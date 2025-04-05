import logging
import json
import os
import time
import random
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/flashcards.log", mode='a'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("flashcards")

def analyze_card_difficulty(card_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyze flashcards to identify those with poor performance
    
    Args:
        card_data: List of flashcards with review history
        
    Returns:
        List of difficult cards with difficulty scores
    """
    logger.info(f"Analyzing difficulty of {len(card_data)} flashcards")
    
    # Criteria thresholds
    EASE_FACTOR_THRESHOLD = 1.8
    REPETITIONS_THRESHOLD = 2
    
    difficult_cards = []
    
    for card in card_data:
        # Skip cards that haven't been reviewed yet
        if 'last_review' not in card:
            continue
        
        ease_factor = card.get('ease_factor', 2.5)
        repetitions = card.get('repetitions', 0)
        
        # Add to difficult cards if it meets our criteria
        if ease_factor < EASE_FACTOR_THRESHOLD and repetitions > REPETITIONS_THRESHOLD:
            # Create a copy of the card with difficulty metrics
            difficult_card = card.copy()
            difficult_card['difficulty_score'] = calculate_difficulty_score(card)
            difficult_cards.append(difficult_card)
    
    # Sort difficult cards by difficulty score (descending)
    difficult_cards.sort(key=lambda x: x['difficulty_score'], reverse=True)
    
    logger.info(f"Found {len(difficult_cards)} difficult cards")
    return difficult_cards

def calculate_difficulty_score(card: Dict[str, Any]) -> float:
    """
    Calculate a difficulty score for a card based on its study history
    
    Args:
        card: Flashcard data with review history
        
    Returns:
        float: Difficulty score (0-10 scale, higher = more difficult)
    """
    # Base difficulty is inversely related to ease factor
    ease_factor = card.get('ease_factor', 2.5)
    base_difficulty = max(0, (3.0 - ease_factor) / 1.7)  # Normalize to 0-1 range
    
    # Factor in number of repetitions
    repetitions = card.get('repetitions', 0)
    repetition_factor = min(1.0, repetitions / 10.0)  # Normalize, caps at 10 repetitions
    
    # Combined score (0-10 scale)
    score = (base_difficulty * 0.7 + repetition_factor * 0.3) * 10
    
    return round(score, 1)

def generate_related_cards(difficult_cards: List[Dict[str, Any]], 
                           num_to_generate: int = 3,
                           difficulty_level: str = "medium",
                           generation_strategy: str = "related",
                           api_client=None) -> List[Dict[str, Any]]:
    """
    Generate new flashcards using AI based on difficult cards
    
    Args:
        difficult_cards: List of cards identified as difficult
        num_to_generate: Number of new cards to generate
        difficulty_level: Desired difficulty level (easy, medium, hard)
        generation_strategy: Strategy to use (related, breakdown, alternative)
        api_client: Optional API client for Mistral or other LLM
        
    Returns:
        List of generated flashcard dictionaries
    """
    from .services import mistral_client, chat_service
    
    logger.info(f"Generating {num_to_generate} cards using strategy '{generation_strategy}' at '{difficulty_level}' difficulty")
    
    # Extract card content for the prompt
    cards_content = []
    for card in difficult_cards:
        cards_content.append({
            "question": card.get('question', ''),
            "answer": card.get('answer', ''),
            "difficulty_score": card.get('difficulty_score', 5.0)
        })
    
    # Create the generation prompt
    prompt = create_generation_prompt(cards_content, generation_strategy, difficulty_level, num_to_generate)
    
    try:
        # Use the existing chat service (which uses Mistral)
        logger.info("Using chat service to generate cards")
        response = chat_service(prompt)
        
        # Extract the response content
        if isinstance(response, dict) and "response" in response:
            generated_content = response["response"]
        else:
            generated_content = str(response)
        
        # Parse the generated content
        new_cards = parse_ai_response(generated_content)
        
        logger.info(f"Successfully generated {len(new_cards)} cards")
        return new_cards
    
    except Exception as e:
        logger.error(f"Error generating AI flashcards: {str(e)}")
        
        # Return some fallback cards for testing
        logger.warning("Using fallback card generation")
        return generate_fallback_cards(difficult_cards, num_to_generate)

def create_generation_prompt(cards_content: List[Dict[str, Any]], 
                            strategy: str,
                            difficulty: str,
                            num_cards: int) -> str:
    """
    Create a detailed prompt for the AI to generate new flashcards
    
    Args:
        cards_content: List of cards with questions and answers
        strategy: The generation strategy (related, breakdown, alternative)
        difficulty: The desired difficulty level (easy, medium, hard)
        num_cards: Number of cards to generate
        
    Returns:
        str: The formatted prompt for the AI
    """
    cards_text = ""
    for i, card in enumerate(cards_content, 1):
        cards_text += f"Card {i}:\n"
        cards_text += f"Question: {card['question']}\n"
        cards_text += f"Answer: {card['answer']}\n"
        cards_text += f"Difficulty Score: {card['difficulty_score']}/10\n\n"
    
    strategy_descriptions = {
        "related": "Create new flashcards on related topics that will help reinforce the same knowledge",
        "breakdown": "Break down the difficult concepts into simpler, more digestible flashcards",
        "alternative": "Present the same information in alternative ways that might be easier to remember"
    }
    
    difficulty_descriptions = {
        "easy": "Create simpler cards that build foundational knowledge",
        "medium": "Create moderately challenging cards that extend the concepts",
        "hard": "Create advanced cards that deepen understanding of the concepts"
    }
    
    # Build the prompt
    prompt = f"""You are an expert educator and flashcard creator. I'm having difficulty with certain flashcards and need your help to create new ones that will improve my learning.

Here are the flashcards I'm struggling with:

{cards_text}

Please create {num_cards} new flashcards using the following approach:
- Strategy: {strategy} - {strategy_descriptions.get(strategy, "")}
- Difficulty: {difficulty} - {difficulty_descriptions.get(difficulty, "")}

The new flashcards should:
1. Help me better understand and remember the difficult material
2. Follow good flashcard design principles (clear, concise questions with specific answers)
3. Avoid duplicating the exact same cards I already have
4. Be relevant to the subject matter of my difficult cards

Format your response EXACTLY as follows for each new card (and include NOTHING else):

[CARD_START]
QUESTION: (the question for the flashcard)
ANSWER: (the answer for the flashcard)
[CARD_END]

Only include the [CARD_START], QUESTION:, ANSWER:, and [CARD_END] markers - nothing else. Don't include any explanations, introductions or conclusions.
"""
    
    return prompt

def parse_ai_response(response_text: str) -> List[Dict[str, Any]]:
    """
    Parse the AI response into a list of flashcard dictionaries
    
    Args:
        response_text: The text response from the AI
        
    Returns:
        list: List of flashcard dictionaries
    """
    import uuid
    from datetime import datetime
    
    # Initialize empty list
    new_cards = []
    
    # Strip any API prefix
    if response_text.startswith('[API]'):
        response_text = response_text[5:].strip()
    
    # Find all card blocks
    card_blocks = []
    current_block = ""
    in_card = False
    
    for line in response_text.split('\n'):
        stripped_line = line.strip()
        
        if stripped_line == '[CARD_START]':
            in_card = True
            current_block = ""
        elif stripped_line == '[CARD_END]':
            in_card = False
            if current_block.strip():
                card_blocks.append(current_block.strip())
            current_block = ""
        elif in_card:
            current_block += line + "\n"
    
    # Parse each card block
    for block in card_blocks:
        question = ""
        answer = ""
        
        lines = block.split('\n')
        for line in lines:
            if line.startswith('QUESTION:'):
                question = line[len('QUESTION:'):].strip()
            elif line.startswith('ANSWER:'):
                answer = line[len('ANSWER:'):].strip()
        
        if question and answer:
            new_card = {
                'id': str(uuid.uuid4()),
                'title': "",
                'question': question,
                'answer': answer,
                'image_url': "",
                'created_at': datetime.now().isoformat(),
                'tags': ["ai_generated"],
                'repetitions': 0,
                'ease_factor': 2.5,
                'ai_generated': True
            }
            new_cards.append(new_card)
    
    return new_cards

def generate_fallback_cards(difficult_cards: List[Dict[str, Any]], num_to_generate: int = 3) -> List[Dict[str, Any]]:
    """
    Generate fallback cards when AI generation fails
    
    Args:
        difficult_cards: List of difficult cards
        num_to_generate: Number of cards to generate
        
    Returns:
        List of generated card dictionaries
    """
    import uuid
    from datetime import datetime
    
    # Sample templates for different types of cards
    question_templates = [
        "What is the key difference between {concept} and {related_concept}?",
        "How would you explain {concept} to a beginner?",
        "What are the main components of {concept}?",
        "Give an example of {concept} in a real-world context.",
        "What problem does {concept} solve?",
        "What are the limitations of {concept}?",
        "How does {concept} relate to {related_concept}?",
        "What is the opposite of {concept}?",
        "What is a simplified version of {concept}?",
        "If {concept} didn't exist, what would we use instead?"
    ]
    
    # Extract concepts from difficult cards
    concepts = []
    for card in difficult_cards:
        question = card.get('question', '')
        answer = card.get('answer', '')
        
        # Very simple extraction - just get the first few words
        words = question.split()
        if len(words) > 2:
            concepts.append(' '.join(words[:3]))
        else:
            concepts.append(question)
    
    # Generate new cards
    new_cards = []
    for i in range(min(num_to_generate, len(question_templates))):
        # Get a concept and a different related concept
        concept = random.choice(concepts)
        related_concepts = [c for c in concepts if c != concept]
        related_concept = random.choice(related_concepts) if related_concepts else concept
        
        # Create a question from template
        template = question_templates[i % len(question_templates)]
        question = template.format(concept=concept, related_concept=related_concept)
        
        # Create a placeholder answer
        answer = f"This is a placeholder answer about {concept}. In a real implementation, this would be generated by an AI model."
        
        # Create the card
        new_card = {
            'id': str(uuid.uuid4()),
            'title': "",
            'question': question,
            'answer': answer,
            'image_url': "",
            'created_at': datetime.now().isoformat(),
            'tags': ["ai_generated"],
            'repetitions': 0,
            'ease_factor': 2.5,
            'ai_generated': True
        }
        new_cards.append(new_card)
    
    return new_cards
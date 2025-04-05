import streamlit as st
import json
import time
from datetime import datetime
import random
import uuid
from pathlib import Path
import requests
import os
from typing import List, Dict, Any, Optional

# Get environment variables
from dotenv import load_dotenv
load_dotenv(".client_env")
DOMAIN_NAME = os.getenv("DOMAIN_NAME", "localhost")
ROOT_PATH = os.getenv("ROOT_PATH", "")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8090")

# Initialize AI-related session state variables
def init_flashcard_ai_state():
    """Initialize AI-related session state variables for flashcards"""
    if "difficult_cards" not in st.session_state:
        st.session_state.difficult_cards = []
    
    if "ai_generated_cards" not in st.session_state:
        st.session_state.ai_generated_cards = []
    
    if "selected_difficult_cards" not in st.session_state:
        st.session_state.selected_difficult_cards = []
    
    if "generation_in_progress" not in st.session_state:
        st.session_state.generation_in_progress = False
    
    if "show_select_cards" not in st.session_state:
        st.session_state.show_select_cards = False
    
    # AI settings - load from file if available
    if "ai_settings" not in st.session_state:
        # Default settings
        default_ai_settings = {
            "num_cards_to_generate": 3,
            "generation_strategy": "related",  # 'related', 'breakdown', 'alternative'
            "difficulty_level": "medium"       # 'easy', 'medium', 'hard'
        }
        
        # Try to load settings from file
        settings_file = Path("flashcard_ai_settings.json")
        if settings_file.exists():
            try:
                with open(settings_file, "r") as f:
                    st.session_state.ai_settings = json.load(f)
            except Exception as e:
                print(f"Failed to load AI settings: {e}")
                st.session_state.ai_settings = default_ai_settings
        else:
            st.session_state.ai_settings = default_ai_settings

def analyze_difficult_cards():
    """
    Analyze flashcards to identify those with poor performance
    
    This function finds cards that:
    1. Have low ease factors (< 1.8)
    2. Have been reviewed multiple times (repetitions > 2)
    3. Have been consistently rated as 'Again' or 'Hard'
    """
    # Reset difficult cards list
    st.session_state.difficult_cards = []
    
    # Criteria thresholds
    EASE_FACTOR_THRESHOLD = 1.8
    REPETITIONS_THRESHOLD = 2
    
    # Analyze each card
    for card in st.session_state.flashcards:
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
            difficult_card['selected'] = False
            st.session_state.difficult_cards.append(difficult_card)
    
    # Sort difficult cards by difficulty score (descending)
    st.session_state.difficult_cards.sort(key=lambda x: x['difficulty_score'], reverse=True)
    
    return st.session_state.difficult_cards

def calculate_difficulty_score(card):
    """
    Calculate a difficulty score for a card based on its study history
    
    Higher score = more difficult
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

def toggle_card_selection(card_id):
    """Toggle the selection status of a difficult card"""
    for card in st.session_state.difficult_cards:
        if card['id'] == card_id:
            card['selected'] = not card['selected']
            break
    
    # Update selected cards list
    st.session_state.selected_difficult_cards = [
        card for card in st.session_state.difficult_cards if card.get('selected', False)
    ]

def generate_ai_flashcards(selected_cards=None):
    """
    Generate new flashcards using AI based on selected difficult cards
    
    Args:
        selected_cards: List of cards to use as the basis for generation
    """
    if not selected_cards:
        selected_cards = st.session_state.selected_difficult_cards
    
    if not selected_cards:
        return {"status": "error", "message": "No cards selected for AI generation"}
    
    try:
        # Set the generation in progress flag
        st.session_state.generation_in_progress = True
        
        # Get generation settings from session state
        strategy = st.session_state.ai_settings.get('generation_strategy', 'related')
        difficulty = st.session_state.ai_settings.get('difficulty_level', 'medium')
        num_cards = st.session_state.ai_settings.get('num_cards_to_generate', 3)
        
        # First try to use the backend API for flashcard generation
        try:
            from frontend.middleware import generate_ai_flashcards as api_generate_flashcards
            
            # Call the dedicated API endpoint
            result = api_generate_flashcards(
                selected_cards,
                num_to_generate=num_cards,
                difficulty_level=difficulty,
                generation_strategy=strategy
            )
            
            if isinstance(result, dict) and "generated_cards" in result:
                # Success! Use the cards from the API
                new_cards = result["generated_cards"]
                st.session_state.ai_generated_cards = new_cards
                
                return {
                    "status": "success",
                    "message": f"Generated {len(new_cards)} new flashcards using backend AI",
                    "cards": new_cards
                }
        except Exception as api_error:
            # If API call fails, fall back to the chat-based method
            print(f"API generation failed, falling back to chat: {str(api_error)}")
        
        # Fallback method using the chat API
        # Prepare the API request
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/chat/message/"
        
        # Extract card content for the prompt
        cards_content = []
        for card in selected_cards:
            cards_content.append({
                "question": card['question'],
                "answer": card['answer'],
                "difficulty_score": card.get('difficulty_score', 5.0)
            })
        
        prompt = create_generation_prompt(cards_content, strategy, difficulty, num_cards)
        
        # Send the request to the backend
        payload = {
            "message": prompt,
            "rag_config": {
                "enabled": False
            }
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            response_data = response.json()
            generated_content = response_data.get("response", "")
            
            # Parse the generated content into flashcards
            new_cards = parse_ai_response(generated_content)
            
            # Add the new cards to the session state
            st.session_state.ai_generated_cards = new_cards
            
            return {
                "status": "success",
                "message": f"Generated {len(new_cards)} new flashcards",
                "cards": new_cards
            }
        else:
            return {
                "status": "error",
                "message": f"Error generating flashcards: {response.status_code}"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error generating flashcards: {str(e)}"
        }
    finally:
        # Clear the generation in progress flag
        st.session_state.generation_in_progress = False

def create_generation_prompt(cards_content, strategy, difficulty, num_cards):
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

def parse_ai_response(response_text):
    """
    Parse the AI response into a list of flashcard dictionaries
    
    Args:
        response_text: The text response from the AI
        
    Returns:
        list: List of flashcard dictionaries
    """
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

def save_ai_settings():
    """Save AI assistant settings to file"""
    try:
        with open("flashcard_ai_settings.json", "w") as f:
            json.dump(st.session_state.ai_settings, f, indent=2)
        return {"status": "success", "message": "AI settings saved successfully"}
    except Exception as e:
        st.error(f"Failed to save AI settings: {e}")
        return {"status": "error", "message": f"Failed to save AI settings: {str(e)}"}

def save_ai_generated_cards():
    """Save the AI-generated cards to the main flashcards list"""
    if not st.session_state.ai_generated_cards:
        return {"status": "error", "message": "No AI-generated cards to save"}
    
    # Add the generated cards to the main flashcards list
    st.session_state.flashcards.extend(st.session_state.ai_generated_cards)
    
    # Save to disk if auto-save is enabled
    if st.session_state.flashcard_settings['auto_save']:
        try:
            with open("flashcards.json", "w") as f:
                json.dump(st.session_state.flashcards, f, indent=2)
                
            # Reset the generated cards list
            ai_cards_count = len(st.session_state.ai_generated_cards)
            st.session_state.ai_generated_cards = []
            
            return {
                "status": "success", 
                "message": f"Saved {ai_cards_count} AI-generated flashcards"
            }
        except Exception as e:
            return {"status": "error", "message": f"Failed to save flashcards: {str(e)}"}
    else:
        # Just note that they've been added to memory
        ai_cards_count = len(st.session_state.ai_generated_cards)
        st.session_state.ai_generated_cards = []
        
        return {
            "status": "success", 
            "message": f"Added {ai_cards_count} AI-generated flashcards (not yet saved to disk)"
        }

def apply_custom_ai_css():
    """Apply custom CSS for the AI flashcard interface"""
    st.markdown("""
    <style>
    /* Card difficulty indicator */
    .difficulty-indicator {
        font-size: 0.8rem;
        padding: 4px 8px;
        border-radius: 10px;
        font-weight: bold;
        margin-left: 10px;
    }
    
    .difficulty-high {
        background-color: #ffcccc;
        color: #cc0000;
    }
    
    .difficulty-medium {
        background-color: #fff2cc;
        color: #e65c00;
    }
    
    .difficulty-low {
        background-color: #e6f2ff;
        color: #0066cc;
    }
    
    /* AI card container */
    .ai-card-container {
        background-color: #f0f8ff;
        border-left: 4px solid #6c4ed4;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    
    .ai-card-question {
        font-weight: 500;
        color: #333;
        margin-bottom: 10px;
    }
    
    .ai-card-answer {
        color: #2a6099;
        padding: 10px;
        background-color: #f4f9ff;
        border-radius: 5px;
    }
    
    /* AI badge */
    .ai-badge {
        background-color: #6c4ed4;
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
    }
    
    /* Selected card indicator */
    .card-selected {
        border: 2px solid #4CAF50;
        background-color: #f0fff0;
    }
    
    /* Card preview */
    .card-preview {
        padding: 15px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 15px;
    }
    
    .card-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .generation-strategy-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.75rem;
        font-weight: bold;
    }
    
    .strategy-related {
        background-color: #e6f3ff;
        color: #0066cc;
    }
    
    .strategy-breakdown {
        background-color: #fff2e6;
        color: #cc6600;
    }
    
    .strategy-alternative {
        background-color: #f0e6ff;
        color: #6600cc;
    }
    
    .difficulty-badge {
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 0.7rem;
        margin-left: 8px;
    }
    
    .difficulty-easy {
        background-color: #d4f7d4;
        color: #28a745;
    }
    
    .difficulty-medium {
        background-color: #fff2cc;
        color: #e65c00;
    }
    
    .difficulty-hard {
        background-color: #ffcccc;
        color: #cc0000;
    }
    </style>
    """, unsafe_allow_html=True)

def render_ai_tab():
    """Render the AI tab for analyzing and generating flashcards"""
    st.markdown("""
    <h3 style="margin-bottom: 20px;">AI Flashcard Assistant</h3>
    <p>Analyze difficult cards and generate new flashcards to improve your learning.</p>
    """, unsafe_allow_html=True)
    
    # Main sections
    if not st.session_state.show_select_cards:
        render_analysis_section()
    else:
        render_card_selection_section()
    
    # Display AI-generated cards if any
    if st.session_state.ai_generated_cards:
        render_generated_cards_section()

def render_analysis_section():
    """Render the initial analysis section with the analyze button"""
    # Description
    st.markdown("""
    <div style="background-color: #f0f8ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h4 style="color: #333; margin-top: 0;">How it works</h4>
        <p>This tool analyzes your flashcard review history to identify cards you're struggling with. It then uses AI to create new cards that will help you better understand those difficult concepts.</p>
        <ol>
            <li><strong>Analyze</strong> your flashcards to find the ones you've been struggling with</li>
            <li><strong>Select</strong> specific difficult cards you want help with</li>
            <li><strong>Generate</strong> new AI-created flashcards designed to boost your understanding</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)
    
    # Start analysis button
    if st.button("Analyze My Flashcards", key="analyze_btn", use_container_width=True):
        with st.spinner("Analyzing your flashcards..."):
            difficult_cards = analyze_difficult_cards()
            
            if difficult_cards:
                st.session_state.show_select_cards = True
                st.rerun()
            else:
                st.info("No difficult cards found. This could be because you haven't reviewed enough cards yet, or because you're doing well with all your cards!")

def render_card_selection_section():
    """Render the card selection section after analysis"""
    # Header
    if st.session_state.difficult_cards:
        st.markdown(f"""
        <h4>We found {len(st.session_state.difficult_cards)} cards you might be struggling with</h4>
        <p>Select the cards you want help with, then click "Generate AI Flashcards"</p>
        """, unsafe_allow_html=True)
        
        # "Select All" checkbox
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            select_all = st.checkbox("Select All Cards", key="select_all_cb")
            if select_all:
                for card in st.session_state.difficult_cards:
                    card['selected'] = True
            else:
                # Only deselect all if the user explicitly unchecked the box
                if st.session_state.get("select_all_cb_prev", False) and not select_all:
                    for card in st.session_state.difficult_cards:
                        card['selected'] = False
            
            # Store previous state
            st.session_state.select_all_cb_prev = select_all
        
        # Display difficult cards
        for i, card in enumerate(st.session_state.difficult_cards):
            difficulty_score = card.get('difficulty_score', 5.0)
            
            # Determine difficulty class
            if difficulty_score >= 7.0:
                difficulty_class = "difficulty-high"
                difficulty_text = "High Difficulty"
            elif difficulty_score >= 4.0:
                difficulty_class = "difficulty-medium"
                difficulty_text = "Medium Difficulty"
            else:
                difficulty_class = "difficulty-low"
                difficulty_text = "Low Difficulty"
            
            # Card container with selection state
            card_class = "card-preview card-selected" if card.get('selected', False) else "card-preview"
            
            st.markdown(f"""
            <div class="{card_class}" id="card_{card['id']}">
                <div class="card-preview-header">
                    <span>Card {i+1}</span>
                    <span class="difficulty-indicator {difficulty_class}">{difficulty_text} ({difficulty_score}/10)</span>
                </div>
                <div class="ai-card-question"><strong>Question:</strong> {card['question']}</div>
                <div class="ai-card-answer"><strong>Answer:</strong> {card['answer']}</div>
            </div>
            """, unsafe_allow_html=True)
            
            # Selection checkbox
            st.checkbox(
                "Select this card", 
                key=f"select_card_{card['id']}", 
                value=card.get('selected', False),
                on_change=toggle_card_selection,
                args=(card['id'],)
            )
        
        # Update selected cards count
        selected_count = len([c for c in st.session_state.difficult_cards if c.get('selected', False)])
        
        # AI generation settings
        st.markdown("### Generation Settings")
        
        col1, col2 = st.columns(2)
        with col1:
            st.session_state.ai_settings['generation_strategy'] = st.selectbox(
                "Generation Strategy",
                options=["related", "breakdown", "alternative"],
                index=["related", "breakdown", "alternative"].index(st.session_state.ai_settings.get('generation_strategy', 'related')),
                format_func=lambda x: {
                    "related": "Related Concepts",
                    "breakdown": "Break Down Concepts",
                    "alternative": "Alternative Approaches"
                }.get(x, x),
                help="Choose how AI should generate new cards"
            )
        
        with col2:
            st.session_state.ai_settings['difficulty_level'] = st.selectbox(
                "Difficulty Level",
                options=["easy", "medium", "hard"],
                index=["easy", "medium", "hard"].index(st.session_state.ai_settings.get('difficulty_level', 'medium')),
                format_func=lambda x: x.capitalize(),
                help="Choose the difficulty level for new cards"
            )
        
        st.session_state.ai_settings['num_cards_to_generate'] = st.slider(
            "Number of Cards to Generate",
            min_value=1,
            max_value=10,
            value=st.session_state.ai_settings.get('num_cards_to_generate', 3),
            help="How many new cards should the AI create"
        )
        
        # Save these settings as the defaults
        if st.checkbox("Save as default settings", key="save_as_default", value=False):
            save_ai_settings()
        
        # Generation button
        generate_button = st.button(
            f"Generate AI Flashcards from {selected_count} Selected Cards", 
            key="generate_btn", 
            use_container_width=True,
            disabled=selected_count == 0 or st.session_state.generation_in_progress
        )
        
        if generate_button:
            with st.spinner("Generating AI flashcards... This may take a moment."):
                result = generate_ai_flashcards()
                
                if result['status'] == 'success':
                    st.success(result['message'])
                    st.rerun()
                else:
                    st.error(result['message'])
        
        # Back button
        if st.button("← Back to Analysis", key="back_btn"):
            st.session_state.show_select_cards = False
            st.rerun()
    else:
        st.info("No difficult cards were found. Try reviewing more flashcards first.")
        
        if st.button("← Back", key="back_empty_btn"):
            st.session_state.show_select_cards = False
            st.rerun()

def render_generated_cards_section():
    """Render the section displaying AI-generated cards"""
    st.markdown("""
    <h3 style="margin: 30px 0 20px 0;">AI-Generated Flashcards</h3>
    <p>Review these new flashcards and save them to your collection if they're helpful.</p>
    """, unsafe_allow_html=True)
    
    # Display generation strategy badge
    strategy = st.session_state.ai_settings['generation_strategy']
    difficulty = st.session_state.ai_settings['difficulty_level']
    
    st.markdown(f"""
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div class="generation-strategy-badge strategy-{strategy}">
            Strategy: {strategy.capitalize()}
        </div>
        <div class="difficulty-badge difficulty-{difficulty}">
            Difficulty: {difficulty.capitalize()}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Display each generated card
    for i, card in enumerate(st.session_state.ai_generated_cards):
        st.markdown(f"""
        <div class="ai-card-container">
            <h4>Card {i+1} <span class="ai-badge">AI</span></h4>
            <div class="ai-card-question"><strong>Question:</strong> {card['question']}</div>
            <div class="ai-card-answer"><strong>Answer:</strong> {card['answer']}</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Save button
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Save All to My Flashcards", key="save_ai_cards_btn", use_container_width=True):
            result = save_ai_generated_cards()
            
            if result['status'] == 'success':
                st.success(result['message'])
                time.sleep(1)
                st.rerun()
            else:
                st.error(result['message'])
    
    with col2:
        if st.button("Generate More Cards", key="generate_more_btn", use_container_width=True):
            with st.spinner("Generating more flashcards..."):
                result = generate_ai_flashcards()
                
                if result['status'] == 'success':
                    st.success(result['message'])
                    st.rerun()
                else:
                    st.error(result['message'])
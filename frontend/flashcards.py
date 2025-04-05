import streamlit as st
import time
import json
from datetime import datetime, timedelta
import os
import random
import uuid
from pathlib import Path
import requests
import base64
from io import BytesIO
from PIL import Image
import urllib.parse

# Default flashcard settings
DEFAULT_FLASHCARD_SETTINGS = {
    "new_cards_per_day": 10,
    "review_cards_per_day": 20,
    "ease_factor_default": 2.5,
    "initial_interval": 1, # in days
    "interval_modifier": 1.0,
    "auto_save": True
}

# Initialize session state variables for flashcards
def init_flashcards_state():
    """Initialize flashcards-related session state variables"""
    if "flashcards" not in st.session_state:
        # Load existing cards if available
        cards_file = Path("flashcards.json")
        if cards_file.exists():
            try:
                with open(cards_file, "r") as f:
                    st.session_state.flashcards = json.load(f)
            except Exception as e:
                st.error(f"Failed to load flashcards: {e}")
                st.session_state.flashcards = []
        else:
            st.session_state.flashcards = []
    
    if "flashcard_settings" not in st.session_state:
        # Load settings if available
        settings_file = Path("flashcard_settings.json")
        if settings_file.exists():
            try:
                with open(settings_file, "r") as f:
                    st.session_state.flashcard_settings = json.load(f)
            except Exception as e:
                st.error(f"Failed to load flashcard settings: {e}")
                st.session_state.flashcard_settings = DEFAULT_FLASHCARD_SETTINGS
        else:
            st.session_state.flashcard_settings = DEFAULT_FLASHCARD_SETTINGS
    
    if "current_flashcard" not in st.session_state:
        st.session_state.current_flashcard = None
    
    if "show_answer" not in st.session_state:
        st.session_state.show_answer = False
    
    if "flashcard_stats" not in st.session_state:
        # Load stats if available
        stats_file = Path("flashcard_stats.json")
        if stats_file.exists():
            try:
                with open(stats_file, "r") as f:
                    st.session_state.flashcard_stats = json.load(f)
                    # Check if it's a new day since the last study
                    if st.session_state.flashcard_stats.get("last_study_date"):
                        last_study = datetime.fromisoformat(st.session_state.flashcard_stats["last_study_date"])
                        today = datetime.now()
                        if last_study.date() < today.date():
                            # Reset daily stats for a new day
                            st.session_state.flashcard_stats["studied_today"] = 0
                            st.session_state.flashcard_stats["correct_today"] = 0
            except Exception as e:
                st.error(f"Failed to load flashcard stats: {e}")
                st.session_state.flashcard_stats = {
                    "studied_today": 0,
                    "total_studied": 0,
                    "correct_today": 0,
                    "total_correct": 0,
                    "streak": 0,
                    "last_study_date": None
                }
        else:
            st.session_state.flashcard_stats = {
                "studied_today": 0,
                "total_studied": 0,
                "correct_today": 0,
                "total_correct": 0,
                "streak": 0,
                "last_study_date": None
            }
        
    # Add a flag to reset the form
    if "reset_flashcard_form" not in st.session_state:
        st.session_state.reset_flashcard_form = False
        
    # Add a flag to get the next card
    if "get_next_flashcard" not in st.session_state:
        st.session_state.get_next_flashcard = False

# Spaced repetition algorithm functions
def calculate_next_review(card, ease):
    """
    Calculate the next review date based on SM-2 algorithm
    
    Parameters:
    - card: The flashcard with review history
    - ease: The ease factor (1-4) representing difficulty
        1: Again - Card was not remembered, start over
        2: Hard - Card was remembered with difficulty
        3: Good - Card was remembered with some effort
        4: Easy - Card was remembered easily
    
    Returns:
    - Updated card with new review date and interval
    """
    # Get default values if not present in card
    interval = card.get('interval', st.session_state.flashcard_settings['initial_interval'])
    ease_factor = card.get('ease_factor', st.session_state.flashcard_settings['ease_factor_default'])
    repetitions = card.get('repetitions', 0)
    
    # Update based on SM-2 algorithm
    if ease == 1:  # Again
        repetitions = 0
        interval = st.session_state.flashcard_settings['initial_interval']
    elif ease == 2:  # Hard
        ease_factor = max(1.3, ease_factor - 0.15)
        if repetitions == 0:
            interval = st.session_state.flashcard_settings['initial_interval']
        else:
            interval = max(1, interval * 1.2 * st.session_state.flashcard_settings['interval_modifier'])
        repetitions += 1
    elif ease == 3:  # Good
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 3
        else:
            interval = interval * ease_factor * st.session_state.flashcard_settings['interval_modifier']
        repetitions += 1
    elif ease == 4:  # Easy
        if repetitions == 0:
            interval = 3
        elif repetitions == 1:
            interval = 7
        else:
            interval = interval * ease_factor * 1.3 * st.session_state.flashcard_settings['interval_modifier']
        ease_factor = min(3.0, ease_factor + 0.15)
        repetitions += 1
    
    # Calculate next review date
    next_review = datetime.now() + timedelta(days=interval)
    
    # Update card
    card['interval'] = interval
    card['ease_factor'] = ease_factor
    card['repetitions'] = repetitions
    card['next_review'] = next_review.isoformat()
    card['last_review'] = datetime.now().isoformat()
    
    return card

def get_due_cards(max_cards=None):
    """Get cards due for review today"""
    now = datetime.now()
    due_cards = []
    
    for card in st.session_state.flashcards:
        # Check if card has never been reviewed or is due
        if 'next_review' not in card or datetime.fromisoformat(card['next_review']) <= now:
            due_cards.append(card)
    
    # Limit to max_cards if specified
    if max_cards is not None and len(due_cards) > max_cards:
        due_cards = due_cards[:max_cards]
    
    return due_cards

def get_new_cards(max_cards=None):
    """Get cards that have never been studied"""
    new_cards = []
    
    for card in st.session_state.flashcards:
        # Check if the card has never been reviewed (no next_review date)
        # AND check if the card was created today
        if 'next_review' not in card:
            # Check if created today
            if 'created_at' in card:
                created_date = datetime.fromisoformat(card['created_at']).date()
                today = datetime.now().date()
                if created_date == today:
                    new_cards.append(card)
    
    # Shuffle new cards for variety
    random.shuffle(new_cards)
    
    # Limit to max_cards if specified
    if max_cards is not None and len(new_cards) > max_cards:
        new_cards = new_cards[:max_cards]
    
    return new_cards

def save_flashcards():
    """Save flashcards to file"""
    try:
        with open("flashcards.json", "w") as f:
            json.dump(st.session_state.flashcards, f, indent=2)
    except Exception as e:
        st.error(f"Failed to save flashcards: {e}")

def save_flashcard_settings():
    """Save flashcard settings to file"""
    try:
        with open("flashcard_settings.json", "w") as f:
            json.dump(st.session_state.flashcard_settings, f, indent=2)
    except Exception as e:
        st.error(f"Failed to save flashcard settings: {e}")

def save_flashcard_stats():
    """Save flashcard stats to file"""
    try:
        with open("flashcard_stats.json", "w") as f:
            json.dump(st.session_state.flashcard_stats, f, indent=2)
    except Exception as e:
        st.error(f"Failed to save flashcard stats: {e}")

def handle_card_action(ease):
    """Handle a response to a flashcard"""
    if st.session_state.current_flashcard:
        # Update card using spaced repetition algorithm
        card_id = st.session_state.current_flashcard['id']
        
        # Find the card in the list
        for i, card in enumerate(st.session_state.flashcards):
            if card['id'] == card_id:
                # Calculate next review date
                updated_card = calculate_next_review(st.session_state.flashcards[i], ease)
                st.session_state.flashcards[i] = updated_card
                
                # Update stats
                st.session_state.flashcard_stats['studied_today'] += 1
                st.session_state.flashcard_stats['total_studied'] += 1
                if ease >= 3:  # Good or Easy
                    st.session_state.flashcard_stats['correct_today'] += 1
                    st.session_state.flashcard_stats['total_correct'] += 1
                    st.session_state.flashcard_stats['streak'] += 1
                else:
                    st.session_state.flashcard_stats['streak'] = 0
                
                st.session_state.flashcard_stats['last_study_date'] = datetime.now().isoformat()
                
                # Auto-save if enabled
                if st.session_state.flashcard_settings['auto_save']:
                    save_flashcards()
                    save_flashcard_stats()
                
                # Reset current card and show_answer
                st.session_state.current_flashcard = None
                st.session_state.show_answer = False
                
                # Set a flag to indicate we need to get a new card
                st.session_state.get_next_flashcard = True
                
                # Don't call rerun here, it will be handled in the main render function
                break

def get_next_card():
    """Get the next card to review"""
    # Check for due cards first
    due_cards = get_due_cards(st.session_state.flashcard_settings['review_cards_per_day'])
    if due_cards:
        return random.choice(due_cards)
    
    # If no due cards, get new cards
    new_cards = get_new_cards(st.session_state.flashcard_settings['new_cards_per_day'])
    if new_cards:
        return new_cards[0]
    
    return None

def toggle_show_answer():
    """Toggle showing the answer"""
    st.session_state.show_answer = not st.session_state.show_answer

def create_new_card():
    """Add a new flashcard"""
    title = st.session_state.new_title
    question = st.session_state.new_question
    answer = st.session_state.new_answer
    image_url = st.session_state.new_image_url
    
    if question.strip() and answer.strip():
        new_card = {
            'id': str(uuid.uuid4()),
            'title': title.strip(),
            'question': question,
            'answer': answer,
            'image_url': image_url.strip(),
            'created_at': datetime.now().isoformat(),
            'tags': [],
            'repetitions': 0,
            'ease_factor': st.session_state.flashcard_settings['ease_factor_default']
        }
        
        st.session_state.flashcards.append(new_card)
        
        # Auto-save if enabled
        if st.session_state.flashcard_settings['auto_save']:
            save_flashcards()
        
        # Instead of clearing directly, set a flag to indicate form should be reset
        st.session_state.reset_flashcard_form = True
        
        # Show success message
        st.success("New flashcard created successfully!")
        time.sleep(1)
        st.rerun()

def apply_custom_flashcards_css():
    """Apply custom CSS for the flashcards interface"""
    st.markdown("""
    <style>
    /* Flashcard container */
    .flashcard-container {
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    /* Flashcard question and answer */
    .flashcard-question {
        font-size: 1.5rem;
        font-weight: 500;
        color: #333;
        margin-bottom: 20px;
    }
    
    .flashcard-answer {
        font-size: 1.3rem;
        color: #2a6099;
        padding: 15px;
        background-color: #f4f9ff;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid #4A76F9;
    }
    
    /* Stats container */
    .stats-container {
        background-color: #f0f4f9;
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 10px;
    }
    
    .stat-item {
        background-color: white;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    
    .stat-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #6c4ed4;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #666;
    }
    
    /* Button group styling */
    .button-group {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
    }
    
    /* Response buttons */
    .response-button-again {
        background-color: #ff6b6b !important;
    }
    
    .response-button-hard {
        background-color: #ffa94d !important;
    }
    
    .response-button-good {
        background-color: #69db7c !important;
    }
    
    .response-button-easy {
        background-color: #4dabff !important;
    }
    
    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    
    .stTabs [data-baseweb="tab"] {
        padding: 10px 16px;
        border-radius: 8px;
    }
    
    /* Form styling in Create tab */
    .create-form {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    </style>
    """, unsafe_allow_html=True)

def download_and_cache_image(url):
    """
    Download an image from a URL and cache it locally.
    Returns the path to the cached image, or None if the download fails.
    """
    # Create a cache directory if it doesn't exist
    cache_dir = Path("image_cache")
    cache_dir.mkdir(exist_ok=True)
    
    # Create a filename based on the URL
    url_hash = str(hash(url))
    file_extension = os.path.splitext(url)[1]
    if not file_extension:
        file_extension = ".png"  # Default extension
    
    cached_file_path = cache_dir / f"{url_hash}{file_extension}"
    
    # If already cached, return the path
    if cached_file_path.exists():
        return str(cached_file_path)
    
    # Try to download the image
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise an exception for bad responses
        
        # Save the image
        with open(cached_file_path, 'wb') as f:
            f.write(response.content)
        
        return str(cached_file_path)
    except Exception as e:
        st.error(f"Failed to download image: {str(e)}")
        return None

def get_image_as_base64(url):
    """
    Convert an image from a URL to a base64 string.
    This works around CORS issues by embedding the image directly.
    """
    try:
        # First try to download the image
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise an exception for bad responses
        
        # Convert to base64
        image_data = base64.b64encode(response.content).decode("utf-8")
        # Determine image type
        if url.lower().endswith(".png"):
            mime_type = "image/png"
        elif url.lower().endswith((".jpg", ".jpeg")):
            mime_type = "image/jpeg"
        elif url.lower().endswith(".gif"):
            mime_type = "image/gif"
        elif url.lower().endswith(".svg"):
            mime_type = "image/svg+xml"
        else:
            mime_type = "image/png"  # Default
        
        return f"data:{mime_type};base64,{image_data}"
    except Exception as e:
        st.error(f"Failed to process image: {str(e)}")
        return None

def display_image(url):
    """
    Display an image from a URL using multiple methods for maximum reliability.
    
    This function tries several approaches:
    1. Direct display via st.image
    2. Local caching and display
    3. Base64 encoding to bypass CORS issues
    4. HTML rendering with error handling
    """
    if not url or url.strip() == "":
        return
    
    # Method 1: Try direct display first
    try:
        st.image(url, use_column_width=True)
        return True
    except Exception:
        pass  # If it fails, continue to the next method
    
    # Method 2: Try downloading and caching
    try:
        cached_path = download_and_cache_image(url)
        if cached_path:
            st.image(cached_path, use_column_width=True)
            return True
    except Exception:
        pass  # If it fails, continue to the next method
    
    # Method 3: Try base64 encoding
    try:
        base64_img = get_image_as_base64(url)
        if base64_img:
            st.markdown(f'<img src="{base64_img}" style="width:100%;">', unsafe_allow_html=True)
            return True
    except Exception:
        pass  # If it fails, continue to the next method
    
    # Method 4: Fallback to HTML img tag with error handling
    st.markdown(f"""
    <div>
        <img src="{url}" style="max-width:100%;" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Not+Available';"/>
        <p style="color:gray;font-size:0.8em;">Image URL: {url}</p>
    </div>
    """, unsafe_allow_html=True)
    
    return True

def render_study_tab():
    """Render the study tab for reviewing flashcards"""
    # Add a debug button at the top to check session state
    if st.button("🔍 Debug - Show Current Card Data", key="debug_card_btn"):
        st.write("Current flashcard data:")
        st.json(st.session_state.current_flashcard if st.session_state.current_flashcard else {"status": "No card currently loaded"})
        st.write("Session state:")
        st.write({
            "show_answer": st.session_state.show_answer,
            "get_next_flashcard": st.session_state.get_next_flashcard,
            "cards_count": len(st.session_state.flashcards),
            "due_cards_count": len(get_due_cards()),
            "new_cards_count": len(get_new_cards())
        })
    
    # Check if we need to get a new card based on the flag
    if st.session_state.get_next_flashcard:
        st.session_state.current_flashcard = get_next_card()
        st.session_state.get_next_flashcard = False
        st.rerun()
    
    # Get a card if we don't have one
    if not st.session_state.current_flashcard:
        st.session_state.current_flashcard = get_next_card()
    
    # Display card or "all caught up" message
    if st.session_state.current_flashcard:
        # Use a completely different approach with custom HTML and consistent styling
        
        card = st.session_state.current_flashcard
        title = card.get("title", "")
        question = card.get("question", "Question not available")
        answer = card.get("answer", "Answer not available")
        image_url = card.get("image_url", "")
        
        # Create a container with custom styling
        st.markdown("""
        <style>
        .flashcard-box {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
            padding: 2rem;
            margin: 1.5rem 0;
            transition: all 0.3s ease;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .card-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #6c4ed4;
            margin-bottom: 0.5rem;
            text-align: center;
        }
        
        .question-text {
            font-size: 1.5rem;
            font-weight: 500;
            color: #333;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .answer-box {
            background-color: #f4f9ff;
            border-left: 5px solid #4A76F9;
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            font-size: 1.2rem;
            color: #2a6099;
        }
        
        .rating-text {
            margin: 1rem 0;
            font-size: 1.1rem;
            color: #666;
            text-align: center;
        }
        
        .card-image {
            max-width: 100%;
            margin-top: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        </style>
        """, unsafe_allow_html=True)
        
        col_left, col_main, col_right = st.columns([1, 10, 1])
        
        with col_main:
            # Render the flashcard box
            st.markdown(f"""
            <div class="flashcard-box">
                {f'<div class="card-title">{title}</div>' if title else ''}
                <div class="question-text">{question}</div>
            """, unsafe_allow_html=True)
            
            # Show answer section (using standard Streamlit components for the button)
            if not st.session_state.show_answer:
                # Center the Show Answer button
                btn_col1, btn_col2, btn_col3 = st.columns([1, 2, 1])
                with btn_col2:
                    st.button("Show Answer", key="show_answer_btn", 
                             on_click=toggle_show_answer, use_container_width=True)
            else:
                # Show answer and rating buttons
                st.markdown(f"""
                <div class="answer-box">{answer}</div>
                """, unsafe_allow_html=True)
                
                # Display image if available
                if image_url:
                    display_image(image_url)
                
                st.markdown(f"""
                <p class="rating-text">How well did you remember this?</p>
                """, unsafe_allow_html=True)
                
                # Use standard Streamlit components for rating buttons
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.button("Again", key="again_btn", 
                              on_click=handle_card_action, kwargs={"ease": 1},
                              use_container_width=True, 
                              help="I didn't remember this time")
                
                with col2:
                    st.button("Hard", key="hard_btn", 
                              on_click=handle_card_action, kwargs={"ease": 2},
                              use_container_width=True, 
                              help="I remembered with difficulty")
                
                with col3:
                    st.button("Good", key="good_btn", 
                              on_click=handle_card_action, kwargs={"ease": 3},
                              use_container_width=True, 
                              help="I remembered with some effort")
                
                with col4:
                    st.button("Easy", key="easy_btn", 
                              on_click=handle_card_action, kwargs={"ease": 4},
                              use_container_width=True, 
                              help="I remembered easily")
            
            st.markdown("</div>", unsafe_allow_html=True)
            
        # Show card details
        with st.expander("Card Details"):
            if title:
                st.write(f"Title: {title}")
            st.write(f"Card ID: {card.get('id', 'N/A')}")
            st.write(f"Created: {datetime.fromisoformat(card.get('created_at', datetime.now().isoformat())).strftime('%Y-%m-%d')}")
            
            # Improve repetitions display
            rep_count = card.get('repetitions', 0)
            if 'last_review' in card:  # Card has been reviewed at least once
                st.write(f"Reviews: {rep_count}")
            else:
                st.write("Reviews: Never reviewed")
                
            if 'last_review' in card:
                st.write(f"Last review: {datetime.fromisoformat(card['last_review']).strftime('%Y-%m-%d')}")
            
            if 'next_review' in card:
                next_review = datetime.fromisoformat(card['next_review'])
                now = datetime.now()
                time_delta = next_review - now
                
                # Calculate days, hours, minutes
                days = time_delta.days
                hours = time_delta.seconds // 3600
                minutes = (time_delta.seconds % 3600) // 60
                
                # Format the time until next review
                time_str = ""
                if days > 0:
                    time_str += f"{days} day{'s' if days != 1 else ''}, "
                if hours > 0 or days > 0:  # Show hours if days are shown
                    time_str += f"{hours} hour{'s' if hours != 1 else ''}, "
                time_str += f"{minutes} minute{'s' if minutes != 1 else ''}"
                
                st.write(f"Next review: {next_review.strftime('%Y-%m-%d')} ({time_str})")
                
    else:
        # No cards due - this is using standard Streamlit components for reliability
        st.info("🎉 All caught up! You've reviewed all your due cards for today. Come back tomorrow or create new cards.")
        
        # Add a button to reset and try again
        if st.button("Find Cards to Review Anyway", key="force_review", help="This will find cards to review even if they're not due yet"):
            # Reset the current card and force a refresh
            st.session_state.current_flashcard = None
            st.session_state.get_next_flashcard = True
            st.rerun()

def render_create_tab():
    """Render the create tab for adding new flashcards"""
    st.markdown("""
    <h3 style="margin-bottom: 20px;">Create New Flashcards</h3>
    """, unsafe_allow_html=True)
    
    # Check if we need to reset the form
    if st.session_state.reset_flashcard_form:
        # Reset the flag first
        st.session_state.reset_flashcard_form = False
        # The form will be cleared on the next rerun
        st.rerun()
    
    with st.form(key="new_card_form", clear_on_submit=False):
        # Initialize session state for form inputs if needed
        if "new_title" not in st.session_state:
            st.session_state.new_title = ""
        if "new_question" not in st.session_state:
            st.session_state.new_question = ""
        if "new_answer" not in st.session_state:
            st.session_state.new_answer = ""
        if "new_image_url" not in st.session_state:
            st.session_state.new_image_url = ""
        
        title = st.text_input("Title", key="new_title", placeholder="Enter a title for the flashcard...")
        question = st.text_area("Question", key="new_question", height=100, 
                     placeholder="Enter your question here...")
        answer = st.text_area("Answer", key="new_answer", height=150,
                     placeholder="Enter the answer here...")
        image_url = st.text_input("Image URL", key="new_image_url", placeholder="Optional: Enter an image URL...")
        
        # Preview image if URL is provided
        if image_url:
            st.caption("Image Preview:")
            display_image(image_url)
        
        submitted = st.form_submit_button("Create Flashcard", use_container_width=True)
        if submitted:
            create_new_card()

def render_manage_tab():
    """Render the manage tab for viewing and editing flashcards"""
    st.markdown("""
    <h3 style="margin-bottom: 20px;">Manage Flashcards</h3>
    """, unsafe_allow_html=True)
    
    # Filter options
    col1, col2 = st.columns(2)
    with col1:
        filter_option = st.selectbox(
            "Filter cards by",
            ["All Cards", "Due Today", "New Cards", "Reviewed Cards"]
        )
    
    with col2:
        sort_option = st.selectbox(
            "Sort by",
            ["Date Created (Newest)", "Date Created (Oldest)", "Next Review Date"]
        )
    
    # Get filtered cards
    filtered_cards = st.session_state.flashcards.copy()
    
    if filter_option == "Due Today":
        now = datetime.now()
        filtered_cards = [card for card in filtered_cards if 
                         'next_review' not in card or 
                         datetime.fromisoformat(card['next_review']) <= now]
    elif filter_option == "New Cards":
        filtered_cards = [card for card in filtered_cards if 'next_review' not in card]
    elif filter_option == "Reviewed Cards":
        filtered_cards = [card for card in filtered_cards if 'next_review' in card]
    
    # Sort cards
    if sort_option == "Date Created (Newest)":
        filtered_cards.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    elif sort_option == "Date Created (Oldest)":
        filtered_cards.sort(key=lambda x: x.get('created_at', ''))
    elif sort_option == "Next Review Date":
        # Sort by next_review, putting cards without next_review at the top
        def get_next_review(card):
            if 'next_review' not in card:
                return datetime.min
            return datetime.fromisoformat(card['next_review'])
        
        filtered_cards.sort(key=get_next_review)
    
    # Display cards
    if filtered_cards:
        st.write(f"Showing {len(filtered_cards)} cards")
        for i, card in enumerate(filtered_cards):
            # Use title in the expander if available, otherwise use the question
            display_title = card.get('title', '')
            display_text = display_title if display_title else card['question'][:50] + ('...' if len(card['question']) > 50 else '')
            
            with st.expander(f"Card {i+1}: {display_text}"):
                # Card details
                if 'title' in card and card['title'].strip():
                    st.markdown(f"**Title:**\n{card['title']}")
                st.markdown(f"**Question:**\n{card['question']}")
                st.markdown(f"**Answer:**\n{card['answer']}")
                
                # Display image if available
                if card.get('image_url'):
                    st.markdown("**Image:**")
                    display_image(card['image_url'])
                
                # Card metadata
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**Created:** {datetime.fromisoformat(card['created_at']).strftime('%Y-%m-%d')}")
                    if 'last_review' in card:
                        st.markdown(f"**Last Review:** {datetime.fromisoformat(card['last_review']).strftime('%Y-%m-%d')}")
                
                with col2:
                    if 'next_review' in card:
                        next_review = datetime.fromisoformat(card['next_review'])
                        now = datetime.now()
                        time_delta = next_review - now
                        
                        # Calculate days, hours, minutes
                        days = time_delta.days
                        hours = time_delta.seconds // 3600
                        minutes = (time_delta.seconds % 3600) // 60
                        
                        # Format the time until next review
                        time_str = ""
                        if days > 0:
                            time_str += f"{days} day{'s' if days != 1 else ''}, "
                        if hours > 0 or days > 0:  # Show hours if days are shown
                            time_str += f"{hours} hour{'s' if hours != 1 else ''}, "
                        time_str += f"{minutes} minute{'s' if minutes != 1 else ''}"
                        
                        st.markdown(f"**Next Review:** {next_review.strftime('%Y-%m-%d')} ({time_str})")
                    
                    rep_count = card.get('repetitions', 0)
                    if 'last_review' in card:  # Card has been reviewed at least once
                        st.markdown(f"**Reviews:** {rep_count}")
                    else:
                        st.markdown("**Reviews:** Never reviewed")
                
                # Edit and delete buttons
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Edit", key=f"edit_{card['id']}"):
                        st.session_state.editing_card = card
                        st.session_state.edit_title = card.get('title', '')
                        st.session_state.edit_question = card['question']
                        st.session_state.edit_answer = card['answer']
                        st.session_state.edit_image_url = card.get('image_url', '')
                
                with col2:
                    if st.button("Delete", key=f"delete_{card['id']}"):
                        # Remove card from list
                        st.session_state.flashcards = [c for c in st.session_state.flashcards if c['id'] != card['id']]
                        
                        # Save changes
                        if st.session_state.flashcard_settings['auto_save']:
                            save_flashcards()
                        
                        st.success("Card deleted successfully!")
                        time.sleep(1)
                        st.rerun()
    else:
        st.info("No cards match the selected filter criteria.")
    
    # Save button for all changes
    if st.button("Save All Changes", use_container_width=True):
        save_flashcards()
        st.success("All changes saved successfully!")

def render_stats_tab():
    """Render the stats tab for viewing performance statistics"""
    st.markdown("""
    <h3 style="margin-bottom: 20px;">Flashcard Statistics</h3>
    """, unsafe_allow_html=True)
    
    # Summary stats
    st.markdown('<div class="stats-container">', unsafe_allow_html=True)
    st.markdown('<h4 style="margin-bottom: 10px;">Summary</h4>', unsafe_allow_html=True)
    
    st.markdown('<div class="stats-grid">', unsafe_allow_html=True)
    
    # Total cards
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{len(st.session_state.flashcards)}</div>
        <div class="stat-label">Total Cards</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Cards due today
    due_cards = get_due_cards()
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{len(due_cards)}</div>
        <div class="stat-label">Due Today</div>
    </div>
    """, unsafe_allow_html=True)
    
    # New cards
    new_cards = get_new_cards()
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{len(new_cards)}</div>
        <div class="stat-label">New Cards</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Current streak - Moved to Summary section
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{st.session_state.flashcard_stats['streak']}</div>
        <div class="stat-label">Current Streak</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Overall success rate
    overall_success_rate = 0
    if st.session_state.flashcard_stats['total_studied'] > 0:
        overall_success_rate = round(st.session_state.flashcard_stats['total_correct'] / st.session_state.flashcard_stats['total_studied'] * 100)
    
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{overall_success_rate}%</div>
        <div class="stat-label">Overall Success</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Daily progress
    st.markdown('<h4 style="margin: 20px 0 10px 0;">Today\'s Progress</h4>', unsafe_allow_html=True)
    
    st.markdown('<div class="stats-grid">', unsafe_allow_html=True)
    
    # Cards studied today
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{st.session_state.flashcard_stats['studied_today']}</div>
        <div class="stat-label">Cards Studied</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Correct today
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{st.session_state.flashcard_stats['correct_today']}</div>
        <div class="stat-label">Correct Answers</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Today's success rate
    today_success_rate = 0
    if st.session_state.flashcard_stats['studied_today'] > 0:
        today_success_rate = round(st.session_state.flashcard_stats['correct_today'] / st.session_state.flashcard_stats['studied_today'] * 100)
    
    st.markdown(f"""
    <div class="stat-item">
        <div class="stat-value">{today_success_rate}%</div>
        <div class="stat-label">Today's Success</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Graph of review schedule (to be implemented)
    # Retention rate (to be implemented)

def render_settings_tab():
    """Render the settings tab for flashcard settings"""
    st.markdown("""
    <h3 style="margin-bottom: 20px;">Flashcard Settings</h3>
    """, unsafe_allow_html=True)
    
    # Daily limits
    st.subheader("Daily Limits")
    col1, col2 = st.columns(2)
    
    with col1:
        st.session_state.flashcard_settings['new_cards_per_day'] = st.slider(
            "New cards per day",
            min_value=1,
            max_value=50,
            value=st.session_state.flashcard_settings['new_cards_per_day'],
            step=1,
            help="Maximum number of new cards to show per day"
        )
    
    with col2:
        st.session_state.flashcard_settings['review_cards_per_day'] = st.slider(
            "Review cards per day",
            min_value=1,
            max_value=100,
            value=st.session_state.flashcard_settings['review_cards_per_day'],
            step=5,
            help="Maximum number of review cards to show per day"
        )
    
    # Advanced settings
    st.subheader("Advanced Settings")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.session_state.flashcard_settings['initial_interval'] = st.slider(
            "Initial interval (days)",
            min_value=1,
            max_value=10,
            value=st.session_state.flashcard_settings['initial_interval'],
            step=1,
            help="Number of days before the first review"
        )
    
    with col2:
        st.session_state.flashcard_settings['interval_modifier'] = st.slider(
            "Interval modifier",
            min_value=0.5,
            max_value=2.0,
            value=st.session_state.flashcard_settings['interval_modifier'],
            step=0.1,
            help="Multiplier for all review intervals"
        )
    
    # Auto-save setting
    st.session_state.flashcard_settings['auto_save'] = st.toggle(
        "Auto-save changes",
        value=st.session_state.flashcard_settings['auto_save'],
        help="Automatically save changes when creating or reviewing cards"
    )
    
    # Save button
    if st.button("Save Settings", use_container_width=True):
        save_flashcard_settings()
        st.success("Settings saved successfully!")
    
    # Reset button
    if st.button("Reset to Defaults", use_container_width=True):
        st.session_state.flashcard_settings = DEFAULT_FLASHCARD_SETTINGS
        save_flashcard_settings()
        st.success("Settings reset to defaults!")
        st.rerun()

def render_flashcards_interface():
    """Main function to render the flashcards interface"""
    # Apply custom CSS
    apply_custom_flashcards_css()
    
    # Header
    st.markdown("""
    <div style="text-align: center; padding: 20px 0; animation: fadeIn 1s ease-in;">
        <h1 style="color: #6c4ed4; margin-bottom: 5px;">📚 Flashcards</h1>
        <p style="color: #666; font-size: 1rem;">Boost your learning with spaced repetition</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation to chat page
    col1, col2 = st.columns([5, 1])
    with col2:
        st.button("💬 Chat", key="goto_chat", on_click=switch_to_chat)
    
    # Create tabs for different sections
    tab_labels = ["Study", "Create", "Manage", "Stats", "Settings"]
    tabs = st.tabs(tab_labels)
    
    # Study Tab
    with tabs[0]:
        render_study_tab()
    
    # Create Tab
    with tabs[1]:
        render_create_tab()
    
    # Manage Tab
    with tabs[2]:
        render_manage_tab()
    
    # Stats Tab
    with tabs[3]:
        render_stats_tab()
    
    # Settings Tab
    with tabs[4]:
        render_settings_tab()
    
    # Footer
    st.markdown("""
    <div style="text-align: center; color: #888; padding-top: 20px; border-top: 1px solid #eee;">
        <p>Built with ❤️ using Streamlit</p>
    </div>
    """, unsafe_allow_html=True)

def switch_to_flashcards():
    """Switch to the flashcards page"""
    st.session_state.page = "flashcards"

def switch_to_chat():
    """Switch to the chat page"""
    st.session_state.page = "chat"
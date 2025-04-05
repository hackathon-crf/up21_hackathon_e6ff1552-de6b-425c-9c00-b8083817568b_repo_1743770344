import streamlit as st
from frontend.middleware import call_backend_test, send_message, save_chat_history, submit_feedback
import time
from datetime import datetime
import random
import uuid
from frontend.settings import init_settings_state, render_settings_tab
from frontend.flashcards import init_flashcards_state, render_flashcards_interface
from frontend.multiplayer import init_multiplayer_state, render_multiplayer_interface

# Configure page at module level for importing modules
st.set_page_config(
    page_title="Modern Chatbot",
    page_icon="💬",
    layout="centered"
)

def initialize_session_state():
    """Initialize session state variables if they don't exist"""
    # Initialize settings-related state first
    init_settings_state()
    
    # Initialize flashcards-related state
    init_flashcards_state()
    
    # Initialize multiplayer-related state
    init_multiplayer_state()
    
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant", 
                "content": "Hello! How can I help you today?", 
                "timestamp": datetime.now().strftime("%H:%M"),
                "id": str(uuid.uuid4())
            }
        ]
    
    if "user_input" not in st.session_state:
        st.session_state.user_input = ""
        
    # Add a flag to track if we need to process a new message
    if "process_new_message" not in st.session_state:
        st.session_state.process_new_message = False
        
    # Add a flag for feedback mode
    if "show_feedback" not in st.session_state:
        st.session_state.show_feedback = False
        
    # Track current message for feedback
    if "current_feedback_msg_id" not in st.session_state:
        st.session_state.current_feedback_msg_id = None
    
    # Set default page
    if "page" not in st.session_state:
        st.session_state.page = "chat"

def submit_message():
    """Callback function when a message is submitted"""
    if st.session_state.current_input.strip():  # Check if input is not just whitespace
        # Get the message content
        user_message = st.session_state.current_input
        
        # Update tracking variables
        st.session_state.user_input = user_message
        st.session_state.process_new_message = True
        
        # Add user message to chat
        timestamp = datetime.now().strftime("%H:%M")
        st.session_state.messages.append(
            {
                "role": "user", 
                "content": user_message, 
                "timestamp": timestamp,
                "id": str(uuid.uuid4())
            }
        )

def switch_to_settings():
    """Switch to the settings page"""
    st.session_state.page = "settings"

def switch_to_chat():
    """Switch to the chat page"""
    st.session_state.page = "chat"

def switch_to_flashcards():
    """Switch to the flashcards page"""
    st.session_state.page = "flashcards"
    
def switch_to_multiplayer():
    """Switch to the multiplayer page"""
    st.session_state.page = "multiplayer"

def apply_custom_css():
    """Apply custom CSS for a beautiful chat interface"""
    st.markdown("""
    <style>
    /* Main container styling */
    .main {
        background-color: #f9f9fb;
    }
    
    /* Header styling */
    .stHeader {
        background-color: #ffffff;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    /* Chat container */
    .chat-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 12px;
    }
    
    /* Message bubbles */
    .assistant-bubble {
        background-color: #f0f4f9;
        border-radius: 18px 18px 18px 0;
        padding: 12px 18px;
        margin-bottom: 10px;
        display: inline-block;
        max-width: 80%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .user-bubble {
        background-color: #4A76F9;
        color: white;
        border-radius: 18px 18px 0 18px;
        padding: 12px 18px;
        margin-bottom: 10px;
        display: inline-block;
        max-width: 80%;
        float: right;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    /* Timestamp styling */
    .timestamp {
        font-size: 0.7rem;
        color: #888;
        margin-top: 4px;
        display: block;
    }
    
    /* Typing animation */
    .typing-animation {
        display: inline-flex;
        align-items: center;
        height: 30px;
    }
    
    .typing-dot {
        width: 8px;
        height: 8px;
        margin: 0 2px;
        background-color: #888;
        border-radius: 50%;
        opacity: 0.6;
        animation: pulse 1.5s infinite ease-in-out;
    }
    
    .typing-dot:nth-child(1) {
        animation-delay: 0s;
    }
    
    .typing-dot:nth-child(2) {
        animation-delay: 0.3s;
    }
    
    .typing-dot:nth-child(3) {
        animation-delay: 0.6s;
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.2);
        }
    }
    
    /* Input box styling */
    .stTextInput > div > div > input {
        border-radius: 20px !important;
        padding-left: 20px !important;
    }
    
    /* Send button styling */
    .stButton > button {
        border-radius: 8px !important;  /* Changed from 50% to 8px for rectangular buttons */
        padding: 0.5rem 1rem !important; /* Added padding for better text display */
        height: auto !important; /* Allow height to adjust to content */
        width: auto !important; /* Allow width to adjust to content */
        min-width: 44px !important; /* Minimum width to fit content */
        min-height: 44px !important; /* Minimum height for touch targets */
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background-color: #4A76F9 !important;
        color: white !important;
        font-size: 1rem !important; /* Larger font size for better readability */
    }
    
    /* Settings button specific styling */
    button[data-testid="baseButton-secondary"]:has(div:contains("⚙️")) {
        padding: 0.5rem 1rem !important;
        width: auto !important;
        border-radius: 8px !important;
        background-color: #6c4ed4 !important;
        color: white !important;
    }
    
    /* Back button styling */
    button[data-testid="baseButton-secondary"]:has(div:contains("Back")) {
        padding: 0.5rem 1.2rem !important;
        width: auto !important;
        border-radius: 8px !important;
        background-color: #f0f0f0 !important;
        color: #333 !important;
    }
    
    /* Primary button styling (Save Settings) */
    button[data-testid="baseButton-primary"] {
        padding: 0.7rem 1.5rem !important;
        width: auto !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
    }
    
    /* Send icon styling */
    .send-icon {
        font-size: 16px;
    }
    
    /* Spinner animation for loading state */
    @keyframes spinner {
        to {transform: rotate(360deg);}
    }
    
    .spinner:before {
        content: '';
        box-sizing: border-box;
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin-top: -10px;
        margin-left: -10px;
        border-radius: 50%;
        border: 2px solid #ccc;
        border-top-color: #333;
        animation: spinner .6s linear infinite;
    }
    
    /* Sidebar navigation */
    .sidebar-nav {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        margin-bottom: 20px;
    }
    
    .sidebar-nav h3 {
        color: #6c4ed4;
        font-size: 1.2rem;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .sidebar-nav-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 5px;
        border-radius: 8px;
        cursor: pointer;
        text-decoration: none;
        color: #333;
        transition: background-color 0.2s;
    }
    
    .sidebar-nav-item:hover {
        background-color: #f8f9fa;
    }
    
    .sidebar-nav-item.active {
        background-color: #6c4ed4;
        color: white;
    }
    
    .sidebar-nav-icon {
        margin-right: 10px;
        font-size: 1.2rem;
        display: inline-block;
        width: 24px;
        text-align: center;
    }
    
    /* Nav bar styling */
    .nav-container {
        display: flex;
        justify-content: flex-end;
        padding: 10px 20px;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
    </style>
    """, unsafe_allow_html=True)

def render_chat_message(message):
    """Render a chat message with styling based on role"""
    role = message["role"]
    content = message["content"]
    timestamp = message.get("timestamp", "")
    metrics = message.get("metrics", {})
    
    # Check if content appears to be a JSON string containing the response data
    if role == "assistant" and isinstance(content, str) and content.startswith("{") and "response" in content and "metrics" in content:
        try:
            import json
            # Try to parse the content as JSON
            parsed_content = json.loads(content.replace("'", '"'))
            if isinstance(parsed_content, dict) and "response" in parsed_content and "metrics" in parsed_content:
                # Extract the actual response content and metrics
                content = parsed_content["response"]
                metrics = parsed_content["metrics"]
        except:
            # If parsing fails, leave content as is
            pass
    
    if role == "assistant":
        st.markdown(f"""
        <div style="display: flex; margin-bottom: 15px;">
            <div style="background-color: #6c4ed4; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0">
                <span style="font-size: 16px;">🤖</span>
            </div>
            <div>
                <div class="assistant-bubble">{content}</div>
                <span class="timestamp">{timestamp}</span>
                <div style="font-size: 0.8rem; color: #888; margin-top: 5px;">
                    Tokens: {metrics.get("total_tokens", 0)} | Time: {metrics.get("response_time", 0)}s
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div style="display: flex; flex-direction: row-reverse; margin-bottom: 15px;">
            <div style="background-color: #f0f0f0; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-left: 10px; flex-shrink: 0">
                <span style="font-size: 16px;">👤</span>
            </div>
            <div style="text-align: right;">
                <div class="user-bubble">{content}</div>
                <span class="timestamp">{timestamp}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

def show_typing_animation():
    """Show a typing animation while the assistant is "thinking"""
    typing_container = st.empty()
    typing_container.markdown("""
    <div style="display: flex; margin-bottom: 15px;">
        <div style="background-color: #6c4ed4; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-right: 10px; flex-shrink: 0">
            <span style="font-size: 16px;">🤖</span>
        </div>
        <div class="assistant-bubble typing-animation">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    return typing_container

def create_chat_input():
    """Create a styled chat input area with a send button"""
    col1, col2 = st.columns([6, 1])
    
    with col1:
        # Use the on_change parameter to call our function when input changes
        user_input = st.text_input(
            "Type a message...",
            key="current_input",
            label_visibility="collapsed",
            placeholder="Type your message here...",
            on_change=submit_message
        )
    
    with col2:
        send_button = st.button(
            "Send ➤", 
            key="send",
            help="Send message",
            on_click=submit_message
        )
    
    return user_input, send_button

def render_sidebar():
    """Render the sidebar navigation"""
    with st.sidebar:
        st.markdown('<div class="sidebar-nav">', unsafe_allow_html=True)
        st.markdown('<h3>Navigation</h3>', unsafe_allow_html=True)
        
        # Chat navigation item
        chat_class = "active" if st.session_state.page == "chat" else ""
        if st.button("💬 Chat", key="chat-nav-btn", help="Go to Chat", use_container_width=True, 
                   type="secondary" if st.session_state.page != "chat" else "primary"):
            switch_to_chat()
        
        # Flashcards navigation item
        flashcards_class = "active" if st.session_state.page == "flashcards" else ""
        if st.button("📚 Flashcards", key="flashcards-nav-btn", help="Go to Flashcards", use_container_width=True,
                   type="secondary" if st.session_state.page != "flashcards" else "primary"):
            switch_to_flashcards()
        
        # Multiplayer navigation item
        multiplayer_class = "active" if st.session_state.page == "multiplayer" else ""
        if st.button("🎮 Multiplayer", key="multiplayer-nav-btn", help="Go to Multiplayer", use_container_width=True,
                   type="secondary" if st.session_state.page != "multiplayer" else "primary"):
            switch_to_multiplayer()
        
        # Settings navigation item
        settings_class = "active" if st.session_state.page == "settings" else ""
        if st.button("⚙️ Settings", key="settings-nav-btn", help="Go to Settings", use_container_width=True,
                   type="secondary" if st.session_state.page != "settings" else "primary"):
            switch_to_settings()
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # App info section
        st.markdown("""
        <div style="padding: 15px 10px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px;">
            <h4 style="color: #6c4ed4; font-size: 1.1rem; margin-bottom: 10px;">About</h4>
            <p style="color: #666; font-size: 0.9rem;">
                Modern Chatbot with RAG capabilities and flashcard learning system with spaced repetition.
            </p>
        </div>
        """, unsafe_allow_html=True)

def render_chat_interface():
    """Render the chat interface"""
    # Header with subtle animation
    st.markdown("""
    <div style="text-align: center; padding: 20px 0; animation: fadeIn 1s ease-in;">
        <h1 style="color: #6c4ed4; margin-bottom: 5px;">✨ Modern Chatbot ✨</h1>
        <p style="color: #666; font-size: 1rem;">Ask me anything and I'll do my best to help!</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check backend connection
    backend_status = call_backend_test()
    
    # Show model info if enabled
    if st.session_state.settings["other"]["show_model_info"]:
        model_info = f"Model: {st.session_state.settings['model']['provider']}/{st.session_state.settings['model']['model_name']}"
        st.markdown(f"<p style='text-align: center; color: #888; font-size: 0.8rem;'>{model_info}</p>", unsafe_allow_html=True)
    
    # Chat container
    chat_container = st.container()
    
    # Display chat messages
    with chat_container:
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        for message in st.session_state.messages:
            render_chat_message(message)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Chat input
    st.markdown("<div style='padding: 20px 0;'></div>", unsafe_allow_html=True)
    user_input, send_button = create_chat_input()
    
    # Process user message if the flag is set
    if st.session_state.process_new_message:
        # Reset the flag
        st.session_state.process_new_message = False
        
        # Get the last user message
        user_message = st.session_state.messages[-1]["content"]
        
        # Show typing animation
        typing_animation = show_typing_animation()
        
        # Simulate thinking/processing time
        time.sleep(random.uniform(0.5, 1.5))
        
        try:
            # Call backend API to get response
            if backend_status:
                # Get response from backend
                api_response = send_message(user_message)
                
                # Debug the response structure
                print(f"API Response: {api_response}")
                
                # Extract message text and metrics data
                if isinstance(api_response, dict):
                    # Get the actual message text, not the entire response object
                    assistant_message = api_response.get("response", "Sorry, I couldn't process your request at the moment.")
                    
                    # Extract metrics separately
                    metrics = api_response.get("metrics", {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "response_time": 0
                    })
                else:
                    # Fallback if response is not a dictionary
                    assistant_message = str(api_response)
                    metrics = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "response_time": 0
                    }
            else:
                assistant_message = "Sorry, I'm having trouble connecting to my brain right now. Please try again later."
                metrics = {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "response_time": 0
                }
                st.error("Backend is not responding", icon="🚫")
                
        except Exception as e:
            assistant_message = f"Oops! Something went wrong: {str(e)}"
            metrics = {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "response_time": 0
            }
            st.error(f"Error: {str(e)}", icon="⚠️")
        
        # Remove typing animation
        typing_animation.empty()
        
        # Add assistant response to chat
        timestamp = datetime.now().strftime("%H:%M")
        st.session_state.messages.append({
            "role": "assistant", 
            "content": assistant_message,  # Store only the message text, not the entire response
            "timestamp": timestamp,
            "id": str(uuid.uuid4()),
            "metrics": metrics  # Store metrics separately
        })
        
        # Save chat history
        save_chat_history(st.session_state.messages)
        
        # Rerun to update UI with assistant message
        st.rerun()
    
    # Add some space at the bottom
    st.markdown("<div style='padding: 20px 0;'></div>", unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
    <div style="text-align: center; color: #888; padding-top: 20px; border-top: 1px solid #eee;">
        <p>Built with ❤️ using Streamlit</p>
    </div>
    """, unsafe_allow_html=True)

def main():
    """Main entry point for the Streamlit app"""
    # Initialize session state
    initialize_session_state()
    
    # Apply custom styling
    apply_custom_css()
    
    # Render sidebar navigation
    render_sidebar()
    
    # Render the appropriate page based on session state
    if st.session_state.page == "settings":
        render_settings_tab()
    elif st.session_state.page == "flashcards":
        render_flashcards_interface()
    elif st.session_state.page == "multiplayer":
        render_multiplayer_interface()
    else:
        render_chat_interface()
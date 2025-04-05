import streamlit as st
import time
import json
from datetime import datetime
import random
import uuid
from pathlib import Path
import requests
import base64
import os
from io import BytesIO
from PIL import Image
import asyncio
import websockets
import threading

# Import middleware functions
from frontend.middleware import call_backend_test
from settings.config import settings
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".client_env")

# Get environment variables, with fallbacks
DOMAIN_NAME = os.getenv("DOMAIN_NAME", "localhost")
ROOT_PATH = os.getenv("ROOT_PATH", "")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8090")

# Initialize multiplayer-related session state variables
def init_multiplayer_state():
    """Initialize multiplayer-related session state variables"""
    # Main state for multiplayer UI
    if "multiplayer_state" not in st.session_state:
        st.session_state.multiplayer_state = "lobby"  # lobby, waiting_room, game_view, scoreboard_view, results_view
    
    # User credentials and game info
    if "nickname" not in st.session_state:
        st.session_state.nickname = ""
    if "game_code" not in st.session_state:
        st.session_state.game_code = ""
    if "host_id" not in st.session_state:
        st.session_state.host_id = ""
    if "player_id" not in st.session_state:
        st.session_state.player_id = ""
    if "is_host" not in st.session_state:
        st.session_state.is_host = False
    
    # Game data
    if "players" not in st.session_state:
        st.session_state.players = []
    if "current_question" not in st.session_state:
        st.session_state.current_question = None
    if "timer_duration" not in st.session_state:
        st.session_state.timer_duration = 20  # seconds
    if "round_start_time" not in st.session_state:
        st.session_state.round_start_time = None
    if "answered_this_round" not in st.session_state:
        st.session_state.answered_this_round = False
    if "scoreboard_data" not in st.session_state:
        st.session_state.scoreboard_data = None
    if "game_results" not in st.session_state:
        st.session_state.game_results = None
    
    # WebSocket connection
    if "ws_connected" not in st.session_state:
        st.session_state.ws_connected = False
    if "ws_messages" not in st.session_state:
        st.session_state.ws_messages = []
    if "ws_last_update" not in st.session_state:
        st.session_state.ws_last_update = datetime.now()

def switch_to_multiplayer():
    """Switch to the multiplayer page"""
    st.session_state.page = "multiplayer"

def switch_to_chat():
    """Switch to the chat page"""
    st.session_state.page = "chat"

def switch_to_flashcards():
    """Switch to the flashcards page"""
    st.session_state.page = "flashcards"

def apply_custom_multiplayer_css():
    """Apply custom CSS for the multiplayer interface"""
    st.markdown("""
    <style>
    /* Game container */
    .game-container {
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
    }
    
    /* Lobby styling */
    .lobby-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }
    
    /* Waiting room styling */
    .player-list {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
    }
    
    .player-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 5px;
        border-radius: 8px;
        background-color: white;
    }
    
    .player-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #6c4ed4;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        font-weight: bold;
    }
    
    .player-host-badge {
        background-color: #ffd700;
        color: #333;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 10px;
    }
    
    /* Game code display */
    .game-code-display {
        background-color: #f0f4f9;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        text-align: center;
        font-size: 1.5rem;
        font-weight: bold;
        letter-spacing: 5px;
        color: #333;
    }
    
    /* Question styling */
    .question-container {
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
    }
    
    .question-text {
        font-size: 1.5rem;
        font-weight: 500;
        color: #333;
        margin-bottom: 20px;
    }
    
    /* Timer */
    .timer-container {
        margin: 20px 0;
    }
    
    .timer-bar {
        height: 10px;
        border-radius: 5px;
        background: linear-gradient(90deg, #4A76F9 0%, #6c4ed4 100%);
    }
    
    /* Answer options */
    .answer-option {
        background-color: #f0f4f9;
        border: 2px solid #4A76F9;
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .answer-option:hover {
        background-color: #e0e8f9;
        transform: translateY(-2px);
    }
    
    .answered {
        background-color: #d1d1d1;
        border-color: #999;
        color: #666;
        pointer-events: none;
    }
    
    /* Scoreboard */
    .scoreboard-container {
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .scoreboard-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .player-score-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 15px;
        margin-bottom: 10px;
        border-radius: 8px;
        background-color: #f8f9fa;
    }
    
    .player-rank {
        font-weight: bold;
        font-size: 1.2rem;
        margin-right: 15px;
        color: #666;
    }
    
    .player-score {
        font-weight: bold;
        font-size: 1.1rem;
        color: #4A76F9;
    }
    
    .player-score-change {
        font-size: 0.9rem;
        padding: 3px 8px;
        border-radius: 10px;
        margin-left: 10px;
    }
    
    .score-increased {
        background-color: #d4f7d4;
        color: #28a745;
    }
    
    .score-unchanged {
        background-color: #f7f7d7;
        color: #ffc107;
    }
    
    /* Results view */
    .results-container {
        background-color: white;
        border-radius: 12px;
        padding: 30px;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
    }
    
    .results-title {
        font-size: 2rem;
        font-weight: 600;
        color: #6c4ed4;
        margin-bottom: 30px;
    }
    
    .winner-badge {
        background-color: #ffd700;
        color: #333;
        font-size: 0.9rem;
        padding: 3px 8px;
        border-radius: 10px;
        margin-left: 10px;
    }
    
    /* Connection status */
    .connection-status {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        z-index: 1000;
    }
    
    .connected {
        background-color: #d4f7d4;
        color: #28a745;
    }
    
    .disconnected {
        background-color: #f7d4d4;
        color: #dc3545;
    }
    </style>
    """, unsafe_allow_html=True)

# WebSocket connection handling
def setup_websocket_connection():
    """Setup WebSocket connection in a separate thread"""
    if st.session_state.ws_connected:
        return  # Already connected
    
    if not st.session_state.game_code or not st.session_state.nickname:
        return  # Missing required data
    
    # Start WebSocket connection in a separate thread
    def websocket_thread():
        asyncio.run(connect_to_websocket())
    
    thread = threading.Thread(target=websocket_thread)
    thread.daemon = True
    thread.start()

async def connect_to_websocket():
    """Connect to the WebSocket server"""
    ws_url = f"ws://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/multiplayer/ws/{st.session_state.game_code}/{st.session_state.nickname}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            st.session_state.ws_connected = True
            
            # Listen for messages
            while True:
                try:
                    message = await websocket.recv()
                    handle_websocket_message(message)
                except websockets.exceptions.ConnectionClosed:
                    st.session_state.ws_connected = False
                    break
    except Exception as e:
        st.session_state.ws_connected = False
        print(f"WebSocket error: {e}")

def handle_websocket_message(message):
    """Handle incoming WebSocket messages"""
    try:
        # Parse the message
        data = json.loads(message)
        event_type = data.get("event")
        
        # Add to messages queue
        st.session_state.ws_messages.append(data)
        st.session_state.ws_last_update = datetime.now()
        
        # Handle different event types
        if event_type == "player_joined":
            st.session_state.players = data.get("players", [])
        
        elif event_type == "player_left":
            st.session_state.players = data.get("players", [])
        
        elif event_type == "game_started":
            st.session_state.multiplayer_state = "game_view"
        
        elif event_type == "new_question":
            st.session_state.current_question = data.get("question", {})
            st.session_state.timer_duration = data.get("timer_duration", 20)
            st.session_state.round_start_time = datetime.now()
            st.session_state.answered_this_round = False
            st.session_state.multiplayer_state = "game_view"
        
        elif event_type == "show_scoreboard":
            st.session_state.scoreboard_data = data.get("scoreboard", {})
            st.session_state.multiplayer_state = "scoreboard_view"
        
        elif event_type == "game_over":
            st.session_state.game_results = data.get("results", {})
            st.session_state.multiplayer_state = "results_view"
        
    except Exception as e:
        print(f"Error handling WebSocket message: {e}")

# API client functions for multiplayer
def create_game(host_nickname, flashcards_content):
    """Create a new multiplayer game"""
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/multiplayer/create"
        print(f"Creating game at URL: {url}")
        
        payload = {
            "host_nickname": host_nickname,
            "flashcards_content": flashcards_content
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {
                "status": "error",
                "message": f"Error: {response.status_code}"
            }
    except Exception as e:
        print(f"Error creating game: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection error: {str(e)}"
        }

def join_game(game_code, nickname):
    """Join an existing multiplayer game"""
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/multiplayer/join"
        print(f"Joining game at URL: {url}")
        
        payload = {
            "game_code": game_code,
            "nickname": nickname
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {
                "status": "error",
                "message": f"Error: {response.status_code}"
            }
    except Exception as e:
        print(f"Error joining game: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection error: {str(e)}"
        }

def start_game(game_code, host_id):
    """Start a multiplayer game"""
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/multiplayer/start"
        print(f"Starting game at URL: {url}")
        
        payload = {
            "game_code": game_code,
            "host_id": host_id
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {
                "status": "error",
                "message": f"Error: {response.status_code}"
            }
    except Exception as e:
        print(f"Error starting game: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection error: {str(e)}"
        }

def submit_answer(game_code, player_id, answer, time_taken):
    """Submit an answer for the current question"""
    try:
        url = f"http://{DOMAIN_NAME}:{BACKEND_PORT}{ROOT_PATH}/api/multiplayer/answer"
        print(f"Submitting answer to URL: {url}")
        
        payload = {
            "game_code": game_code,
            "player_id": player_id,
            "answer": answer,
            "time_taken": time_taken
        }
        
        response = requests.post(url, json=payload)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from backend: {response.text}")
            return {
                "status": "error",
                "message": f"Error: {response.status_code}"
            }
    except Exception as e:
        print(f"Error submitting answer: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection error: {str(e)}"
        }

# UI Components for each state
def render_lobby():
    """Render the lobby UI for joining or creating a game"""
    st.markdown("""
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6c4ed4;">🎮 Multiplayer Flashcards</h1>
        <p>Play flashcard games with friends in real-time!</p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    # Create Game Form
    with col1:
        st.markdown('<div class="lobby-container">', unsafe_allow_html=True)
        st.markdown('<h2>Create a Game</h2>', unsafe_allow_html=True)
        
        nickname = st.text_input("Your Nickname", key="create_nickname", placeholder="Enter your nickname...")
        
        # File uploader for flashcards.json
        uploaded_file = st.file_uploader("Upload Flashcards (JSON file)", type=["json"])
        
        if st.button("Create Game", key="create_game_btn", use_container_width=True, disabled=not (nickname and uploaded_file)):
            if nickname and uploaded_file:
                try:
                    # Read the uploaded flashcards file
                    flashcards_content = json.load(uploaded_file)
                    
                    # Call API to create game
                    result = create_game(nickname, flashcards_content)
                    
                    if result.get("status") != "error":
                        # Store game information in session state
                        st.session_state.game_code = result.get("game_code")
                        st.session_state.host_id = result.get("host_id")
                        st.session_state.nickname = nickname
                        st.session_state.is_host = True
                        st.session_state.player_id = result.get("player_id")
                        
                        # Switch to waiting room
                        st.session_state.multiplayer_state = "waiting_room"
                        st.rerun()
                    else:
                        st.error(f"Failed to create game: {result.get('message')}")
                except Exception as e:
                    st.error(f"Error creating game: {str(e)}")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Join Game Form
    with col2:
        st.markdown('<div class="lobby-container">', unsafe_allow_html=True)
        st.markdown('<h2>Join a Game</h2>', unsafe_allow_html=True)
        
        join_nickname = st.text_input("Your Nickname", key="join_nickname", placeholder="Enter your nickname...")
        join_code = st.text_input("Game Code", key="join_code", placeholder="Enter the game code...", max_chars=6)
        
        if st.button("Join Game", key="join_game_btn", use_container_width=True, disabled=not (join_nickname and join_code)):
            if join_nickname and join_code:
                # Call API to join game
                result = join_game(join_code, join_nickname)
                
                if result.get("status") != "error":
                    # Store game information in session state
                    st.session_state.game_code = join_code
                    st.session_state.nickname = join_nickname
                    st.session_state.is_host = False
                    st.session_state.player_id = result.get("player_id")
                    
                    # Switch to waiting room
                    st.session_state.multiplayer_state = "waiting_room"
                    st.rerun()
                else:
                    st.error(f"Failed to join game: {result.get('message')}")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Game instructions
    st.markdown("""
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px;">
        <h3 style="color: #333;">How to Play</h3>
        <ol>
            <li><b>Create a Game:</b> Upload your flashcards JSON file and create a game.</li>
            <li><b>Share the Code:</b> Send the game code to your friends.</li>
            <li><b>Answer Questions:</b> The faster you answer correctly, the more points you earn!</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)

def render_waiting_room():
    """Render the waiting room UI while waiting for players"""
    # Setup WebSocket connection if not connected
    if not st.session_state.ws_connected:
        setup_websocket_connection()
    
    # Header
    st.markdown("""
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6c4ed4;">Waiting Room</h1>
        <p>Waiting for players to join...</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Game code display
    st.markdown(f"""
    <div class="game-code-display">
        Game Code: {st.session_state.game_code}
    </div>
    """, unsafe_allow_html=True)
    
    # Connection status
    status_class = "connected" if st.session_state.ws_connected else "disconnected"
    status_text = "Connected" if st.session_state.ws_connected else "Disconnected"
    st.markdown(f"""
    <div class="connection-status {status_class}">
        {status_text}
    </div>
    """, unsafe_allow_html=True)
    
    # Player list
    st.markdown('<h3>Players</h3>', unsafe_allow_html=True)
    st.markdown('<div class="player-list">', unsafe_allow_html=True)
    
    if st.session_state.players:
        for player in st.session_state.players:
            is_host = player.get("id") == st.session_state.host_id
            player_name = player.get("nickname", "Unknown")
            
            st.markdown(f"""
            <div class="player-item">
                <div class="player-avatar">{player_name[0].upper()}</div>
                <div style="flex-grow: 1;">{player_name}</div>
                {f'<div class="player-host-badge">Host</div>' if is_host else ''}
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown('<div style="text-align: center; padding: 20px; color: #666;">Waiting for players to join...</div>', unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Start game button (for host only)
    if st.session_state.is_host:
        if len(st.session_state.players) >= 1:  # At least one player to start (normally would be 2+)
            if st.button("Start Game", key="start_game_btn", use_container_width=True):
                # Call API to start the game
                result = start_game(st.session_state.game_code, st.session_state.host_id)
                
                if result.get("status") == "error":
                    st.error(f"Failed to start game: {result.get('message')}")
        else:
            st.button("Start Game", key="start_game_btn", use_container_width=True, disabled=True,
                    help="Need at least 2 players to start the game")
    
    # Back to lobby button
    if st.button("Leave Game", key="leave_game_btn", use_container_width=True):
        # Reset session state
        st.session_state.multiplayer_state = "lobby"
        st.session_state.ws_connected = False
        st.session_state.game_code = ""
        st.session_state.host_id = ""
        st.session_state.nickname = ""
        st.session_state.is_host = False
        st.session_state.player_id = ""
        st.session_state.players = []
        st.rerun()
    
    # Periodically check for new WebSocket messages
    if st.session_state.ws_connected:
        # Rerun every second to check for new messages
        time_since_update = (datetime.now() - st.session_state.ws_last_update).total_seconds()
        if time_since_update > 1.0:
            time.sleep(0.1)
            st.rerun()

def render_game_view():
    """Render the game view UI during active gameplay"""
    # Header
    st.markdown("""
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6c4ed4;">Game in Progress</h1>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if we have a current question
    if not st.session_state.current_question:
        st.markdown("""
        <div style="text-align: center; padding: 30px;">
            <p>Waiting for the next question...</p>
            <div class="typing-animation">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Check for updates every second
        time.sleep(1)
        st.rerun()
        return
    
    # Get question data
    question_text = st.session_state.current_question.get("question", "Question not available")
    answer = st.session_state.current_question.get("answer", "")
    options = st.session_state.current_question.get("options", [])
    question_id = st.session_state.current_question.get("id", "")
    
    # Calculate remaining time
    remaining_time = 0
    if st.session_state.round_start_time:
        elapsed_seconds = (datetime.now() - st.session_state.round_start_time).total_seconds()
        remaining_time = max(0, st.session_state.timer_duration - elapsed_seconds)
        time_percentage = max(0, min(100, (remaining_time / st.session_state.timer_duration) * 100))
    
    # Display the question and timer
    st.markdown(f"""
    <div class="question-container">
        <div class="question-text">{question_text}</div>
        
        <div class="timer-container">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Time remaining</span>
                <span>{int(remaining_time)} seconds</span>
            </div>
            <div style="background-color: #eee; border-radius: 5px; height: 10px; width: 100%;">
                <div class="timer-bar" style="width: {time_percentage}%;"></div>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # Display answer options if available, otherwise show text input
    answer_submitted = False
    
    if st.session_state.answered_this_round:
        st.markdown("""
        <div style="text-align: center; margin: 20px 0;">
            <div style="background-color: #d4f7d4; color: #28a745; padding: 10px; border-radius: 8px;">
                <p style="margin: 0;">Your answer has been submitted!</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Waiting for other players...</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        if options:
            # Multiple choice question
            st.markdown("</div>", unsafe_allow_html=True)  # Close the question container
            
            for i, option in enumerate(options):
                btn_key = f"option_{i}"
                if st.button(option, key=btn_key, use_container_width=True, 
                           disabled=st.session_state.answered_this_round):
                    # Submit answer
                    time_taken = (datetime.now() - st.session_state.round_start_time).total_seconds()
                    submit_answer(st.session_state.game_code, st.session_state.player_id, option, time_taken)
                    
                    # Update state
                    st.session_state.answered_this_round = True
                    st.rerun()
        else:
            # Text input question
            text_answer = st.text_input("Your Answer", key="text_answer", 
                                      disabled=st.session_state.answered_this_round)
            
            if st.button("Submit Answer", key="submit_answer_btn", use_container_width=True, 
                       disabled=st.session_state.answered_this_round or not text_answer.strip()):
                if text_answer.strip():
                    # Submit answer
                    time_taken = (datetime.now() - st.session_state.round_start_time).total_seconds()
                    submit_answer(st.session_state.game_code, st.session_state.player_id, text_answer, time_taken)
                    
                    # Update state
                    st.session_state.answered_this_round = True
                    st.rerun()
            
            st.markdown("</div>", unsafe_allow_html=True)  # Close the question container
    
    # Player status
    st.markdown('<h3 style="margin-top: 20px;">Players</h3>', unsafe_allow_html=True)
    st.markdown('<div class="player-list">', unsafe_allow_html=True)
    
    if st.session_state.players:
        for player in st.session_state.players:
            player_name = player.get("nickname", "Unknown")
            answered = player.get("answered_this_round", False)
            score = player.get("score", 0)
            
            status_text = "✓ Answered" if answered else "Thinking..."
            status_color = "#28a745" if answered else "#ffc107"
            
            st.markdown(f"""
            <div class="player-item">
                <div class="player-avatar">{player_name[0].upper()}</div>
                <div style="flex-grow: 1;">{player_name}</div>
                <div style="color: {status_color};">{status_text}</div>
                <div style="margin-left: 15px; font-weight: bold;">{score} pts</div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Auto-refresh to update timer
    if remaining_time > 0 and not st.session_state.answered_this_round:
        time.sleep(0.1)
        st.rerun()
    
    # Periodically check for new WebSocket messages
    if st.session_state.ws_connected:
        # Rerun every second to check for new messages
        time_since_update = (datetime.now() - st.session_state.ws_last_update).total_seconds()
        if time_since_update > 1.0:
            time.sleep(0.5)
            st.rerun()

def render_scoreboard_view():
    """Render the scoreboard view UI between questions"""
    # Header
    st.markdown("""
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6c4ed4;">Round Results</h1>
    </div>
    """, unsafe_allow_html=True)
    
    # Make sure we have scoreboard data
    if not st.session_state.scoreboard_data:
        st.markdown("""
        <div style="text-align: center; padding: 30px;">
            <p>Loading results...</p>
            <div class="typing-animation">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Check for updates every second
        time.sleep(1)
        st.rerun()
        return
    
    # Display correct answer
    correct_answer = st.session_state.scoreboard_data.get("correct_answer", "Not available")
    
    st.markdown(f"""
    <div style="background-color: #d4f7d4; color: #28a745; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h3 style="margin: 0; color: #28a745;">Correct Answer:</h3>
        <p style="font-size: 1.2rem; margin-top: 5px;">{correct_answer}</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Display player scores
    st.markdown('<div class="scoreboard-container">', unsafe_allow_html=True)
    st.markdown('<h2 class="scoreboard-title">Current Standings</h2>', unsafe_allow_html=True)
    
    player_rankings = st.session_state.scoreboard_data.get("player_rankings", [])
    
    if player_rankings:
        for i, player in enumerate(player_rankings):
            player_name = player.get("nickname", "Unknown")
            score = player.get("score", 0)
            score_change = player.get("score_change", 0)
            
            score_change_class = "score-increased" if score_change > 0 else "score-unchanged"
            score_change_text = f"+{score_change}" if score_change > 0 else "0"
            
            st.markdown(f"""
            <div class="player-score-item">
                <div style="display: flex; align-items: center;">
                    <div class="player-rank">#{i+1}</div>
                    <div class="player-avatar">{player_name[0].upper()}</div>
                    <div>{player_name}</div>
                </div>
                <div style="display: flex; align-items: center;">
                    <div class="player-score">{score}</div>
                    <div class="player-score-change {score_change_class}">{score_change_text}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown('<p style="text-align: center;">No player data available</p>', unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Heading to next question message
    st.markdown("""
    <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f0f4f9; border-radius: 8px;">
        <p>Next question in a few seconds...</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Periodically check for new WebSocket messages
    if st.session_state.ws_connected:
        # Rerun every second to check for new messages
        time_since_update = (datetime.now() - st.session_state.ws_last_update).total_seconds()
        if time_since_update > 1.0:
            time.sleep(0.5)
            st.rerun()

def render_results_view():
    """Render the final results view UI at the end of the game"""
    # Header
    st.markdown("""
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6c4ed4;">Game Over!</h1>
        <p>Final Results</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Make sure we have results data
    if not st.session_state.game_results:
        st.markdown("""
        <div style="text-align: center; padding: 30px;">
            <p>Loading final results...</p>
            <div class="typing-animation">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Check for updates every second
        time.sleep(1)
        st.rerun()
        return
    
    # Display winner
    final_rankings = st.session_state.game_results.get("final_rankings", [])
    
    if final_rankings and len(final_rankings) > 0:
        winner = final_rankings[0]
        winner_name = winner.get("nickname", "Unknown")
        winner_score = winner.get("score", 0)
        
        st.markdown(f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #ffd700; display: inline-block; width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;">
                <div style="line-height: 80px; font-size: 40px;">🏆</div>
            </div>
            <h2 style="margin: 0; color: #333;">{winner_name}</h2>
            <p style="font-size: 1.2rem; margin: 5px 0;">{winner_score} points</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Display final rankings
    st.markdown('<div class="results-container">', unsafe_allow_html=True)
    st.markdown('<h2 class="results-title">Final Standings</h2>', unsafe_allow_html=True)
    
    if final_rankings:
        for i, player in enumerate(final_rankings):
            player_name = player.get("nickname", "Unknown")
            score = player.get("score", 0)
            
            winner_badge = '<div class="winner-badge">Winner!</div>' if i == 0 else ''
            
            st.markdown(f"""
            <div class="player-score-item">
                <div style="display: flex; align-items: center;">
                    <div class="player-rank">#{i+1}</div>
                    <div class="player-avatar">{player_name[0].upper()}</div>
                    <div>{player_name}{winner_badge}</div>
                </div>
                <div class="player-score">{score}</div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown('<p style="text-align: center;">No player data available</p>', unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Game stats
    game_stats = st.session_state.game_results.get("game_stats", {})
    
    st.markdown("""
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
        <h3 style="color: #333; margin-bottom: 15px;">Game Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    """, unsafe_allow_html=True)
    
    questions_count = game_stats.get("questions_count", 0)
    st.markdown(f"""
    <div style="background-color: white; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #6c4ed4;">{questions_count}</div>
        <div style="color: #666;">Questions</div>
    </div>
    """, unsafe_allow_html=True)
    
    players_count = game_stats.get("players_count", 0)
    st.markdown(f"""
    <div style="background-color: white; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #6c4ed4;">{players_count}</div>
        <div style="color: #666;">Players</div>
    </div>
    """, unsafe_allow_html=True)
    
    game_duration = game_stats.get("game_duration", "0m 0s")
    st.markdown(f"""
    <div style="background-color: white; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #6c4ed4;">{game_duration}</div>
        <div style="color: #666;">Duration</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Action buttons
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Play Again", key="play_again_btn", use_container_width=True):
            # Reset session state
            st.session_state.multiplayer_state = "lobby"
            st.session_state.ws_connected = False
            st.session_state.game_code = ""
            st.session_state.host_id = ""
            st.session_state.nickname = ""
            st.session_state.is_host = False
            st.session_state.player_id = ""
            st.session_state.players = []
            st.session_state.current_question = None
            st.session_state.scoreboard_data = None
            st.session_state.game_results = None
            st.rerun()
    
    with col2:
        if st.button("Back to Home", key="back_to_home_btn", use_container_width=True):
            # Reset session state and go back to main page
            st.session_state.multiplayer_state = "lobby"
            st.session_state.ws_connected = False
            st.session_state.page = "chat"  # Back to main chat interface
            st.rerun()

def render_multiplayer_interface():
    """Main function to render the multiplayer interface"""
    # Initialize multiplayer state if needed
    init_multiplayer_state()
    
    # Apply custom CSS
    apply_custom_multiplayer_css()
    
    # Render the appropriate view based on the current state
    if st.session_state.multiplayer_state == "lobby":
        render_lobby()
    elif st.session_state.multiplayer_state == "waiting_room":
        render_waiting_room()
    elif st.session_state.multiplayer_state == "game_view":
        render_game_view()
    elif st.session_state.multiplayer_state == "scoreboard_view":
        render_scoreboard_view()
    elif st.session_state.multiplayer_state == "results_view":
        render_results_view()
    else:
        st.error(f"Unknown multiplayer state: {st.session_state.multiplayer_state}")
        
        # Fallback to lobby
        if st.button("Go to Lobby", use_container_width=True):
            st.session_state.multiplayer_state = "lobby"
            st.rerun()
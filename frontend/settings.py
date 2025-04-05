import streamlit as st
import os
from pathlib import Path
from rag_api_client import list_collections
from frontend.middleware import update_preferences

def init_settings_state():
    """Initialize settings-related session state variables"""
    if "page" not in st.session_state:
        st.session_state.page = "chat"  # Default to chat page
    
    if "settings" not in st.session_state:
        # Default settings
        st.session_state.settings = {
            "prompt": {
                "system_prompt": "You are a helpful and friendly assistant. Your responses should be concise, informative, and engaging.",
                "temperature": 0.7,
                "max_tokens": 500
            },
            "model": {
                "provider": "mistral",
                "model_name": "mistral-tiny",
                "api_key": os.environ.get("MISTRAL_API_KEY", ""),
                "streaming": True
            },
            "context": {
                "memory_size": 10,  # Number of messages to remember
                "include_timestamps": True,
                "include_system_messages": False
            },
            "rag": {
                "enabled": True,
                "collections": [],
                "available_collections": [],
                "top_k": 3,  # Number of chunks to retrieve from RAG
            },
            "other": {
                "log_conversations": True,
                "enable_feedback": False,
                "show_model_info": True,
                "theme": "light"
            }
        }
        
        # Load available RAG collections when initializing
        try:
            collections = list_collections()
            st.session_state.settings["rag"]["available_collections"] = collections
            # Set default collections to all available
            st.session_state.settings["rag"]["collections"] = collections
        except Exception as e:
            print(f"Failed to load RAG collections: {e}")

def save_settings():
    """Save settings to a file and sync to backend"""
    # Create .streamlit directory if it doesn't exist
    streamlit_dir = Path.home() / ".streamlit"
    streamlit_dir.mkdir(exist_ok=True)
    
    # Create or update config.toml with settings
    # Following the guidelines from README.md about config.toml format
    config_path = Path(".streamlit") / "config.toml"
    config_path.parent.mkdir(exist_ok=True)
    
    with open(config_path, "w") as f:
        # Client settings
        f.write("[client]\n")
        f.write(f"toolbarMode = \"{'minimal' if st.session_state.settings['other']['enable_feedback'] else 'viewer'}\"\n")
        f.write(f"showSidebarNavigation = false\n\n")
        
        # Theme settings
        f.write("[theme]\n")
        f.write(f"base = \"{st.session_state.settings['other']['theme']}\"\n")
        f.write(f"primaryColor = \"#6c4ed4\"\n")
        f.write(f"backgroundColor = \"#f9f9fb\"\n")
        f.write(f"textColor = \"#262730\"\n")
    
    # Send settings to backend
    try:
        response = update_preferences(st.session_state.settings)
        if response.get("status") == "success":
            st.success("Settings saved successfully and synced to backend!")
        else:
            st.warning(f"Settings saved locally but failed to sync with backend: {response.get('message', 'Unknown error')}")
    except Exception as e:
        st.warning(f"Settings saved locally but failed to sync with backend: {str(e)}")
        print(f"Error syncing preferences: {str(e)}")

def switch_to_chat():
    """Switch to the chat page"""
    st.session_state.page = "chat"

def render_settings_tab():
    """Render settings page with tabs"""
    # Apply settings-specific CSS for button styling
    st.markdown("""
    <style>
    /* Custom button styling for Settings page */
    .stButton > button {
        border-radius: 8px !important; 
        padding: 0.5rem 1rem !important; 
        height: auto !important; 
        width: auto !important; 
        min-width: 100px !important; 
        min-height: 44px !important; 
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 1rem !important; 
    }
    
    /* Tab button styling */
    .stTabs button {
        font-size: 1rem !important;
        font-weight: 500 !important;
        padding: 0.5rem 1rem !important;
    }
    
    /* Tab content padding */
    .stTabs [data-baseweb="tab-panel"] {
        padding-top: 1rem !important;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown("""
    <div style="text-align: center; padding: 20px 0; animation: fadeIn 1s ease-in;">
        <h1 style="color: #6c4ed4; margin-bottom: 5px;">⚙️ Chatbot Settings</h1>
        <p style="color: #666; font-size: 1rem;">Customize your chatbot experience</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Back button
    st.button("← Back to Chat", key="back_to_chat", on_click=switch_to_chat)
    st.divider()
    
    # Create tabs for different settings categories
    tab_labels = ["Prompt", "Model", "Context", "RAG", "RAG Management", "Other"]
    tabs = st.tabs(tab_labels)
    
    # Prompt Settings Tab
    with tabs[0]:
        st.header("Prompt Settings")
        
        st.session_state.settings["prompt"]["system_prompt"] = st.text_area(
            "System Prompt",
            value=st.session_state.settings["prompt"]["system_prompt"],
            help="The prompt that defines your chatbot's personality and behavior",
            height=150
        )
        
        col1, col2 = st.columns(2)
        with col1:
            st.session_state.settings["prompt"]["temperature"] = st.slider(
                "Temperature",
                min_value=0.0,
                max_value=1.0,
                value=st.session_state.settings["prompt"]["temperature"],
                step=0.1,
                help="Higher values make output more random, lower values more deterministic"
            )
        
        with col2:
            st.session_state.settings["prompt"]["max_tokens"] = st.slider(
                "Max Response Length",
                min_value=100,
                max_value=2000,
                value=st.session_state.settings["prompt"]["max_tokens"],
                step=100,
                help="Maximum number of tokens in the model's response"
            )
    
    # Model Settings Tab
    with tabs[1]:
        st.header("Model Settings")
        
        st.session_state.settings["model"]["provider"] = st.selectbox(
            "Provider",
            options=["mistral", "openai", "anthropic", "local"],
            index=["mistral", "openai", "anthropic", "local"].index(st.session_state.settings["model"]["provider"]),
            help="The AI provider to use for your chatbot"
        )
        
        # Show different model options based on provider
        if st.session_state.settings["model"]["provider"] == "mistral":
            model_options = ["mistral-tiny", "mistral-small", "mistral-medium", "mistral-large"]
            default_index = 0
            if st.session_state.settings["model"]["model_name"] in model_options:
                default_index = model_options.index(st.session_state.settings["model"]["model_name"])
            
            st.session_state.settings["model"]["model_name"] = st.selectbox(
                "Model",
                options=model_options,
                index=default_index,
                help="The specific model to use from the selected provider"
            )
        elif st.session_state.settings["model"]["provider"] == "openai":
            st.session_state.settings["model"]["model_name"] = st.selectbox(
                "Model",
                options=["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
                index=0,
                help="The specific model to use from the selected provider"
            )
        elif st.session_state.settings["model"]["provider"] == "anthropic":
            st.session_state.settings["model"]["model_name"] = st.selectbox(
                "Model",
                options=["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
                index=0,
                help="The specific model to use from the selected provider"
            )
        else:  # local
            st.session_state.settings["model"]["model_name"] = st.text_input(
                "Model Path",
                value=st.session_state.settings["model"]["model_name"],
                help="Path to local model"
            )
        
        # API Key input with password masking
        st.session_state.settings["model"]["api_key"] = st.text_input(
            "API Key",
            value=st.session_state.settings["model"]["api_key"],
            type="password",
            help="Your API key for the selected provider"
        )
        
        st.session_state.settings["model"]["streaming"] = st.toggle(
            "Enable Streaming Responses",
            value=st.session_state.settings["model"]["streaming"],
            help="Display responses as they're generated"
        )
    
    # Context Settings Tab
    with tabs[2]:
        st.header("Context Settings")
        
        st.session_state.settings["context"]["memory_size"] = st.slider(
            "Conversation Memory",
            min_value=1,
            max_value=50,
            value=st.session_state.settings["context"]["memory_size"],
            step=1,
            help="Number of previous messages to include in context"
        )
        
        st.session_state.settings["context"]["include_timestamps"] = st.toggle(
            "Include Timestamps",
            value=st.session_state.settings["context"]["include_timestamps"],
            help="Include message timestamps in the context"
        )
        
        st.session_state.settings["context"]["include_system_messages"] = st.toggle(
            "Include System Messages",
            value=st.session_state.settings["context"]["include_system_messages"],
            help="Include system messages in the context"
        )
    
    # RAG Settings Tab
    with tabs[3]:
        st.header("RAG Settings")
        
        st.session_state.settings["rag"]["enabled"] = st.toggle(
            "Enable Retrieval-Augmented Generation",
            value=st.session_state.settings["rag"]["enabled"],
            help="Use document retrieval to enhance chatbot responses"
        )
        
        # Refresh collections button
        if st.button("Refresh Collections", key="refresh_collections"):
            try:
                collections = list_collections()
                st.session_state.settings["rag"]["available_collections"] = collections
                st.success(f"Found {len(collections)} collections")
            except Exception as e:
                st.error(f"Failed to load collections: {str(e)}")
        
        # Only show collection selection if RAG is enabled
        if st.session_state.settings["rag"]["enabled"]:
            # Show available collections
            if "available_collections" in st.session_state.settings["rag"] and st.session_state.settings["rag"]["available_collections"]:
                st.session_state.settings["rag"]["collections"] = st.multiselect(
                    "Select Knowledge Bases",
                    options=st.session_state.settings["rag"]["available_collections"],
                    default=st.session_state.settings["rag"]["collections"],
                    help="Select which document collections to use for RAG"
                )
                
                st.session_state.settings["rag"]["top_k"] = st.slider(
                    "Number of chunks to retrieve",
                    min_value=1,
                    max_value=10,
                    value=st.session_state.settings["rag"]["top_k"],
                    step=1,
                    help="Number of document chunks to retrieve for each query"
                )
            else:
                st.info("No collections available. Click 'Refresh Collections' to fetch available knowledge bases.")
    
    # New RAG Management Tab
    with tabs[4]:
        render_rag_management_tab()
    
    # Other Settings Tab
    with tabs[5]:
        st.header("Other Settings")
        
        st.session_state.settings["other"]["log_conversations"] = st.toggle(
            "Log Conversations",
            value=st.session_state.settings["other"]["log_conversations"],
            help="Save conversation history to logs"
        )
        
        st.session_state.settings["other"]["enable_feedback"] = st.toggle(
            "Enable Feedback Option",
            value=st.session_state.settings["other"]["enable_feedback"],
            help="Allow users to provide feedback on responses"
        )
        
        st.session_state.settings["other"]["show_model_info"] = st.toggle(
            "Show Model Info",
            value=st.session_state.settings["other"]["show_model_info"],
            help="Display model information on the chat interface"
        )
        
        st.session_state.settings["other"]["theme"] = st.selectbox(
            "Theme",
            options=["light", "dark"],
            index=["light", "dark"].index(st.session_state.settings["other"]["theme"]),
            help="UI theme for the chatbot"
        )
    
    # Save and reset buttons
    st.divider()
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Save Settings", type="primary", use_container_width=True):
            save_settings()
    with col2:
        if st.button("Reset to Defaults", use_container_width=True):
            # Reset to defaults by removing settings from session state
            del st.session_state.settings
            init_settings_state()
            st.success("Settings reset to defaults!")
            st.rerun()

def render_rag_management_tab():
    """Render RAG management interface with collection creation and document upload"""
    from frontend.middleware import create_rag_collection, add_document_to_collection
    from rag_api_client import list_collections
    
    st.header("RAG Management")
    
    # Initialize state variables if they don't exist
    if "rag_management_tab" not in st.session_state:
        st.session_state.rag_management_tab = "collections"
    
    # Create navigation pills
    col1, col2, col3 = st.columns([1, 1, 3])
    with col1:
        if st.button("Collections", type="primary" if st.session_state.rag_management_tab == "collections" else "secondary",
                   key="collections_tab", use_container_width=True):
            st.session_state.rag_management_tab = "collections"
            st.rerun()
    
    with col2:
        if st.button("Documents", type="primary" if st.session_state.rag_management_tab == "documents" else "secondary",
                   key="documents_tab", use_container_width=True):
            st.session_state.rag_management_tab = "documents"
            st.rerun()
    
    st.divider()
    
    # Display appropriate tab content
    if st.session_state.rag_management_tab == "collections":
        render_collections_tab()
    else:
        render_documents_tab()

def render_collections_tab():
    """Render the collections management tab"""
    from frontend.middleware import create_rag_collection
    from rag_api_client import list_collections
    
    st.subheader("Manage Collections")
    
    # Display existing collections
    st.markdown("### Existing Collections")
    
    # Refresh collections button
    if st.button("🔄 Refresh Collections", key="refresh_collections_manage"):
        try:
            collections = list_collections()
            st.session_state.settings["rag"]["available_collections"] = collections
            st.success(f"Found {len(collections)} collections")
        except Exception as e:
            st.error(f"Failed to load collections: {str(e)}")
    
    # Show available collections
    if "available_collections" in st.session_state.settings["rag"]:
        collections = st.session_state.settings["rag"]["available_collections"]
        if collections:
            for i, collection in enumerate(collections):
                st.markdown(f"**{i+1}.** {collection}")
        else:
            st.info("No collections found. Create a new one below or refresh the list.")
    else:
        st.info("No collections loaded yet. Click 'Refresh Collections' to fetch the list.")
    
    # Create new collection section
    st.markdown("### Create New Collection")
    with st.form("create_collection_form"):
        new_collection_name = st.text_input("Collection Name", 
                                        placeholder="Enter a name for the new collection")
        submitted = st.form_submit_button("Create Collection")
        
        if submitted and new_collection_name:
            # Call the API to create collection
            response = create_rag_collection(new_collection_name)
            if response.get("status") == "success":
                st.success(f"Collection '{new_collection_name}' created successfully!")
                # Refresh the list of collections
                try:
                    collections = list_collections()
                    st.session_state.settings["rag"]["available_collections"] = collections
                except Exception:
                    pass
            else:
                st.error(f"Failed to create collection: {response.get('message', 'Unknown error')}")

def render_documents_tab():
    """Render the documents management tab"""
    from frontend.middleware import add_document_to_collection
    
    st.subheader("Manage Documents")
    
    # Document upload section
    st.markdown("### Upload Document to Collection")
    
    # Check if we have collections available
    if not st.session_state.settings["rag"].get("available_collections"):
        st.warning("No collections available. Please create or refresh collections in the Collections tab first.")
        return
    
    with st.form("upload_document_form"):
        # Collection selection
        collection_name = st.selectbox(
            "Select Collection",
            options=st.session_state.settings["rag"]["available_collections"],
            help="Choose the collection to add this document to"
        )
        
        # File upload
        uploaded_file = st.file_uploader(
            "Upload Document", 
            type=["pdf", "txt", "docx", "md", "csv"],
            help="Supported formats: PDF, TXT, DOCX, MD, CSV"
        )
        
        # Embedding model selection
        model = st.selectbox(
            "Embedding Model",
            options=["mistral-embed", "text-embedding-ada-002"],
            help="Model to use for generating document embeddings"
        )
        
        # Advanced options expander
        with st.expander("Advanced Options"):
            chunking_col1, chunking_col2 = st.columns(2)
            
            with chunking_col1:
                chunk_size = st.number_input(
                    "Chunk Size",
                    min_value=100,
                    max_value=2000,
                    value=500,
                    step=50,
                    help="Size of text chunks in characters (larger chunks provide more context but less precision)"
                )
            
            with chunking_col2:
                chunk_overlap = st.number_input(
                    "Chunk Overlap",
                    min_value=0,
                    max_value=500,
                    value=50,
                    step=10,
                    help="Overlap between consecutive chunks to maintain context between chunks"
                )
        
        submitted = st.form_submit_button("Upload Document")
        
        if submitted and uploaded_file and collection_name:
            # Show upload in progress indicator
            with st.spinner(f"Uploading document to collection '{collection_name}'..."):
                # Call the API to upload document
                response = add_document_to_collection(
                    file=uploaded_file,
                    collection_name=collection_name,
                    model=model,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap
                )
                
                if response.get("status") == "success":
                    st.success(f"Document '{uploaded_file.name}' uploaded successfully to collection '{collection_name}'!")
                else:
                    st.error(f"Failed to upload document: {response.get('message', 'Unknown error')}")
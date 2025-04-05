#!/bin/bash
# Set the domain name environment variable
export DOMAIN_NAME="localhost"

# Run the backend service
python main_back.py --port 1027 > logs/backend.log &

# Give the backend time to start
sleep 2

# Run the frontend using streamlit
streamlit run main_front.py > logs/frontend.log
#!/bin/bash

# Start the Ollama server
ollama serve &

# Pull Model
# ollama run deepseek-r1:7b &

#debug
# curl http://localhost:11434/api/chat -d '{
#   "model": "deepseek-r1:7b",
#   "messages": [
#     {
#       "role": "user",
#       "content": "why is the sky blue?"
#     }
#   ],
#   "stream": false
# }'

# Run Electron app (npm start)
npm start

#!/bin/bash

# Script to run the agent with the required API key
# Usage: ./run-agent.sh "Your task description"

# Check if API key is provided as environment variable
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Please set the ANTHROPIC_API_KEY environment variable."
  echo "Example: export ANTHROPIC_API_KEY=your_api_key_here"
  exit 1
fi

# Run the agent with the provided task
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npm run agent -- "$@"
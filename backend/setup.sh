#!/bin/bash

echo "Setting up AI Event Manager Backend..."

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit the .env file and add your OpenAI API key"
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p storage
mkdir -p uploads
mkdir -p vector_db

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Run: python main.py"
echo "3. The API will be available at http://localhost:8000"

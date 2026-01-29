#!/bin/bash
# Build script for Render deployment

# Install Node.js dependencies and build React app
cd frontend
npm install
npm run build
cd ..

# Install Python dependencies
pip install -r requirements.txt
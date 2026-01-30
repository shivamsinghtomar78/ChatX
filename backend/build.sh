#!/bin/bash
# Build script for Render deployment
set -e # Exit immediately if a command exits with a non-zero status.

# Frontend is now deployed separately on Vercel.
# This script only handles backend dependencies.

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Build complete! ---"
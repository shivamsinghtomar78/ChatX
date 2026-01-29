#!/bin/bash
# Build script for Render deployment
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Installing Node.js dependencies ---"
cd frontend
npm install

echo "--- Building React app ---"
npm run build

echo "--- Verifying build ---"
if [ ! -d "build" ]; then
  echo "Error: Build directory not found!"
  exit 1
fi

if [ ! -f "build/index.html" ]; then
  echo "Error: index.html not found in build directory!"
  exit 1
fi

cd ..

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Build complete! ---"
#!/bin/bash

# ChatX Frontend Setup Script
# This script installs dependencies and sets up the improved frontend

echo "🚀 ChatX Frontend Setup"
echo "======================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎨 Setup complete!"
echo ""
echo "📚 Documentation:"
echo "  - README_IMPROVEMENTS.md - Overview of improvements"
echo "  - PERFORMANCE_GUIDE.md - Performance optimization guide"
echo "  - QUICK_START.md - Quick start guide"
echo ""
echo "🚀 Next steps:"
echo "  1. npm start          - Start development server"
echo "  2. npm run build      - Build for production"
echo "  3. npm run analyze    - Analyze bundle size"
echo ""
echo "✨ Happy coding!"

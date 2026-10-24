#!/bin/bash

echo "========================================"
echo "Document Parser Website Installation"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies"
    exit 1
fi

echo
echo "Installing frontend dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    exit 1
fi
cd ..

echo
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo
echo "To start the application:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo
echo "Or start servers separately:"
echo "- Backend: npm run server"
echo "- Frontend: cd client && npm start"
echo 
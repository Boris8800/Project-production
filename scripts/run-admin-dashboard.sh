#!/bin/bash
# Admin Dashboard Launcher for Ken
# This script starts the admin web interface on port 3000

echo "========================================"
echo "  Admin Trip Management Dashboard"
echo "  For: Ken (Administrator)"
echo "========================================"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies"
        exit 1
    fi
fi

# Set environment variables
export PORT=3000
export NEXT_PUBLIC_API_URL="http://localhost:3001"

echo ""
echo "Starting Admin Dashboard..."
echo "Admin Interface: http://localhost:3000/(admin)/trips"
echo "Login Page: http://localhost:3000/tenants/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server on port 3000
npm run dev -- --port 3000

# If dev fails, try build and start
if [ $? -ne 0 ]; then
    echo "Dev server failed, trying production build..."
    npm run build
    npm run start -- --port 3000
fi

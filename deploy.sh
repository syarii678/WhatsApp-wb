#!/bin/bash

# WhatsApp Bot Web Deployment Script
# This script helps deploy the WhatsApp bot web application

echo "🚀 WhatsApp Bot Web Deployment Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Set up database
echo "🗄️ Setting up database..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to set up database"
    exit 1
fi

echo "✅ Database set up successfully"

# Create sessions directory
echo "📁 Creating sessions directory..."
mkdir -p sessions

echo "✅ Sessions directory created"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

echo "✅ Application built successfully"

# Check if we're in Termux
if [ -n "$PREFIX" ] && [ "$PREFIX" = "/data/data/com.termux/files/usr" ]; then
    echo "📱 Termux environment detected"
    echo "🌐 Starting server..."
    npm start
else
    echo "💻 Standard environment detected"
    echo "🌐 Starting development server..."
    npm run dev
fi

echo "🎉 Deployment complete!"
echo "📱 Open your browser and navigate to http://localhost:3000"
#!/bin/bash

# WhatsApp Bot Web Vercel Deployment Script
echo "🚀 WhatsApp Bot Web - Vercel Deployment"
echo "====================================="

# Check if Vercel CLI is installed
if ! command -l vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami

if [ $? -ne 0 ]; then
    echo "❌ Please login to Vercel first:"
    echo "   Run: vercel login"
    exit 1
fi

echo "✅ Vercel authentication confirmed"

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your configuration before deploying"
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📱 Your WhatsApp Bot Web is now live on Vercel!"
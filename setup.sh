#!/bin/bash

# Cemetery Mapping Information System - Setup Script
# This script sets up the project with all dependencies and configurations

echo "🚀 Starting Cemetery Mapping Information System Setup..."
echo "========================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p uploads logs public/css public/js public/images

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Setup database
echo "🗄️  Setting up database..."
if [ -f .env ]; then
    source .env
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ Database configuration found"
        npm run migrate
        npm run seed
    else
        echo "⚠️  DATABASE_URL not set in .env"
        echo "Please configure your database connection"
    fi
else
    echo "⚠️  .env file not found. Please create one"
fi

# Create sample data structure
echo "📊 Creating sample data structure..."
mkdir -p data/samples
cp db/seed.sql data/samples/ 2>/dev/null || true

# Set permissions
echo "🔧 Setting permissions..."
chmod -R 755 uploads logs

echo "========================================================"
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "  npm start"
echo ""
echo "🌐 To run in development mode:"
echo "  npm run dev"
echo ""
echo "📝 Default admin credentials:"
echo "  Email: admin@cemetery.com"
echo "  Password: admin123"
echo "========================================================"
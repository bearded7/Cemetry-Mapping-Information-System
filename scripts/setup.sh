#!/bin/bash

echo "🚀 Starting Cemetery Mapping Information System Setup..."
echo "========================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Create directories
echo "📁 Creating project directories..."
mkdir -p uploads/{messages,graves,thumbnails,cemeteries}
mkdir -p public/{css,js,images}
mkdir -p logs
mkdir -p data/samples

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your database configuration"
fi

# Setup database
echo "🗄️  Setting up database..."
if [ -f .env ]; then
    source .env
    if [ -n "$DATABASE_URL" ]; then
        npm run migrate
        npm run seed
    else
        echo "⚠️  DATABASE_URL not set in .env"
    fi
fi

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
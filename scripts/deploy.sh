#!/bin/bash

# Deployment script for Render.com or production

echo "🚀 Starting deployment process..."

# Check environment
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Seed database
echo "🌱 Seeding database..."
npm run seed

# Start application
echo "🚀 Starting application..."
npm start
# Create Dockerfile
cat > Dockerfile << 'EOF'
# ============================================================
# Cemetery Mapping Information System - Dockerfile
# Version: 3.0.0
# ============================================================

# Use Node.js 18 LTS Alpine image for smaller size
FROM node:18-alpine

# Install system dependencies for sharp and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production=false && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads/{profiles,graves,cemeteries,messages,thumbnails} \
    && mkdir -p logs \
    && mkdir -p public/{css,js,images} \
    && mkdir -p data/samples \
    && chmod -R 755 uploads logs

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["npm", "start"]
EOF
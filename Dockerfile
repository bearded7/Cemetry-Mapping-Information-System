FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install, not npm ci)
RUN npm install --production=false

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
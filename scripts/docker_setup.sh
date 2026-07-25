# Build and run with Docker Compose
docker-compose up -d

# Or build only the app
docker build -t cemetery-system .
docker run -p 3000:3000 cemetery-system
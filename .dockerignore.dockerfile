# ============================================================
# Docker Ignore File
# ============================================================

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local
.env.production

# Uploads (will be mounted as volume)
uploads/

# Logs
logs/
*.log

# Database files
*.db
*.sqlite
*.sqlite3

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Git
.git/
.gitignore
.gitattributes

# Docker
Dockerfile
docker-compose*.yml
.dockerignore

# Build outputs
dist/
build/
coverage/

# Temporary files
tmp/
temp/
*.tmp

# Documentation
docs/
README.md
LICENSE

# CI/CD
.github/
.gitlab-ci.yml
.travis.yml
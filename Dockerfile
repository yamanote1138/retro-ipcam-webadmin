# syntax=docker/dockerfile:1

# ============================================
# Builder Stage
# ============================================
FROM node:20.18.0-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source files and configuration
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Build the Vue app
RUN npm run build

# ============================================
# Production Stage - Caddy
# ============================================
FROM caddy:2-alpine

# Copy built static files
COPY --from=builder /usr/src/app/dist /usr/share/caddy

# Create a simple Caddyfile for SPA routing
RUN echo $'{\n\
    auto_https off\n\
}\n\
\n\
:80 {\n\
    root * /usr/share/caddy\n\
    encode gzip\n\
    try_files {path} /index.html\n\
    file_server\n\
}' > /etc/caddy/Caddyfile

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

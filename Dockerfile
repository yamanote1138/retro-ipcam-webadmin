# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Build Vue Frontend
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
# Stage 2: Production Runtime
# ============================================
FROM node:20.18.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built frontend from builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy server
COPY server.mjs ./

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["node", "server.mjs"]

# Backend Dockerfile
# Multi-stage build for Node.js Express API
# Using Debian-based image for better Prisma compatibility

FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for prisma)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Production stage
FROM node:18-slim

# Install security updates and required libraries
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create app user (security best practice)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

WORKDIR /app

# Copy dependencies and generated files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs . .

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]

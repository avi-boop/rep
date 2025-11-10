# Backend Dockerfile
# Multi-stage build for Node.js Express API

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for prisma)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client for linux-musl-openssl-3.0.x
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN npx prisma generate

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine

# Install security updates
RUN apk --no-cache upgrade

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

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

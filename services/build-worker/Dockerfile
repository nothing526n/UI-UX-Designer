# Phase 8 — Isolated Ephemeral Build Container
# Multi-stage security-hardened Alpine container for isolated builds

FROM node:20-alpine AS base

# Install security updates and build utilities
RUN apk update && apk add --no-cache dumb-init bash

# Create unprivileged build user
RUN addgroup -S platform && adduser -S platform -G platform

WORKDIR /sandbox

# Copy workspace package manifests
COPY package.json tsconfig.json ./
COPY src/ ./src/

# Install dependencies and compile
RUN npm install
RUN npm run build

# Strip development tokens and set read-only permissions
RUN chown -R platform:platform /sandbox

# Switch to non-root user
USER platform

# Environment constraints
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4001

EXPOSE 4001

# Entrypoint via dumb-init to properly handle signal termination (SIGTERM, SIGINT)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

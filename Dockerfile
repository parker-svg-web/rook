# ============================================================
# Rook — Dockerfile
# Multi-stage build: node:20-alpine, non-root user, health checks
# ============================================================

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all backend source first (node_modules excluded via .dockerignore)
COPY backend/ ./backend/

# Install all backend deps (including dev deps for tsc build)
RUN cd backend && npm ci

# Compile TypeScript
RUN cd backend && npx tsc

# Copy and build frontend
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ---- Runtime Stage ----
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup -g 1001 -S rook && \
    adduser -S rook -u 1001 -G rook

WORKDIR /app

# Copy compiled backend and production deps
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/package-lock.json ./backend/

# Install only production deps
RUN cd backend && npm ci --only=production

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/backend/data && chown -R rook:rook /app

# Switch to non-root user
USER rook

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "backend/dist/index.js"]
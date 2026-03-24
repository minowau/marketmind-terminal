# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Build the frontend
# We set VITE_API_URL to relative /api/v1 so it works in the same container
ENV VITE_API_URL=/api/v1
RUN npm run build

# ── Stage 2: Build Backend & Final Image ──
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (for building some Python packages if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=7860
ENV DEBUG=False

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 7860

# Start Gunicorn with uvicorn workers
# We use --chdir backend to find the app module correctly
CMD ["gunicorn", "-w", "1", "--timeout", "120", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:7860", "--chdir", "backend", "app.main:app"]

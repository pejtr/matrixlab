FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Build frontend and server
ENV NODE_ENV=production
RUN pnpm run build

# Expose port and start application
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["pnpm", "start"]

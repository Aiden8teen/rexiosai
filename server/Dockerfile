FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
ENV NODE_ENV=development
COPY --chown=node:node server/package.json server/package-lock.json ./
RUN --mount=type=cache,id=rexios-npm,target=/root/.npm,sharing=locked \
    npm ci --prefer-offline --ignore-scripts --no-audit --no-fund --fetch-retries=4
COPY --chown=node:node server/ ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build \
    && mkdir -p /app/uploads && chown node:node /app/uploads
ENV NODE_ENV=production UPLOAD_DIR=/app/uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

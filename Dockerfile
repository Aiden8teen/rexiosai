FROM node:24-bookworm-slim AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=rexios-npm,target=/root/.npm,sharing=locked \
    npm ci --prefer-offline --ignore-scripts --no-audit --no-fund --fetch-retries=4

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM caddy:2.11.4-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend-build /app/dist /srv

EXPOSE 80

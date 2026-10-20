FROM node:24-bookworm-slim AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM caddy:2.11.4-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend-build /app/dist /srv

EXPOSE 80

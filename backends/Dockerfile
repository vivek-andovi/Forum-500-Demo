# Forum500 API — production image for AWS ECS Fargate (linux/arm64 or amd64).
FROM node:20-alpine AS base
# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/static ./static
COPY --from=build --chown=node:node /app/scripts/create-admin.mjs ./scripts/create-admin.mjs
COPY --chown=node:node package.json ./
# Run as the unprivileged "node" user.
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD sh -c "wget -qO- http://localhost:\${PORT:-4000}/api/health || exit 1"
# Apply pending migrations (idempotent), seed initial data if empty, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node dist/main"]

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
# Apply pending migrations (idempotent), then start the server.
# SEED_ON_START=1 (demo hosts like Railway only) also loads the demo seed when the DB has no users.
# Never set it in production: the seed creates admin@forum500.club with a known password.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_ON_START\" = 1 ]; then npm run db:seed; fi && node dist/main"]

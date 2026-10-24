# Forum500 API images. Default target: a normal server (any container host). --target lambda: AWS Lambda.
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

# ───────────── AWS Lambda image: docker build --target lambda ─────────────
# Built on AWS's own Lambda base image (Amazon Linux 2023), so Prisma's engines and argon2's native module match
# the Lambda runtime. One image, several functions: the API (CMD dist/lambda.handler) and migrations
# (handler override dist/migrate.handler). Nothing runs migrations on start-up here.
FROM public.ecr.aws/lambda/nodejs:20 AS lambda-build
WORKDIR /build
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM public.ecr.aws/lambda/nodejs:20 AS lambda
# Lambda can only write to /tmp.
ENV NODE_ENV=production HOME=/tmp PRISMA_HIDE_UPDATE_MESSAGE=1
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=lambda-build /build/node_modules ./node_modules
COPY --from=lambda-build /build/dist ./dist
COPY --from=lambda-build /build/prisma ./prisma
COPY --from=lambda-build /build/static ./static
COPY --from=lambda-build /build/scripts/create-admin.mjs ./scripts/create-admin.mjs
COPY package.json ./
CMD ["dist/lambda.handler"]

# ───────────── Container image (default target): a normal long-running server ─────────────
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
# SEED_ON_START=1 (throwaway demo hosts only) also loads the demo seed when the DB has no users.
# Never set it in production: the seed creates admin@forum500.club with a known password.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_ON_START\" = 1 ]; then npm run db:seed; fi && node dist/main"]

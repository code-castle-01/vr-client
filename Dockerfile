# This Dockerfile builds the Vite app and serves `dist` with a lightweight Node server.
# pdfjs-dist@5.5.x requires Node >= 20.19.0, so we pin a compatible base image.
FROM node:20.19.0-bookworm-slim AS base

WORKDIR /app/refine

FROM base AS deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found, falling back to npm install." && npm install; \
  fi

FROM base AS builder

ENV NODE_ENV production

COPY --from=deps /app/refine/node_modules ./node_modules

COPY . .

RUN npm run build

FROM base AS runner

ENV NODE_ENV production

COPY --from=builder /app/refine/dist ./dist
COPY --from=builder /app/refine/server.mjs ./server.mjs

USER node

CMD ["node", "server.mjs"]

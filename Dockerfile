# This Dockerfile builds the Vite app and serves `dist` with a lightweight Node server.
FROM refinedev/node:18 AS base

FROM base as deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found, falling back to npm install." && npm install; \
  fi

FROM base as builder

ENV NODE_ENV production

COPY --from=deps /app/refine/node_modules ./node_modules

COPY . .

RUN npm run build

FROM base as runner

ENV NODE_ENV production

COPY --from=builder /app/refine/dist ./dist
COPY --from=builder /app/refine/server.mjs ./server.mjs

USER refine

CMD ["node", "server.mjs"]

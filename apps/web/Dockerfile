FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

# --- Build: every dependency, dev included ------------------------------------------------------
FROM base AS build

RUN npm install -g corepack@latest
RUN corepack enable pnpm

ENV CI=true

# Downloads only depend on the lockfile: this layer is reused until it changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch --store-dir /pnpm/store

COPY . .
RUN pnpm install --frozen-lockfile --offline --store-dir /pnpm/store

WORKDIR /app/apps/web
RUN node ace build --ignore-ts-errors

# Same lockfile, production dependencies of the app (and its workspace packages) only.
WORKDIR /app
RUN rm -rf node_modules apps/*/node_modules packages/*/node_modules \
  && pnpm install --prod --frozen-lockfile --offline --store-dir /pnpm/store --filter web...

# --- Runtime ------------------------------------------------------------------------------------
FROM base

ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/ui /app/packages/ui
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json
COPY --from=build /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=build /app/apps/web/build /app/apps/web/build

WORKDIR /app/apps/web/build

EXPOSE 3333

CMD ["node", "bin/server.js"]

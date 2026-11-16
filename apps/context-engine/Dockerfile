FROM node:22-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN npm install -g corepack@latest
RUN corepack enable pnpm

COPY . .

ENV CI=true
RUN pnpm install --force --frozen-lockfile

WORKDIR /app/apps/context-engine

RUN node ace build --ignore-ts-errors

WORKDIR /app/apps/context-engine/build

EXPOSE 3334

CMD ["node", "bin/server.js"]

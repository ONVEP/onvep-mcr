# ONVEP MCR

**Automate and enhance your live production.**

ONVEP MCR is a self-hosted master control room for live shows. Prepare rundowns, design HTML graphics, and drive the whole production from one shared live context that Bitfocus Companion, Node-RED and any HTTP client can read and write.

## Features

- **Rundowns**: plan shows step by step, then follow them from the live view.
- **HTML graphics (CG)**: build layers with HTML and Tailwind, preview them at any resolution, and load the public layer URL as a browser source in your playout software. Supports CSS variables, custom CSS and hot reload. Layers are bound to the live context.
- **Context engine**: a shared JSON state pushed over SSE, with validators, mutators and version history (`apps/context-engine`).
- **Companion module**: watch context paths as Companion variables, trigger on changes, and set, merge, append or delete values from buttons.
- **Node-RED nodes**: read, write and watch the context from your flows.
- **Team and media**: role-based permissions, invitations and notifications; network drives as media sources.
- **English and French UI.**

## Architecture

```
                ┌──────────────┐   SSE / HTTP   ┌──────────────────┐
  Browser ─────▶│   apps/web   │◀──────────────▶│ apps/context-    │◀── Companion module
  (operators)   │ AdonisJS +   │                │ engine (AdonisJS)│◀── Node-RED nodes
                │ Inertia/React│                └──────────────────┘◀── any HTTP client
  Playout ─────▶│ /cg/* (public│                         │
  (browser src) │  CG layers)  │                         │
                └──────┬───────┘                         │
                       └────────── PostgreSQL ───────────┘
                          (app)              (context_engine)
```

| Path                                       | What                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `apps/web`                                 | Main app: auth, users and roles, rundowns, graphics, media, context explorer, landing page        |
| `apps/context-engine`                      | Live context service: REST at `/context/:path`, SSE subscriptions, mutators, validators, versions |
| `packages/companion-module-context-engine` | Bitfocus Companion module ([help](packages/companion-module-context-engine/companion/HELP.md))    |
| `packages/node-red-contrib-context-engine` | Node-RED nodes for the context engine                                                             |
| `packages/ui`                              | Shared shadcn/Radix primitives                                                                    |
| `packages/skills`                          | Agent skills describing the repo conventions                                                      |
| `deploy/`, `scripts/deploy.sh`             | Production stack (Traefik, Portainer) and deploy script                                           |

Stack: AdonisJS 7, Inertia + React 19, Tailwind 4 + shadcn/Radix, PostgreSQL, pnpm + Turbo.

## Getting started (development)

Requirements: Node.js ≥ 24, pnpm, Docker.

```bash
pnpm install

# Environment files, one per app
cp apps/web/.env.example apps/web/.env
cp apps/context-engine/.env.example apps/context-engine/.env
(cd apps/web && node ace generate:key)
(cd apps/context-engine && node ace generate:key)

# PostgreSQL (creates both databases), pgAdmin, Mailpit, Node-RED
pnpm infra:up

# Database schema, plus seeded roles and an admin account
pnpm ace migration:run
pnpm ace db:seed
(cd apps/context-engine && node ace migration:run)

pnpm dev
```

| Service        | URL                   |
| -------------- | --------------------- |
| Web app        | http://localhost:3333 |
| Context engine | http://localhost:3334 |
| Node-RED       | http://localhost:1880 |
| Mailpit        | http://localhost:8025 |
| pgAdmin        | http://localhost:5050 |

The seeder creates `admin@repo.com` / `123`. Use it only for local development.

> Node-RED runs in Docker and reaches the context engine on the host. Set `HOST=0.0.0.0` in `apps/context-engine/.env`. With rootless Docker, also set `NODE_RED_CONTEXT_ENGINE_URL` to the host's LAN IP.

### Useful commands

```bash
pnpm dev                  # all apps in watch mode
pnpm test                 # full test suite
pnpm typecheck && pnpm lint
pnpm ace <command>        # Adonis CLI for apps/web
pnpm ace make:module <name> [--db] [--i18n] [--events]
```

## Deployment

Production runs behind an existing **Traefik v3** (Docker provider). Three images are built: `web`, `context-engine` and `node-red`.

### Docker Compose on the server

Fill in the production section of `apps/web/.env` (`APP_DOMAIN`, `CONTEXT_ENGINE_DOMAIN`, `NODE_RED_DOMAIN`, `TRAEFIK_*`, `NODE_RED_BASIC_AUTH`, `CONTEXT_ENGINE_WRITE_ALLOWED_IPS`), then:

```bash
pnpm docker:prod
```

### Build, push and roll out

`pnpm deploy:prod [tag]` builds the images, pushes them to `REGISTRY` and, when `DEPLOY_HOST` is set, pulls them on the server, restarts the stack and runs migrations. It is configured through environment variables or a `.env.deploy` file at the repository root (see the header of [scripts/deploy.sh](scripts/deploy.sh)).

### Portainer

[deploy/portainer-stack.yaml](deploy/portainer-stack.yaml) is the full stack for a Portainer _Web editor_ stack, using the images pushed by `pnpm deploy:prod`. Its variables are listed in [deploy/portainer.env.example](deploy/portainer.env.example).

## Contributing

Code is organised as one module per bounded context under `apps/web/app/<module>/`. Read [AGENTS.md](AGENTS.md) for the conventions, and the skills in [packages/skills](packages/skills) for the detailed workflows. Run `pnpm typecheck && pnpm lint && pnpm test` before opening a pull request.

## License

[MIT](LICENSE). Built on [adonisjs-starter-kit](https://github.com/filipebraida/adonisjs-starter-kit) by Filipe Braida.

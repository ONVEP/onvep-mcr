#!/usr/bin/env bash
# Builds the production images, pushes them to a registry and, when DEPLOY_HOST is set, rolls
# them out on the server (pull, restart, migrations).
#
# Configuration: environment variables, or a .env.deploy file at the repo root:
#   REGISTRY=registry.example.com/onvep   where to push (required)
#   DEPLOY_HOST=user@prod.example.com     ssh target; empty: build and push only
#   DEPLOY_PATH=/srv/onvep-mcr            repo checkout on the server (compose files, .env files)
#   PLATFORM=linux/amd64                  platform of the server
#
# Usage: pnpm deploy:prod [tag]          tag defaults to the current commit
set -euo pipefail

cd "$(dirname "$0")/.."
# Variables already set (e.g. `REGISTRY=… pnpm deploy:prod`) win over .env.deploy.
if [[ -f .env.deploy ]]; then
  while IFS='=' read -r key value; do
    value="${value%\"}" value="${value#\"}" value="${value%\'}" value="${value#\'}"
    [[ -z "${!key:-}" ]] && export "$key=$value"
  done < <(grep -E '^[A-Z_][A-Z0-9_]*=' .env.deploy)
fi

: "${REGISTRY:?Set REGISTRY (e.g. registry.example.com/onvep), see scripts/deploy.sh}"
PLATFORM="${PLATFORM:-linux/amd64}"
DEPLOY_PATH="${DEPLOY_PATH:-/srv/onvep-mcr}"
TAG="${1:-$(git rev-parse --short HEAD)}"

if [[ -z "${1:-}" && -n "$(git status --porcelain)" ]]; then
  echo "⚠ Uncommitted changes: the images won't match commit $TAG." >&2
fi

# image name → Dockerfile. Same names as the `image:` entries of docker-compose.prod.yaml and
# deploy/portainer-stack.yaml.
declare -A DOCKERFILES=(
  [web]=apps/web/Dockerfile
  [context-engine]=apps/context-engine/Dockerfile
  [node-red]=packages/node-red-contrib-context-engine/Dockerfile
)

for app in web context-engine node-red; do
  image="$REGISTRY/$app"
  echo "▶ Building $image:$TAG ($PLATFORM)"
  docker buildx build \
    --platform "$PLATFORM" \
    --file "${DOCKERFILES[$app]}" \
    --tag "$image:$TAG" \
    --tag "$image:latest" \
    --push \
    .
done

if [[ -z "${DEPLOY_HOST:-}" ]]; then
  echo "✔ Pushed $REGISTRY/{web,context-engine,node-red}:$TAG (no DEPLOY_HOST: not deployed)"
  exit 0
fi

echo "▶ Deploying $TAG on $DEPLOY_HOST:$DEPLOY_PATH"
# The checkout on the server provides the compose files, the .env files and the Node-RED
# nodes (bind-mounted): it must be on the same commit.
ssh "$DEPLOY_HOST" bash -s -- "$DEPLOY_PATH" "$REGISTRY" "$TAG" <<'REMOTE'
set -euo pipefail
cd "$1"
export REGISTRY="$2" TAG="$3"
git pull --ff-only
compose() { docker compose --env-file apps/web/.env -f docker-compose.yaml -f docker-compose.prod.yaml "$@"; }
compose pull web context-engine
compose up -d --no-build --remove-orphans
compose exec -T context-engine node ace migration:run --force
compose exec -T web node ace migration:run --force
REMOTE

echo "✔ Deployed $TAG"

# Node-RED with the context engine nodes built in, for deployments without the repo checkout
# (Portainer). Built from the repo root: see scripts/deploy.sh.
FROM nodered/node-red:5.0.9

# Node-RED loads the modules installed next to itself, like `npm install` would put them.
COPY packages/node-red-contrib-context-engine /usr/src/node-red/node_modules/node-red-contrib-context-engine

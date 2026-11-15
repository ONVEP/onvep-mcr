import { defineConfig } from '@adonisjs/transmit'

// In-memory SSE (single node). The context engine resolves which channels to
// notify from the local subscriber list, so a distributed transport would
// only reach subscribers whose channel is also subscribed on this node.
export default defineConfig({
  pingInterval: '30s',
  transport: null,
})

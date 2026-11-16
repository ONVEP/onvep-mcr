import { InstanceBase, InstanceStatus } from '@companion-module/base'

import { actionDefinitions } from './actions.js'
import { ContextEngine, channelFor, normalizeUrl } from './engine.js'

export const UpgradeScripts = []

/**
 * Parses the "watched paths" config: one `variable=path` or bare `path` per line (or comma).
 * A bare path gets its variable id from the path itself: `layers.0.name` → `layers_0_name`.
 */
export function parseWatchedPaths(text) {
  const watched = []
  for (const entry of text.split(/[\n,]/)) {
    const line = entry.trim()
    if (line === '' || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    const path = (separator === -1 ? line : line.slice(separator + 1)).trim()
    const name = separator === -1 ? path : line.slice(0, separator).trim()
    const variableId = name.replace(/[^\w-]/g, '_') || 'context'
    if (!watched.some((other) => other.variableId === variableId))
      watched.push({ variableId, path })
  }
  return watched
}

export default class ContextEngineInstance extends InstanceBase {
  engine = null
  watched = []

  async init(config) {
    this.setActionDefinitions(actionDefinitions(this))
    await this.configUpdated(config)
  }

  async configUpdated(config) {
    this.engine?.close()
    this.config = config
    this.watched = parseWatchedPaths(config.watch ?? '')
    this.setVariableDefinitions(
      Object.fromEntries(
        this.watched.map(({ variableId, path }) => [
          variableId,
          { name: path === '' ? 'Whole context' : `Value at ${path}` },
        ])
      )
    )

    this.updateStatus(InstanceStatus.Connecting)
    const engine = new ContextEngine(normalizeUrl(config.url || 'http://localhost:3334'), {
      onConnected: () => {
        this.updateStatus(InstanceStatus.Ok)
        // Changes made while disconnected were never received.
        this.#readWatched(engine)
      },
      onDisconnected: (error, wasConnected) => {
        if (this.engine !== engine) return
        this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
        // Logged once per outage, not on every retry.
        this.log(wasConnected ? 'warn' : 'debug', `Event stream lost: ${error.message}`)
      },
      onEvent: (channel, payload) => {
        const values = {}
        for (const { variableId, path } of this.watched) {
          if (channelFor(path) === channel) values[variableId] = payload?.value
        }
        this.setVariableValues(values)
      },
    })
    this.engine = engine
    engine.watch([...new Set(this.watched.map(({ path }) => channelFor(path)))])
  }

  #readWatched(engine) {
    for (const { variableId, path } of this.watched) {
      engine.read(path).then(
        (value) => {
          if (this.engine === engine) this.setVariableValues({ [variableId]: value })
        },
        (error) => this.log('error', `Reading "${path}": ${error.message}`)
      )
    }
  }

  async destroy() {
    this.engine?.close()
    this.engine = null
  }

  getConfigFields() {
    return [
      {
        type: 'textinput',
        id: 'url',
        label: 'Context engine URL',
        width: 8,
        default: 'http://localhost:3334',
      },
      {
        type: 'textinput',
        id: 'watch',
        label: 'Watched paths',
        width: 12,
        multiline: true,
        default: '',
        description:
          'One per line: "variable_name=path" (e.g. "score=match.score.home"), or just a path ' +
          '(its variable is named after it: "layers.0.name" → layers_0_name; "name=" watches the whole context). ' +
          'Each one becomes a variable updated live: use it in a trigger "On variable change".',
      },
    ]
  }
}

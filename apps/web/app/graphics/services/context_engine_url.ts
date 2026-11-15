import env from '#start/env'

/** Where CG pages reach the context engine from the browser (ctx-source bindings). */
export function contextEngineUrl() {
  return env.get('CONTEXT_ENGINE_PUBLIC_URL') || env.get('CONTEXT_ENGINE_URL')
}

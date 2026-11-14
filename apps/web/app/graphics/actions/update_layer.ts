import type Layer from '#graphics/models/layer'

export interface UpdateLayerInput {
  target: Layer
  name?: string
  enabled?: boolean
  content?: string | null
}

export default class UpdateLayer {
  // The slug is deliberately kept on rename: playout software points at /cg/layer/:slug.
  async handle(input: UpdateLayerInput): Promise<Layer> {
    if (input.name !== undefined) input.target.name = input.name
    if (input.enabled !== undefined) input.target.enabled = input.enabled
    if (input.content !== undefined) input.target.content = input.content ?? ''
    await input.target.save()

    return input.target
  }
}

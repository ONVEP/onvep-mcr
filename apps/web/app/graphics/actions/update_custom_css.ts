import CustomCss from '#graphics/models/custom_css'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface UpdateCustomCssInput {
  content: string | null
}

export default class UpdateCustomCss {
  async handle(input: UpdateCustomCssInput): Promise<CustomCss> {
    const row = (await CustomCss.query().orderBy('id', 'asc').first()) ?? new CustomCss()
    row.content = input.content ?? ''
    await row.save()
    reloadCgPages()

    return row
  }
}

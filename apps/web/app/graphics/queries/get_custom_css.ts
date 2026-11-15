import CustomCss from '#graphics/models/custom_css'

export default class GetCustomCss {
  async handle(): Promise<string> {
    const row = await CustomCss.query().orderBy('id', 'asc').first()
    return row?.content ?? ''
  }
}

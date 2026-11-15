import CssVariable from '#graphics/models/css_variable'

export default class ListCssVariables {
  async handle(): Promise<CssVariable[]> {
    return CssVariable.query().orderBy('kind', 'asc').orderBy('name', 'asc')
  }
}

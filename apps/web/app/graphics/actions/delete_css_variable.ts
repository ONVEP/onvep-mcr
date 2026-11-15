import type CssVariable from '#graphics/models/css_variable'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface DeleteCssVariableInput {
  target: CssVariable
}

export default class DeleteCssVariable {
  async handle(input: DeleteCssVariableInput): Promise<void> {
    await input.target.delete()
    reloadCgPages()
  }
}

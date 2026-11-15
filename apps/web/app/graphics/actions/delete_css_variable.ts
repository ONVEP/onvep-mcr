import type CssVariable from '#graphics/models/css_variable'

export interface DeleteCssVariableInput {
  target: CssVariable
}

export default class DeleteCssVariable {
  async handle(input: DeleteCssVariableInput): Promise<void> {
    await input.target.delete()
  }
}

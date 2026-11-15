import type { CssVariableKind } from '#graphics/enums/css_variable_kind'
import type CssVariable from '#graphics/models/css_variable'

export interface UpdateCssVariableInput {
  target: CssVariable
  name: string
  kind: CssVariableKind
  value: string
}

export default class UpdateCssVariable {
  async handle({ target, ...input }: UpdateCssVariableInput): Promise<CssVariable> {
    target.merge(input)
    await target.save()

    return target
  }
}

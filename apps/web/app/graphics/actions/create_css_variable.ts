import type { CssVariableKind } from '#graphics/enums/css_variable_kind'
import CssVariable from '#graphics/models/css_variable'

export interface CreateCssVariableInput {
  name: string
  kind: CssVariableKind
  value: string
}

export default class CreateCssVariable {
  async handle(input: CreateCssVariableInput): Promise<CssVariable> {
    return CssVariable.create(input)
  }
}

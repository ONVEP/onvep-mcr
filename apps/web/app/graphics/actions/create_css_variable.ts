import type { CssVariableKind } from '#graphics/enums/css_variable_kind'
import CssVariable from '#graphics/models/css_variable'
import { reloadCgPages } from '#graphics/services/cg_live_reload'

export interface CreateCssVariableInput {
  name: string
  kind: CssVariableKind
  value: string
}

export default class CreateCssVariable {
  async handle(input: CreateCssVariableInput): Promise<CssVariable> {
    const variable = await CssVariable.create(input)
    reloadCgPages()

    return variable
  }
}

export const CSS_VARIABLE_KINDS = ['color', 'value'] as const

export type CssVariableKind = (typeof CSS_VARIABLE_KINDS)[number]

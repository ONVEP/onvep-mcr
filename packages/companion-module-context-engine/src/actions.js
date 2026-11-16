const METHODS = {
  set: 'PUT',
  merge: 'PATCH',
  append: 'POST',
  delete: 'DELETE',
}

const pathOption = {
  id: 'path',
  type: 'textinput',
  label: 'Path',
  default: '',
  useVariables: true,
  description: 'Dotted path, e.g. "layers.0.name". Empty: the whole context.',
}

/** Engine errors carry a code (E_CONTEXT_VALIDATION, E_MUTATOR…) worth showing in the log. */
function describe(error) {
  return error.code ? `${error.code}: ${error.message}` : error.message
}

export function actionDefinitions(self) {
  return {
    write: {
      name: 'Modify the context',
      description: 'Mutators and validators run as for any write.',
      options: [
        {
          id: 'operation',
          type: 'dropdown',
          label: 'Operation',
          default: 'set',
          disableAutoExpression: true,
          choices: [
            { id: 'set', label: 'Set: replace the value' },
            { id: 'merge', label: 'Merge: JSON merge patch into an object' },
            { id: 'append', label: 'Append: push to an array' },
            { id: 'delete', label: 'Delete: remove the path' },
          ],
        },
        pathOption,
        {
          id: 'value',
          type: 'textinput',
          label: 'Value',
          default: '',
          useVariables: true,
          multiline: true,
          isVisibleExpression: `$(options:operation) != 'delete'`,
        },
        {
          id: 'json',
          type: 'checkbox',
          label: 'Value is JSON (number, true/false, null, object, array…)',
          default: false,
          disableAutoExpression: true,
          isVisibleExpression: `$(options:operation) != 'delete'`,
        },
      ],
      callback: async ({ options }) => {
        const path = String(options.path ?? '').trim()
        const operation = options.operation
        let value
        if (operation !== 'delete') {
          value = options.value ?? ''
          if (options.json) {
            try {
              value = JSON.parse(String(value))
            } catch (error) {
              self.log('error', `Invalid JSON for "${path}": ${error.message}`)
              return
            }
          }
        }
        try {
          await self.engine.request(METHODS[operation] ?? 'PUT', path, value)
        } catch (error) {
          self.log('error', `${operation} "${path}" refused: ${describe(error)}`)
        }
      },
    },

    read: {
      name: 'Read a value',
      description: 'Returns the value at the path as the action result (null when missing).',
      options: [pathOption],
      hasResult: true,
      callback: async ({ options }) => {
        const path = String(options.path ?? '').trim()
        try {
          return (await self.engine.read(path)) ?? null
        } catch (error) {
          self.log('error', `Reading "${path}": ${describe(error)}`)
          return null
        }
      },
    },
  }
}

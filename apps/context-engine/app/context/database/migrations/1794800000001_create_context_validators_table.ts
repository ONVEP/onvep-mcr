import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'context_validators'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // Context path the schema applies to, `*` matching any key/index.
      table.string('path').notNullable().unique()
      // JSON Schema (draft 2020-12 subset supported by Ajv)
      table.jsonb('schema').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

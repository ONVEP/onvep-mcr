import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'context_versions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Append-only: one row per committed mutation, the latest one is the live context.
      table.increments('id')
      table.jsonb('context').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

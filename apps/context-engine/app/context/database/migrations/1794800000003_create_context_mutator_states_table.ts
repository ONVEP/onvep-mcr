import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'context_mutator_states'

  async up() {
    // Mutators are files on a disk: their state lives here, keyed by file name.
    // No row means enabled.
    this.schema.createTable(this.tableName, (table) => {
      table.string('name').primary()
      table.boolean('enabled').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

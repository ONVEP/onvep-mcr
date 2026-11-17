import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'context_validators'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Disabled validators stay stored but are not compiled nor run.
      table.boolean('enabled').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('enabled')
    })
  }
}

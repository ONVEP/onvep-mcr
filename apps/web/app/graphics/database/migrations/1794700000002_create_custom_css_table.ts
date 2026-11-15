import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'custom_css'

  async up() {
    // Single row: the stylesheet appended to every CG page.
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('content').notNullable().defaultTo('')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

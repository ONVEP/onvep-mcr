import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'layers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      // Public identifier used in /cg/layer/:slug URLs, so it never changes after creation.
      table.string('slug').notNullable().unique()
      table.boolean('enabled').notNullable().defaultTo(true)
      // Raw HTML injected as-is into the CG page.
      table.text('content').notNullable().defaultTo('')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

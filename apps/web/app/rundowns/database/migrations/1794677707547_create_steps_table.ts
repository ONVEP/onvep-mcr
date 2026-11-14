import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'steps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('rundown_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('rundowns')
        .onDelete('CASCADE')
      table
        .integer('step_type_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('step_types')
        .onDelete('RESTRICT')
      table.integer('order').notNullable()
      table.string('title').notNullable()
      // Seconds.
      table.integer('planned_duration').notNullable().defaultTo(0)
      table.time('played_time').nullable()
      // Hard start time: the timeline waits until then instead of chaining from the previous step.
      table.time('wait_until').nullable()
      table.boolean('auto_next').notNullable().defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['rundown_id', 'order'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

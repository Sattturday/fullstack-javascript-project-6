export async function up(knex) {
  await knex.schema.createTable('task_statuses', (table) => {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('task_statuses')
}

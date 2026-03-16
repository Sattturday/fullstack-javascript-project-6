export async function up(knex) {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary()
    table.string('name').notNullable()
    table.text('description')
    table.integer('statusId').unsigned().notNullable()
    table.integer('creatorId').unsigned().notNullable()
    table.integer('executorId').unsigned()

    table.foreign('statusId').references('task_statuses.id').onDelete('RESTRICT')
    table.foreign('creatorId').references('users.id').onDelete('RESTRICT')
    table.foreign('executorId').references('users.id').onDelete('SET NULL')

    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tasks')
}

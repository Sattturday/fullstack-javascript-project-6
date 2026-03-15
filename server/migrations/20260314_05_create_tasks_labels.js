export async function up(knex) {
  await knex.schema.createTable('tasks_labels', (table) => {
    table.integer('taskId').unsigned().notNullable();
    table.integer('labelId').unsigned().notNullable();

    table.primary(['taskId', 'labelId']);
    table.foreign('taskId').references('tasks.id').onDelete('CASCADE');
    table.foreign('labelId').references('labels.id').onDelete('RESTRICT');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tasks_labels');
}
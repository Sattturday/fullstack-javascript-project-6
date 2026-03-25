// eslint-disable-next-line import/prefer-default-export
export async function seed(knex) {
  await knex('task_statuses').insert([
    { name: 'New' },
    { name: 'In Progress' },
    { name: 'Testing' },
    { name: 'Done' },
  ]);
}

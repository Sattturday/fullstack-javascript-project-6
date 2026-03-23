export async function seed(knex) {
  await knex('tasks').insert([
    { name: 'Setup project', description: 'Initialize repository and basic structure', statusId: 1, creatorId: 1, executorId: 2 },
    { name: 'Implement login', description: 'Add authentication via Passport', statusId: 2, creatorId: 2, executorId: 2 },
    { name: 'Create tasks CRUD', description: 'Implement full CRUD for tasks', statusId: 1, creatorId: 1, executorId: 3 },
  ])
}

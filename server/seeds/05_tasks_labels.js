export async function seed(knex) {
  await knex('tasks_labels').insert([
    { taskId: 1, labelId: 2 }, // Setup project → Feature
    { taskId: 2, labelId: 1 }, // Implement login → Bug
    { taskId: 2, labelId: 3 }, // Implement login → Urgent
    { taskId: 3, labelId: 2 }, // Create tasks CRUD → Feature
    { taskId: 3, labelId: 4 }, // Create tasks CRUD → Low Priority
  ])
}

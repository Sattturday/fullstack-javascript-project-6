import encrypt from '../lib/secure.cjs'

export async function seed(knex) {
  await knex('tasks_labels').truncate()
  await knex('tasks').truncate()
  await knex('labels').truncate()
  await knex('task_statuses').truncate()
  await knex('users').truncate()

  const passwordDigest = encrypt('123')

  await knex('users').insert([
    { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', passwordDigest },
    { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', passwordDigest },
    { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', passwordDigest },
  ])
}

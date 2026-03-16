import bcrypt from 'bcrypt'

export async function seed(knex) {
  await knex('users').del()

  const password = await bcrypt.hash('123', 10)

  await knex('users').insert([
    { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password },
    { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', password },
    { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', password },
  ])
}

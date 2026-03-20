import encrypt from '../lib/secure.cjs'

export async function seed(knex) {
  await knex('users').del()

  const passwordDigest = encrypt('123')

  await knex('users').insert([
    { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', passwordDigest },
    { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', passwordDigest },
    { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', passwordDigest },
  ])
}

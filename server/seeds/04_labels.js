export async function seed(knex) {
  await knex('labels').del();

  await knex('labels').insert([
    { name: 'Bug' },
    { name: 'Feature' },
    { name: 'Urgent' },
    { name: 'Low Priority' },
  ]);
}
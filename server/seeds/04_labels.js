// eslint-disable-next-line import/prefer-default-export
export async function seed(knex) {
  await knex('labels').insert([
    { name: 'Bug' },
    { name: 'Feature' },
    { name: 'Urgent' },
    { name: 'Low Priority' },
  ]);
}

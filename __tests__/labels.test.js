import fastify from 'fastify';
import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from '@jest/globals';

import { getTestData, prepareData, cleanDb } from './helpers/index.js';
import init from '../server/plugin.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await cleanDb(knex);
    await prepareData(app);
  });

  const signIn = async (data) => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: { data },
    });
    const [sessionCookie] = response.cookies;
    const { name, value } = sessionCookie;
    return { [name]: value };
  };

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const cookie = await signIn(testData.users.existing);
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.labels.new;
    const cookie = await signIn(testData.users.existing);

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: { data: params },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findOne({ name: params.name });
    expect(label).toBeDefined();
  });

  it('edit', async () => {
    const cookie = await signIn(testData.users.existing);
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: label.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('update', async () => {
    const cookie = await signIn(testData.users.existing);
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: label.id }),
      payload: { data: { name: 'Updated Label' } },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const updatedLabel = await models.label.query().findById(label.id);
    expect(updatedLabel.name).toBe('Updated Label');
  });

  it('delete', async () => {
    const cookie = await signIn(testData.users.existing);
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: label.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(label.id);
    expect(deletedLabel).toBeUndefined();
  });

  it('create with invalid data', async () => {
    const cookie = await signIn(testData.users.existing);

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: { data: { name: '' } },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('create without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      payload: { data: testData.labels.new },
    });

    expect(response.statusCode).toBe(302);
    const label = await models.label.query().findOne({ name: testData.labels.new.name });
    expect(label).toBeUndefined();
  });

  it('edit without auth', async () => {
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id: label.id }),
    });

    expect(response.statusCode).toBe(302);
  });

  it('update without auth', async () => {
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateLabel', { id: label.id }),
      payload: { data: { name: 'Hacked' } },
    });

    expect(response.statusCode).toBe(302);
    const unchanged = await models.label.query().findById(label.id);
    expect(unchanged.name).toBe(testData.labels.existing.name);
  });

  it('delete label linked to task', async () => {
    const cookie = await signIn(testData.users.existing);
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });
    const task = await models.task.query().first();

    await knex('tasks_labels').insert({ taskId: task.id, labelId: label.id });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: label.id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const stillExists = await models.label.query().findById(label.id);
    expect(stillExists).toBeDefined();
  });

  it('delete without auth', async () => {
    const label = await models.label.query().findOne({ name: testData.labels.existing.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id: label.id }),
    });

    expect(response.statusCode).toBe(302);
    const still = await models.label.query().findById(label.id);
    expect(still).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});

import fastify from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'

import { getTestData, prepareData, cleanDb } from './helpers/index.js'
import init from '../server/plugin.js'

describe('test statuses CRUD', () => {
  let app
  let knex
  let models
  const testData = getTestData()

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    })
    await init(app)
    knex = app.objection.knex
    models = app.objection.models

    await knex.migrate.latest()
  })

  beforeEach(async () => {
    await cleanDb(knex)
    await prepareData(app)
  })

  const signIn = async (data) => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: { data },
    })
    const [sessionCookie] = response.cookies
    const { name, value } = sessionCookie
    return { [name]: value }
  }

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    })

    expect(response.statusCode).toBe(200)
  })

  it('new', async () => {
    const cookie = await signIn(testData.users.existing)
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    })

    expect(response.statusCode).toBe(200)
  })

  it('create', async () => {
    const params = testData.statuses.new
    const cookie = await signIn(testData.users.existing)

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: { data: params },
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    const status = await models.taskStatus.query().findOne({ name: params.name })
    expect(status).toBeDefined()
  })

  it('edit', async () => {
    const cookie = await signIn(testData.users.existing)
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: status.id }),
      cookies: cookie,
    })

    expect(response.statusCode).toBe(200)
  })

  it('update', async () => {
    const cookie = await signIn(testData.users.existing)
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id: status.id }),
      payload: { data: { name: 'Updated Status' } },
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    const updatedStatus = await models.taskStatus.query().findById(status.id)
    expect(updatedStatus.name).toBe('Updated Status')
  })

  it('delete', async () => {
    const cookie = await signIn(testData.users.existing)
    const status = await models.taskStatus.query().findOne({ name: 'Done' })
    await knex('tasks').where('statusId', status.id).del()

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: status.id }),
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    const deletedStatus = await models.taskStatus.query().findById(status.id)
    expect(deletedStatus).toBeUndefined()
  })

  it('create with invalid data', async () => {
    const cookie = await signIn(testData.users.existing)

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: { data: { name: '' } },
      cookies: cookie,
    })

    expect(response.statusCode).toBe(200)
  })

  it('new without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    })

    expect(response.statusCode).toBe(302)
  })

  it('create without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: { data: testData.statuses.new },
    })

    expect(response.statusCode).toBe(302)
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.new.name })
    expect(status).toBeUndefined()
  })

  it('edit without auth', async () => {
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editStatus', { id: status.id }),
    })

    expect(response.statusCode).toBe(302)
  })

  it('update without auth', async () => {
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateStatus', { id: status.id }),
      payload: { data: { name: 'Hacked' } },
    })

    expect(response.statusCode).toBe(302)
    const unchanged = await models.taskStatus.query().findById(status.id)
    expect(unchanged.name).toBe(testData.statuses.existing.name)
  })

  it('delete without auth', async () => {
    const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteStatus', { id: status.id }),
    })

    expect(response.statusCode).toBe(302)
    const still = await models.taskStatus.query().findById(status.id)
    expect(still).toBeDefined()
  })

  afterAll(async () => {
    await app.close()
  })
})

import _ from 'lodash'
import fastify from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'

import init from '../server/plugin.js'
import encrypt from '../server/lib/secure.cjs'
import { getTestData, prepareData, cleanDb } from './helpers/index.js'

describe('test users CRUD', () => {
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
      url: app.reverse('users'),
    })

    expect(response.statusCode).toBe(200)
  })

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    })

    expect(response.statusCode).toBe(200)
  })

  it('create', async () => {
    const params = testData.users.new
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: params,
      },
    })

    expect(response.statusCode).toBe(302)
    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    }
    const user = await models.user.query().findOne({ email: params.email })
    expect(user).toMatchObject(expected)
  })

  it('edit', async () => {
    const params = testData.users.existing
    const cookie = await signIn(params)
    const existingUser = await models.user.query().findOne({ email: params.email })

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editUser', { id: existingUser.id }),
      cookies: cookie,
    })

    expect(response.statusCode).toBe(200)
  })

  it('update', async () => {
    const params = testData.users.existing
    const cookie = await signIn(params)
    const existingUser = await models.user.query().findOne({ email: params.email })

    const updatedData = { ...params, firstName: 'UpdatedName' }
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateUser', { id: existingUser.id }),
      payload: { data: updatedData },
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    const updatedUser = await models.user.query().findById(existingUser.id)
    expect(updatedUser.firstName).toBe('UpdatedName')
  })

  it('delete', async () => {
    const params = testData.users.existing
    const cookie = await signIn(params)
    const user = await models.user.query().findOne({ email: params.email })
    // Remove tasks referencing this user so delete is allowed
    await knex('tasks').where('creatorId', user.id).orWhere('executorId', user.id).del()

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id: user.id }),
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    const deletedUser = await models.user.query().findById(user.id)
    expect(deletedUser).toBeUndefined()
  })

  afterAll(async () => {
    await app.close()
  })
})

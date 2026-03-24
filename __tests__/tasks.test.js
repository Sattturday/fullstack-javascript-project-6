import fastify from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'

import { getTestData, prepareData, cleanDb } from './helpers/index.js'
import init from '../server/plugin.js'

describe('test tasks', () => {
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

  describe('CRUD', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('tasks'),
      })

      expect(response.statusCode).toBe(200)
    })

    it('show', async () => {
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('showTask', { id: task.id }),
      })

      expect(response.statusCode).toBe(200)
    })

    it('new', async () => {
      const cookie = await signIn(testData.users.existing)
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newTask'),
        cookies: cookie,
      })

      expect(response.statusCode).toBe(200)
    })

    it('create', async () => {
      const params = testData.tasks.new
      const cookie = await signIn(testData.users.existing)

      const response = await app.inject({
        method: 'POST',
        url: app.reverse('tasks'),
        payload: { data: params },
        cookies: cookie,
      })

      expect(response.statusCode).toBe(302)
      const task = await models.task.query().findOne({ name: params.name })
      expect(task).toBeDefined()
      expect(task.statusId).toBe(params.statusId)
    })

    it('create sets creatorId to current user', async () => {
      const params = testData.tasks.new
      const cookie = await signIn(testData.users.existing)
      const currentUser = await models.user.query().findOne({ email: testData.users.existing.email })

      const response = await app.inject({
        method: 'POST',
        url: app.reverse('tasks'),
        payload: { data: params },
        cookies: cookie,
      })

      expect(response.statusCode).toBe(302)
      const task = await models.task.query().findOne({ name: params.name })
      expect(task.creatorId).toBe(currentUser.id)
    })

    it('edit', async () => {
      const cookie = await signIn(testData.users.existing)
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editTask', { id: task.id }),
        cookies: cookie,
      })

      expect(response.statusCode).toBe(200)
    })

    it('update', async () => {
      const cookie = await signIn(testData.users.existing)
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateTask', { id: task.id }),
        payload: { data: { name: 'Updated task name', statusId: task.statusId } },
        cookies: cookie,
      })

      expect(response.statusCode).toBe(302)
      const updatedTask = await models.task.query().findById(task.id)
      expect(updatedTask.name).toBe('Updated task name')
    })

    it('delete by creator', async () => {
      const cookie = await signIn(testData.users.existing)
      const currentUser = await models.user.query().findOne({ email: testData.users.existing.email })
      const task = await models.task.query().findOne({ creatorId: currentUser.id })

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: task.id }),
        cookies: cookie,
      })

      expect(response.statusCode).toBe(302)
      const deletedTask = await models.task.query().findById(task.id)
      expect(deletedTask).toBeUndefined()
    })

    it('delete by non-creator fails', async () => {
      const cookie = await signIn(testData.users.existing)
      const currentUser = await models.user.query().findOne({ email: testData.users.existing.email })
      const otherUser = await models.user.query().whereNot('id', currentUser.id).first()

      const status = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })
      const task = await models.task.query().insert({
        name: 'Other user task',
        statusId: status.id,
        creatorId: otherUser.id,
      })

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: task.id }),
        cookies: cookie,
      })

      expect(response.statusCode).toBe(302)
      const stillExists = await models.task.query().findById(task.id)
      expect(stillExists).toBeDefined()
    })

    it('create with invalid data', async () => {
      const cookie = await signIn(testData.users.existing)

      const response = await app.inject({
        method: 'POST',
        url: app.reverse('tasks'),
        payload: { data: { name: '' } },
        cookies: cookie,
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('access control', () => {
    it('new without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newTask'),
      })

      expect(response.statusCode).toBe(302)
    })

    it('create without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('tasks'),
        payload: { data: testData.tasks.new },
      })

      expect(response.statusCode).toBe(302)
      const task = await models.task.query().findOne({ name: testData.tasks.new.name })
      expect(task).toBeUndefined()
    })

    it('edit without auth', async () => {
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editTask', { id: task.id }),
      })

      expect(response.statusCode).toBe(302)
    })

    it('update without auth', async () => {
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateTask', { id: task.id }),
        payload: { data: { name: 'Hacked' } },
      })

      expect(response.statusCode).toBe(302)
      const unchanged = await models.task.query().findById(task.id)
      expect(unchanged.name).toBe(testData.tasks.existing.name)
    })

    it('delete without auth', async () => {
      const task = await models.task.query().findOne({ name: testData.tasks.existing.name })

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteTask', { id: task.id }),
      })

      expect(response.statusCode).toBe(302)
      const still = await models.task.query().findById(task.id)
      expect(still).toBeDefined()
    })
  })

  describe('filters', () => {
    let cookie
    let currentUser
    let existingStatus
    let secondStatus
    let bugLabel
    let featureLabel

    beforeEach(async () => {
      cookie = await signIn(testData.users.existing)
      currentUser = await models.user.query().findOne({ email: testData.users.existing.email })

      existingStatus = await models.taskStatus.query().findOne({ name: testData.statuses.existing.name })
      secondStatus = await models.taskStatus.query().whereNot('id', existingStatus.id).first()
      bugLabel = await models.label.query().findOne({ name: testData.labels.existing.name })
      featureLabel = await models.label.query().whereNot('id', bugLabel.id).first()

      const existingTask = await models.task.query().findOne({ name: testData.tasks.existing.name })
      await knex('tasks_labels').insert({ taskId: existingTask.id, labelId: bugLabel.id })

      const otherUser = await models.user.query().whereNot('id', currentUser.id).first()
      await models.task.query().insert({
        name: 'Second task',
        statusId: secondStatus.id,
        creatorId: otherUser.id,
        executorId: currentUser.id,
      })
      const secondTask = await models.task.query().findOne({ name: 'Second task' })
      await knex('tasks_labels').insert({ taskId: secondTask.id, labelId: featureLabel.id })
    })

    it('filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/tasks?statusId=${existingStatus.id}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain(testData.tasks.existing.name)
      expect(response.body).not.toContain('Second task')
    })

    it('filter by executor', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/tasks?executorId=${currentUser.id}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain('Second task')
    })

    it('filter by label', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/tasks?labelId=${bugLabel.id}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain(testData.tasks.existing.name)
      expect(response.body).not.toContain('Second task')
    })

    it('filter by isCreatorUser', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tasks?isCreatorUser=on',
        cookies: cookie,
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain(testData.tasks.existing.name)
      expect(response.body).not.toContain('Second task')
    })

    it('isCreatorUser filter ignored without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tasks?isCreatorUser=on',
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain(testData.tasks.existing.name)
      expect(response.body).toContain('Second task')
    })
  })

  afterAll(async () => {
    await app.close()
  })
})

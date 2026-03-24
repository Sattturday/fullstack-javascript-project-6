import i18next from 'i18next'

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const { statusId, executorId, labelId, isCreatorUser } = req.query

      const query = app.objection.models.task.query()
        .withGraphJoined('[status, creator, executor, labels]')

      if (statusId) {
        query.where('tasks.statusId', statusId)
      }
      if (executorId) {
        query.where('tasks.executorId', executorId)
      }
      if (labelId) {
        query.where('labels.id', labelId)
      }
      if (isCreatorUser === 'on' && req.user) {
        query.where('tasks.creatorId', req.user.id)
      }

      const [tasks, statuses, users, labels] = await Promise.all([
        query,
        app.objection.models.taskStatus.query(),
        app.objection.models.user.query(),
        app.objection.models.label.query(),
      ])

      const filter = { statusId, executorId, labelId, isCreatorUser }
      reply.render('tasks/index', { tasks, statuses, users, labels, filter })
      return reply
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task()
      const statuses = await app.objection.models.taskStatus.query()
      const users = await app.objection.models.user.query()
      const labels = await app.objection.models.label.query()
      reply.render('tasks/new', { task, statuses, users, labels })
      return reply
    })
    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task()
      const data = {
        ...req.body.data,
        statusId: Number(req.body.data.statusId),
        creatorId: req.user.id,
        executorId: req.body.data.executorId ? Number(req.body.data.executorId) : null,
      }
      task.$set(data)

      try {
        const validTask = await app.objection.models.task.fromJson(data)
        const labelIds = [].concat(req.body.data.labels || []).map(Number).filter(id => Number.isInteger(id) && id > 0)

        await app.objection.knex.transaction(async (trx) => {
          const insertedTask = await app.objection.models.task.query(trx).insert(validTask)
          if (labelIds.length > 0) {
            await trx('tasks_labels').insert(labelIds.map(labelId => ({ taskId: insertedTask.id, labelId })))
          }
        })

        req.flash('info', i18next.t('flash.tasks.create.success'))
        reply.redirect(app.reverse('tasks'))
      }
      catch (error) {
        req.flash('error', i18next.t('flash.tasks.create.error'))
        const statuses = await app.objection.models.taskStatus.query()
        const users = await app.objection.models.user.query()
        const labels = await app.objection.models.label.query()
        reply.render('tasks/new', { task, statuses, users, labels, errors: error.data })
      }

      return reply
    })
    .get('/tasks/:id', { name: 'showTask' }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query()
        .findById(id)
        .withGraphJoined('[status, creator, executor, labels]')
      if (!task) {
        reply.code(404)
        return reply
      }
      reply.render('tasks/show', { task })
      return reply
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id).withGraphJoined('labels')
      const statuses = await app.objection.models.taskStatus.query()
      const users = await app.objection.models.user.query()
      const labels = await app.objection.models.label.query()
      reply.render('tasks/edit', { task, statuses, users, labels })
      return reply
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id)
      if (!task) {
        reply.code(404)
        return reply
      }
      const data = {
        ...req.body.data,
        statusId: Number(req.body.data.statusId),
        creatorId: task.creatorId,
        executorId: req.body.data.executorId ? Number(req.body.data.executorId) : null,
      }

      try {
        const validData = await app.objection.models.task.fromJson(data)
        const labelIds = [].concat(req.body.data.labels || []).map(Number).filter(id => Number.isInteger(id) && id > 0)

        await app.objection.knex.transaction(async (trx) => {
          await task.$query(trx).patch(validData)
          await trx('tasks_labels').where('taskId', id).del()
          if (labelIds.length > 0) {
            await trx('tasks_labels').insert(labelIds.map(labelId => ({ taskId: Number(id), labelId })))
          }
        })

        req.flash('info', i18next.t('flash.tasks.edit.success'))
        reply.redirect(app.reverse('tasks'))
      }
      catch (error) {
        req.flash('error', i18next.t('flash.tasks.edit.error'))
        const statuses = await app.objection.models.taskStatus.query()
        const users = await app.objection.models.user.query()
        const labels = await app.objection.models.label.query()
        reply.render('tasks/edit', { task, statuses, users, labels, errors: error.data })
      }

      return reply
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id)
      if (!task) {
        reply.code(404)
        return reply
      }

      if (task.creatorId !== req.user.id) {
        req.flash('error', i18next.t('flash.tasks.delete.accessError'))
        reply.redirect(app.reverse('tasks'))
        return reply
      }

      await app.objection.models.task.query().deleteById(id)
      req.flash('info', i18next.t('flash.tasks.delete.success'))
      reply.redirect(app.reverse('tasks'))
      return reply
    })
}

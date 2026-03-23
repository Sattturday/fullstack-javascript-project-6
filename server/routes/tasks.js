import i18next from 'i18next'

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query()
        .withGraphJoined('[status, creator, executor]')
      reply.render('tasks/index', { tasks })
      return reply
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task()
      const statuses = await app.objection.models.taskStatus.query()
      const users = await app.objection.models.user.query()
      reply.render('tasks/new', { task, statuses, users })
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
        await app.objection.models.task.query().insert(validTask)
        req.flash('info', i18next.t('flash.tasks.create.success'))
        reply.redirect(app.reverse('tasks'))
      }
      catch ({ data: errors }) {
        req.flash('error', i18next.t('flash.tasks.create.error'))
        const statuses = await app.objection.models.taskStatus.query()
        const users = await app.objection.models.user.query()
        reply.render('tasks/new', { task, statuses, users, errors })
      }

      return reply
    })
    .get('/tasks/:id', { name: 'showTask' }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query()
        .findById(id)
        .withGraphJoined('[status, creator, executor]')
      reply.render('tasks/show', { task })
      return reply
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id)
      const statuses = await app.objection.models.taskStatus.query()
      const users = await app.objection.models.user.query()
      reply.render('tasks/edit', { task, statuses, users })
      return reply
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id)
      const data = {
        ...req.body.data,
        statusId: Number(req.body.data.statusId),
        creatorId: task.creatorId,
        executorId: req.body.data.executorId ? Number(req.body.data.executorId) : null,
      }

      try {
        const validData = await app.objection.models.task.fromJson(data)
        await task.$query().patch(validData)
        req.flash('info', i18next.t('flash.tasks.edit.success'))
        reply.redirect(app.reverse('tasks'))
      }
      catch ({ data: errors }) {
        req.flash('error', i18next.t('flash.tasks.edit.error'))
        const statuses = await app.objection.models.taskStatus.query()
        const users = await app.objection.models.user.query()
        reply.render('tasks/edit', { task, statuses, users, errors })
      }

      return reply
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params
      const task = await app.objection.models.task.query().findById(id)

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

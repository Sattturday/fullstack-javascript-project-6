import { fileURLToPath } from 'url'
import path from 'path'
import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'
import fastifyFormbody from '@fastify/formbody'
import fastifySecureSession from '@fastify/secure-session'
import fastifyPassport from '@fastify/passport'
import fastifySensible from '@fastify/sensible'
import { plugin as fastifyReverseRoutes } from 'fastify-reverse-routes'
import fastifyMethodOverride from 'fastify-method-override'
import qs from 'qs'
import Pug from 'pug'
import Knex from 'knex'
import { Model } from 'objection'
import i18next from 'i18next'

import * as knexConfig from '../knexfile.js'
import ru from './locales/ru.js'
import en from './locales/en.js'
import addRoutes from './routes/index.js'
import getHelpers from './helpers/index.js'
import User from './models/User.cjs'
import TaskStatus from './models/TaskStatus.cjs'
import Task from './models/Task.cjs'
import Label from './models/Label.cjs'
import FormStrategy from './lib/passportStrategies/FormStrategy.js'

const __dirname = fileURLToPath(path.dirname(import.meta.url))

const mode = process.env.NODE_ENV || 'development'

const setUpViews = (app) => {
  app.register(fastifyView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      ...getHelpers(app),
      assetPath: filename => `/assets/${filename}`,
    },
    templates: path.join(__dirname, '..', 'server', 'views'),
  })

  // preHandler reads flash from the PREVIOUS request (redirect flow).
  // render() reads flash set by the CURRENT handler (validation error flow).
  // Handlers must call either render() or redirect(), never both.
  app.decorateReply('render', function render(viewPath, locals) {
    if (!this.locals) this.locals = { flash: {} }
    if (!this.locals.flash) this.locals.flash = {}
    const freshFlash = this.flash ? (this.flash() || {}) : {}
    Object.entries(freshFlash).forEach(([type, messages]) => {
      this.locals.flash[type] = (this.locals.flash[type] || []).concat(messages)
    })
    this.view(viewPath, { ...locals, reply: this })
  })
}

const setUpStaticAssets = (app) => {
  const pathPublic = path.join(__dirname, '..', 'dist')
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  })
}

const setupLocalization = async () => {
  await i18next
    .init({
      lng: 'ru',
      fallbackLng: 'en',
      resources: {
        ru,
        en,
      },
    })
}

const addHooks = (app) => {
  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      isAuthenticated: () => req.isAuthenticated(),
      currentUser: req.user,
      t: key => i18next.t(key),
      flash: reply.flash ? (reply.flash() || {}) : {},
    }
  })
}

const registerPlugins = async (app) => {
  await app.register(fastifySensible)
  await app.register(fastifyReverseRoutes)
  await app.register(fastifyFormbody, { parser: qs.parse })

  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY || 'a-secret-with-minimum-length-of-32',
    cookie: {
      path: '/',
    },
  })

  fastifyPassport.registerUserDeserializer(
    user => app.objection.models.user.query().findById(user.id),
  )
  fastifyPassport.registerUserSerializer(user => Promise.resolve(user))
  fastifyPassport.use(new FormStrategy('form', app))
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())
  await app.decorate('fp', fastifyPassport)
  app.decorate('authenticate', (...args) => fastifyPassport.authenticate(
    'form',
    {
      failureRedirect: app.reverse('newSession'),
      failureFlash: i18next.t('flash.authError'),
    },
  )(...args))

  await app.register(fastifyMethodOverride)
}

const setupDb = (app) => {
  const config = knexConfig[mode]
  const knex = Knex(config)
  Model.knex(knex)

  app.decorate('objection', {
    knex,
    models: { user: User, taskStatus: TaskStatus, task: Task, label: Label },
  })

  app.addHook('onClose', async () => {
    await knex.destroy()
  })
}

export const options = {
  exposeHeadRoutes: false,
}

export default async (app, _options) => {
  setupDb(app)
  await registerPlugins(app)

  await setupLocalization()
  setUpViews(app)
  setUpStaticAssets(app)
  addRoutes(app)
  addHooks(app)

  return app
}

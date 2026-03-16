import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pug from 'pug'

import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'
import i18next from 'i18next'

import en from './locales/en.js'
import ru from './locales/ru.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const options = { exposeHeadRoutes: false }

const setupLocalization = async () => {
  await i18next.init({
    lng: 'en',
    fallbackLng: 'ru',
    resources: { en, ru },
  })
}

export default async (app, _opts) => {
  await setupLocalization()

  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, '..', 'dist'),
    prefix: '/assets/',
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: path.resolve(__dirname, 'views'),
    includeViewExtension: true,
    defaultContext: {
      t: key => i18next.t(key),
      assetPath: filename => `/assets/${filename}`,
    },
  })

  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      t: key => i18next.t(key),
    }
  })

  app.get('/', async (req, reply) => reply.view('index'))
}

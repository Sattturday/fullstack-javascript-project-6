import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pug from 'pug'

import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const options = { exposeHeadRoutes: false }

export default async (app, opts) => {
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, '..', 'dist'),
    prefix: '/assets/',
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: path.resolve(__dirname, 'views'),
  })

  app.get('/', async (req, reply) => {
    return reply.view('index')
  })
}
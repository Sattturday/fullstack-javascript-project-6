import { fileURLToPath } from 'url';
import path from 'path';
import fastifyStatic from '@fastify/static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const options = { exposeHeadRoutes: false };

export default async (app, opts) => {
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, '..', 'dist'),
    prefix: '/assets/',
  });

  app.get('/', async (req, reply) => {
    reply.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand" href="/">Task Manager</a>
    </div>
  </nav>
  <div class="container mt-4">
    <h1>Welcome to Task Manager</h1>
    <p class="lead">A simple task management application.</p>
  </div>
  <script src="/assets/main.js"></script>
</body>
</html>`);
  });
};

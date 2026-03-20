import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const migrations = {
  directory: path.join(__dirname, 'server', 'migrations'),
}

const seeds = {
  directory: path.join(__dirname, 'server', 'seeds'),
}

export const development = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'database.sqlite'),
  },
  useNullAsDefault: true,
  migrations,
  seeds,
}

export const test = {
  client: 'sqlite3',
  connection: ':memory:',
  useNullAsDefault: true,
  // debug: true,
  migrations,
  seeds,
}

export const production = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations,
  seeds,
}

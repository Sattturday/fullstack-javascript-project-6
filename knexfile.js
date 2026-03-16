import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

export default {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './server/migrations',
    },
    seeds: {
      directory: './server/seeds',
    },
  },
}

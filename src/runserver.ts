import config from 'config'
import * as db from './db'
import logger from './util/logger'
import app from './server'
import io from './socket'
import { startCron, stopCron } from './cron'

logger.info('initializing...')
logger.warn(`ENV: ${process.env.NODE_ENV}`)

Promise.all([db.connect()]).then(() => {
  logger.info('starting server...')
  const s = app.listen(config.get('server.port'), () => {
    logger.info(`server started on port ${config.get('server.port')}`)
  })
  io.listen(s)
  startCron()

  process.on('SIGINT', async () => {
    logger.info('server is shutting down...')
    await Promise.all([stopCron(), db.disconnect(), io.close(), s.close()])
  })
})

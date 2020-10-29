import config from 'config'
import server from './app'
import logger from './util/logger'
import * as db from './db'
import * as pubsub from './pubsub'
import * as cron from './cronWorker'

logger.info('initializing...')

Promise.all([db.connect(),pubsub.connect(),cron.startCronWorkers()]).then(() => {
  logger.info('starting server...')
  server.listen(config.get('server.port'), () => {
    logger.info('server started.')
  })
})

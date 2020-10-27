import config from 'config'
import server from './app'
import logger from './util/logger'
import * as db from './db'

logger.info('initializing...')

Promise.all([db.connect()]).then(() => {
  logger.info('starting server...')
  server.listen(config.get('server.port'), () => {
    logger.info('server started.')
  })
})

import './init'
import config from 'config'
import Koa from 'koa'
import logger from 'koa-logger'
import routes from './routes'

const app = new Koa()

app.use(logger())
app.use(routes())

export default app

import './init'
import config from 'config'
import Koa from 'koa'
import logger from 'koa-logger'
import helmet from 'koa-helmet'
import cors from '@koa/cors'
import requestId from 'koa-requestid'
import compress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import jsonPretty from 'koa-json'
import routes from './routes'

const app = new Koa()

app.proxy = config.get('server.proxy')
app.keys = config.get('server.keys')


app.use(logger())
app.use(helmet())
app.use(cors())
app.use(requestId())
app.use(compress())
app.use(jsonPretty())
app.use(bodyParser())
app.use(routes())


export default app

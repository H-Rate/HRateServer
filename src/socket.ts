import { deviceConnectController, clientConnectController } from './ctrl'
import { checkDeviceId } from './ctrl/middlewares/devices'
import { checkClientDetails } from './ctrl/middlewares/clients'
import Server = require('socket.io')
import app from './server'

const io = new Server(app)

export const deviceNamespace = io.of('/device')
deviceNamespace.use(checkDeviceId)
deviceNamespace.on('connection', deviceConnectController)

export const clientNameSpace = io.of('/client')
clientNameSpace.use(checkClientDetails)
clientNameSpace.on('connection', clientConnectController)

export default io

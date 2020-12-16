import io from '../socket'
import {
  createDevice,
  disconnectDevice,
  generateDeviceToken,
  getSubscribers,
  fetchClients,
  clearRoom,
  removeDevice,
} from '../db/ops/device'
import { deleteClients } from '../db/ops/client'
import { connect, existsKey } from '../db/redis'

const clients: any[] = []

const deviceDisconnectController = async (data): Promise<void> => {
  if (!data.id) return
  const device = await disconnectDevice(data.id)
  await clearRoom(data.id)
  delete device[device.id]
}

const deviceGenerateTokenController = async (data): Promise<void> => {
  if (!data.id) return
  const token = await generateDeviceToken(data.id)
  const socket = clients[data.id]
  if (!socket) return
  if (!token) {
    socket.emit(new Error('Token Generation error please try again'))
  }
  socket.emit('deviceToken', token)
}

const deviceMessageController = async (data): Promise<void> => {
  if (!data.id) return
  if (!(await existsKey(data.id))) return
  io.of('/client').to(data.id).emit('update', data.payload)
}

const deviceGetSubscribers = async (data): Promise<void> => {
  if (!data.id) return
  const socket = clients[data.id]
  if (!socket) return
  let subscribers = await getSubscribers(data.id)
  if (!subscribers) subscribers = []
  socket.emit('subscriberList', { subscribers })
}

const deviceRemoveSubscribers = async (data): Promise<void> => {
  if (!data.id) return
  if (!data.subscriber) return
  const socket = clients[data.id]
  if (!socket) return
  const subscribers = await fetchClients(data.id)
  if (!subscribers.includes(data.subscriber)) return
  const clientSocket = io.of('/client').connected[data.subscriber]
  clientSocket.leave(data.id)
  await deleteClients([clientSocket.id])
  clientSocket.disconnect()
}

const deviceUnregisterController = async (data): Promise<void> => {
  if (!data.id) return
  const socket = clients[data.id]
  if (!socket) return
  await clearRoom(data.id)
  await removeDevice(data.id)
  socket.emit('unRegisterAck', true)
  socket.disconnect()
}

export const deviceConnectController = async (socket): Promise<void> => {
  const device = await createDevice(socket.handshake.query.deviceId, socket.handshake.address)
  socket.emit('deviceRegister', device)
  clients[device.id] = socket
  socket.on('disconnectDevice', deviceDisconnectController)
  socket.on('generateToken', deviceGenerateTokenController)
  socket.on('message', deviceMessageController)
  socket.on('subscribers', deviceGetSubscribers)
  socket.on('removeSubscribers', deviceRemoveSubscribers)
  socket.on('unRegister', deviceUnregisterController)
}

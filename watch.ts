import clientIo from 'socket.io-client'
import dayjs from 'dayjs'

let device

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const deviceId = dayjs().toISOString()
const deviceSocket = clientIo(`http://localhost:3000/device`, {
  query: { deviceId },
})

deviceSocket.on('deviceRegister', async response => {
  device = response
  deviceSocket.emit('generateToken', { id: device.id })
  while (1) {
    await delay(20000)
    deviceSocket.emit('message', { id: response.id, payload: { a: 'something' } })
    deviceSocket.emit('subscribers', { id: response.id })
  }
})

deviceSocket.on('error', response => {
  console.log(response)
})

deviceSocket.on('disconnect', response => {
  console.log(response)
})

deviceSocket.on('deviceToken', token => {
  console.log(token)
})

deviceSocket.on('subscriberList', list => {
  if (list.subscribers.length > 0) {
    deviceSocket.emit('removeSubscribers', {
      id: device.id,
      subscriber: list.subscribers[0].socketId,
    })
  }
})
import { connect as redisConnect, disconnect as redisDisconnect } from '../src/db'
import { deleteKey, getClient, getObject, getString } from '../src/db/redis'
import type { RedisClient } from 'redis'
import io from '../src/socket'
import app from '../src/server'
import config from 'config'
import clientIo from 'socket.io-client'
import * as _ from 'lodash'

let redisClient: RedisClient
let server: any

const getDeviceId = (size: number): number => {
  return _.join(
    _.range(size).map(i => _.random(0, 9)),
    '',
  )
}

beforeAll(async done => {
  await redisConnect()
  redisClient = getClient()
  server = app.listen(config.get('server.port'))
  io.listen(server)
  done()
})

// afterEach(async done => {
//   await redisClient.flushall()
//   done()
// })

afterAll(async done => {
  await redisDisconnect()
  await io.close()
  await server.close()
  done()
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Connect Client', () => {
  it('should save client on db on right token ', async done => {
    const deviceId = getDeviceId(20)
    let device
    const name = 'mydevice'
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { name, token },
      })
      clientSocket.on('connect', async response => {
        await delay(100)
        const clientEntry = await getObject(clientSocket.id)
        expect(clientEntry.socketId).toBe(clientSocket.id)
        expect(clientEntry.name).toBe(name)
        clientSocket.disconnect()
        deviceSocket.disconnect()
        done()
      })
    })
  })
  it('should get updates from device on right token ', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { name: 'mydevice', token },
      })
      clientSocket.on('connect', response => {
        deviceSocket.emit('message', { id: device.id, payload: { a: 'something' } })
      })
      clientSocket.on('update', async response => {
        expect(response).toBeDefined()
        expect(response.a).toBe('something')
        deviceSocket.disconnect()
        clientSocket.disconnect()
        done()
      })
    })
  })
  it('should throw an error if the token is wrong', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { name: 'mydevice', token: '12345' },
      })
      clientSocket.on('error', err => {
        expect(err).toBe('Incorrect Token')
        deviceSocket.disconnect()
        clientSocket.disconnect()
        done()
      })
    })
  })
  it('should throw an error if no token is sent', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { name: 'mydevice' },
      })
      clientSocket.on('error', err => {
        expect(err).toBe('Invalid Client Token')
        deviceSocket.disconnect()
        clientSocket.disconnect()
        done()
      })
    })
  })
  it('should throw an error if no name is sent', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { token },
      })
      clientSocket.on('error', err => {
        expect(err).toBe('Invalid Client Name')
        deviceSocket.disconnect()
        clientSocket.disconnect()
        done()
      })
    })
  })
  it('should throw an error if device is not connected', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      await deviceSocket.emit('disconnectDevice', { id: device.id })
      deviceSocket.disconnect()
      await delay(100)
      const clientSocket = await clientIo(`ws://localhost:${config.get('server.port')}/client`, {
        query: { name: 'mydevice', token },
      })
      clientSocket.on('error', err => {
        expect(err).toBe('Device Offline')
        clientSocket.disconnect()
        done()
      })
    })
  })
})

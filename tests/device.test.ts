import { connect as redisConnect, disconnect as redisDisconnect } from '../src/db'
import { deleteKey, getClient, getObject, getString } from '../src/db/redis'
import { getSubscribers, fetchClients } from '../src/db/ops/device'
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

afterEach(async done => {
  await redisClient.flushall()
  done()
})

afterAll(async done => {
  await redisDisconnect()
  await io.close()
  await server.close()
  done()
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('connectDevice', () => {
  it('returns a error if no deviceId is sent during device registration', async done => {
    const deviceSocket = clientIo(`ws://localhost:${config.get('server.port')}/device`)
    deviceSocket.on('error', response => {
      expect(response).toBe('Invalid Device Id')
      deviceSocket.disconnect()
      done()
    })
  })

  it('returns a error if no deviceId is smaller than 12 charecters', async done => {
    const deviceId = getDeviceId(10)
    const deviceSocket = clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('error', response => {
      expect(response).toBe('Invalid Device Id')
      deviceSocket.disconnect()
      done()
    })
  })

  it('returns a error if no deviceId is larger than 24 charecters', async done => {
    const deviceId = getDeviceId(25)
    const deviceSocket = clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('error', response => {
      expect(response).toBe('Invalid Device Id')
      deviceSocket.disconnect()
      done()
    })
  })

  it('registers a device if deviceId is sent', async done => {
    const deviceId = getDeviceId(20)
    const deviceSocket = clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', response => {
      expect(response.id).toBeDefined()
      expect(response.deviceId).toBe(deviceId)
      expect(response.connected).toBeTruthy()
      deviceSocket.disconnect()
      done()
    })
  })
})

describe('disconnectDevice', () => {
  it('sets device to connected to false on registered device disconnect', async done => {
    const deviceId = getDeviceId(20)
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async device => {
      await deviceSocket.emit('disconnectDevice', { id: device.id })
      await deviceSocket.disconnect()
      //waiting for redis to finish writing
      await delay(100)
      let deviceEntry = await redisClient.get(device.id)
      deviceEntry = JSON.parse(deviceEntry)
      expect(deviceEntry).toBeDefined()
      expect(deviceEntry.connected).toBeFalsy()
      done()
    })
  })
  it('room should be empty on device disconnect', async done => {
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
        await deviceSocket.emit('disconnectDevice', { id: device.id })
        await deviceSocket.disconnect()
        await delay(100)
        const subscribers = await getSubscribers(device.id)
        expect(subscribers).toHaveLength(0)
        clientSocket.disconnect()
        done()
      })
    })
  })
})

describe('generateToken', () => {
  it('returns a token when valid data is sent', async done => {
    const deviceId = getDeviceId(20)
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async device => {
      await deviceSocket.emit('generateToken', { id: device.id })
      deviceSocket.on('deviceToken', async token => {
        let deviceInternalId = await redisClient.get(token)
        let deviceEntry = await redisClient.get(deviceInternalId)
        deviceEntry = JSON.parse(deviceEntry)
        expect(deviceEntry).toBeDefined()
        expect(deviceEntry.token).toBe(token)
        deviceSocket.disconnect()
        done()
      })
    })
  })

  it('deletes old token when new token is generated', async done => {
    const deviceId = getDeviceId(20)
    const tokens: string[] = []
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async device => {
      await deviceSocket.emit('generateToken', { id: device.id })
      await delay(100)
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      tokens.push(token)
      if (tokens.length > 1) {
        const oldToken = await getString(tokens[0])
        expect(oldToken).toBeUndefined()
        deviceSocket.disconnect()
        done()
      }
    })
  })
})

describe('sendMessage', () => {
  it('should send message to subscribed client ', async done => {
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
})

describe('getSubscribers', () => {
  it('should return a list of current session subscribers ', async done => {
    const deviceId = getDeviceId(20)
    const name = 'mydevice'
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
        query: { name, token },
      })
      clientSocket.on('connect', response => {
        deviceSocket.emit('message', { id: device.id, payload: { a: 'something' } })
      })
      clientSocket.on('update', async response => {
        await deviceSocket.emit('subscribers', { id: device.id })
      })
      deviceSocket.on('subscriberList', list => {
        expect(list.subscribers).toHaveLength(1)
        expect(list.subscribers[0].socketId).toBe(clientSocket.id)
        expect(list.subscribers[0].name).toBe(name)
        deviceSocket.disconnect()
        clientSocket.disconnect()
        done()
      })
    })
  })

  it('should return an empty list if all subscribers disconnected ', async done => {
    const deviceId = getDeviceId(20)
    const name = 'mydevice'
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
        query: { name, token },
      })
      clientSocket.on('connect', response => {
        deviceSocket.emit('message', { id: device.id, payload: { a: 'something' } })
      })
      clientSocket.on('update', async response => {
        await clientSocket.disconnect()
        await delay(100)
        await deviceSocket.emit('subscribers', { id: device.id })
      })
      deviceSocket.on('subscriberList', list => {
        expect(list.subscribers).toHaveLength(0)
        deviceSocket.disconnect()
        done()
      })
    })
  })
})

describe('remove subscribers', () => {
  it('should remove the specified subscriber from db ', async done => {
    const deviceId = getDeviceId(20)
    const name = 'mydevice'
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
        query: { name, token },
      })
      clientSocket.on('connect', response => {
        deviceSocket.emit('message', { id: device.id, payload: { a: 'something' } })
      })
      clientSocket.on('update', async response => {
        await deviceSocket.emit('subscribers', { id: device.id })
      })
      deviceSocket.on('subscriberList', async list => {
        expect(list.subscribers).toHaveLength(1)
        deviceSocket.emit('removeSubscribers', {
          id: device.id,
          subscriber: list.subscribers[0].socketId,
        })
        await delay(100)
        const clientEntry = await getString(list.subscribers[0].socketId)
        expect(clientEntry).toBeUndefined()
        clientSocket.disconnect()
        deviceSocket.disconnect()
        done()
      })
    })
  })
  it('Should remove the specified subscriber from the subcriberList ', async done => {
    const deviceId = getDeviceId(20)
    const name = 'mydevice'
    let count = 0
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
        query: { name, token },
      })
      clientSocket.on('connect', response => {
        deviceSocket.emit('message', { id: device.id, payload: { a: 'something' } })
      })
      clientSocket.on('update', async response => {
        await deviceSocket.emit('subscribers', { id: device.id })
      })
      deviceSocket.on('subscriberList', async list => {
        if (count === 0) {
          expect(list.subscribers).toHaveLength(1)
          deviceSocket.emit('removeSubscribers', {
            id: device.id,
            subscriber: list.subscribers[0].socketId,
          })
          await delay(100)
          await deviceSocket.emit('subscribers', { id: device.id })
          count++
        } else {
          expect(list.subscribers).toHaveLength(0)
          clientSocket.disconnect()
          deviceSocket.disconnect()
          done()
        }
      })
    })
  })
})

describe('unRegister', () => {
  it('Should remove a device from db if valid data is sent ', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('unRegister', { id: device.id })
    })
    deviceSocket.on('unRegisterAck', async response => {
      const savedDevice = await getObject(device.id)
      expect(savedDevice).toBeUndefined()
      deviceSocket.disconnect()
      done()
    })
  })
  it('Room should be empty if valid data is sent ', async done => {
    const deviceId = getDeviceId(20)
    let device
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async regdevice => {
      device = regdevice
      await deviceSocket.emit('unRegister', { id: device.id })
    })
    deviceSocket.on('unRegisterAck', async response => {
      const subscribers = await fetchClients(device.id)
      expect(subscribers).toHaveLength(0)
      deviceSocket.disconnect()
      done()
    })
  })
})

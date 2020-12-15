import { connect as redisConnect, disconnect as redisDisconnect } from '../src/db'
import { getClient } from '../src/db/redis'
import type { RedisClient } from 'redis'
import io from '../src/socket'
import app from '../src/server'
import config from 'config'
import clientIo from 'socket.io-client'

let redisClient: RedisClient
let server: any

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

describe('connectDevice', () => {
  it('returns a error if no deviceId is sent during device registration', async done => {
    const deviceSocket = clientIo(`ws://localhost:${config.get('server.port')}/device`)
    deviceSocket.on('error', response => {
      expect(response).toBe('Invalid Device Id')
      deviceSocket.disconnect()
      done()
    })
  })

  it('registers a device if deviceId is sent', async done => {
    const deviceId = '876487236'
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
    const deviceId = '876487236'
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async device => {
      await deviceSocket.emit('disconnectDevice', { id: device.id })
      await deviceSocket.disconnect()
      //waiting for a second for redis to finish writing
      await delay(1000)
      let deviceEntry = await redisClient.get(device.id)
      deviceEntry = JSON.parse(deviceEntry)
      expect(deviceEntry).toBeDefined()
      expect(deviceEntry.connected).toBeFalsy()
      done()
    })
  })
  // it('disconnectes all clients', async done => {})
})

describe('generateToken', () => {
  it('returns a token when valid data is sent', async done => {
    const deviceId = '876487236'
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
        done()
      })
    })
  })

  it('deletes old token when new token is generated', async done => {
    const tokens: string[] = []
    const deviceId = '876487236'
    const deviceSocket = await clientIo(`ws://localhost:${config.get('server.port')}/device`, {
      query: { deviceId },
    })
    deviceSocket.on('deviceRegister', async device => {
      await deviceSocket.emit('generateToken', { id: device.id })
      await delay(1000)
      await deviceSocket.emit('generateToken', { id: device.id })
    })
    deviceSocket.on('deviceToken', async token => {
      tokens.push(token)
      if (tokens.length > 1) {
        const oldToken = await redisClient.get(tokens[0])
        expect(oldToken).toBeNull()
        done()
      }
    })
  })
})

// describe('unRegister', () => {
//   it('Should remove a device from db if valid data is sent ', async done => {})
// })

// describe('sendMessage', () => {
//   it('should send message to subscribed client ', async done => {})
// })

// describe('getSubscribers', () => {
//   it('should return a list of current session subscribers ', async done => {})
// })

// describe('remove subscribers', () => {
//   it('should remove the specified subscriber from db ', async done => {})
//   it('Should remove the specified subscriber from the subcriberList ', async done => {})
// })

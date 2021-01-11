import dayjs from 'dayjs'
import { getObject, getString, setObject, setString, expire, deleteKey } from '../redis'
import uniqid from 'uniqid'
import _ from 'lodash'
import io from '../../socket'

export interface Device {
  deviceId: string
  registedAt: Date
  address: string
  id: string
  updatedAt: Date
  connected: boolean
  token?: string
}

const TOKENVALUES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

export const generateToken = (length: number, exceptions: string[] = []): string => {
  const tokenValuesArray = _.split(TOKENVALUES, '')
  const val = _.join(
    _.range(length).map(x => {
      return tokenValuesArray[_.random(tokenValuesArray.length)]
    }),
    '',
  )
  return exceptions.includes(val) ? generateToken(length, exceptions) : val
}

export const createDevice = async (deviceId: string, address: string): Promise<Device> => {
  let deviceInternalId = await getString(deviceId)
  let device: Device
  if (!deviceInternalId) {
    deviceInternalId = await uniqid()
    device = {
      id: deviceInternalId,
      registedAt: dayjs().toDate(),
      address: address,
      deviceId,
      updatedAt: dayjs().toDate(),
      connected: true,
    }
  } else {
    device = ((await getObject(deviceInternalId)) as unknown) as Device
    device['updatedAt'] = dayjs().toDate()
    device['address'] = address
    device['connected'] = true
  }
  await setObject(deviceInternalId, (device as unknown) as Record<string, unknown>)
  await setString(deviceId, deviceInternalId)

  console.log("Device internal id:", deviceInternalId)
  return device
}

export const removeDevice = async (deviceInternalId: string): Promise<void> => {
  await deleteKey(deviceInternalId)
  return
}

export const disconnectDevice = async (deviceInternalId: string): Promise<Device> => {
  const device = ((await getObject(deviceInternalId)) as unknown) as Device
  if (!device) return
  device['connected'] = false
  await setObject(deviceInternalId, (device as unknown) as Record<string, unknown>)
  return device
}

const removeOldToken = async (device: Device): Promise<void> => {
  if (!device.token) return
  const oldToken = getString(device.token)
  if (!oldToken) return
  await deleteKey(device.token)
  return
}

export const generateDeviceToken = async (
  deviceInternalId: string,
): Promise<string | undefined> => {
  const device = ((await getObject(deviceInternalId)) as unknown) as Device
  if (!device) return
  await removeOldToken(device)
  const token = generateToken(5)
  const existingToken = await getString(token)
  if (!existingToken) {
    await setString(token, device.id)
    await expire(token, 60)
    device['token'] = token
    await setObject(deviceInternalId, (device as unknown) as Record<string, unknown>)
    return token
  }
  return undefined
}

export const fetchClients = async (deviceInternalId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    io.of('/client')
      .in(deviceInternalId)
      .clients((err, clients) => {
        if (err) reject(err)
        resolve(clients)
      })
  })
}

export const getSubscribers = async (
  deviceInternalId: string,
): Promise<Record<string, unknown>[]> => {
  const device = ((await getObject(deviceInternalId)) as unknown) as Device
  if (!device) return
  const clients = await fetchClients(deviceInternalId)
  const subscribers = []
  for (let index = 0; index < clients.length; index++) {
    const client = clients[index]
    const clientEntry = await getObject(client)
    subscribers.push(clientEntry)
  }
  return subscribers
}

export const clearRoom = async (roomName: string): Promise<void> => {
  const subscribers = await fetchClients(roomName)
  for (let index = 0; index < subscribers.length; index++) {
    const subscriber = subscribers[index]
    const subscriberSocket = io.of('/client').connected[subscriber]
    await subscriberSocket.leave(roomName)
  }
  return
}

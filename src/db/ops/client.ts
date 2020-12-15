import io from '../../socket'
import { setObject, deleteKey, scanKey } from '../redis'
import * as _ from 'lodash'

export interface Client {
  socketId: string
  name: string
}

export const createClient = async (socketId: string, name: string): Promise<Client> => {
  const client: Client = { socketId, name }
  await setObject(socketId, (client as unknown) as Record<string, unknown>)
  return client
}

export const deleteClients = async (socketIds: string[]): Promise<void> => {
  await Promise.all(socketIds.map(sId => deleteKey(sId)))
  return
}

export const getAllClients = async (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    io.of('/client').clients((err, clients) => {
      if (err) reject(err)
      resolve(clients)
    })
  })
}

export const clearDisconnecedClients = async (): Promise<void> => {
  const allConnectedClients = await getAllClients()
  const allAliveClients = await scanKey('/client*')
  const deadClients = _.difference(allAliveClients, allConnectedClients)
  await deleteClients(deadClients)
}

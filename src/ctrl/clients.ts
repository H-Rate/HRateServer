import { getObject, getString, setObject, setString, expire, deleteKey } from '../db/redis'
import { createClient } from '../db/ops/client'

export const clientConnectController = async (socket): Promise<void> => {
  const deviceInternalId = await getString(socket.handshake.query.token)
  const device = await getObject(deviceInternalId)
  await socket.join(device.id)
  await createClient(socket.id, socket.handshake.query.name)
}

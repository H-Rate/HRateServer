import { getString } from '../../db/redis'

export const checkClientDetails = async (socket, next): Promise<any> => {
  if (!socket.handshake.query.name) {
    return next(new Error('Invalid Client Name'))
  }
  if (!socket.handshake.query.token || socket.handshake.query.token.length > 5) {
    return next(new Error('Invalid Client Token'))
  }
  const deviceInternalId = await getString(socket.handshake.query.token)
  if (!deviceInternalId) {
    return next(new Error('Incorrect Token'))
  }
  return next()
}

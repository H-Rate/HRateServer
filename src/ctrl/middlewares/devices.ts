export const checkDeviceId = (socket, next): any => {
  if (
    !socket.handshake.query.deviceId ||
    socket.handshake.query.deviceId.length > 24 ||
    socket.handshake.query.deviceId.length < 12
  ) {
    return next(new Error('Invalid Device Id'))
  }
  return next()
}

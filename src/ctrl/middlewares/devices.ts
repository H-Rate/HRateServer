export const checkDeviceId = (socket, next): any => {
  console.log("check did " + socket.handshake.query.deviceId)
  if (
    !socket.handshake.query.deviceId ||
    socket.handshake.query.deviceId.length > 50 ||
    socket.handshake.query.deviceId.length < 12
  ) {
    return next(new Error('Invalid Device Id'))
  }
  return next()
}

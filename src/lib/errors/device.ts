export class DeviceAlreadyRegisteredError extends Error {
  constructor(deviceId) {
    super(`device:${deviceId} is already registered`)
  }
}

export class TokenAliveError extends Error {
  constructor() {
    super(`device has a living token`)
  }
}

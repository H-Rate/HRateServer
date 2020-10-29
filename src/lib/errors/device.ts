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

export class NoDeviceWithToken extends Error {
  constructor(token) {
    super(`No device found with token:${token}`)
  }
}


export class AlreadySubscribedError extends Error {
  constructor(appId) {
    super(`app:${appId} has already been subscribed to device`)
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor(name) {
    super(`SubscriptionName:${name} not found in Application`)
  }
}


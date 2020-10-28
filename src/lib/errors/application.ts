export class NameAlreadyUsedError extends Error {
  constructor(name) {
    super(`name:${name} is already in use`)
  }
}
export class InvalidPasswordError extends Error {
  constructor() {
    super('password is not valid')
  }
}

export class ApplicationNotFoundError extends Error {
  constructor(appId) {
    super(`Application not found ${appId}`)
  }
}


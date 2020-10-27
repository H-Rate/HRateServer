import type { ClientSession } from 'mongoose'

export type Context = { readonly session?: ClientSession }
export const root: Context = { session: null } as const

export const make = (ctx: Context = null, session: ClientSession = null): Context => {
  if (!ctx) {
    return root
  }

  return Object.create(ctx, {
    session: {
      get(): ClientSession {
        return session
      },
    },
  })
}

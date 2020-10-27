import type { Boom } from '@hapi/boom'
import type { RouterContext } from '@koa/router'
import type { Context, Middleware } from 'koa'
import _ from 'lodash'
import logger from '../util/logger'
import { toPlainData } from '../util/sanitize'
import { pages2offset } from '../util/pagination'

export type ResponseBody = unknown
export type ResponseStatusCode = number
export type ResponseArray = unknown[]
export type ResponseMap = {
  body?: ResponseBody
  status?: ResponseStatusCode
}
export type Response = ResponseMap | ResponseStatusCode | ResponseBody

export type ParamResolver = (val: string, ctx: RouterContext) => Promise<unknown>

export interface ControllerInput {
  data: any
  query: Record<string, string>
  params: Record<string, string>
  state: Context['state']
}

export type Controller = (input: ControllerInput) => Promise<Response>

const isPlainObject = (a: unknown): a is Record<string, unknown> => {
  return _.isPlainObject(a)
}

const isResponseArray = (res: Response): res is ResponseArray => {
  return Array.isArray(res)
}

const isResponseMap = (res: Response): res is ResponseMap => {
  return isPlainObject(res) && ('body' in res || 'status' in res)
}

const isResponseStatusCode = (res: Response): res is ResponseStatusCode => {
  return !isResponseMap(res) && Number.isInteger(res)
}

const isResponseBody = (res: Response): res is ResponseBody => {
  return !isResponseMap(res) && !isResponseStatusCode(res)
}

const convertResponse = (response: Response) => {
  let responseMap: Partial<ResponseMap>
  if (isResponseMap(response)) {
    responseMap = response
  } else if (isResponseArray(response)) {
    responseMap = { body: { data: response } }
  } else if (isResponseStatusCode(response)) {
    responseMap = { status: response }
  } else if (isResponseBody(response)) {
    responseMap = { body: response }
  } else {
    responseMap = { status: 500 }
  }
  return { status: 200, body: '', ...responseMap }
}

const isBoomError = (val: Error): val is Boom => _.get(val, 'isBoom', false)

const paginate = (query: Record<string, string>) => {
  const perPage = Math.min(100, Math.max(3, parseInt(query.per_page, 10) || 10))
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const [limit, skip] = pages2offset(perPage, page)

  return { perPage, page, limit, skip }
}

export default (controller: Controller, sanitize: (data: unknown) => unknown): Middleware => async (
  ctx,
): Promise<void> => {
  ctx.state.pagination = paginate(ctx.query)

  let response: Response
  try {
    response = await controller({
      data: ctx.request.body,
      query: ctx.request.query,
      params: ctx.params,
      state: ctx.state,
    })
  } catch (error) {
    logger.error(error)

    if (isBoomError(error)) {
      const { statusCode, payload } = error.output
      response = { status: statusCode, body: payload }
    } else {
      response = { status: 500, body: '' }

      if (process.env.NODE_ENV !== 'production') {
        // workaround for TS. TS consider the response as unknown
        const r: ResponseMap = response
        r.body = {
          error: {
            name: error.name,
            message: error.message,
          },
        }
      }
    }
  }

  const { status, body } = convertResponse(response)

  let rv
  if (_.inRange(status, 200, 300)) {
    const plain = toPlainData(body) as Record<string, unknown>
    if (plain && 'data' in plain && Object.keys(plain).length === 1) {
      rv = { data: sanitize(plain.data) }
    } else {
      rv = sanitize(plain)
    }
  } else {
    rv = body
  }

  ctx.status = status
  ctx.body = rv
}

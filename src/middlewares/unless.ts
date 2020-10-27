import _ from 'lodash'
import url from 'url'
import type { Middleware } from 'koa'

export type Path = { methods?: string[]; path: string | RegExp; exclude?: string[] } | string | RegExp

//fix any
const matches = (cfg: Path, method: string, pathname: string): boolean => {
  if (_.isString(cfg)) {
    return (cfg as string) === pathname
  }
  if (_.isRegExp(cfg)) {
    return !!(cfg as RegExp).exec(pathname)
  }

  if (_.isObject(cfg)) {
    const m = (cfg as any).methods.length !== 0 ? (cfg as any).methods.includes(method) : true
    if ((cfg as any).exclude?.includes(pathname)) {
      return false
    }
    if (_.isString((cfg as any).path)) {
      return m && (cfg as any).path === pathname
    }
    if (_.isRegExp((cfg as any).path)) {
      return m && !!(cfg as any).path.exec(pathname)
    }
  }

  return false
}

export default (paths: Path[] = []) => (mw: Middleware): Middleware => (ctx, next) => {
  const { pathname } = url.parse(ctx.url || '', true)
  for (const path of paths) {
    if (matches(path, ctx.method, pathname)) {
      console.log('public')
      return next()
    }
  }

  return mw(ctx, next)
}

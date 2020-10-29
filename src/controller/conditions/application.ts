import {Users} from '../../specs/common'
import type { Condition } from '../../middlewares/resource'

//Permissions
export const isApplication: Condition = ctx => {
  return ctx.state.user.user.type === Users.APP
}

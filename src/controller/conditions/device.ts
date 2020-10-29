import {Users} from '../../specs/common'
import type { Condition } from '../../middlewares/resource'

//Permissions
export const isDevice: Condition = ctx => {
  return ctx.state.user.user.type === Users.DEVICE
}

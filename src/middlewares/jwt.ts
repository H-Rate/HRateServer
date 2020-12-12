import config from "config";
import type { Middleware } from "koa-jwt";
import jwt from "koa-jwt";

export default (): Middleware => {
  return jwt({
    secret: config.get("jwt.secret"),
    async isRevoked(_, data) {
      if (data["exp"] < Date.now()) {
        return true;
      }

      return false;
    },
  });
};

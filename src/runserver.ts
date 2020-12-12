import config from "config";
import server from "./app";
import * as db from "./db";
import logger from "./util/logger";

logger.info("initializing...");
logger.warn(`ENV: ${process.env.NODE_ENV}`);

Promise.all([db.connect()]).then(() => {
  logger.info("starting server...");
  const s = server.listen(config.get("server.port"), () => {
    logger.info("server started.");
  });

  process.on("SIGINT", async () => {
    logger.info("server is shutting down...");
    await Promise.all([db.disconnect(), s.close()]);
  });
});

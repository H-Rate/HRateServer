import config from "config";
import {
  connect as mongoConnect,
  disconnect as mongoDisconnect,
} from "./mongo";

export const connect = async (): Promise<void> => {
  await Promise.all([mongoConnect(config.get("mongo.uri"))]);
};

export const disconnect = async (): Promise<void> => {
  await Promise.all([mongoDisconnect()]);
};

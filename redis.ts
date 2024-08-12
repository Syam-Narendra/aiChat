import { createClient } from "redis";

if (
  !Bun.env["redisPassword"] ||
  !Bun.env["redisHost"] ||
  !Bun.env["redisPort"]
) {
  throw new Error("Redis credentials are not set");
}

const redisPort = parseInt(Bun.env["redisPort"]);
export const redisClient = createClient({
  password: Bun.env["redisPassword"],
  socket: {
    host: Bun.env["redisHost"],
    port: redisPort,
  },
});

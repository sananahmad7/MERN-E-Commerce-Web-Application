import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error(
    "UPSTASH_REDIS_URL is not defined in the environment variables."
  );
}
export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

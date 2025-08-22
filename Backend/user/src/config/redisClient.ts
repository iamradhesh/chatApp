import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();  // 👈 must load env before using it

if (!process.env.REDIS_URI) {
  throw new Error("❌ REDIS_URI is not defined in .env");
}

const redisClient = createClient({
  url: process.env.REDIS_URI
});

redisClient.connect()
  .then(() => console.log("✅ Redis connected"))
  .catch((error) => {
    console.error("❌ Redis connection error:", error);
    process.exit(1);
  });

export default redisClient;

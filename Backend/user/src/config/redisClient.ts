import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.REDIS_URI) {
  throw new Error("❌ REDIS_URI is not defined in .env");
}

const redisClient = createClient({
  url: process.env.REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Max Redis reconnection attempts reached");
        return new Error("Max retry attempts reached");
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`🔄 Reconnecting to Redis... attempt ${retries}`);
      return delay;
    }
  }
});

// Handle connection errors
redisClient.on("error", (error) => {
  console.error("❌ Redis Client Error:", error.message);
});

// Handle reconnection
redisClient.on("reconnecting", () => {
  console.log("🔄 Redis client reconnecting...");
});

// Handle successful connection
redisClient.on("ready", () => {
  console.log("✅ Redis client ready");
});

// Connect to Redis
redisClient.connect()
  .then(() => console.log("✅ Redis connected"))
  .catch((error) => {
    console.error("❌ Redis connection error:", error);
    // Don't exit immediately, let reconnection strategy handle it
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏳ Closing Redis connection...");
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import redisClient from "./config/redisClient.js";
import userRoutes from "./routes/userRoute.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

const app = express();

// DB connection

connectDB();

// RabbitMQ connection
connectRabbitMQ();

// Example Redis usage
app.get("/cache-test", async (req, res) => {
  await redisClient.set("foo", "bar");
  const value = await redisClient.get("foo");
  res.send(`Redis says: ${value}`);
});

// Mount user routes
app.use("/api/v1", userRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port = ${port}`);
});

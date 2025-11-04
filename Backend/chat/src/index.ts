import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import chatRoutes from './routes/ChatRoutes.js';
import cors from 'cors';
import { app,server } from './config/socket.js';
dotenv.config();
connectDB();

app.use(express.json());
app.use(cors())

const PORT = process.env.PORT || 5003;
app.use('/api/v1', chatRoutes);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


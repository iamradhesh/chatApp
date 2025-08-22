import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());



app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Mail service is running on port ${process.env.PORT || 3000}`);
});
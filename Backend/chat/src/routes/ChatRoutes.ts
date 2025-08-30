import express from 'express';

import { Router } from 'express';
import { createNewChat } from '../controllers/chatController.js';
import { isAuth } from '../middlewares/isAuth.js';

const router = Router();

router.post("/chat/new", isAuth, createNewChat);

export default router;
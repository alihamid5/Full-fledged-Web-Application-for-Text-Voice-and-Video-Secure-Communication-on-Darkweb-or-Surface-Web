import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage,
  markMessagesAsRead
} from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes
router.post('/', protect, sendMessage);
router.get('/:chatId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);
router.put('/read/:chatId', protect, markMessagesAsRead);

export default router; 
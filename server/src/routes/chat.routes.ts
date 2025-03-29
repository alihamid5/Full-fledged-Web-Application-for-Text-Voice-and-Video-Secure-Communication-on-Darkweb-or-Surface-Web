import express from 'express';
import {
  createChat,
  getUserChats,
  getChatById,
  updateChat,
  addUserToChat,
  removeUserFromChat,
  deleteChat
} from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes
router.post('/', protect, createChat);
router.get('/', protect, getUserChats);
router.get('/:id', protect, getChatById);
router.put('/:id', protect, updateChat);
router.post('/:id/users', protect, addUserToChat);
router.delete('/:id/users/:userId', protect, removeUserFromChat);
router.delete('/:id', protect, deleteChat);

export default router; 
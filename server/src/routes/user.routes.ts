import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  getOnlineUsers
} from '../controllers/user.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes
router.get('/search', protect, searchUsers);
router.get('/online', protect, getOnlineUsers);
router.get('/:id', protect, getUserById);

// Admin routes
router.get('/', protect, admin, getUsers);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router; 
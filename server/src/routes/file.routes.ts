import express from 'express';
import {
  upload,
  uploadFile,
  getFile,
  deleteFile,
  getUserFiles
} from '../controllers/file.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes
router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/', protect, getUserFiles);
router.get('/:id', getFile); // Public/Private depending on file settings
router.delete('/:id', protect, deleteFile);

export default router; 
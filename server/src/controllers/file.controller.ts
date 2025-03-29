import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { asyncHandler } from '../middleware/error.middleware';
import File from '../models/file.model';
import { ApiError } from '../middleware/error.middleware';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // Default 10MB
  }
});

/**
 * @desc    Upload a file
 * @route   POST /api/files/upload
 * @access  Private
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError('No file uploaded', 400);
  }
  
  // Create file record in database
  const file = await File.create({
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
    isPublic: req.body.isPublic === 'true'
  });
  
  res.status(201).json({
    _id: file._id,
    originalName: file.originalName,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    type: file.type,
    url: `/api/files/${file._id}`,
    isPublic: file.isPublic,
    createdAt: file.createdAt
  });
});

/**
 * @desc    Get file by ID
 * @route   GET /api/files/:id
 * @access  Private/Public (depending on file settings)
 */
export const getFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await File.findById(req.params.id);
  
  if (!file) {
    throw new ApiError('File not found', 404);
  }
  
  // Check if file is public or user is authorized
  if (!file.isPublic && (!req.user || file.uploadedBy.toString() !== req.user._id.toString())) {
    throw new ApiError('Not authorized to access this file', 403);
  }
  
  // Check if file exists on disk
  if (!fs.existsSync(file.path)) {
    throw new ApiError('File not found on server', 404);
  }
  
  // Set content type
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
  
  // Stream file
  const fileStream = fs.createReadStream(file.path);
  fileStream.pipe(res);
});

/**
 * @desc    Delete file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await File.findById(req.params.id);
  
  if (!file) {
    throw new ApiError('File not found', 404);
  }
  
  // Check if user is authorized
  if (file.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to delete this file', 403);
  }
  
  // Delete file from disk if it exists
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
  
  // Delete file record from database
  await File.deleteOne({ _id: file._id });
  
  res.json({ message: 'File deleted' });
});

/**
 * @desc    Get user's files
 * @route   GET /api/files
 * @access  Private
 */
export const getUserFiles = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const files = await File.find({ uploadedBy: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await File.countDocuments({ uploadedBy: req.user._id });
  
  res.json({
    files: files.map(file => ({
      _id: file._id,
      originalName: file.originalName,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      type: file.type,
      url: `/api/files/${file._id}`,
      isPublic: file.isPublic,
      createdAt: file.createdAt
    })),
    page,
    pages: Math.ceil(total / limit),
    total
  });
}); 
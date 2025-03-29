"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFiles = exports.deleteFile = exports.getFile = exports.uploadFile = exports.upload = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const error_middleware_1 = require("../middleware/error.middleware");
const file_model_1 = __importDefault(require("../models/file.model"));
const error_middleware_2 = require("../middleware/error.middleware");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${(0, uuid_1.v4)()}-${Date.now()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('File type not allowed'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
    }
});
exports.uploadFile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new error_middleware_2.ApiError('No file uploaded', 400);
    }
    const file = await file_model_1.default.create({
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
exports.getFile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const file = await file_model_1.default.findById(req.params.id);
    if (!file) {
        throw new error_middleware_2.ApiError('File not found', 404);
    }
    if (!file.isPublic && (!req.user || file.uploadedBy.toString() !== req.user._id.toString())) {
        throw new error_middleware_2.ApiError('Not authorized to access this file', 403);
    }
    if (!fs_1.default.existsSync(file.path)) {
        throw new error_middleware_2.ApiError('File not found on server', 404);
    }
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    const fileStream = fs_1.default.createReadStream(file.path);
    fileStream.pipe(res);
});
exports.deleteFile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const file = await file_model_1.default.findById(req.params.id);
    if (!file) {
        throw new error_middleware_2.ApiError('File not found', 404);
    }
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
        throw new error_middleware_2.ApiError('Not authorized to delete this file', 403);
    }
    if (fs_1.default.existsSync(file.path)) {
        fs_1.default.unlinkSync(file.path);
    }
    await file_model_1.default.deleteOne({ _id: file._id });
    res.json({ message: 'File deleted' });
});
exports.getUserFiles = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const files = await file_model_1.default.find({ uploadedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await file_model_1.default.countDocuments({ uploadedBy: req.user._id });
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

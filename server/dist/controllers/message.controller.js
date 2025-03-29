"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesAsRead = exports.deleteMessage = exports.getMessages = exports.sendMessage = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const message_model_1 = __importStar(require("../models/message.model"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
const error_middleware_2 = require("../middleware/error.middleware");
exports.sendMessage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { chatId, text, type, fileUrl, fileName, fileSize, replyTo } = req.body;
    const chat = await chat_model_1.default.findById(chatId);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (!chat.members.includes(req.user._id)) {
        throw new error_middleware_2.ApiError('Not authorized to send messages in this chat', 403);
    }
    const message = await message_model_1.default.create({
        chat: chatId,
        sender: req.user._id,
        text,
        type: type || message_model_1.MessageType.TEXT,
        fileUrl,
        fileName,
        fileSize,
        replyTo,
        readBy: [req.user._id]
    });
    chat.lastMessage = message._id;
    await chat.save();
    const populatedMessage = await message_model_1.default.findById(message._id)
        .populate('sender', 'username avatar')
        .populate({
        path: 'replyTo',
        populate: {
            path: 'sender',
            select: 'username avatar'
        }
    });
    res.status(201).json(populatedMessage);
});
exports.getMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const chatId = req.params.chatId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const chat = await chat_model_1.default.findById(chatId);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (!chat.members.includes(req.user._id)) {
        throw new error_middleware_2.ApiError('Not authorized to view messages in this chat', 403);
    }
    const messages = await message_model_1.default.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate({
        path: 'replyTo',
        populate: {
            path: 'sender',
            select: 'username avatar'
        }
    });
    const total = await message_model_1.default.countDocuments({ chat: chatId });
    res.json({
        messages: messages.reverse(),
        page,
        pages: Math.ceil(total / limit),
        total
    });
});
exports.deleteMessage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const message = await message_model_1.default.findById(req.params.id);
    if (!message) {
        throw new error_middleware_2.ApiError('Message not found', 404);
    }
    if (message.sender.toString() !== req.user._id.toString()) {
        throw new error_middleware_2.ApiError('Not authorized to delete this message', 403);
    }
    message.isDeleted = true;
    message.text = 'This message has been deleted';
    message.fileUrl = '';
    message.fileName = '';
    message.fileSize = 0;
    await message.save();
    res.json({ message: 'Message deleted' });
});
exports.markMessagesAsRead = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const chatId = req.params.chatId;
    const chat = await chat_model_1.default.findById(chatId);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (!chat.members.includes(req.user._id)) {
        throw new error_middleware_2.ApiError('Not authorized to access this chat', 403);
    }
    await message_model_1.default.updateMany({
        chat: chatId,
        readBy: { $ne: req.user._id }
    }, {
        $addToSet: { readBy: req.user._id }
    });
    res.json({ message: 'Messages marked as read' });
});

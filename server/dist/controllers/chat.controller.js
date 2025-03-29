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
exports.deleteChat = exports.removeUserFromChat = exports.addUserToChat = exports.updateChat = exports.getChatById = exports.getUserChats = exports.createChat = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const chat_model_1 = __importStar(require("../models/chat.model"));
const message_model_1 = __importDefault(require("../models/message.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_2 = require("../middleware/error.middleware");
exports.createChat = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId, name, type } = req.body;
    if (type === chat_model_1.ChatType.PRIVATE && userId) {
        const existingChat = await chat_model_1.default.findOne({
            type: chat_model_1.ChatType.PRIVATE,
            members: { $all: [req.user._id, userId] }
        });
        if (existingChat) {
            return res.status(200).json(existingChat);
        }
    }
    const chatData = {
        type: type || chat_model_1.ChatType.PRIVATE,
        members: [req.user._id],
        createdBy: req.user._id
    };
    if (type === chat_model_1.ChatType.GROUP && name) {
        chatData.name = name;
    }
    if (type === chat_model_1.ChatType.PRIVATE && userId) {
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            throw new error_middleware_2.ApiError('User not found', 404);
        }
        chatData.members.push(userId);
    }
    if (type === chat_model_1.ChatType.GROUP) {
        chatData.admins = [req.user._id];
    }
    const chat = await chat_model_1.default.create(chatData);
    const populatedChat = await chat_model_1.default.findById(chat._id)
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('createdBy', 'username email avatar')
        .populate('lastMessage');
    res.status(201).json(populatedChat);
});
exports.getUserChats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const chats = await chat_model_1.default.find({ members: req.user._id })
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
    res.json(chats);
});
exports.getChatById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const chat = await chat_model_1.default.findById(req.params.id)
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('createdBy', 'username email avatar')
        .populate({
        path: 'lastMessage',
        populate: {
            path: 'sender',
            select: 'username avatar'
        }
    });
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (!chat.members.some((member) => member._id.toString() === req.user._id.toString())) {
        throw new error_middleware_2.ApiError('Not authorized to access this chat', 403);
    }
    res.json(chat);
});
exports.updateChat = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { name } = req.body;
    const chat = await chat_model_1.default.findById(req.params.id);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (chat.type === chat_model_1.ChatType.GROUP &&
        !chat.admins.some((admin) => admin.toString() === req.user._id.toString())) {
        throw new error_middleware_2.ApiError('Not authorized to update this chat', 403);
    }
    chat.name = name || chat.name;
    const updatedChat = await chat.save();
    const populatedChat = await chat_model_1.default.findById(updatedChat._id)
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('createdBy', 'username email avatar')
        .populate('lastMessage');
    res.json(populatedChat);
});
exports.addUserToChat = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    const chat = await chat_model_1.default.findById(req.params.id);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    if (chat.type === chat_model_1.ChatType.GROUP &&
        !chat.admins.some((admin) => admin.toString() === req.user._id.toString())) {
        throw new error_middleware_2.ApiError('Not authorized to add users to this chat', 403);
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        throw new error_middleware_2.ApiError('User not found', 404);
    }
    if (chat.members.some((member) => member.toString() === userId)) {
        throw new error_middleware_2.ApiError('User is already a member of this chat', 400);
    }
    chat.members.push(userId);
    const updatedChat = await chat.save();
    const populatedChat = await chat_model_1.default.findById(updatedChat._id)
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('createdBy', 'username email avatar')
        .populate('lastMessage');
    res.json(populatedChat);
});
exports.removeUserFromChat = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const chat = await chat_model_1.default.findById(req.params.id);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    const isAdmin = chat.admins.some((admin) => admin.toString() === req.user._id.toString());
    const isSelf = userId === req.user._id.toString();
    if (chat.type === chat_model_1.ChatType.GROUP && !isAdmin && !isSelf) {
        throw new error_middleware_2.ApiError('Not authorized to remove users from this chat', 403);
    }
    if (!chat.members.some((member) => member.toString() === userId)) {
        throw new error_middleware_2.ApiError('User is not a member of this chat', 400);
    }
    chat.members = chat.members.filter((member) => member.toString() !== userId);
    if (chat.admins.some((admin) => admin.toString() === userId)) {
        chat.admins = chat.admins.filter((admin) => admin.toString() !== userId);
    }
    if (chat.members.length === 0) {
        await chat_model_1.default.deleteOne({ _id: chat._id });
        await message_model_1.default.deleteMany({ chat: chat._id });
        return res.json({ message: 'Chat deleted' });
    }
    const updatedChat = await chat.save();
    const populatedChat = await chat_model_1.default.findById(updatedChat._id)
        .populate('members', 'username email avatar isOnline lastSeen')
        .populate('admins', 'username email avatar')
        .populate('createdBy', 'username email avatar')
        .populate('lastMessage');
    res.json(populatedChat);
});
exports.deleteChat = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const chat = await chat_model_1.default.findById(req.params.id);
    if (!chat) {
        throw new error_middleware_2.ApiError('Chat not found', 404);
    }
    const isAdmin = chat.admins.some((admin) => admin.toString() === req.user._id.toString());
    const isCreator = chat.createdBy.toString() === req.user._id.toString();
    if (chat.type === chat_model_1.ChatType.GROUP && !isAdmin && !isCreator) {
        throw new error_middleware_2.ApiError('Not authorized to delete this chat', 403);
    }
    await chat_model_1.default.deleteOne({ _id: chat._id });
    await message_model_1.default.deleteMany({ chat: chat._id });
    res.json({ message: 'Chat deleted' });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.searchUsers = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_2 = require("../middleware/error.middleware");
exports.getUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await user_model_1.default.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await user_model_1.default.countDocuments({});
    res.json({
        users,
        page,
        pages: Math.ceil(total / limit),
        total
    });
});
exports.getUserById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await user_model_1.default.findById(req.params.id);
    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            isAdmin: user.isAdmin,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt
        });
    }
    else {
        throw new error_middleware_2.ApiError('User not found', 404);
    }
});
exports.updateUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await user_model_1.default.findById(req.params.id);
    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;
        user.bio = req.body.bio || user.bio;
        user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
            isAdmin: updatedUser.isAdmin,
            isOnline: updatedUser.isOnline,
            lastSeen: updatedUser.lastSeen,
            createdAt: updatedUser.createdAt
        });
    }
    else {
        throw new error_middleware_2.ApiError('User not found', 404);
    }
});
exports.deleteUser = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await user_model_1.default.findById(req.params.id);
    if (user) {
        if (user._id.toString() === req.user._id.toString()) {
            throw new error_middleware_2.ApiError('Cannot delete your own account', 400);
        }
        await user_model_1.default.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    }
    else {
        throw new error_middleware_2.ApiError('User not found', 404);
    }
});
exports.searchUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const keyword = req.query.keyword
        ? {
            $or: [
                { username: { $regex: req.query.keyword, $options: 'i' } },
                { email: { $regex: req.query.keyword, $options: 'i' } }
            ]
        }
        : {};
    const users = await user_model_1.default.find({
        ...keyword,
        _id: { $ne: req.user._id }
    }).select('-password');
    res.json(users);
});
exports.getOnlineUsers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const users = await user_model_1.default.find({ isOnline: true }).select('-password');
    res.json(users);
});

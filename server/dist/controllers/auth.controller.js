"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = exports.refreshAccessToken = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("../middleware/error.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_2 = require("../middleware/error.middleware");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};
const generateRefreshToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
};
exports.register = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { username, email, password } = req.body;
    const userExists = await user_model_1.default.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        if (userExists.email === email) {
            throw new error_middleware_2.ApiError('Email already in use', 400);
        }
        else {
            throw new error_middleware_2.ApiError('Username already taken', 400);
        }
    }
    const user = await user_model_1.default.create({
        username,
        email,
        password
    });
    if (user) {
        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            token
        });
    }
    else {
        throw new error_middleware_2.ApiError('Invalid user data', 400);
    }
});
exports.login = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await user_model_1.default.findOne({ email }).select('+password');
    if (user && (await user.comparePassword(password))) {
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();
        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            token
        });
    }
    else {
        throw new error_middleware_2.ApiError('Invalid email or password', 401);
    }
});
exports.logout = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (req.user) {
        const user = await user_model_1.default.findById(req.user._id);
        if (user) {
            user.isOnline = false;
            user.lastSeen = new Date();
            await user.save();
        }
    }
    res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
});
exports.refreshAccessToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new error_middleware_2.ApiError('No refresh token provided', 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateToken(decoded.id);
        res.json({ token: newAccessToken });
    }
    catch (error) {
        throw new error_middleware_2.ApiError('Invalid refresh token', 401);
    }
});
exports.getUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await user_model_1.default.findById(req.user._id);
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
exports.updateUserProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = await user_model_1.default.findById(req.user._id);
    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;
        user.bio = req.body.bio || user.bio;
        if (req.body.password) {
            user.password = req.body.password;
        }
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

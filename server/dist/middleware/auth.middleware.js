"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = await user_model_1.default.findById(decoded.id).select('-password');
            if (!req.user) {
                throw new error_middleware_1.ApiError('Not authorized, user not found', 401);
            }
            next();
        }
        catch (error) {
            console.error(error);
            throw new error_middleware_1.ApiError('Not authorized, token failed', 401);
        }
    }
    if (!token) {
        throw new error_middleware_1.ApiError('Not authorized, no token', 401);
    }
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    }
    else {
        throw new error_middleware_1.ApiError('Not authorized as an admin', 403);
    }
};
exports.admin = admin;
const refreshToken = async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        throw new error_middleware_1.ApiError('No refresh token provided', 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await user_model_1.default.findById(decoded.id);
        if (!user) {
            throw new error_middleware_1.ApiError('User not found', 404);
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
        res.locals.accessToken = accessToken;
        next();
    }
    catch (error) {
        console.error(error);
        throw new error_middleware_1.ApiError('Invalid refresh token', 401);
    }
};
exports.refreshToken = refreshToken;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/refresh-token', auth_controller_1.refreshAccessToken);
router.post('/logout', auth_middleware_1.protect, auth_controller_1.logout);
router.get('/profile', auth_middleware_1.protect, auth_controller_1.getUserProfile);
router.put('/profile', auth_middleware_1.protect, auth_controller_1.updateUserProfile);
exports.default = router;

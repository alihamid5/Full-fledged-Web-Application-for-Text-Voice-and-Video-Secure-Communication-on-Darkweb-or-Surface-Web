"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, chat_controller_1.createChat);
router.get('/', auth_middleware_1.protect, chat_controller_1.getUserChats);
router.get('/:id', auth_middleware_1.protect, chat_controller_1.getChatById);
router.put('/:id', auth_middleware_1.protect, chat_controller_1.updateChat);
router.post('/:id/users', auth_middleware_1.protect, chat_controller_1.addUserToChat);
router.delete('/:id/users/:userId', auth_middleware_1.protect, chat_controller_1.removeUserFromChat);
router.delete('/:id', auth_middleware_1.protect, chat_controller_1.deleteChat);
exports.default = router;

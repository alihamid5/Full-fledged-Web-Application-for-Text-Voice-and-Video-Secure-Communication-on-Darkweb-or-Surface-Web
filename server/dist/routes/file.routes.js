"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const file_controller_1 = require("../controllers/file.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/upload', auth_middleware_1.protect, file_controller_1.upload.single('file'), file_controller_1.uploadFile);
router.get('/', auth_middleware_1.protect, file_controller_1.getUserFiles);
router.get('/:id', file_controller_1.getFile);
router.delete('/:id', auth_middleware_1.protect, file_controller_1.deleteFile);
exports.default = router;

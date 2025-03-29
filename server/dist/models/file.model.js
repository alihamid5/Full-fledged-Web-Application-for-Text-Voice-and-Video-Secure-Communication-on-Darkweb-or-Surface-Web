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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var FileType;
(function (FileType) {
    FileType["IMAGE"] = "image";
    FileType["VIDEO"] = "video";
    FileType["AUDIO"] = "audio";
    FileType["DOCUMENT"] = "document";
    FileType["OTHER"] = "other";
})(FileType || (exports.FileType = FileType = {}));
const fileSchema = new mongoose_1.Schema({
    originalName: {
        type: String,
        required: [true, 'Original file name is required']
    },
    filename: {
        type: String,
        required: [true, 'File name is required']
    },
    path: {
        type: String,
        required: [true, 'File path is required']
    },
    mimetype: {
        type: String,
        required: [true, 'File MIME type is required']
    },
    size: {
        type: Number,
        required: [true, 'File size is required']
    },
    type: {
        type: String,
        enum: Object.values(FileType),
        required: [true, 'File type is required']
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required']
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
fileSchema.pre('save', function (next) {
    const mimetype = this.mimetype.toLowerCase();
    if (mimetype.startsWith('image/')) {
        this.type = FileType.IMAGE;
    }
    else if (mimetype.startsWith('video/')) {
        this.type = FileType.VIDEO;
    }
    else if (mimetype.startsWith('audio/')) {
        this.type = FileType.AUDIO;
    }
    else if (mimetype === 'application/pdf' ||
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'text/plain') {
        this.type = FileType.DOCUMENT;
    }
    else {
        this.type = FileType.OTHER;
    }
    next();
});
const File = mongoose_1.default.model('File', fileSchema);
exports.default = File;

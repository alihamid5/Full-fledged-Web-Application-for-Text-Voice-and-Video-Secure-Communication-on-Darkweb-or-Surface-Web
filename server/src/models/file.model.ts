import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

// File types enum
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other'
}

// File interface
export interface IFile extends Document {
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  type: FileType;
  uploadedBy: mongoose.Types.ObjectId | IUser;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// File schema
const fileSchema = new Schema<IFile>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required']
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Helper method to determine file type from mimetype
fileSchema.pre('save', function(next) {
  const mimetype = this.mimetype.toLowerCase();
  
  if (mimetype.startsWith('image/')) {
    this.type = FileType.IMAGE;
  } else if (mimetype.startsWith('video/')) {
    this.type = FileType.VIDEO;
  } else if (mimetype.startsWith('audio/')) {
    this.type = FileType.AUDIO;
  } else if (
    mimetype === 'application/pdf' ||
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'text/plain'
  ) {
    this.type = FileType.DOCUMENT;
  } else {
    this.type = FileType.OTHER;
  }
  
  next();
});

// Create and export File model
const File = mongoose.model<IFile>('File', fileSchema);
export default File; 
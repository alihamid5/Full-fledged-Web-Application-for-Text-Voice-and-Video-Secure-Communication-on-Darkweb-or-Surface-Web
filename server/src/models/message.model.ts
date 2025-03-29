import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { IChat } from './chat.model';

// Message types enum
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE_NOTE = 'voice_note'
}

// Message interface
export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId | IChat;
  sender: mongoose.Types.ObjectId | IUser;
  text: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: mongoose.Types.ObjectId | IMessage;
  readBy: (mongoose.Types.ObjectId | IUser)[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message schema
const messageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat is required']
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT
    },
    fileUrl: {
      type: String
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create and export Message model
const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message; 
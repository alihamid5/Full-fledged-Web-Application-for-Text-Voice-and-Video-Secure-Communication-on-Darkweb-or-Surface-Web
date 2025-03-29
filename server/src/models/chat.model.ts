import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

// Chat types enum
export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  GLOBAL = 'global'
}

// Chat interface
export interface IChat extends Document {
  name?: string;
  type: ChatType;
  members: mongoose.Types.ObjectId[] | IUser[];
  admins?: mongoose.Types.ObjectId[] | IUser[];
  lastMessage?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Chat schema
const chatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Chat name cannot exceed 50 characters']
    },
    type: {
      type: String,
      enum: Object.values(ChatType),
      required: [true, 'Chat type is required'],
      default: ChatType.PRIVATE
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'At least one member is required']
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    }
  },
  {
    timestamps: true
  }
);

// Create and export Chat model
const Chat = mongoose.model<IChat>('Chat', chatSchema);
export default Chat; 
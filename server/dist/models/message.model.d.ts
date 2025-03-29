import mongoose, { Document } from 'mongoose';
import { IUser } from './user.model';
import { IChat } from './chat.model';
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    FILE = "file",
    VOICE_NOTE = "voice_note"
}
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
declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage> & IMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Message;

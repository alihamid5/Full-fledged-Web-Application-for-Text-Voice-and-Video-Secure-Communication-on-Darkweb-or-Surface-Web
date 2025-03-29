import mongoose, { Document } from 'mongoose';
import { IUser } from './user.model';
export declare enum ChatType {
    PRIVATE = "private",
    GROUP = "group",
    GLOBAL = "global"
}
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
declare const Chat: mongoose.Model<IChat, {}, {}, {}, mongoose.Document<unknown, {}, IChat> & IChat & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Chat;

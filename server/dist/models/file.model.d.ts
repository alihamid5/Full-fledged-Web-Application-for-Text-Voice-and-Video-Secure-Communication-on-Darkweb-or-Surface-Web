import mongoose, { Document } from 'mongoose';
import { IUser } from './user.model';
export declare enum FileType {
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    OTHER = "other"
}
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
declare const File: mongoose.Model<IFile, {}, {}, {}, mongoose.Document<unknown, {}, IFile> & IFile & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default File;

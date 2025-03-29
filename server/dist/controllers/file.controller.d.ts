import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserFiles: (req: Request, res: Response, next: import("express").NextFunction) => void;

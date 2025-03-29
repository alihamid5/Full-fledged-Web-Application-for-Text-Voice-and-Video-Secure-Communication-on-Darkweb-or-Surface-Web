import { Request, Response } from 'express';
export declare const createChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserChats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getChatById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addUserToChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeUserFromChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteChat: (req: Request, res: Response, next: import("express").NextFunction) => void;

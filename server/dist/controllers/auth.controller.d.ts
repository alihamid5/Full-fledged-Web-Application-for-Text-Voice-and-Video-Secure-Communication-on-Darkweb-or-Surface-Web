import { Request, Response } from 'express';
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const refreshAccessToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateUserProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;

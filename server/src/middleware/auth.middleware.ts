import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';
import User from '../models/user.model';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to protect routes - verifies JWT token
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        throw new ApiError('Not authorized, user not found', 401);
      }

      next();
    } catch (error) {
      console.error(error);
      throw new ApiError('Not authorized, token failed', 401);
    }
  }

  if (!token) {
    throw new ApiError('Not authorized, no token', 401);
  }
};

/**
 * Middleware to check if user is admin
 */
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    throw new ApiError('Not authorized as an admin', 403);
  }
};

/**
 * Middleware to refresh tokens
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    throw new ApiError('No refresh token provided', 401);
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    // Set new access token in response
    res.locals.accessToken = accessToken;
    
    next();
  } catch (error) {
    console.error(error);
    throw new ApiError('Invalid refresh token', 401);
  }
}; 
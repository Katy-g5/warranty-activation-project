import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        isAdmin: boolean;
      };
    }
  }
}

// Interface for JWT payload
interface JwtPayload {
  id: number;
  username: string;
  isAdmin: boolean;
}

/**
 * Middleware to protect routes that require authentication
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, String(env.jwt.secret)) as JwtPayload;
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin
    };
    next();
  } catch (error) {
    console.log("Auth Error", error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware to protect routes that require admin privileges
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    return;
  }
  
  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user: any): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin
  };
  
  // Cast types to bypass TypeScript's strict type checking
  // @ts-ignore
  return jwt.sign(payload, String(env.jwt.secret), { expiresIn: env.jwt.expiresIn });
}; 
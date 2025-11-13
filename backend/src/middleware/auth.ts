import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Types } from "mongoose";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        _id: Types.ObjectId;
        name: string;
        email: string;
        password?: string;
        [key: string]: any;
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try multiple ways to get the Authorization header
    const authHeader = req.header("Authorization") || req.headers.authorization || req.get("Authorization");
    
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Remove "Bearer " prefix if present
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;

    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user object with id for compatibility
    // Convert Mongoose document to plain object and add id field
    const userObj = user.toObject();
    const userId = user._id as Types.ObjectId;
    
    req.user = {
      ...userObj,
      id: userId.toString(),
      _id: userId,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
};

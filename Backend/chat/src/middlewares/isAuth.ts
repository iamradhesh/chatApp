import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import type { JwtPayload } from "jsonwebtoken"; // ✅ type-only import
import jwt from "jsonwebtoken";
import type { Document } from "mongoose"; // if you're using mongoose types

// Define user interface
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

// Extend Request to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser | JwtPayload | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Please Login - No Auth Headers" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    console.log("Decoded JWT:", decoded);
    if (!decoded) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    // Attach decoded payload to req.user
    req.user = decoded as JwtPayload;

    console.log("Authenticated User ID:", req.user);

    next();
  } catch (error) {
    console.log("Error in isAuth middleware:", error);
    next(error);
  }
};

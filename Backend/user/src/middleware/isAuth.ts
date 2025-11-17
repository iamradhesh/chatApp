import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import { User } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // ✅ Safely extract token and tell TS it's definitely a string
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // ✅ Ensure JWT_SECRET is defined
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: "JWT secret not configured" });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token - Please log in again" });
  }
};

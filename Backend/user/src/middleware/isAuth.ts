import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import { User } from "../model/User.js"; // Import your User model
import jwt, { type JwtPayload } from "jsonwebtoken";
import TryCatch from "../config/TryCatch.js"; // Assuming you have this

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const token = authHeader.split(" ")[1];
        
        // Verify token and extract user information
        const decoded = jwt.verify(token, process.env.JWT_SECRET! as string) as JwtPayload;
        if (!decoded || !decoded.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Fetch the full user from database using the ID from token
        const user = await User.findById(decoded.id).select("-password"); // Exclude password
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        req.user = user; // Now req.user has the full user object
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token - Please log in again" });
        return;
    }
};
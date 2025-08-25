import type { Request, Response } from "express";
import redisClient from "../config/redisClient.js";
import TryCatch from "../config/TryCatch.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { User } from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

//Login User:-
export const loginUser = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body;

  const rateLimitKey = `otp:ratelimit:${email}`;
  const isRateLimited = await redisClient.exists(rateLimitKey);

  if (isRateLimited) {
    return res
      .status(429)
      .json({ message: "Please wait before requesting another OTP." });
  }

  await redisClient.set(rateLimitKey, "1");
  await redisClient.expire(rateLimitKey, 60);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.set(`otp:${email}`, otp);
  await redisClient.expire(`otp:${email}`, 300);

  console.log(`OTP for ${email}: ${otp}`);

  const message = {
    to: email,
    subject: "Your OTP Code",
    body: otp,
  };

  await publishToQueue("send-otp", message);

  return res.status(200).json({ message: "OTP sent successfully" });
});

//Verify OTP

export const verifyOtp = TryCatch(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  await redisClient.del(`otp:${email}`);

  let user = await User.findOne({ email });

  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ email, name });
  }

  if (!user || !user._id) {
    return res.status(500).json({ message: "User creation failed" });
  }

  const token = generateToken(user._id.toString());

  return res.status(200).json({
    message: "User verified and logged in successfully.",
    token,
    user,
  });
});

//fetch profile
export const myProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        // Add other fields you want to return
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
        // password is already excluded in isAuth middleware
      },
    });
  }
);

//update profile

export const updateProfile = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email } = req.body;
    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  }
);

// Get all users
export const getAllUsers = TryCatch(async (req: Request, res: Response) => {
  const users = await User.find();
  return res.status(200).json({
    success: true,
    users,
  });
});

//Get Single User:-

export const getUser = TryCatch(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({
    success: true,
    user,
  });
});

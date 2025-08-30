import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;   // ✅ fixes "unknown" _id issue
  name: string;
  email: string;
  createdAt?: Date;               // ✅ fixes "createdAt does not exist"
  updatedAt?: Date;               // ✅ fixes "updatedAt does not exist"
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

export const User = mongoose.model<IUser>("User", userSchema);

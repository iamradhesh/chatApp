import mongoose, { Document, Schema } from "mongoose";
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
}, { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);
export const User = mongoose.model("User", userSchema);
//# sourceMappingURL=User.js.map
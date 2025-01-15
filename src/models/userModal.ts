import mongoose, { Schema, Document } from "mongoose";

// Define the user interface
interface IUser extends Document {
  email: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  password?: string; // Optional initially
  phoneNumber?: string;
  verificationCode: string;
  gender: string;
  country: string;
  isVerified: boolean;
}

// Define the user schema
const userSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: { type: String },
    secondName: { type: String },
    lastName: { type: String },
    password: { type: String }, // Optional at the first stage
    gender: { type: String },
    country: { type: String },
    phoneNumber: { type: String },
    verificationCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create an index on the email field to improve lookup performance
userSchema.index({ email: 1 });

// Create and export the User model
const userModal = mongoose.model<IUser>("User", userSchema);
export default userModal;

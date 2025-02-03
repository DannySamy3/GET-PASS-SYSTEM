import { Request, Response } from "express";
import bcrypt from "bcrypt";
import userModal from "../models/userModal"; // Import your user model

// Controller to register user after verification
export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Changed the return type to `Promise<Response>`
  const { name, email, password, enteredVerificationCode } = req.body;

  if (!name || !email || !password || !enteredVerificationCode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Find the user by email
    const existingUser = await userModal.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Find the verification code sent to the user (You should have stored this in the user's document)
    const storedVerificationCode = await userModal
      .findOne({ email })
      .select("verificationCode isVerified");

    if (!storedVerificationCode) {
      return res
        .status(400)
        .json({ message: "No verification code found for this email" });
    }

    // Check if the verification code matches
    if (storedVerificationCode.verificationCode !== enteredVerificationCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Verify if the user is already verified
    if (storedVerificationCode.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Hash the user's password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document
    const newUser = new userModal({
      name,
      email,
      password: hashedPassword,
      verificationCode: "", // Clear the verification code after use
      isVerified: true, // Mark as verified
    });

    // Save the new user to the database
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user" });
  }
};

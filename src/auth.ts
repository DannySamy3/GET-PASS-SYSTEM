import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModal from "../src/models/userModal"; // Import your user model

// Controller to authenticate user (login)
export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  // Check if the email and password are provided
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Email and password are required " });
  }

  try {
    // Find the user by email (this returns the full user document)
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not verified" });
    }
    const userData = user.password as string;
    // Compare the provided password with the stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, userData);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (You can customize the payload and expiration)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your_secret_key", // Make sure to store the secret key in environment variables
      { expiresIn: "1h" }
    );

    // Send the user data along with the token as response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        firstName: user.firstName,
        secondName: user.secondName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      }, // Returning the full user document here
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Error logging in user" });
  }
};

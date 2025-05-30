import nodemailer from "nodemailer";
import { Request, Response } from "express";
import dotenv from "dotenv";
import userModal from "./models/userModal"; // Import your User model
import bcrypt from "bcrypt";

dotenv.config();

// Set up the transporter for Gmail using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Should be smtp.gmail.com
  port: parseInt(process.env.EMAIL_PORT || "587"), // Port should be 587 for TLS
  secure: false, // false for TLS (Port 587)
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App password
  },
});

// Generate a random 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Controller to send verification code to the email
export const sendVerificationCode = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email } = req.body; // Email sent in the request body

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const verificationCode = generateVerificationCode();

  try {
    // Check if the user already exists
    const existingUser = await userModal.findOne({ email });

    if (existingUser) {
      // Check if the user is fully registered
      if (existingUser.isVerified) {
        return res
          .status(400)
          .json({ message: "Email is already registered and verified." });
      }

      // If not fully registered, update the verification code
      existingUser.verificationCode = verificationCode;
      await existingUser.save();

      // Send email with the updated verification code
      const mailOptions = {
        from: process.env.EMAIL_FROM, // From email address
        to: email, // Recipient's email
        subject: "Your Verification Code", // Email subject
        text: `Your new verification code is: ${verificationCode}`, // Email body
      };

      await transporter.sendMail(mailOptions);
      console.log(`Updated verification code sent to ${email}`);
      return res
        .status(200)
        .json({ message: "Verification code sent successfully." });
    }

    // If the user does not exist, create a new user and send verification code
    const newUser = new userModal({
      email,
      verificationCode,
      isVerified: false, // Initially not verified
    });

    await newUser.save();

    const mailOptions = {
      from: process.env.EMAIL_FROM, // From email address
      to: email, // Recipient's email
      subject: "Your Verification Code", // Email subject
      text: `Your verification code is: ${verificationCode}`, // Email body
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${email}`);
    res.status(200).json({ message: "Verification code sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending verification code." });
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email, verificationCode } = req.body; // Extract email and verificationCode from the request body

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ message: "Email and verification code are required" });
  }

  try {
    // Find the user by email
    const user = await userModal.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the verification code matches the one in the database
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // If the verification code matches, mark the user as verified but not fully registered
    user.isVerified = false; // Keep isVerified false until finalization
    await user.save();

    // Return a success response
    res.status(200).json({
      message: "Verification code verified successfully",
      data: { email },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ message: "Error verifying token" });
  }
};

export const finalizeRegistration = async (
  req: Request,
  res: Response
): Promise<any> => {
  const {
    email,
    firstName,
    lastName,
    password,
    phoneNumber,
    gender,
    country,
    secondName,
  } = req.body;

  // Ensure all required fields are provided
  if (
    !email ||
    !firstName ||
    !secondName ||
    !lastName ||
    !password ||
    !phoneNumber ||
    !gender ||
    !country
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Find the user by email and check if they exist
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user is already fully registered (verified)
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "User is already fully registered." });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user with the remaining data
    user.firstName = firstName;
    user.secondName = secondName;
    user.lastName = lastName;
    user.password = hashedPassword; // Save the hashed password
    user.phoneNumber = phoneNumber;
    user.gender = gender;
    user.country = country;
    user.isVerified = true; // Mark the user as verified

    // Save the updated user data
    await user.save();

    res
      .status(200)
      .json({ message: "User registration completed successfully." });
  } catch (error) {
    console.error("Error finalizing registration:", error);
    res.status(500).json({ message: "Error finalizing registration." });
  }
};

export const resendVerificationCode = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email } = req.body; // Email sent in the request body

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const verificationCode = generateVerificationCode();

  try {
    // Check if the user exists
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email is already registered and verified." });
    }

    // Update the user's verification code
    user.verificationCode = verificationCode;
    await user.save();

    // Send the updated verification code via email
    const mailOptions = {
      from: process.env.EMAIL_FROM, // From email address
      to: email, // Recipient's email
      subject: "Resend Verification Code", // Email subject
      text: `Your verification code is: ${verificationCode}`, // Email body
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code resent to ${email}`);
    return res
      .status(200)
      .json({ message: "Verification code resent successfully." });
  } catch (error) {
    console.error("Error resending verification code:", error);
    res.status(500).json({ message: "Error resending verification code." });
  }
};

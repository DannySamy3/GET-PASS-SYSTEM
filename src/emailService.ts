import nodemailer from "nodemailer";
import { Request, Response } from "express";
import dotenv from "dotenv";

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

const generateVerificationCode = (): string => {
  // Generates a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body; // Assuming the email is sent in the request body

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const verificationCode = generateVerificationCode();

  const mailOptions = {
    from: process.env.EMAIL_FROM, // From email address
    to: email, // Recipient's email
    subject: "Your Verification Code", // Email subject
    text: `Your verification code is: ${verificationCode}`, // Email body
  };

  try {
    // Send email using the transporter
    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${email}`);
    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending verification code" });
  }
};

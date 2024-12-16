import nodemailer from "nodemailer";
import { config } from "dotenv";
import crypto from "crypto";
import { Request, Response } from "express";

config({ path: "./.env" });

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // Use TLS (set to true if you're using SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to generate a random 6-digit verification code
export const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Function to send verification code email
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
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${email}`);
    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending verification code" });
  }
};

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModal_1 = __importDefault(require("../models/userModal")); // Import your user model
// Controller to register user after verification
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Changed the return type to `Promise<Response>`
    const { name, email, password, enteredVerificationCode } = req.body;
    if (!name || !email || !password || !enteredVerificationCode) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        // Find the user by email
        const existingUser = yield userModal_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        // Find the verification code sent to the user (You should have stored this in the user's document)
        const storedVerificationCode = yield userModal_1.default.findOne({ email }).select("verificationCode isVerified");
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
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create a new user document
        const newUser = new userModal_1.default({
            name,
            email,
            password: hashedPassword,
            verificationCode: "", // Clear the verification code after use
            isVerified: true, // Mark as verified
        });
        // Save the new user to the database
        yield newUser.save();
        return res.status(201).json({ message: "User registered successfully" });
    }
    catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Error registering user" });
    }
});
exports.registerUser = registerUser;

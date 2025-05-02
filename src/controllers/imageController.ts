import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import studentModel from "../models/studentModel";
import imgurClient from "../config/imgur";

// Set up Multer storage and file size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit the file size to 50MB
  fileFilter: (
    req: Request,
    file: any,
    cb: (error: Error | null, acceptFile: boolean) => void
  ) => {
    const typedFile = file as { mimetype: string; size: number };
    // Validate file type
    if (!typedFile.mimetype || !typedFile.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }

    // Validate file size
    if (typedFile.size > 50 * 1024 * 1024) {
      return cb(new Error("File size exceeds 50MB limit!"), false);
    }

    cb(null, true);
  },
});

// Middleware for Multer to handle file uploads
export const handleImageUpload = upload.single("file");

interface ImgurErrorResponse {
  response?: {
    data: any;
  };
  message?: string;
}

// Helper function to upload file to Imgur and return the URL
export const uploadFileToImgur = async (
  file: any,
  fileName: string
): Promise<string> => {
  try {
    console.log("Starting file upload to Imgur...");
    const typedFile = file as { buffer: Buffer; mimetype: string };

    // Convert buffer to base64
    const base64Image = typedFile.buffer.toString("base64");
    console.log("Image converted to base64, size:", base64Image.length);

    const response = await imgurClient.upload({
      image: base64Image,
      type: "base64",
      title: fileName,
    });

    console.log("Imgur API Response:", response);

    if (!response.success) {
      console.error("Imgur upload failed:", response.data);
      throw new Error("Imgur upload failed");
    }

    console.log("Image uploaded successfully to Imgur:", response.data.link);
    return response.data.link;
  } catch (error: unknown) {
    console.error("Detailed error uploading to Imgur:", error);
    const imgurError = error as ImgurErrorResponse;
    if (imgurError.response?.data) {
      console.error("Imgur API Error Response:", imgurError.response.data);
    }
    throw new Error(
      `Failed to upload to Imgur: ${imgurError.message || "Unknown error"}`
    );
  }
};

// Controller to edit the image and update the student image URL in the DB
export const editImageController = async (
  req: Request & { file?: Express.Multer.File },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if the file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { studentId, previousImageUrl } = req.body;

    if (!studentId) {
      res.status(400).json({ error: "Student ID is required" });
      return;
    }

    // Upload the new image to Imgur
    const newFileName = `students/${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const imageUrl = await uploadFileToImgur(req.file, newFileName);

    // Update the student's image in the database with the new image URL
    await studentModel.findByIdAndUpdate(studentId, { image: imageUrl });

    // On successful upload and DB update, return the new image URL
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({
      error: "Internal server error",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

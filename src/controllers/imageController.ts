import { Request, Response, NextFunction } from "express";
import Storage from "@google-cloud/storage";
import path from "path";
import multer from "multer";
import studentModel from "../models/studentModel"; // Assuming this is your student model

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: "certain-mission-447922-c5",
});

const bucketName = "get-pass-app-student-photos-1740399843";
const bucket = storage.bucket(bucketName);

// Set up Multer storage and file size limits
const upload = multer({
  storage: multer.memoryStorage(), // Store the file in memory for easy upload to GCP
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit the file size to 50MB
  fileFilter: (
    req: Request,
    file: any,
    cb: (error: Error | null, acceptFile: boolean) => void
  ) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Middleware for Multer to handle file uploads
export const handleImageUpload = upload.single("file");

// Helper function to upload file to GCP and return the public URL
const uploadFileToGCP = (blobStream: any, bucket: any, blob: any) => {
  return new Promise((resolve, reject) => {
    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });
    blobStream.on("error", reject); // reject on error
  });
};

// Controller to edit the image and update the student image URL in the DB
export const editImageController = async (
  req: Request & { file?: Express.Multer.File }, // Extend the Request type to include the file
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

    // Extract filename from previous URL to delete the old image (if any)
    if (previousImageUrl) {
      const previousImagePath = previousImageUrl.split("/").slice(-1)[0];
      const previousFile = bucket.file(`students/${previousImagePath}`);

      // Try to delete the previous image
      try {
        await previousFile.delete();
      } catch (err) {
        console.warn("Warning: Could not delete previous image", err);
      }
    }

    // Upload the new image to GCP
    const newFileName = `students/${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const blob = bucket.file(newFileName);
    const blobStream = blob.createWriteStream({
      resumable: true,
      //@ts-ignore
      contentType: req.file.mimetype,
    });

    // Write the file buffer to the stream
    blobStream.end(req.file.buffer);

    // Await the result of the upload
    const publicUrl = await uploadFileToGCP(blobStream, bucket, blob);

    // Update the student's image in the database with the new image URL
    await studentModel.findByIdAndUpdate(studentId, { image: publicUrl });

    // On successful upload and DB update, return the new image URL
    res.status(200).json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import { Request, Response, NextFunction } from "express";
import Storage from "@google-cloud/storage";
import path from "path";
import multer from "multer";

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
    if (
      typeof file.mimetype === "string" &&
      !file.mimetype.startsWith("image/")
    ) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Middleware for Multer to handle file uploads
export const handleImageUpload = upload.single("file");

// Controller to edit the image (the file is already handled by Multer)
export const editImageController = async (
  req: Request & { file?: Express.Multer.File }, // Extend the Request type to include the file
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if the file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return; // exit the function after sending the response
    }

    const { previousImageUrl } = req.body;

    if (!previousImageUrl) {
      res.status(400).json({ error: "Previous image URL is required" });
      return; // exit the function after sending the response
    }

    // Extract filename from previous URL
    const previousImagePath = previousImageUrl.split("/").slice(-1)[0];
    const previousFile = bucket.file(`students/${previousImagePath}`);

    // Delete the previous image (if any)
    await previousFile.delete().catch((err) => {
      console.warn("Warning: Could not delete previous image", err);
    });

    // Upload the new image to GCP
    const newFileName = `students/${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const blob = bucket.file(newFileName);
    const blobStream = blob.createWriteStream({
      resumable: true,
      //@ts-ignore
      contentType: req.file.mimetype, // Now TypeScript knows 'mimetype' exists
    });

    blobStream.end(req.file.buffer);

    // On successful upload, return the image URL
    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.status(200).json({ imageUrl: publicUrl });
    });

    // Handle upload errors
    blobStream.on("error", (err: any) => {
      console.error("Upload Error:", err);
      res.status(500).json({ error: "Failed to upload new image" });
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

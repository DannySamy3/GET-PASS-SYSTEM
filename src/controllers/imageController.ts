import { Request, Response, NextFunction } from "express";
import Storage from "@google-cloud/storage";
import path from "path";

const storage = new Storage({
  projectId: "certain-mission-447922-c5",
});

const bucketName = "get-pass-app-student-photos-1740399843";
const bucket = storage.bucket(bucketName);

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const editImageController = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { previousImageUrl } = req.body;

    if (!previousImageUrl) {
      res.status(400).json({ error: "Previous image URL is required" });
      return;
    }

    // Extract filename from previous URL
    const previousImagePath = previousImageUrl.split("/").slice(-1)[0];
    const previousFile = bucket.file(`students/${previousImagePath}`);

    // Delete previous image
    await previousFile.delete().catch((err) => {
      console.warn("Warning: Could not delete previous image", err);
    });

    // Upload new image
    const newFileName = `students/${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const blob = bucket.file(newFileName);
    const blobStream = blob.createWriteStream({
      resumable: true,
      //@ts-ignore
      contentType: req.file.mimetype,
    });

    blobStream.end(req.file.buffer);

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.status(200).json({ imageUrl: publicUrl });
    });

    blobStream.on("error", (err: any) => {
      console.error("Upload Error:", err);
      res.status(500).json({ error: "Failed to upload new image" });
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

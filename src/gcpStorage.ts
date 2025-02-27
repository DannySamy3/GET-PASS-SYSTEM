import Storage from "@google-cloud/storage"; // Correct import syntax
import multer from "multer";
import path from "path";

// Use your correct project ID
const storage = new Storage({
  projectId: "certain-mission-447922-c5", // Correct project ID
  // No keyFilename needed if you use ADC (Application Default Credentials)
});

const bucketName = "get-pass-app-student-photos-1740399843";

// Set up multer storage to store the file in memory temporarily
const multerStorage = multer.memoryStorage();

export const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limit the file size to 10MB, can be adjusted
  },
  fileFilter: (
    _req: Express.Request,
    file: any,
    cb: (error: Error | null, acceptFile: boolean) => void
  ) => {
    // You can restrict the file types (e.g., only images)
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

export const uploadToGCS = async (file: any) => {
  try {
    const bucket = storage.bucket(bucketName); // Reference your GCS bucket
    const fileName = `students/${Date.now()}-${path.extname(
      file.originalname
    )}`; // Use a unique name for each file

    const blob = bucket.file(fileName); // Create the file object in the bucket
    const blobStream = blob.createWriteStream({
      resumable: true, // Non-resumable upload, typically sufficient for small files
      contentType: file.mimetype, // Ensure the correct MIME type is set
    });

    return new Promise<string>((resolve, reject) => {
      blobStream
        .on("finish", () => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // Generate the public URL for the uploaded file
          resolve(publicUrl); // Return the URL of the uploaded file
        })
        .on("error", (err: any) => {
          console.error("GCS Upload Error:", err);
          reject(new Error(`Failed to upload to GCS: ${err.message}`));
        })
        .end(file.buffer); // Upload the file's buffer to GCS
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error uploading to GCS: ${error.message}`);
    } else {
      throw new Error("Error uploading to GCS: Unknown error");
    }
  }
};

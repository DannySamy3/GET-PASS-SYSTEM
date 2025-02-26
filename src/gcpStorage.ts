import Storage from "@google-cloud/storage";
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
});

export const uploadToGCS = async (file: Express.Multer.File) => {
  const bucket = storage.bucket(bucketName); // Reference your GCS bucket
  const blob = bucket.file(
    `students/${Date.now()}-${path.extname(file.originalname)}` // Use a unique name for each file
  );
  const blobStream = blob.createWriteStream({
    resumable: false, // Non-resumable upload, typically sufficient for small files
  });

  return new Promise((resolve, reject) => {
    blobStream
      .on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // Generate the public URL for the uploaded file
        resolve(publicUrl); // Return the URL of the uploaded file
      })
      .on("error", (err: any) => {
        reject(err); // Reject the promise if an error occurs during the upload
      })
      .end(file.buffer); // Upload the file's buffer to GCS
  });
};

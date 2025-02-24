import Storage from "@google-cloud/storage";
import multer from "multer";
import path from "path";

const storage = new Storage({
  projectId: "your-gcp-project-id",
  // No keyFilename needed for ADC
});

const bucketName = "get-pass-app-student-photos-1740399843";

const multerStorage = multer.memoryStorage();

export const upload = multer({
  storage: multerStorage,
});

export const uploadToGCS = async (file: Express.Multer.File) => {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(
    `students/${Date.now()}-${path.extname(file.originalname)}`
  );
  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    blobStream
      .on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      })
      .on("error", (err: any) => {
        reject(err);
      })
      .end(file.buffer);
  });
};

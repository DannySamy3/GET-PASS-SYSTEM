import * as admin from "firebase-admin";
import path from "path";

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require("./get-pass-f74c4-firebase-adminsdk-fbsvc-9d2fe00c74.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "get-pass-f74c4.appspot.com",
    });

    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

export const bucket = admin.storage().bucket();
export default admin;

import ImgurClient from "imgur";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.IMGUR_CLIENT_ID) {
  throw new Error("IMGUR_CLIENT_ID is not defined in environment variables");
}

// Initialize Imgur client
const client = new ImgurClient({
  clientId: process.env.IMGUR_CLIENT_ID,
  clientSecret: process.env.IMGUR_CLIENT_SECRET,
});

console.log(
  "Imgur client initialized with client ID:",
  process.env.IMGUR_CLIENT_ID
);

export default client;

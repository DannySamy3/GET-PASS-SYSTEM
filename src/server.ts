import app from "./app";
import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: "./.env" });

// const DB_LOCAL = process.env.DATABASE_LOCAL as string;
// const DB_PASSWORD = process.env.PASSWORD as string;

// const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

// mongoose.connect(DB).then(() => {
//   // console.log("DB connection successful!");
// });

// const port = process.env.PORT;
// const server = app.listen(port, () => {
//   console.log(`App is running at ${port}`);
// });

// Get MongoDB connection string from the .env file
const DB = process.env.DATABASE_LOCAL as string;

const port = process.env.PORT || 4000; // Default port if not specified

// Connect to MongoDB Atlas
mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err: any) => {
    console.error("DB connection error: ", err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Start the server
const server = app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});

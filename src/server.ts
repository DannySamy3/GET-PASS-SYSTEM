import app from "./app";
import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: "./.env" });

const DB_LOCAL = process.env.DATABASE_LOCAL as string;
const DB_PASSWORD = process.env.PASSWORD as string;

const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

mongoose.connect(DB).then(() => {
  // console.log("DB connection successful!");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running at ${port}`);
});

import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";
import sponsorRoute from "./routes/sponsorRoute";
import scanRoute from "./routes/scanRoute";
import authRoute from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/getPass/students", studentRoute);
app.use("/getPass/classes", classRoutes);
app.use("/getPass/sponsors", sponsorRoute);
app.use("/getPass/scans", scanRoute);
app.use("/getPass/auth", authRoute);

export default app;

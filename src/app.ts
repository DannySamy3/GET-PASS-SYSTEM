import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";
import sponsorRoute from "./routes/sponsorRoute";
import scanRoute from "./routes/scanRoute";
import authRoute from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";
import imageRoutes from "./routes/imageRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import cors from "cors";
import dotenv from "dotenv";

import errorHandler from "./middleware/errorHandler";
import bodyParser from "body-parser";

dotenv.config();

const app = express();

// Set up body parsing with the required size limits
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.use(cors());

// Development logging with morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Define routes
app.use("/getPass/students", studentRoute);
app.use("/getPass/classes", classRoutes);
app.use("/getPass/sponsors", sponsorRoute);
app.use("/getPass/scans", scanRoute);
app.use("/getPass/auth", authRoute);
app.use("/getPass/images", imageRoutes);
app.use("/getPass/sessions", sessionRoutes);
app.use("/students", studentRoute);

// Add error handler middleware after all routes
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    errorHandler(err, req, res, next);
  }
);

export default app;

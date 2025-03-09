import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";
import sponsorRoute from "./routes/sponsorRoute";
import scanRoute from "./routes/scanRoute";
import authRoute from "./routes/authRoutes";
import classRoutes from "./routes/classRoutes";
import imageRoutes from "./routes/imageRoutes";
import cors from "cors";
import dotenv from "dotenv";
import studentController from "./controllers/studentController";
import errorHandler from "./middleware/errorHandler";
import bodyParser from "body-parser";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/getPass/students", studentRoute);
app.use("/getPass/classes", classRoutes);
app.use("/getPass/sponsors", sponsorRoute);
app.use("/getPass/scans", scanRoute);
app.use("/getPass/auth", authRoute);
app.use("/getPass/images", imageRoutes);
app.use("/students", studentController);

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

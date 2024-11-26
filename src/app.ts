import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/getPass", studentRoute);

export default app;

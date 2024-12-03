import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";
import sponsorRoute from "./routes/sponsorRoute";
import scanRoute from "./routes/scanRoute";

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/getPass/students", studentRoute);
app.use("/getPass/sponsors", sponsorRoute);
app.use("/getPass/scans", scanRoute);

export default app;

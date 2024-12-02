import express from "express";
import morgan from "morgan";
import studentRoute from "./routes/studentRoute";
import sponsorRoute from "./routes/sponsorRoute";

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/getPass/students", studentRoute);
app.use("/getPass/sponsors", sponsorRoute);

export default app;

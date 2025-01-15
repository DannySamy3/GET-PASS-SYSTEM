"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const studentRoute_1 = __importDefault(require("./routes/studentRoute"));
const sponsorRoute_1 = __importDefault(require("./routes/sponsorRoute"));
const scanRoute_1 = __importDefault(require("./routes/scanRoute"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const classRoutes_1 = __importDefault(require("./routes/classRoutes"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
app.use("/getPass/students", studentRoute_1.default);
app.use("/getPass/classes", classRoutes_1.default);
app.use("/getPass/sponsors", sponsorRoute_1.default);
app.use("/getPass/scans", scanRoute_1.default);
app.use("/getPass/auth", authRoutes_1.default);
exports.default = app;

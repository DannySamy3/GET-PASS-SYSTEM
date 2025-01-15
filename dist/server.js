"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: "./.env" });
const DB_LOCAL = process.env.DATABASE_LOCAL;
const DB_PASSWORD = process.env.PASSWORD;
const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);
mongoose_1.default.connect(DB).then(() => {
    // console.log("DB connection successful!");
});
const port = process.env.PORT || 3000;
const server = app_1.default.listen(port, () => {
    console.log(`App is running at ${port}`);
});

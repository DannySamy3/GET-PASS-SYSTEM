"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScans = exports.addScan = void 0;
const studentModel_1 = __importDefault(require("../models/studentModel"));
const scanModel_1 = __importDefault(require("../models/scanModel"));
const studentModel_2 = require("../models/studentModel");
const classModel_1 = __importDefault(require("../models/classModel"));
var ScanStatus;
(function (ScanStatus) {
    ScanStatus["COMPLETED"] = "COMPLETED";
    ScanStatus["PENDING"] = "PENDING";
    ScanStatus["FAILED"] = "FAILED";
})(ScanStatus || (ScanStatus = {}));
const addScan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            status: "fail",
            message: "Missing required field: id",
        });
        return;
    }
    try {
        const student = yield studentModel_1.default.findOne({ _id: id });
        if (!student) {
            res.status(404).json({
                status: "fail",
                message: "Student not found",
            });
            return;
        }
        let scanStatus = ScanStatus.FAILED;
        if (student.status === studentModel_2.RegistrationStatus.REGISTERED) {
            scanStatus = ScanStatus.COMPLETED;
        }
        else if (student.status === studentModel_2.RegistrationStatus.UNREGISTERED) {
            scanStatus = ScanStatus.FAILED;
        }
        const newScan = yield scanModel_1.default.create({
            student: id,
            status: scanStatus,
            date: Date.now(),
        });
        res.status(201).json({
            status: "success",
            data: {
                student: {
                    status: student.status,
                },
                scan: newScan,
            },
        });
    }
    catch (error) {
        console.error("Error in adding scan:", error);
        const newScan = yield scanModel_1.default.create({
            student: id,
            status: ScanStatus.PENDING,
            date: Date.now(),
        });
        res.status(500).json({
            status: "fail",
            message: "Network error or internal server error. Scan status is PENDING.",
        });
    }
});
exports.addScan = addScan;
const getScans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, date, month } = req.query;
        const criteria = {};
        if (status) {
            criteria.status = status;
        }
        let scans;
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({
                    message: "Invalid date format. Please provide a valid date string.",
                });
                return;
            }
            const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
            criteria.date = { $gte: startOfDay, $lte: endOfDay };
            scans = yield scanModel_1.default.find(criteria).populate("student").lean();
        }
        else if (month) {
            const parsedMonth = parseInt(month, 10);
            if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
                res.status(400).json({
                    message: "Invalid month. Please provide a valid month (1-12).",
                });
                return;
            }
            const currentYear = new Date().getFullYear();
            const startOfMonth = new Date(currentYear, parsedMonth - 1, 1);
            const endOfMonth = new Date(currentYear, parsedMonth, 0, 23, 59, 59, 999);
            criteria.date = { $gte: startOfMonth, $lte: endOfMonth };
            scans = yield scanModel_1.default.find(criteria).populate("student").lean();
        }
        else {
            scans = yield scanModel_1.default.find(criteria).populate("student").lean();
        }
        const totalScans = (yield scanModel_1.default.find()).length;
        const completedScans = scans.filter((scan) => scan.status === "COMPLETED").length;
        const failedScans = scans.filter((scan) => scan.status === "FAILED").length;
        const classCount = {};
        scans.forEach((scan) => {
            const status = scan.status;
            if ((status === "COMPLETED" || status === "FAILED") && scan.student) {
                const classId = scan.student.classId.toString();
                if (classId) {
                    classCount[classId] = (classCount[classId] || 0) + 1;
                }
            }
        });
        const classIds = Object.keys(classCount);
        const classes = yield classModel_1.default
            .find({
            _id: { $in: classIds.map((id) => id) },
        })
            .lean();
        const classNames = {};
        classes.forEach((cls) => {
            classNames[cls._id.toString()] = cls.classInitial;
        });
        const classCountWithNames = {};
        for (const classId in classCount) {
            if (classNames[classId]) {
                classCountWithNames[classNames[classId]] = classCount[classId];
            }
        }
        let responseData = {};
        if (!req.query || Object.keys(req.query).length === 0) {
            responseData = { totalScans, scans };
        }
        else if (req.query.date || req.query.month) {
            responseData = {
                totalScans,
                scans,
                classCount: classCountWithNames,
                granted: completedScans,
                denied: failedScans,
            };
        }
        else {
            responseData = {
                totalScans,
                classCount: classCountWithNames,
                statusCount: status === "COMPLETED" ? completedScans : failedScans,
                scans, // Moved scans property here to avoid duplication
            };
        }
        res.status(200).json(responseData);
    }
    catch (error) {
        if (error instanceof Error) {
            res
                .status(500)
                .json({ message: `Error fetching scans: ${error.message}` });
        }
        else {
            res
                .status(500)
                .json({ message: "An unknown error occurred while fetching scans." });
        }
    }
});
exports.getScans = getScans;

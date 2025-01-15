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
exports.deleteClass = exports.updateClass = exports.getClassById = exports.getAllClasses = exports.getAllClassInitials = exports.createClass = void 0;
const studentModel_1 = __importDefault(require("../models/studentModel")); // Import the Student model
const classModel_1 = __importDefault(require("../models/classModel"));
const createClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, duration, classInitial } = req.body;
        if (!name || !duration || !classInitial) {
            res.status(400).json({
                status: "fail",
                message: "Name, duration, or classInitial is missing",
            });
            return;
        }
        const newClass = yield classModel_1.default.create({ name, duration, classInitial });
        res.status(201).json({
            status: "success",
            data: { class: newClass },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            // Handle specific errors
            if (error.name === "ValidationError") {
                res.status(400).json({
                    status: "fail",
                    message: error.message,
                });
                return;
            }
            // Handle other known errors
            res.status(500).json({
                status: "fail",
                message: error.message,
            });
            return;
        }
        else {
            // Handle unknown errors
            res.status(500).json({
                status: "fail",
                message: "Internal server error",
            });
            return;
        }
    }
});
exports.createClass = createClass;
const getAllClassInitials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classInitials = yield classModel_1.default.find({}, "classInitial"); // Fetch only the "classInitial" field
        res.status(200).json({
            success: true,
            data: classInitials.map((cls) => cls.classInitial), // Return only initials in an array
        });
    }
    catch (error) {
        console.error("Error fetching class initials:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch class initials",
        });
    }
});
exports.getAllClassInitials = getAllClassInitials;
const getAllClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classes = yield classModel_1.default.find();
        res.status(200).json({
            success: true,
            classes,
        });
    }
    catch (error) {
        console.error("Error fetching classes", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch classes",
        });
    }
});
exports.getAllClasses = getAllClasses;
const getClassById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const classDoc = yield classModel_1.default.findById(id);
        if (!classDoc) {
            res.status(404).json({
                status: "fail",
                message: "Class not found",
            });
            return;
        }
        res.status(200).json({
            status: "success",
            data: classDoc,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.getClassById = getClassById;
const updateClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, duration, classInitial } = req.body;
        // Validate input fields
        if (!name && !duration && !classInitial) {
            res.status(400).json({ message: "No fields provided to update" });
            return;
        }
        // Fetch the current class
        const existingClass = yield classModel_1.default.findById(id);
        if (!existingClass) {
            res.status(404).json({ message: "Class not found" });
            return;
        }
        // Check if input fields are the same as existing values
        if (name === existingClass.name &&
            duration === existingClass.duration &&
            classInitial === existingClass.classInitial) {
            res
                .status(400)
                .json({ message: "No changes detected in the input fields" });
            return;
        }
        // Update the class
        const updatedClass = yield classModel_1.default.findByIdAndUpdate(id, { name, duration, classInitial }, { new: true, runValidators: true });
        res
            .status(200)
            .json({ message: "Class updated successfully", class: updatedClass });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update class", error });
    }
});
exports.updateClass = updateClass;
const deleteClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if any students are linked to the class
        const linkedStudents = yield studentModel_1.default.find({ classId: id });
        if (linkedStudents.length > 0) {
            res.status(400).json({
                message: "Cannot delete class. There are students linked to this class.",
            });
            return;
        }
        // Proceed to delete the class if no students are linked
        const deletedClass = yield classModel_1.default.findByIdAndDelete(id);
        if (!deletedClass) {
            res.status(404).json({ message: "Class not found" });
            return;
        }
        res.status(200).json({ message: "Class deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete class", error });
    }
});
exports.deleteClass = deleteClass;

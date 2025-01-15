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
exports.editStudent = exports.getClassRegistrationStats = exports.getRegisteredStudents = exports.updateStudentSponsor = exports.getStudentById = exports.createStudent = exports.getStudents = void 0;
const studentModel_1 = __importDefault(require("../models/studentModel"));
const classModel_1 = __importDefault(require("../models/classModel"));
const sponsorModel_1 = __importDefault(require("../models/sponsorModel"));
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = {};
        if (req.query.name) {
            const name = req.query.name;
            const nameRegex = new RegExp(name, "i"); // 'i' makes the regex case-insensitive
            query.$or = [
                { firstName: nameRegex },
                { secondName: nameRegex },
                { lastName: nameRegex },
            ];
        }
        if (req.query.regNo) {
            query.regNo = req.query.regNo;
        }
        // if (req.query.class) {
        //   const className = req.query.class as string;
        //   const classDoc = await classModel.findOne({ name: className });
        //   if (classDoc) {
        //     query.class = classDoc._id;
        //   } else {
        //     res.status(404).json({
        //       status: "fail",
        //       message: "Class not found",
        //     });
        //     return;
        //   }
        // }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const students = yield studentModel_1.default.find(query).skip(skip).limit(limit);
        const total = yield studentModel_1.default.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            status: "success",
            data: {
                students,
                total,
                totalPages,
                currentPage: page,
            },
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
exports.getStudents = getStudents;
const createStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, secondName, lastName, email, phoneNumber, nationality, classId, enrollmentYear, sponsorId, gender, } = req.body;
    if (!firstName ||
        !secondName ||
        !lastName ||
        !email ||
        !phoneNumber ||
        !nationality ||
        !classId ||
        !enrollmentYear ||
        !sponsorId ||
        !gender) {
        res.status(400).json({
            status: "fail",
            message: "Missing input fields",
        });
        return;
    }
    try {
        const getSelectedClass = yield classModel_1.default.findById(classId);
        if (!getSelectedClass) {
            res.status(400).json({
                status: "fail",
                message: "The selected class doesn't exist",
            });
            return;
        }
        const getSponsor = yield sponsorModel_1.default.findById(sponsorId);
        if (!getSponsor) {
            res.status(400).json({
                status: "fail",
                message: "The selected sponsor doesn't exist",
            });
            return;
        }
        const status = getSponsor.name === "Metfund" ? "REGISTERED" : "NOT REGISTERED";
        const student = new studentModel_1.default({
            firstName,
            secondName,
            lastName,
            email,
            phoneNumber,
            nationality,
            classId,
            sponsor: sponsorId,
            status,
            gender,
            enrollmentYear,
        });
        const savedStudent = yield student.save();
        res.status(201).json({
            status: "success",
            data: { student: savedStudent },
        });
    }
    catch (error) {
        console.error("Error while creating student:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.createStudent = createStudent;
const getStudentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = req.params.id;
        const student = yield studentModel_1.default.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.status(200).json(student);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getStudentById = getStudentById;
const updateStudentSponsor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, sponsorId } = req.body;
    // Validate inputs
    if (!studentId || !sponsorId) {
        res.status(400).json({
            status: "fail",
            message: "Missing required fields: studentId or sponsorId",
        });
        return;
    }
    try {
        // Check if student exists
        const student = yield studentModel_1.default.findById(studentId);
        if (!student) {
            res.status(404).json({
                status: "fail",
                message: "Student not found",
            });
            return;
        }
        // Check if sponsor exists
        const sponsor = yield sponsorModel_1.default.findById(sponsorId);
        if (!sponsor) {
            res.status(404).json({
                status: "fail",
                message: "Sponsor not found",
            });
            return;
        }
        // Update the student's sponsor
        student.sponsor = sponsorId;
        yield student.save();
        res.status(200).json({
            status: "success",
            message: "Sponsor updated successfully",
            data: {
                student: {
                    id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    currentSponsor: sponsor.name,
                },
            },
        });
    }
    catch (error) {
        console.error("Error updating student sponsor:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.updateStudentSponsor = updateStudentSponsor;
const getRegisteredStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const students = yield studentModel_1.default.find({ status: "REGISTERED" });
        if (students.length === 0) {
            res.status(404).json({
                status: "fail",
                message: "No registered students found",
            });
            return;
        }
        res.status(200).json({
            status: "success",
            data: students,
            studentNumber: students.length,
        });
    }
    catch (error) {
        console.error("Error retrieving registered students:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.getRegisteredStudents = getRegisteredStudents;
const getClassRegistrationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all classes with their initials (only classInitial, not the full class details)
        const classes = yield classModel_1.default.find({}, { classInitial: 1 });
        // Initialize response structure
        const stats = {
            registered: {},
            unregistered: {},
            classInitials: classes.map((classDoc) => classDoc.classInitial), // Populate with only class initials
        };
        // Iterate through classes and calculate stats
        for (const classDoc of classes) {
            // We directly use classDoc._id which is already an ObjectId
            const classId = classDoc._id;
            const classInitial = classDoc.classInitial;
            // Count registered students
            const registeredCount = yield studentModel_1.default.countDocuments({
                classId: classId, // No need to call toString() here
                status: "REGISTERED",
            });
            // Count unregistered students
            const unregisteredCount = yield studentModel_1.default.countDocuments({
                classId: classId, // No need to call toString() here
                status: "NOT REGISTERED",
            });
            // Populate stats
            stats.registered[classInitial] = registeredCount;
            stats.unregistered[classInitial] = unregisteredCount;
        }
        // Send response
        res.status(200).json(stats);
    }
    catch (error) {
        console.error("Error fetching class registration stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getClassRegistrationStats = getClassRegistrationStats;
const editStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // Use 'id' instead of '_id' to match the route parameter
        const updates = req.body;
        // Validate studentId
        if (!id) {
            res.status(400).json({
                message: "Student ID is required.",
            });
            return;
        }
        // Find and update student
        const updatedStudent = yield studentModel_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });
        if (!updatedStudent) {
            res.status(404).json({
                message: "Student not found.",
            });
            return;
        }
        res.status(200).json({
            message: "Student updated successfully.",
            student: updatedStudent,
        });
    }
    catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
});
exports.editStudent = editStudent;

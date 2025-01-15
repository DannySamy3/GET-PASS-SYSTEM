"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.RegistrationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const counterModel_1 = __importDefault(require("./counterModel"));
const classModel_1 = __importDefault(require("./classModel"));
// Enum for registration status
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["REGISTERED"] = "REGISTERED";
    RegistrationStatus["UNREGISTERED"] = "NOT REGISTERED";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
// Enum for gender
var Gender;
(function (Gender) {
    Gender["Male"] = "Male";
    Gender["Female"] = "Female";
})(Gender || (Gender = {}));
// Student Schema
const studentSchema = new mongoose_1.Schema({
    studentNumber: { type: Number, unique: true },
    firstName: { type: String, required: true },
    secondName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    nationality: { type: String, required: true },
    classId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "classModel", // Reference to Class model
        required: true,
    },
    sponsor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "sponsorModel", // Reference to Sponsor model
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(RegistrationStatus),
        required: true,
    },
    gender: {
        type: String,
        enum: Object.values(Gender),
        required: true,
    },
    enrollmentYear: { type: Number, required: true },
    image: { type: String },
    regNo: { type: String, unique: true, required: false },
}, { timestamps: true });
// Pre-save hook to generate regNo and studentNumber
studentSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Saving student document...");
        // Log the current state of 'this'
        console.log("Pre-save hook triggered for student:", this);
        try {
            if (this.isNew) {
                // Increment studentNumber from counter
                console.log("Incrementing student number...");
                const counter = yield counterModel_1.default.findOneAndUpdate({ modelName: "studentNumber" }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
                if (!counter) {
                    console.error("Failed to increment student number. Counter not found.");
                    return next(new Error("Failed to increment student number"));
                }
                this.studentNumber = counter.sequenceValue;
                console.log("Generated studentNumber:", this.studentNumber);
                // Resolve classInitial and generate regNo
                console.log("Fetching class data for classId:", this.classId);
                const classDoc = yield classModel_1.default.findById(this.classId);
                // Debugging: check if classDoc is found
                if (!classDoc) {
                    console.error("Class not found for classId:", this.classId);
                    return next(new Error("Invalid classId: Class not found."));
                }
                // Log class information for debugging
                console.log("Class found:", classDoc);
                // Generate regNo if class is found
                this.regNo = `${classDoc.classInitial}/${this.enrollmentYear
                    .toString()
                    .slice(-2)}/${this.studentNumber}`;
                console.log("Generated regNo:", this.regNo);
            }
            // Proceed to save the document
            next();
        }
        catch (error) {
            console.error("Error in pre-save hook:", error);
            if (error instanceof Error) {
                next(error); // If it's an instance of Error, pass it to next()
            }
            else {
                next(new Error("An unknown error occurred.")); // Handle unknown error types
            }
        }
    });
});
// Model definition
const studentModel = mongoose_1.default.model("studentModel", studentSchema);
exports.default = studentModel;

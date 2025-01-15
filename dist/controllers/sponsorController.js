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
exports.getSponsorById = exports.getAllSponsors = exports.editSponsor = exports.deleteSponsor = exports.createSponsor = void 0;
const sponsorModel_1 = __importDefault(require("../models/sponsorModel"));
const studentModel_1 = __importDefault(require("../models/studentModel"));
const createSponsor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, Amount } = req.body;
    if (!name || !Amount) {
        res.status(400).json({
            status: "fail",
            message: "Missing required fields: name or Amount",
        });
        return;
    }
    try {
        const newSponsor = new sponsorModel_1.default({
            name,
            Amount,
        });
        const savedSponsor = yield newSponsor.save();
        res.status(201).json({
            status: "success",
            message: "Sponsor created successfully",
            data: {
                sponsor: savedSponsor,
            },
        });
    }
    catch (error) {
        console.error("Error creating sponsor:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.createSponsor = createSponsor;
const deleteSponsor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            status: "fail",
            message: "Missing required parameter: id",
        });
        return;
    }
    try {
        // Check if the sponsor exists
        const sponsorToDelete = yield sponsorModel_1.default.findById(id);
        if (!sponsorToDelete) {
            res.status(404).json({
                status: "fail",
                message: "Sponsor not found",
            });
            return;
        }
        // Prevent deleting the "Private" sponsor
        // if (sponsorToDelete.name === "Private") {
        //   res.status(400).json({
        //     status: "fail",
        //     message: 'The "Private" sponsor cannot be deleted',
        //   });
        //   return;
        // }
        // Check if students are linked to the sponsor
        const linkedStudents = yield studentModel_1.default.find({ sponsor: id });
        if (linkedStudents.length > 0) {
            res.status(400).json({
                status: "fail",
                message: `Cannot delete sponsor. ${linkedStudents.length} student(s) are linked to this sponsor.`,
            });
            return;
        }
        // Delete the sponsor
        const deletedSponsor = yield sponsorModel_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: "success",
            message: "Sponsor deleted successfully",
            data: {
                sponsor: deletedSponsor,
            },
        });
    }
    catch (error) {
        console.error("Error deleting sponsor:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.deleteSponsor = deleteSponsor;
const editSponsor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, Amount } = req.body;
    // Validate input
    if (!name && !Amount) {
        res.status(400).json({
            status: "fail",
            message: "At least one field (name or Amount) must be provided for updating",
        });
        return;
    }
    try {
        const result = yield sponsorModel_1.default.updateOne({ _id: id }, { $set: { name, Amount } });
        if (result.modifiedCount === 0) {
            res.status(404).json({
                status: "fail",
                message: "Sponsor not found or no changes made",
            });
            return;
        }
        res.status(200).json({
            status: "success",
            message: "Sponsor updated successfully",
            data: {
                id,
                name,
                Amount,
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
exports.editSponsor = editSponsor;
const getAllSponsors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sponsors = yield sponsorModel_1.default.find();
        if (sponsors.length === 0) {
            res.status(404).json({
                status: "fail",
                message: "No sponsors found",
            });
            return;
        }
        res.status(200).json({
            status: "success",
            data: sponsors,
        });
    }
    catch (error) {
        console.error("Error fetching sponsors:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            status: "fail",
            message: errorMessage,
        });
    }
});
exports.getAllSponsors = getAllSponsors;
const getSponsorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const sponsor = yield sponsorModel_1.default.findById(id);
        if (!sponsor) {
            res.status(404).json({
                status: "fail",
                message: "Sponsor not found",
            });
            return;
        }
        res.status(200).json({
            status: "success",
            data: sponsor,
        });
    }
    catch (error) {
        console.error("Error fetching sponsor by ID:", error);
        res.status(500).json({
            status: "fail",
            message: "Internal server error",
        });
    }
});
exports.getSponsorById = getSponsorById;

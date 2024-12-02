import { Request, Response } from "express";
import sponsorModel from "../models/sponsorModel";
import studentModel from "../models/studentModel";

export const createSponsor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, Amount } = req.body;

  if (!name || !Amount) {
    res.status(400).json({
      status: "fail",
      message: "Missing required fields: name or Amount",
    });
    return;
  }

  try {
    const newSponsor = new sponsorModel({
      name,
      Amount,
    });

    const savedSponsor = await newSponsor.save();

    res.status(201).json({
      status: "success",
      message: "Sponsor created successfully",
      data: {
        sponsor: savedSponsor,
      },
    });
  } catch (error) {
    console.error("Error creating sponsor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};
export const deleteSponsor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      status: "fail",
      message: "Missing required parameter: id",
    });
    return;
  }

  try {
    // Check if the original sponsor exists
    const sponsor = await sponsorModel.findById(id);
    if (!sponsor) {
      res.status(404).json({
        status: "fail",
        message: "Sponsor not found",
      });
      return;
    }

    // Automatically fetch a 'private' sponsor (assumed criteria here)
    const privateSponsor = await sponsorModel.findOne({
      name: "Private",
    });
    if (!privateSponsor) {
      res.status(404).json({
        status: "fail",
        message: "Private sponsor not found",
      });
      return;
    }

    // Update students that were referencing the original sponsor
    const updatedStudents = await studentModel.updateMany(
      { sponsor: id },
      { $set: { sponsor: privateSponsor._id } }
    );

    // Check if any students were updated
    if (updatedStudents.modifiedCount === 0) {
      res.status(400).json({
        status: "fail",
        message: "No students found with the specified sponsor",
      });
      return;
    }

    // Delete the sponsor
    const deletedSponsor = await sponsorModel.findByIdAndDelete(id);

    if (!deletedSponsor) {
      res.status(404).json({
        status: "fail",
        message: "Sponsor not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message:
        "Sponsor deleted and students updated with private sponsor successfully",
      data: {
        sponsor: deletedSponsor,
        updatedStudents: updatedStudents.modifiedCount, // Number of students updated
      },
    });
  } catch (error) {
    console.error("Error deleting sponsor and updating students:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

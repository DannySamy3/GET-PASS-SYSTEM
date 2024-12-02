import { Request, Response } from "express";
import sponsorModel from "../models/sponsorModel";
import studentModel from "../models/studentModel";
import { UpdateResult } from "mongoose";

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
    const sponsor = await sponsorModel.findById(id);
    if (!sponsor) {
      res.status(404).json({
        status: "fail",
        message: "Sponsor not found",
      });
      return;
    }

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

    const updatedStudents = await studentModel.updateMany(
      { sponsor: id },
      { $set: { sponsor: privateSponsor._id } }
    );

    // // Check if any students were updated
    // if (updatedStudents.modifiedCount === 0) {
    //   res.status(400).json({
    //     status: "fail",
    //     message: "No students found with the specified sponsor",
    //   });
    //   return;
    // }

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
        updatedStudents: updatedStudents.modifiedCount,
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

export const editSponsor = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { name, Amount } = req.body;

  // Validate input
  if (!name && !Amount) {
    res.status(400).json({
      status: "fail",
      message:
        "At least one field (name or Amount) must be provided for updating",
    });
    return;
  }

  try {
    const result: UpdateResult = await sponsorModel.updateOne(
      { _id: id },
      { $set: { name, Amount } }
    );

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
  } catch (error) {
    console.error("Error updating sponsor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

export const getAllSponsors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sponsors = await sponsorModel.find();

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
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

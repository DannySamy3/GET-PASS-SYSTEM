import { Request, Response } from "express";
import studentModel from "../models/studentModel";
import scanModel from "../models/scanModel";
import { RegistrationStatus } from "../models/studentModel";
import classModel from "../models/classModel";
import jsQR from "jsqr";
import sharp from "sharp";

enum ScanStatus {
  COMPLETED = "COMPLETED",
  ABSENT = "NOT FOUND",
  FAILED = "FAILED",
}

export const addScan = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check content type
    if (req.headers["content-type"] !== "image/jpeg") {
      res.status(400).json({
        status: "fail",
        message: "Only JPEG images are allowed",
      });
      return;
    }

    // Check if request body exists
    if (!req.body || !Buffer.isBuffer(req.body)) {
      res.status(400).json({
        status: "fail",
        message: "No image data received",
      });
      return;
    }

    // Process the QR code image using Sharp
    const image = sharp(req.body);

    // Get image metadata
    const metadata = await image.metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Calculate new dimensions while maintaining aspect ratio
    const maxDimension = 800; // Maximum width or height
    let width = originalWidth;
    let height = originalHeight;

    if (width > height && width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }

    // First attempt: Try to find QR code in the full image
    let foundQR = false;
    let qrRegion = { left: 0, top: 0, width: 0, height: 0 };

    // Function to process image data and try to detect QR code
    const processImageData = async (
      imageBuffer: Buffer,
      imgWidth: number,
      imgHeight: number
    ) => {
      const { data } = await sharp(imageBuffer)
        .ensureAlpha() // Ensure alpha channel
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert to RGBA format for jsQR
      const imageData = new Uint8ClampedArray(imgWidth * imgHeight * 4);
      for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
          const idx = (y * imgWidth + x) * 4; // Assuming Sharp outputs RGBA directly
          imageData[idx] = data[idx];
          imageData[idx + 1] = data[idx + 1];
          imageData[idx + 2] = data[idx + 2];
          imageData[idx + 3] = data[idx + 3];
        }
      }

      // Try to detect QR code
      const code = jsQR(imageData, imgWidth, imgHeight, {
        inversionAttempts: "attemptBoth",
      });
      return code;
    };

    // Try to detect QR code in the full image first
    const fullImageBuffer = await image
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    let code = await processImageData(fullImageBuffer, width, height);

    // If QR code not found, try sliding window approach
    if (!code) {
      console.log("QR code not found in full image, trying sliding window...");

      // Define window sizes to try (as percentages of image size)
      const windowSizes = [0.8, 0.6, 0.4];
      const stepSize = 0.2; // 20% step size

      for (const size of windowSizes) {
        const windowWidth = Math.round(width * size);
        const windowHeight = Math.round(height * size);

        // Slide window across image
        for (
          let y = 0;
          y <= height - windowHeight;
          y += Math.round(height * stepSize)
        ) {
          for (
            let x = 0;
            x <= width - windowWidth;
            x += Math.round(width * stepSize)
          ) {
            // Extract region
            const regionBuffer = await image
              .resize(width, height, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .extract({
                left: x,
                top: y,
                width: windowWidth,
                height: windowHeight,
              })
              .toBuffer();

            // Try to detect QR code in this region
            code = await processImageData(
              regionBuffer,
              windowWidth,
              windowHeight
            );

            if (code) {
              console.log("QR code found in region:", {
                x,
                y,
                width: windowWidth,
                height: windowHeight,
              });
              qrRegion = {
                left: x,
                top: y,
                width: windowWidth,
                height: windowHeight,
              };
              foundQR = true;
              break;
            }
          }
          if (foundQR) break;
        }
        if (foundQR) break;
      }
    }

    if (!code) {
      console.log("All QR code detection attempts failed");
      // Create a failed scan record
      const failedScan = await scanModel.create({
        status: ScanStatus.ABSENT,
        date: Date.now(),
      });

      res.status(400).json({
        status: "fail",
        message:
          "No QR code found in image. Please ensure:\n" +
          "1. The QR code is clear and well-lit\n" +
          "2. The entire QR code is visible in the image\n" +
          "3. The image is not blurry or distorted\n" +
          "4. The QR code has good contrast (black on white background)\n" +
          "5. The image is in a standard format (JPEG)",
      });
      return;
    }

    console.log("QR code detected successfully:", {
      data: code.data,
      location: code.location,
      version: code.version,
      region: foundQR ? qrRegion : "full image",
    });

    // Parse the QR code data as JSON
    let qrData;
    try {
      qrData = JSON.parse(code.data);
    } catch (error) {
      res.status(400).json({
        status: "fail",
        message: "Invalid QR code data format",
      });
      return;
    }

    // Extract student ID from the JSON data
    const studentId = qrData.studentId;
    if (!studentId) {
      res.status(400).json({
        status: "fail",
        message: "No student ID found in QR code data",
      });
      return;
    }

    const student = await studentModel.findOne({ _id: studentId });

    if (!student) {
      res.status(404).json({
        status: "fail",
        message: "Student not found",
      });
      return;
    }

    let scanStatus = ScanStatus.FAILED;

    if (student.status === RegistrationStatus.REGISTERED) {
      scanStatus = ScanStatus.COMPLETED;
    } else if (student.status === RegistrationStatus.UNREGISTERED) {
      scanStatus = ScanStatus.FAILED;
    }

    // Create the new scan record
    let newScan = await scanModel.create({
      student: studentId,
      status: scanStatus,
      date: Date.now(),
    });

    // Populate the student field in the new scan record and select desired fields
    newScan = await newScan.populate({
      path: "student",
      select: "firstName secondName lastName -_id", // Select these fields, exclude _id
    });

    // Structure the response to include the populated student and exclude unwanted fields
    res.status(201).json({
      status: "success",
      data: {
        scan: {
          date: newScan.date,
          status: newScan.status,
          student: newScan.student, // Populated student object
        },
      },
    });
  } catch (error) {
    console.error("Error in adding scan:", error);

    // Create a failed scan record
    const failedScan = await scanModel.create({
      status: ScanStatus.FAILED,
      date: Date.now(),
    });

    res.status(500).json({
      status: "fail",
      message:
        "Failed to process QR code. Please try again with a clearer image.",
    });
  }
};

export const getScans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, month } = req.query;
    const criteria: any = {};

    if (status) {
      criteria.status = status;
    }

    let scans;

    if (date) {
      const parsedDate = new Date(date as string);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          message: "Invalid date format. Please provide a valid date string.",
        });
        return;
      }

      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

      criteria.date = { $gte: startOfDay, $lte: endOfDay };

      scans = await scanModel.find(criteria).populate("student").lean();
    } else if (month) {
      const parsedMonth = parseInt(month as string, 10);
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

      scans = await scanModel.find(criteria).populate("student").lean();
    } else {
      scans = await scanModel.find(criteria).populate("student").lean();
    }

    const totalScans = (await scanModel.find()).length;

    const completedScans = scans.filter(
      (scan) => scan.status === "COMPLETED"
    ).length;

    const failedScans = scans.filter((scan) => scan.status === "FAILED").length;

    const classCount: Record<string, number> = {};

    scans.forEach((scan) => {
      const status = scan.status;
      if ((status === "COMPLETED" || status === "FAILED") && scan.student) {
        const classId = (scan.student as any).classId.toString();
        if (classId) {
          classCount[classId] = (classCount[classId] || 0) + 1;
        }
      }
    });

    const classIds = Object.keys(classCount);
    const classes = await classModel
      .find({
        _id: { $in: classIds.map((id) => id) },
      })
      .lean();

    const classNames: Record<string, string> = {};
    classes.forEach((cls) => {
      classNames[cls._id.toString()] = cls.classInitial;
    });

    const classCountWithNames: Record<string, number> = {};
    for (const classId in classCount) {
      if (classNames[classId]) {
        classCountWithNames[classNames[classId]] = classCount[classId];
      }
    }

    let responseData: any = {};

    if (!req.query || Object.keys(req.query).length === 0) {
      responseData = { totalScans, scans };
    } else if (req.query.date || req.query.month) {
      responseData = {
        totalScans,
        scans,
        classCount: classCountWithNames,
        granted: completedScans,
        denied: failedScans,
      };
    } else {
      responseData = {
        totalScans,
        classCount: classCountWithNames,
        statusCount: status === "COMPLETED" ? completedScans : failedScans,
        scans, // Moved scans property here to avoid duplication
      };
    }

    res.status(200).json(responseData);
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: `Error fetching scans: ${error.message}` });
    } else {
      res
        .status(500)
        .json({ message: "An unknown error occurred while fetching scans." });
    }
  }
};

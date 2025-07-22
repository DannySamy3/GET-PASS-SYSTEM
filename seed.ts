import mongoose from "mongoose";
import { config } from "dotenv";
import studentModel from "./src/models/studentModel";
import classModel from "./src/models/classModel";
import counterModel from "./src/models/counterModel";
import sponsorModel from "./src/models/sponsorModel";
import sessionModel from "./src/models/sessionModel";
import paymentModel from "./src/models/paymentModel";
import { faker } from "@faker-js/faker";
import userModal from "./src/models/userModal";
import scanModel from "./src/models/scanModel";

config({ path: "./.env" });

const DB_LOCAL = process.env.DATABASE_LOCAL as string;
const DB_PASSWORD = process.env.PASSWORD as string;
const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

const universityCourses = [
  {
    name: "Bachelor Degree in Transport and Supply Chain Management",
    duration: 4,
    classInitial: "BTSM",
    fee: 1526000,
  },
  {
    name: "Bachelor Degree in Mechantronics Engineering",
    duration: 4,
    classInitial: "BEME",
    fee: 1790000,
  },
  {
    name: "Bachelor Degree in Mechanical and Marine Engineering",
    duration: 4,
    classInitial: "BMME",
    fee: 1790000,
  },
  {
    name: "Bachelor Degree in Marine Engineering",
    duration: 4,
    classInitial: "BMTE",
    fee: 1790000,
  },
  {
    name: "Bachelor Degree in Oil and Gas Engineering",
    duration: 4,
    classInitial: "BOGE",
    fee: 1790000,
  },
  { name: "Bachelor Degree in Naval Architecture and Off Shore Engineering", duration: 4, classInitial: "BNAOB", fee: 1680000 },
  { name: "Bachelor Degree in Marine Transport and Nautical Science", duration: 4, classInitial: "BMTNS", fee: 1746000 },
  { name: "Bachelor Degree in Shipping And Logistic Management", duration: 4, classInitial: "BSLM", fee: 1240000 },
  {
    name: "Master Degree in Shipping Economics and Logistics",
    duration: 2,
    classInitial: "MSEL",
    fee: 4550000,
  },
  { name: "Master Degree in Transport and Supply chain Management", duration: 2, classInitial: "MTSM", fee: 2200000 },
  {
    name: "Master Degree in Marine Engineering Management",
    duration: 2,
    classInitial: "MMEM",
    fee: 2200000,
  },
  {
    name: "Master Degree in Transport and Nautical Science",
    duration: 2,
    classInitial: "MDTNS",
    fee: 1540000,
  },
];

const sponsors = [{ name: "HESLB" }, { name: "Metfund" }, { name: "Private" }];

mongoose.connect(DB).then(async () => {
  console.log("DB connection successful!");

  try {
    // Clear existing data
    // await classModel.deleteMany({});
    // await studentModel.deleteMany({});
    // await counterModel.deleteMany({});
    // await sponsorModel.deleteMany({});
    // await sessionModel.deleteMany({});
    // await paymentModel.deleteMany({});
    // await sessionModel.deleteMany({});
    await scanModel.deleteMany({})
    // await userModal.deleteMany({});

    // // Create a session
    // const currentDate = new Date();
    // const session = await sessionModel.create({
    //   sessionName: "2023/2024",
    //   startDate: new Date(currentDate.getFullYear(), 0, 1),
    //   endDate: new Date(currentDate.getFullYear(), 11, 31),
    //   amount: 2000000,
    //   activeStatus: true,
    //   grace: true,
    //   gracePeriodDays: 30,
    //   graceActivationDate: new Date(),
    //   graceRemainingDays: 30,
    // });
    // console.log("Session created successfully!");

    // const createdSponsors = await sponsorModel.insertMany(sponsors);
    // console.log("Sponsors seeded successfully!");

    // const classes = await classModel.insertMany(universityCourses);
    // console.log("Classes seeded successfully!");

    // await counterModel.create({ modelName: "studentNumber", sequenceValue: 0 });

    // const students = await Promise.all(
    //   Array.from({ length: 15 }, async () => {
    //     const randomClass = classes[Math.floor(Math.random() * classes.length)];
    //     const randomSponsor =
    //       createdSponsors[Math.floor(Math.random() * createdSponsors.length)];

    //     const enrollmentYear =
    //       Math.floor(Math.random() * (2024 - 2009 + 1)) + 2009;

    //     const counter = await counterModel.findOneAndUpdate(
    //       { modelName: "studentNumber" },
    //       { $inc: { sequenceValue: 1 } },
    //       { new: true }
    //     );

    //     const studentNumber = counter?.sequenceValue || 1;

    //     const regNo = `${randomClass.classInitial}/${enrollmentYear
    //       .toString()
    //       .slice(-2)}/${studentNumber}`;

    //     let registrationStatus = "NOT REGISTERED";

    //     // Determine registration status based on sponsor and grace period
    //     if (randomSponsor.name === "Metfund") {
    //       registrationStatus = "REGISTERED";
    //     } else if (session.grace) {
    //       // During grace period, all students are registered
    //       registrationStatus = "REGISTERED";
    //     }

    //     // Set gender first
    //     const gender = Math.random() < 0.5 ? "Male" : "Female";
    //     const fakerGender = gender.toLowerCase() as "male" | "female";

    //     // Static arrays of real people images from randomuser.me
    //     const maleImages = [
    //       "https://randomuser.me/api/portraits/men/1.jpg",
    //       "https://randomuser.me/api/portraits/men/2.jpg",
    //       "https://randomuser.me/api/portraits/men/3.jpg",
    //       "https://randomuser.me/api/portraits/men/4.jpg",
    //       "https://randomuser.me/api/portraits/men/5.jpg",
    //       "https://randomuser.me/api/portraits/men/6.jpg",
    //       "https://randomuser.me/api/portraits/men/7.jpg",
    //       "https://randomuser.me/api/portraits/men/8.jpg",
    //       "https://randomuser.me/api/portraits/men/9.jpg",
    //       "https://randomuser.me/api/portraits/men/10.jpg"
    //     ];
    //     const femaleImages = [
    //       "https://randomuser.me/api/portraits/women/1.jpg",
    //       "https://randomuser.me/api/portraits/women/2.jpg",
    //       "https://randomuser.me/api/portraits/women/3.jpg",
    //       "https://randomuser.me/api/portraits/women/4.jpg",
    //       "https://randomuser.me/api/portraits/women/5.jpg",
    //       "https://randomuser.me/api/portraits/women/6.jpg",
    //       "https://randomuser.me/api/portraits/women/7.jpg",
    //       "https://randomuser.me/api/portraits/women/8.jpg",
    //       "https://randomuser.me/api/portraits/women/9.jpg",
    //       "https://randomuser.me/api/portraits/women/10.jpg"
    //     ];
    //     const image = gender === "Male"
    //       ? faker.helpers.arrayElement(maleImages)
    //       : faker.helpers.arrayElement(femaleImages);

    //     return {
    //       studentNumber,
    //       firstName: faker.person.firstName(fakerGender),
    //       secondName: faker.person.middleName(fakerGender),
    //       lastName: faker.person.lastName(fakerGender),
    //       email: faker.internet.email(),
    //       phoneNumber: faker.phone.number(),
    //       nationality: faker.location.country(),
    //       classId: randomClass._id,
    //       sponsor: randomSponsor._id,
    //       status: registrationStatus,
    //       registrationStatus,
    //       gender,
    //       enrollmentYear,
    //       image,
    //       regNo,
    //       sessionId: session._id,
    //       payments: [],
    //     };
    //   })
    // );

    // const createdStudents = await studentModel.insertMany(students);
    // console.log("Students seeded successfully!");

    // // Create payments for all students
    // const payments = createdStudents.map((student) => {
    //   const sponsor = createdSponsors.find(
    //     (s) => s._id.toString() === student.sponsor.toString()
    //   );
    //   const isMetfund = sponsor?.name === "Metfund";

    //   // Ensure studentId is always set
    //   if (!student._id) {
    //     throw new Error("Student ID is missing when creating payment");
    //   }

    //   return {
    //     amount: isMetfund ? session.amount : 0, // Full amount for Metfund, 0 for others
    //     sessionId: session._id,
    //     studentId: student._id, // Ensure studentId is set
    //     paymentStatus: student.status === "REGISTERED" ? "PAID" : "PENDING",
    //     remainingAmount: isMetfund ? 0 : session.amount, // 0 for Metfund, full amount for others
    //   };
    // });

    // // Validate payments before inserting
    // for (const payment of payments) {
    //   if (!payment.studentId) {
    //     throw new Error("Payment is missing studentId");
    //   }
    //   if (!payment.sessionId) {
    //     throw new Error("Payment is missing sessionId");
    //   }
    // }

    // await paymentModel.insertMany(payments);
    // console.log("Payments seeded successfully!");

    // // Verify that all payments have valid studentIds
    // const allPayments = await paymentModel.find().populate("studentId");
    // const invalidPayments = allPayments.filter((payment) => !payment.studentId);

    // if (invalidPayments.length > 0) {
    //   console.error(
    //     `Found ${invalidPayments.length} payments with invalid studentIds`
    //   );
    //   // Optionally, you could delete these invalid payments
    //   // await paymentModel.deleteMany({ _id: { $in: invalidPayments.map(p => p._id) } });
    // } else {
    //   console.log("All payments have valid studentIds");
    // }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.connection.close();
  }
});

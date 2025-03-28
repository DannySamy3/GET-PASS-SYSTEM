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

config({ path: "./.env" });

const DB_LOCAL = process.env.DATABASE_LOCAL as string;
const DB_PASSWORD = process.env.PASSWORD as string;
const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

const universityCourses = [
  {
    name: "Computer Science",
    duration: 4,
    classInitial: "CS",
    fee: 2000000,
  },
  {
    name: "Mechanical Engineering",
    duration: 4,
    classInitial: "ME",
    fee: 2500000,
  },
  {
    name: "Electrical Engineering",
    duration: 4,
    classInitial: "EE",
    fee: 2300000,
  },
  {
    name: "Civil Engineering",
    duration: 4,
    classInitial: "CE",
    fee: 2200000,
  },
  {
    name: "Business Administration",
    duration: 3,
    classInitial: "BA",
    fee: 1800000,
  },
  { name: "Economics", duration: 3, classInitial: "EC", fee: 1700000 },
  { name: "Medicine", duration: 6, classInitial: "MD", fee: 3000000 },
  { name: "Law", duration: 4, classInitial: "LW", fee: 1900000 },
  {
    name: "Architecture",
    duration: 5,
    classInitial: "AR",
    fee: 2400000,
  },
  { name: "Psychology", duration: 3, classInitial: "PS", fee: 1600000 },
  {
    name: "Biotechnology",
    duration: 4,
    classInitial: "BT",
    fee: 2100000,
  },
  {
    name: "Environmental Science",
    duration: 3,
    classInitial: "ES",
    fee: 1700000,
  },
];

const sponsors = [{ name: "HESLB" }, { name: "Metfund" }, { name: "Private" }];

mongoose.connect(DB).then(async () => {
  console.log("DB connection successful!");

  // Clear existing data
  await classModel.deleteMany({});
  await studentModel.deleteMany({});
  await counterModel.deleteMany({});
  await sponsorModel.deleteMany({});
  await sessionModel.deleteMany({});
  await paymentModel.deleteMany({});

  // Create a session
  const currentDate = new Date();
  const session = await sessionModel.create({
    sessionName: "2023/2024",
    startDate: new Date(currentDate.getFullYear(), 0, 1),
    endDate: new Date(currentDate.getFullYear(), 11, 31),
    amount: 2000000,
    activeStatus: true,
    grace: true,
  });
  console.log("Session created successfully!");

  const createdSponsors = await sponsorModel.insertMany(sponsors);
  console.log("Sponsors seeded successfully!");

  const classes = await classModel.insertMany(universityCourses);
  console.log("Classes seeded successfully!");

  await counterModel.create({ modelName: "studentNumber", sequenceValue: 0 });

  const students = await Promise.all(
    Array.from({ length: 100 }, async () => {
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      const randomSponsor =
        createdSponsors[Math.floor(Math.random() * createdSponsors.length)];

      const enrollmentYear =
        Math.floor(Math.random() * (2024 - 2009 + 1)) + 2009;

      const counter = await counterModel.findOneAndUpdate(
        { modelName: "studentNumber" },
        { $inc: { sequenceValue: 1 } },
        { new: true }
      );

      const studentNumber = counter?.sequenceValue || 1;

      const regNo = `${randomClass.classInitial}/${enrollmentYear
        .toString()
        .slice(-2)}/${studentNumber}`;

      let registrationStatus = "NOT REGISTERED";
      if (randomSponsor.name === "Metfund") {
        registrationStatus = "REGISTERED";
      }

      return {
        studentNumber,
        firstName: faker.person.firstName(),
        secondName: faker.person.middleName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        nationality: faker.location.country(),
        classId: randomClass._id,
        sponsor: randomSponsor._id,
        status: registrationStatus,
        gender: Math.random() < 0.5 ? "Male" : "Female",
        enrollmentYear,
        image: faker.image.avatar(),
        regNo,
        sessionId: session._id,
        payments: [],
      };
    })
  );

  const createdStudents = await studentModel.insertMany(students);
  console.log("Students seeded successfully!");

  // Create payments for registered students
  const payments = await Promise.all(
    createdStudents
      .filter((student) => student.status === "REGISTERED")
      .map(async (student) => {
        const studentClass = await classModel.findById(student.classId);
        return {
          amount: studentClass?.fee || 2000000,
          sessionId: session._id,
          studentId: student._id,
        };
      })
  );

  await paymentModel.insertMany(payments);
  console.log("Payments seeded successfully!");

  mongoose.connection.close();
});

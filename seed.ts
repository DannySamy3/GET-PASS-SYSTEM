import mongoose from "mongoose";
import { config } from "dotenv";
import studentModel from "./src/models/studentModel";
import classModel from "./src/models/classModel";
import counterModel from "./src/models/counterModel";
import sponsorModel from "./src/models/sponsorModel"; // Import the Sponsor model
import { faker } from "@faker-js/faker";
import userModal from "./src/models/userModal";

config({ path: "./.env" });

const DB_LOCAL = process.env.DATABASE_LOCAL as string;
const DB_PASSWORD = process.env.PASSWORD as string;
const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

const universityCourses = [
  { name: "Computer Science", duration: 4, classInitial: "CS" },
  { name: "Mechanical Engineering", duration: 4, classInitial: "ME" },
  { name: "Electrical Engineering", duration: 4, classInitial: "EE" },
  { name: "Civil Engineering", duration: 4, classInitial: "CE" },
  { name: "Business Administration", duration: 3, classInitial: "BA" },
  { name: "Economics", duration: 3, classInitial: "EC" },
  { name: "Medicine", duration: 6, classInitial: "MD" },
  { name: "Law", duration: 4, classInitial: "LW" },
  { name: "Architecture", duration: 5, classInitial: "AR" },
  { name: "Psychology", duration: 3, classInitial: "PS" },
  { name: "Biotechnology", duration: 4, classInitial: "BT" },
  { name: "Environmental Science", duration: 3, classInitial: "ES" },
];

const sponsors = [
  { name: "HESLB", Amount: 1000 },
  { name: "Metfund", Amount: 2000 },
  { name: "Private", Amount: 3000 },
];

mongoose.connect(DB).then(async () => {
  console.log("DB connection successful!");

  await classModel.deleteMany({});
  await studentModel.deleteMany({});
  await counterModel.deleteMany({});
  await sponsorModel.deleteMany({});
  await userModal.deleteMany({});

  const createdSponsors = await sponsorModel.insertMany(sponsors);

  const classes = await classModel.insertMany(universityCourses);
  console.log("Classes seeded successfully!");

  await counterModel.create({ modelName: "studentNumber", sequenceValue: 0 });

  const students = await Promise.all(
    Array.from({ length: 1500 }, async () => {
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
      };
    })
  );

  await studentModel.insertMany(students);
  console.log("Students seeded successfully!");

  mongoose.connection.close();
});

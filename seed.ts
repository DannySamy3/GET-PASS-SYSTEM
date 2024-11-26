import mongoose from "mongoose";
import { config } from "dotenv";
import studentModel from "./src/models/studentModel";
import classModel from "./src/models/classModel";
import counterModel from "./src/models/counterModel";
import { faker } from "@faker-js/faker";

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
];

mongoose.connect(DB).then(async () => {
  console.log("DB connection successful!");

  // Clear existing data
  await classModel.deleteMany({});
  await studentModel.deleteMany({});
  await counterModel.deleteMany({});

  // Seed classes
  const classes = await classModel.insertMany(universityCourses);
  console.log("Classes seeded successfully!");

  // Initialize counter for studentNumber
  await counterModel.create({ modelName: "studentNumber", sequenceValue: 0 });

  // Generate students
  const students = await Promise.all(
    Array.from({ length: 1000 }, async () => {
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      const enrollmentYear =
        Math.floor(Math.random() * (2024 - 2009 + 1)) + 2009;

      // Increment the student number
      const counter = await counterModel.findOneAndUpdate(
        { modelName: "studentNumber" },
        { $inc: { sequenceValue: 1 } },
        { new: true }
      );

      const studentNumber = counter?.sequenceValue || 1;

      // Generate regNo
      const regNo = `${randomClass.classInitial}/${enrollmentYear
        .toString()
        .slice(-2)}/${studentNumber}`;

      return {
        studentNumber,
        firstName: faker.person.firstName(),
        secondName: faker.person.middleName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        amountPaid: `${faker.finance.amount({
          min: 1000,
          max: 10000,
          dec: 2,
        })} TZS`,
        nationality: faker.location.country(),
        classId: randomClass._id,
        sponsor: faker.person.fullName(),
        status:
          Math.random() < 0.33
            ? "REGISTERED"
            : Math.random() < 0.5
            ? "PARTIAL REGISTERED"
            : "NOT REGISTERED",
        gender: Math.random() < 0.5 ? "Male" : "Female",
        enrollmentYear,
        image: faker.image.avatar(),
        regNo, // Assign the generated regNo here
      };
    })
  );

  await studentModel.insertMany(students);
  console.log("Students seeded successfully!");

  mongoose.connection.close();
});

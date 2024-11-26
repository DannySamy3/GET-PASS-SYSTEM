import mongoose from "mongoose";
import { config } from "dotenv";
import student from "./src/models/studentModel";
import classModel from "./src/models/classModel";
import { faker } from "@faker-js/faker";

config({ path: "./.env" });

const DB_LOCAL = process.env.DATABASE_LOCAL as string;
const DB_PASSWORD = process.env.PASSWORD as string;

const DB = DB_LOCAL.replace("<PASSWORD>", DB_PASSWORD);

const universityCourses = [
  { name: "Computer Science", duration: 4 },
  { name: "Mechanical Engineering", duration: 4 },
  { name: "Electrical Engineering", duration: 4 },
  { name: "Civil Engineering", duration: 4 },
  { name: "Business Administration", duration: 3 },
  { name: "Economics", duration: 3 },
  { name: "Medicine", duration: 6 },
  { name: "Law", duration: 4 },
  { name: "Architecture", duration: 5 },
  { name: "Psychology", duration: 3 },
];

mongoose.connect(DB).then(async () => {
  console.log("DB connection successful!");
  await classModel.deleteMany({});
  const classes = await classModel.insertMany(universityCourses);
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  // Generate 30 dummy students
  const students = Array.from({ length: 50 }, () => ({
    firstName: faker.person.firstName(),
    secondName: faker.person.middleName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    class: randomClass._id,
    phoneNumber: faker.phone.number(),
    enrollmentYear: new Date().getFullYear(),
    amountPaid: `${faker.finance.amount({
      min: 1000,
      max: 10000,
      dec: 2,
    })} TZS`,
    nationality: faker.location.country(),

    regNo: `REG${faker.number.int({ min: 1000, max: 9999 })}`,
    sponsor: faker.person.fullName(),
    status:
      Math.random() < 0.33
        ? "REGISTERED"
        : Math.random() < 0.5
        ? "PARTIAL REGISTERED"
        : "NOT REGISTERED",
  }));

  try {
    await student.deleteMany({});
    await student.insertMany(students);
    console.log("Dummy data inserted successfully!");
  } catch (error) {
    console.error("Error inserting dummy data:", error);
  } finally {
    mongoose.connection.close();
  }
});

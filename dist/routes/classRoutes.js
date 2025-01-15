"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const classController_1 = require("../controllers/classController");
const router = (0, express_1.Router)();
router.route("/").post(classController_1.createClass).get(classController_1.getAllClasses);
router.route("/initials/").get(classController_1.getAllClassInitials);
router.route("/:id").get(classController_1.getClassById).patch(classController_1.updateClass).delete(classController_1.deleteClass);
exports.default = router;

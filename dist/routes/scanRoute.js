"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scanController_1 = require("../controllers/scanController");
const router = (0, express_1.Router)();
router.route("/:id").get(scanController_1.addScan);
router.route("/").get(scanController_1.getScans);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sponsorController_1 = require("../controllers/sponsorController");
const router = (0, express_1.Router)();
router.route("/").post(sponsorController_1.createSponsor).get(sponsorController_1.getAllSponsors);
router
    .route("/:id")
    .delete(sponsorController_1.deleteSponsor)
    .patch(sponsorController_1.editSponsor)
    .get(sponsorController_1.getSponsorById);
exports.default = router;

import express from "express";
import {
  getApplications,
  createApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
} from "../controllers/application.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getApplications);
router.post("/", createApplication);
router.put("/:id", updateApplication);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteApplication);

export default router;

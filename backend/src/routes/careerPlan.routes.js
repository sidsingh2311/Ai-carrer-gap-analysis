import express from "express";
import {
  getCareerPlan,
  generatePlan,
  toggleTaskStatus,
  updateWeeklyFocus,
} from "../controllers/careerPlan.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getCareerPlan);
router.post("/generate", generatePlan);
router.patch("/toggle-task", toggleTaskStatus);
router.patch("/weekly-focus", updateWeeklyFocus);

export default router;

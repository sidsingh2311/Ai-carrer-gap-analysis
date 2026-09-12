import express from "express"
import { analyzeGap, matchJobDescription } from "../controllers/analysis.controller.js"
import { optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

// creating an instance of the router
const router = express.Router();

router.post("/analyze", optionalVerifyJWT, upload.single("resume"), analyzeGap);
router.post("/match-jd", optionalVerifyJWT, upload.single("resume"), matchJobDescription);

export default router;

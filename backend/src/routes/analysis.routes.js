import express from "express"
import { analyzeGap } from "../controllers/analysis.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import upload from "../middlewares/upload.middleware.js";

// creating an instance of the router
const router = express.Router();


router.post("/analyze", upload.single("resume"), analyzeGap);

export default router;

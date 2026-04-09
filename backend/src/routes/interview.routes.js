import express from "express"
import { startInterview,submitAnswer } from "../controllers/interview.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

// creating an instance of the express
const router=express.Router();

router.post("/start",verifyJWT,startInterview);
router.post("/answer",verifyJWT,submitAnswer);

export default router;

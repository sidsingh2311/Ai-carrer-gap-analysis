import express from "express"
import { generateQuiz } from "../controllers/quiz.controllers.js"
import { evaluateQuizController } from "../controllers/quiz.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// creating an instance of the routes
const router = express.Router();

router.post("/generate", verifyJWT, generateQuiz);
router.post("/evaluate", verifyJWT, evaluateQuizController);

export default router;


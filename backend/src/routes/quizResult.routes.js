import express from "express"
import {saveQuizResultController,getUserQuizResultController,getSingleQuizResultController} from "../controllers/quizResult.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js" 

// creating an instance of the router
const router = express.Router();
router.post("/save",verifyJWT,saveQuizResultController);
router.post("/my-result",verifyJWT,getUserQuizResultController);
router.post("/:id",getSingleQuizResultController);

export default router;
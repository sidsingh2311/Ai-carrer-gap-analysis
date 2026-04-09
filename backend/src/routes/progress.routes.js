import express from "express"
import { getProgessControllerDashboard } from "../controllers/progress.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

// creating an instance of the router 
const router = express.Router();

router.get("/dashboard",verifyJWT,getProgessControllerDashboard);

export default router;
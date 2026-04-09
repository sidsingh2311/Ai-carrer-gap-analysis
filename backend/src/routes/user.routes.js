import express from "express"
import { getUser } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


// creating an instance of the router 
const router = express.Router();

router.get("/profile",verifyJWT,getUser);

export default router;

import express from "express"
import { login,register } from "../controllers/auth.controller.js"

// creating an instance of the router
const router = express.Router();

router.post("/login",login);
router.post("/register",register);

export default router


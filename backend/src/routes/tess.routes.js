import express from "express";
import {
  chatWithTess,
  getSuggestions,
  getMemoryVault,
  addMemory,
  deleteMemory,
  syncHistory,
  getActiveConversation,
  clearConversation,
} from "../controllers/tess.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All Tess endpoints require authenticated user
router.use(verifyJWT);

router.post("/chat", chatWithTess);
router.get("/suggestions", getSuggestions);
router.get("/memories", getMemoryVault);
router.post("/memories", addMemory);
router.delete("/memories/:memoryId", deleteMemory);
router.post("/sync", syncHistory);
router.get("/conversation", getActiveConversation);
router.post("/conversation/reset", clearConversation);

export default router;

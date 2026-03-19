import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import * as chatController from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.post("/estimate", aiController.estimate);
router.post("/chat", chatController.handleChat);

export default router;

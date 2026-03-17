import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as aiController from "../controllers/ai.controller";
import * as chatController from "../controllers/chat.controller";

const router = Router();

router.use(authenticate);
router.post("/estimate", aiController.estimate);
router.post("/chat", chatController.handleChat);

export default router;

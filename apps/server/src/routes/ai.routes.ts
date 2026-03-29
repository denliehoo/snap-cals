import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import * as chatController from "../controllers/chat.controller";
import * as goalCoachController from "../controllers/goal-coach.controller";
import { checkAiUsage } from "../middleware/ai-usage";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(checkAiUsage);
router.post("/estimate", aiController.estimate);
router.post("/chat", chatController.handleChat);
router.post("/goal-coach", goalCoachController.handleGoalCoach);

export default router;

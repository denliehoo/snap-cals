import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.use(authenticate);
router.post("/estimate", aiController.estimate);

export default router;

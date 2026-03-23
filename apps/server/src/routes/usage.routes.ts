import { Router } from "express";
import * as usageController from "../controllers/usage.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.get("/", usageController.getUsage);

export default router;

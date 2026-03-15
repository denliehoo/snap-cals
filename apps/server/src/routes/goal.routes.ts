import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as goalController from "../controllers/goal.controller";

const router = Router();

router.use(authenticate);
router.get("/", goalController.get);
router.put("/", goalController.upsert);

export default router;

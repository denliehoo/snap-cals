import { Router } from "express";
import * as goalController from "../controllers/goal.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.get("/", goalController.get);
router.put("/", goalController.upsert);

export default router;

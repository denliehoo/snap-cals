import { Router } from "express";
import { getSignupStatus } from "../controllers/settings.controller";

const router = Router();

router.get("/signup-status", getSignupStatus);

export default router;

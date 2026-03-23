import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller";

const router = Router();

router.post("/revenuecat", webhookController.handleRevenueCat);

export default router;

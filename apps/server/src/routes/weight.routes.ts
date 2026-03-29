import { Router } from "express";
import * as weight from "../controllers/weight.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", weight.create);
router.get("/", weight.list);
router.put("/:id", weight.update);
router.delete("/:id", weight.remove);

export default router;

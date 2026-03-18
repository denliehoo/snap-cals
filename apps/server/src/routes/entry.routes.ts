import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as entries from "../controllers/entry.controller";

const router = Router();

router.use(authenticate);

router.post("/", entries.create);
router.get("/", entries.getByDate);
router.get("/recent", entries.getRecent);
router.get("/week", entries.getByWeek);
router.put("/:id", entries.update);
router.delete("/:id", entries.remove);

export default router;

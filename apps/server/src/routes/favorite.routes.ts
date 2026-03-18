import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as favorites from "../controllers/favorite.controller";

const router = Router();

router.use(authenticate);

router.post("/", favorites.create);
router.get("/", favorites.list);
router.delete("/:id", favorites.remove);

export default router;

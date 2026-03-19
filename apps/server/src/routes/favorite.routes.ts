import { Router } from "express";
import * as favorites from "../controllers/favorite.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", favorites.create);
router.get("/", favorites.list);
router.delete("/:id", favorites.remove);

export default router;

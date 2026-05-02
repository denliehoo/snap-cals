import { Router } from "express";
import * as adminAuth from "../controllers/admin-auth.controller";
import * as adminManage from "../controllers/admin-manage.controller";
import * as adminSettings from "../controllers/admin-settings.controller";
import * as adminUsers from "../controllers/admin-users.controller";
import { authenticateAdmin } from "../middleware/admin-auth";
import { adminAuthLimiter } from "../middleware/rate-limit";

const router = Router();

// Public
router.post("/auth/login", adminAuthLimiter, adminAuth.login);

// Protected
router.use(authenticateAdmin);

router.get("/admins", adminManage.list);
router.post("/admins", adminManage.create);

router.get("/settings", adminSettings.getSettings);
router.put("/settings", adminSettings.updateSettings);

router.get("/users", adminUsers.listUsers);
router.get("/users/:id", adminUsers.getUser);
router.get("/users/:id/entries", adminUsers.getUserEntries);
router.get("/users/:id/entries/week", adminUsers.getUserWeekEntries);
router.put("/users/:id/entries/:entryId", adminUsers.updateUserEntry);
router.get("/users/:id/goals", adminUsers.getUserGoals);
router.put("/users/:id/goals", adminUsers.updateUserGoals);
router.get("/users/:id/weight", adminUsers.getUserWeight);

export default router;

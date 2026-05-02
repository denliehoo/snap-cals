import cors from "cors";
import express from "express";
import { validateApiKey } from "./middleware/api-key";
import passport from "./middleware/passport";
import { aiLimiter, authLimiter } from "./middleware/rate-limit";
import adminRoutes from "./routes/admin.routes";
import aiRoutes from "./routes/ai.routes";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";
import favoriteRoutes from "./routes/favorite.routes";
import goalRoutes from "./routes/goal.routes";
import settingsRoutes from "./routes/settings.routes";
import usageRoutes from "./routes/usage.routes";
import webhookRoutes from "./routes/webhook.routes";
import weightRoutes from "./routes/weight.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Public settings (no auth, no API key)
app.use("/api/settings", settingsRoutes);

// Webhooks use their own auth (Bearer secret), skip API key
app.use("/api/webhooks", webhookRoutes);

// All other routes require API key
app.use("/api", validateApiKey);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/weight", weightRoutes);

export default app;

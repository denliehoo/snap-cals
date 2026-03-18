import express from "express";
import cors from "cors";
import passport from "./middleware/passport";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";
import goalRoutes from "./routes/goal.routes";
import aiRoutes from "./routes/ai.routes";
import favoriteRoutes from "./routes/favorite.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/favorites", favoriteRoutes);

export default app;

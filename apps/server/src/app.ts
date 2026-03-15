import express from "express";
import cors from "cors";
import passport from "./middleware/passport";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";
import goalRoutes from "./routes/goal.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/goals", goalRoutes);

export default app;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "./middleware/passport";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

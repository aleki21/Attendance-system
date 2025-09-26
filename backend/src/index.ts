import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/authmiddleware.js";
import { adminMiddleware } from "./middleware/adminMiddleware.js";
import { usherMiddleware } from "./middleware/usherMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/auth", authRoutes);

// Protected route (any logged-in user)
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "✅ Access granted", user: req.user });
});

// Admin-only route
app.get("/admin-only", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "✅ Admin access granted", user: req.user });
});

// Usher-only route
app.get("/usher-only", authMiddleware, usherMiddleware, (req, res) => {
  res.json({ message: "✅ Usher access granted", user: req.user });
});

// Test DB connection
app.get("/db-test", async (req, res) => {
  try {
    const result = await db.execute("SELECT NOW()");
    res.json({ status: "✅ Connected!", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "❌ DB connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

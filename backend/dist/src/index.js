import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/authmiddleware.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
// Routes
app.use("/auth", authRoutes);
// Protected test route
app.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "✅ Access granted",
        user: req.user,
    });
});
// Test DB connection
app.get("/db-test", async (req, res) => {
    try {
        const result = await db.execute("SELECT NOW()");
        res.json({ status: "✅ Connected!", result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "❌ DB connection failed" });
    }
});
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

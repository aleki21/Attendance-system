import { Router } from "express";
import { db } from "../config/db.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = Router();
// ENV secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    console.log("BODY RECEIVED:", req.body);
    try {
        const { email, password } = req.body;
        // Check user
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        if (result.length === 0 || !result[0].active) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = result[0];
        console.log("USER FROM DB:", user);
        // Compare password (handle both camelCase + snake_case just in case)
        const storedHash = user.passwordHash || user.password_hash;
        if (!storedHash) {
            console.error("❌ No password hash found for user:", user);
            return res.status(500).json({ message: "User password not set properly" });
        }
        console.log("🔑 Plain password received:", password);
        console.log("🔑 Stored hash from DB:", storedHash);
        const validPassword = await bcrypt.compare(password, storedHash);
        console.log("✅ Password valid?", validPassword);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Create token
        const token = jwt.sign({ id: user.userId, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;

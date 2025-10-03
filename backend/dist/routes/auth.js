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
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Check if email exists
        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user
        const assignedRole = 'usher';
        // Insert user
        const [newUser] = await db
            .insert(users)
            .values({
            name,
            email,
            passwordHash: hashedPassword,
            role: assignedRole, // Always 'usher'
        })
            .returning({
            id: users.userId,
            name: users.name,
            email: users.email,
            role: users.role,
        });
        // Create token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
            expiresIn: "1d",
        });
        res.status(201).json({
            message: "✅ User registered successfully",
            token,
            user: newUser,
        });
    }
    catch (error) {
        console.error("❌ Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check user
        const result = await db.select().from(users).where(eq(users.email, email));
        if (result.length === 0 || !result[0].active) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = result[0];
        // Compare password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Create token
        const token = jwt.sign({ id: user.userId, role: user.role }, JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({
            message: "✅ Login successful",
            token,
            user: {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// LOGOUT
// =========================
router.post("/logout", (req, res) => {
    // In stateless JWT, logout just means the client deletes the token.
    // You could also implement token blacklisting if needed.
    return res.json({ message: "✅ Logged out successfully. Please discard your token." });
});
export default router;

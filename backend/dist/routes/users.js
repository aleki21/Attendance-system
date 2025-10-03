import { Router } from "express";
import { db } from "../config/db.js";
import { users } from "../db/schema/index.js";
import { eq, and, like, count } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
const router = Router();
// Validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["admin", "usher"])
});
const updateUserSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    active: z.boolean().optional()
});
// =========================
// GET ALL USERS (with filtering) - FIXED
// =========================
router.get("/", async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        // Build query with all conditions at once
        const usersList = await db
            .select()
            .from(users)
            .where(and(role && role !== 'all' ? eq(users.role, role) : undefined, search ? like(users.name, `%${search}%`) : undefined))
            .limit(Number(limit))
            .offset((Number(page) - 1) * Number(limit));
        // Get total count with same filters
        const totalResult = await db
            .select({ count: count() })
            .from(users)
            .where(and(role && role !== 'all' ? eq(users.role, role) : undefined, search ? like(users.name, `%${search}%`) : undefined));
        const total = totalResult[0].count;
        // Remove password hash from response
        const usersWithoutPassword = usersList.map(user => {
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json({
            users: usersWithoutPassword,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error("❌ Get users error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET USER BY ID
// =========================
router.get("/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));
        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user[0];
        res.json({ user: userWithoutPassword });
    }
    catch (error) {
        console.error("❌ Get user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// CREATE USER (Admin only)
// =========================
router.post("/", async (req, res) => {
    try {
        const validationResult = createUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationResult.error.issues
            });
        }
        const { name, email, password, role } = validationResult.data;
        // Check if email already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
            name,
            email,
            passwordHash: hashedPassword,
            role,
            active: true
        })
            .returning();
        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: "✅ User created successfully",
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error("❌ Create user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// UPDATE USER
// =========================
router.put("/:id", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const validationResult = updateUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationResult.error.issues
            });
        }
        const updateData = validationResult.data;
        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check for duplicate email (if email is being updated)
        if (updateData.email && updateData.email !== existingUser[0].email) {
            const existingWithEmail = await db
                .select()
                .from(users)
                .where(eq(users.email, updateData.email));
            if (existingWithEmail.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }
        // Update user
        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.userId, userId))
            .returning();
        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = updatedUser;
        res.json({
            message: "✅ User updated successfully",
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error("❌ Update user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// DEACTIVATE USER
// =========================
router.patch("/:id/deactivate", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Deactivate user (soft delete)
        await db
            .update(users)
            .set({ active: false })
            .where(eq(users.userId, userId));
        res.json({ message: "✅ User deactivated successfully" });
    }
    catch (error) {
        console.error("❌ Deactivate user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// REACTIVATE USER
// =========================
router.patch("/:id/reactivate", async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));
        if (existingUser.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Reactivate user
        await db
            .update(users)
            .set({ active: true })
            .where(eq(users.userId, userId));
        res.json({ message: "✅ User reactivated successfully" });
    }
    catch (error) {
        console.error("❌ Reactivate user error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import memberRoutes from "./routes/members.js";
import eventRoutes from "./routes/events.js";
import attendanceRoutes from "./routes/attendance.js";
import { authMiddleware } from "./middleware/authmiddleware.js";
import { adminMiddleware } from "./middleware/adminMiddleware.js";
import { usherMiddleware } from "./middleware/usherMiddleware.js";
import analyticsRoutes from "./routes/analytics.js";
// Add SundayService import
import { SundayService } from "./services/sundayService.js";
// Add these Drizzle imports:
import { users, members, events } from "./db/schema/index.js";
import { eq, count } from "drizzle-orm";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({
    origin: 'http://localhost:5173', // Your Vite frontend URL
    credentials: true
}));
app.use(express.json());
// Public routes
app.use("/auth", authRoutes);
// =========================
// PROTECTED ROUTES
// =========================
// User Management (Admin only)
app.use("/users", authMiddleware, adminMiddleware, userRoutes);
// Member Management (Both Admin and Usher can access, but with different permissions)
app.use("/members", authMiddleware, memberRoutes);
// Event Management (Both Admin and Usher can access)
app.use("/events", authMiddleware, eventRoutes);
// Attendance Management (Both Admin and Usher can access)
app.use("/attendance", authMiddleware, attendanceRoutes);
app.use("/analytics", authMiddleware, analyticsRoutes);
// =========================
// SPECIFIC ROLE-BASED ROUTES
// =========================
// Admin-only statistics and reports
app.get("/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get comprehensive admin statistics
        const totalMembersResult = await db.select({ count: count() }).from(members);
        const totalUsersResult = await db.select({ count: count() }).from(users);
        const totalEventsResult = await db.select({ count: count() }).from(events);
        res.json({
            totalMembers: totalMembersResult[0].count,
            totalUsers: totalUsersResult[0].count,
            totalEvents: totalEventsResult[0].count,
            activeUshers: totalUsersResult[0].count - 1, // Subtract admin
        });
    }
    catch (error) {
        console.error("❌ Admin stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Usher-specific dashboard data
app.get("/usher/dashboard", authMiddleware, usherMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Get today's events
        const todayEvents = await db
            .select()
            .from(events)
            .where(eq(events.date, today));
        // Get usher's assigned members count (in real app, you might have usher assignments)
        const totalMembersResult = await db.select({ count: count() }).from(members);
        res.json({
            todayEvents,
            totalMembers: totalMembersResult[0].count,
            assignedMembers: totalMembersResult[0].count, // In real app, this would be filtered
        });
    }
    catch (error) {
        console.error("❌ Usher dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// EXISTING TEST ROUTES (Keep these)
// =========================
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ status: "❌ DB connection failed" });
    }
});
// =========================
// START SUNDAY SERVICE DAILY CHECK
// =========================
SundayService.startDailyCheck();
// =========================
// SERVER STARTUP
// =========================
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📊 Available Routes:`);
    console.log(`   🔐 Auth: POST /auth/login, POST /auth/register`);
    console.log(`   👥 Users: GET/POST/PUT /users (Admin only)`);
    console.log(`   👨‍👩‍👧‍👦 Members: GET/POST/PUT/DELETE /members`);
    console.log(`   📅 Events: GET/POST /events, GET /events/today, GET /events/upcoming`);
    console.log(`   ✅ Attendance: POST /attendance, GET /attendance/event/:id, GET /attendance/stats`);
    console.log(`   📈 Admin: GET /admin/stats`);
    console.log(`   👤 Usher: GET /usher/dashboard`);
    console.log(`   🔄 Sunday Service: Auto-creation scheduled (4:00 AM daily)`);
});

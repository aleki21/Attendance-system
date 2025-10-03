import { Router } from "express";
import { db } from "../config/db.js";
import { attendance, members, events } from "../db/schema/index.js";
import { eq, and, count, sql, gte, lte } from "drizzle-orm"; // ✅ Added gte and lte imports
import { z } from "zod";
const router = Router();
// Validation schemas
const recordAttendanceSchema = z.object({
    eventId: z.number().min(1, "Event ID is required"),
    attendance: z.array(z.object({
        memberId: z.number().min(1, "Member ID is required"),
        status: z.enum(["present", "absent"])
    }))
});
// =========================
// RECORD ATTENDANCE
// =========================
router.post("/", async (req, res) => {
    try {
        const validationResult = recordAttendanceSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationResult.error.issues
            });
        }
        const { eventId, attendance: attendanceRecords } = validationResult.data;
        // Check if event exists
        const eventExists = await db
            .select()
            .from(events)
            .where(eq(events.eventId, eventId));
        if (eventExists.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }
        const results = [];
        for (const record of attendanceRecords) {
            // Check if attendance already exists for this member at this event
            const existingAttendance = await db
                .select()
                .from(attendance)
                .where(and(eq(attendance.memberId, record.memberId), eq(attendance.eventId, eventId)));
            if (existingAttendance.length > 0) {
                // Update existing record
                const [updated] = await db
                    .update(attendance)
                    .set({
                    status: record.status,
                    markedBy: null, // TODO: Get from auth middleware
                    markedAt: new Date()
                })
                    .where(and(eq(attendance.memberId, record.memberId), eq(attendance.eventId, eventId)))
                    .returning();
                results.push(updated);
            }
            else {
                // Create new record
                const [newRecord] = await db
                    .insert(attendance)
                    .values({
                    memberId: record.memberId,
                    eventId: eventId,
                    status: record.status,
                    markedBy: null, // TODO: Get from auth middleware
                })
                    .returning();
                results.push(newRecord);
            }
        }
        res.json({
            message: "✅ Attendance recorded successfully",
            records: results
        });
    }
    catch (error) {
        console.error("❌ Record attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET ATTENDANCE FOR EVENT
// =========================
router.get("/event/:eventId", async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const eventAttendance = await db
            .select({
            attendance: attendance,
            member: members
        })
            .from(attendance)
            .innerJoin(members, eq(attendance.memberId, members.memberId))
            .where(eq(attendance.eventId, eventId));
        res.json({ attendance: eventAttendance });
    }
    catch (error) {
        console.error("❌ Get event attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET ATTENDANCE STATISTICS - FIXED
// =========================
router.get("/stats", async (req, res) => {
    try {
        const { eventId, startDate, endDate } = req.query;
        // Build the query with all conditions in one go
        const stats = await db
            .select({
            eventId: events.eventId,
            eventName: events.name,
            eventDate: events.date,
            presentCount: sql `count(case when ${attendance.status} = 'present' then 1 end)`.as('present_count'),
            totalCount: sql `count(${attendance.attendanceId})`.as('total_count')
        })
            .from(events)
            .leftJoin(attendance, eq(events.eventId, attendance.eventId))
            .where(and(eventId ? eq(events.eventId, Number(eventId)) : undefined, startDate ? gte(events.date, startDate) : undefined, endDate ? lte(events.date, endDate) : undefined))
            .groupBy(events.eventId, events.name, events.date);
        // Calculate percentages
        const statsWithPercentage = stats.map(stat => ({
            eventId: stat.eventId,
            eventName: stat.eventName,
            eventDate: stat.eventDate,
            present: stat.presentCount,
            total: stat.totalCount,
            percentage: stat.totalCount > 0 ? Math.round((stat.presentCount / stat.totalCount) * 100) : 0
        }));
        res.json({ statistics: statsWithPercentage });
    }
    catch (error) {
        console.error("❌ Get attendance stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET TODAY'S ATTENDANCE OVERVIEW - FIXED
// =========================
router.get("/today", async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Get total members count
        const totalMembersResult = await db.select({ count: count() }).from(members);
        const totalMembers = totalMembersResult[0].count;
        // Get today's events with attendance counts
        const todayEvents = await db
            .select()
            .from(events)
            .where(eq(events.date, today));
        // Get attendance counts for each event
        const todayStats = await Promise.all(todayEvents.map(async (event) => {
            const attendanceResult = await db
                .select({ presentCount: count() })
                .from(attendance)
                .where(and(eq(attendance.eventId, event.eventId), eq(attendance.status, "present")));
            return {
                eventId: event.eventId,
                eventName: event.name,
                totalMembers,
                presentCount: attendanceResult[0]?.presentCount || 0
            };
        }));
        res.json({ todayStats });
    }
    catch (error) {
        console.error("❌ Get today's attendance error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;

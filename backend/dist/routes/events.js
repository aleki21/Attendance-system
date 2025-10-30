import { Router } from "express";
import { db } from "../config/db.js";
import { events } from "../db/schema/index.js";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";
import { z } from "zod";
import { SundayService } from "../services/sundayService.js";
const router = Router();
// Validation schema
const createEventSchema = z.object({
    name: z.string().min(1, "Event name is required"),
    eventType: z.enum(["sunday_service", "custom"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});
// =========================
// GET ALL EVENTS - FIXED
// =========================
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 50, type, startDate, endDate } = req.query;
        // Build query with all conditions at once
        const eventsList = await db
            .select()
            .from(events)
            .where(and(type && type !== 'all' ? eq(events.eventType, type) : undefined, startDate ? gte(events.date, startDate) : undefined, endDate ? lte(events.date, endDate) : undefined))
            .orderBy(sql `${events.date} DESC`)
            .limit(Number(limit))
            .offset((Number(page) - 1) * Number(limit));
        // Get total count with same filters
        const totalResult = await db
            .select({ count: count() })
            .from(events)
            .where(and(type && type !== 'all' ? eq(events.eventType, type) : undefined, startDate ? gte(events.date, startDate) : undefined, endDate ? lte(events.date, endDate) : undefined));
        const total = totalResult[0].count;
        res.json({
            events: eventsList,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error("❌ Get events error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET TODAY'S EVENTS
// =========================
router.get("/today", async (req, res) => {
    try {
        // Simple Kenya time solution - UTC+3
        const now = new Date();
        const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const today = kenyaTime.toISOString().split('T')[0];
        console.log(`🇰🇪 Today in Kenya: ${today}`);
        console.log(`🕒 Current UTC time: ${now.toISOString()}`);
        const todayEvents = await db
            .select()
            .from(events)
            .where(eq(events.date, today))
            .orderBy(events.eventType);
        console.log(`📅 Found ${todayEvents.length} events for today`);
        res.json({
            events: todayEvents,
            today: today // For debugging
        });
    }
    catch (error) {
        console.error("❌ Get today's events error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// GET UPCOMING EVENTS
// =========================
router.get("/upcoming", async (req, res) => {
    try {
        // Use Kenya time for today
        const now = new Date();
        const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const today = kenyaTime.toISOString().split('T')[0];
        const upcomingEvents = await db
            .select()
            .from(events)
            .where(gte(events.date, today))
            .orderBy(events.date)
            .limit(10);
        res.json({ events: upcomingEvents });
    }
    catch (error) {
        console.error("❌ Get upcoming events error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// CREATE EVENT
// =========================
router.post("/", async (req, res) => {
    try {
        const validationResult = createEventSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationResult.error.issues
            });
        }
        const { name, eventType, date } = validationResult.data;
        // Validate that the date is not in the past (Kenya time)
        const now = new Date();
        const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const todayInKenya = kenyaTime.toISOString().split('T')[0];
        if (date < todayInKenya) {
            return res.status(400).json({ message: "Cannot create events for past dates" });
        }
        // Check if event already exists on same date with same name
        const existingEvent = await db
            .select()
            .from(events)
            .where(and(eq(events.date, date), eq(events.name, name)));
        if (existingEvent.length > 0) {
            return res.status(400).json({ message: "Event with same name already exists on this date" });
        }
        // Create event
        const [newEvent] = await db
            .insert(events)
            .values({
            name,
            eventType,
            date, // Store as provided (should be YYYY-MM-DD)
            autoGenerated: false,
            createdBy: null,
        })
            .returning();
        res.status(201).json({
            message: "✅ Event created successfully",
            event: newEvent
        });
    }
    catch (error) {
        console.error("❌ Create event error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// AUTO-GENERATE SUNDAY SERVICES (Backup/Manual)
// =========================
router.post("/generate-sundays", async (req, res) => {
    try {
        const { weeks = 4 } = req.body;
        const generatedEvents = [];
        // Get current time in Kenya (UTC+3)
        const now = new Date();
        const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const todayInKenya = kenyaTime.toISOString().split('T')[0];
        const todayDate = new Date(todayInKenya + 'T00:00:00.000Z');
        console.log(`🇰🇪 Generating Sundays from today: ${todayInKenya}`);
        // Start from next Sunday in Kenya time
        const nextSunday = new Date(todayDate);
        nextSunday.setDate(todayDate.getDate() + (7 - todayDate.getDay()));
        console.log(`📅 Next Sunday: ${nextSunday.toISOString().split('T')[0]}`);
        for (let i = 0; i < weeks; i++) {
            const sunday = new Date(nextSunday);
            sunday.setDate(nextSunday.getDate() + (i * 7));
            const sundayStr = sunday.toISOString().split('T')[0];
            // Skip past dates (using Kenya time comparison)
            if (sunday < todayDate) {
                console.log(`⏩ Skipping past date: ${sundayStr}`);
                continue;
            }
            // Check if Sunday service already exists
            const existingEvent = await db
                .select()
                .from(events)
                .where(and(eq(events.date, sundayStr), eq(events.eventType, "sunday_service")));
            if (existingEvent.length === 0) {
                const [newEvent] = await db
                    .insert(events)
                    .values({
                    name: `Sunday Service - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    eventType: "sunday_service",
                    date: sundayStr,
                    autoGenerated: true,
                    createdBy: null,
                })
                    .returning();
                generatedEvents.push(newEvent);
                console.log(`✅ Generated Sunday service: ${sundayStr}`);
            }
            else {
                console.log(`⏩ Sunday service already exists: ${sundayStr}`);
            }
        }
        res.json({
            message: `✅ Generated ${generatedEvents.length} Sunday services`,
            events: generatedEvents
        });
    }
    catch (error) {
        console.error("❌ Generate Sunday services error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// MANUAL SUNDAY CHECK TRIGGER
// =========================
router.post("/trigger-sunday-check", async (req, res) => {
    try {
        const result = await SundayService.manualTrigger();
        res.json(result);
    }
    catch (error) {
        console.error("❌ Manual Sunday check error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// =========================
// DELETE EVENT
// =========================
router.delete("/:id", async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        // Check if event exists
        const existingEvent = await db
            .select()
            .from(events)
            .where(eq(events.eventId, eventId));
        if (existingEvent.length === 0) {
            return res.status(404).json({ message: "Event not found" });
        }
        // Delete event
        await db
            .delete(events)
            .where(eq(events.eventId, eventId));
        res.json({ message: "✅ Event deleted successfully" });
    }
    catch (error) {
        console.error("❌ Delete event error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;

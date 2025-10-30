import { Router } from "express";
import { db } from "../config/db.js";
import { members } from "../db/schema/index.js";
import { eq, and, like, count, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schemas - REMOVED idNo completely
const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ageGroup: z.enum(["child", "youth", "adult"]),
  gender: z.enum(["male", "female"]),
  residence: z.string().min(1, "Residence is required"),
  phone: z.string().optional().nullable(),
}).refine((data) => {
  // Youth and Adult require Phone only
  if (data.ageGroup === "youth" || data.ageGroup === "adult") {
    return !!data.phone;
  }
  return true;
}, {
  message: "Phone number is required for Youth and Adult members",
  path: ["phone"]
}).refine((data) => {
  // Kenyan phone validation (254XXXXXXXXX) - only for youth and adults
  if (data.phone && (data.ageGroup === "youth" || data.ageGroup === "adult")) {
    return /^254\d{9}$/.test(data.phone);
  }
  return true;
}, {
  message: "Phone must be in format 254XXXXXXXXX for Youth and Adult members",
  path: ["phone"]
});

// =========================
// GET ALL MEMBERS
// =========================
router.get("/", async (req, res) => {
  try {
    const { search, ageGroup, gender, page = 1, limit = 50 } = req.query;

    // Build query with all conditions at once
    const membersList = await db
      .select()
      .from(members)
      .where(
        and(
          search ? like(members.name, `%${search}%`) : undefined,
          ageGroup && ageGroup !== 'all' ? eq(members.ageGroup, ageGroup as any) : undefined,
          gender && gender !== 'all' ? eq(members.gender, gender as any) : undefined
        )
      )
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Get total count with same filters
    const totalResult = await db
      .select({ count: count() })
      .from(members)
      .where(
        and(
          search ? like(members.name, `%${search}%`) : undefined,
          ageGroup && ageGroup !== 'all' ? eq(members.ageGroup, ageGroup as any) : undefined,
          gender && gender !== 'all' ? eq(members.gender, gender as any) : undefined
        )
      );
    
    const total = totalResult[0].count;

    res.json({
      members: membersList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get members error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET MEMBER STATISTICS
// =========================
router.get("/stats", async (req, res) => {
  try {
    const ageGroups = await db
      .select({
        ageGroup: members.ageGroup,
        count: count()
      })
      .from(members)
      .groupBy(members.ageGroup);

    const totalResult = await db.select({ count: count() }).from(members);
    const total = totalResult[0].count;

    // Calculate percentages
    const distribution = ageGroups.map(group => ({
      group: group.ageGroup,
      count: group.count,
      percentage: Math.round((group.count / total) * 100)
    }));

    res.json({
      totalMembers: total,
      ageDistribution: distribution
    });
  } catch (error) {
    console.error("❌ Get member stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// CREATE MEMBER
// =========================
router.post("/", async (req, res) => {
  try {
    const validationResult = createMemberSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.issues
      });
    }

    const { name, ageGroup, gender, residence, phone } = validationResult.data;

    // Check for duplicate phone (if provided and for youth/adult)
    if (phone && (ageGroup === "youth" || ageGroup === "adult")) {
      const existingWithPhone = await db
        .select()
        .from(members)
        .where(eq(members.phone, phone));
      
      if (existingWithPhone.length > 0) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    // Insert member - NO ID NUMBER
    const [newMember] = await db
      .insert(members)
      .values({
        name,
        ageGroup,
        gender,
        residence,
        phone: phone || null,
      })
      .returning();

    res.status(201).json({
      message: "✅ Member registered successfully",
      member: newMember
    });
  } catch (error) {
    console.error("❌ Create member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// UPDATE MEMBER
// =========================
router.put("/:id", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const validationResult = createMemberSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.issues
      });
    }

    const { name, ageGroup, gender, residence, phone } = validationResult.data;

    // Check if member exists
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.memberId, memberId));

    if (existingMember.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Check for duplicate phone (excluding current member)
    if (phone && (ageGroup === "youth" || ageGroup === "adult")) {
      const existingWithPhone = await db
        .select()
        .from(members)
        .where(and(
          eq(members.phone, phone),
          sql`${members.memberId} != ${memberId}`
        ));
      
      if (existingWithPhone.length > 0) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    // Update member - NO ID NUMBER
    const [updatedMember] = await db
      .update(members)
      .set({
        name,
        ageGroup,
        gender,
        residence,
        phone: phone || null,
      })
      .where(eq(members.memberId, memberId))
      .returning();

    res.json({
      message: "✅ Member updated successfully",
      member: updatedMember
    });
  } catch (error) {
    console.error("❌ Update member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// DELETE MEMBER
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);

    // Check if member exists
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.memberId, memberId));

    if (existingMember.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    await db
      .delete(members)
      .where(eq(members.memberId, memberId));

    res.json({ message: "✅ Member deleted successfully" });
  } catch (error) {
    console.error("❌ Delete member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
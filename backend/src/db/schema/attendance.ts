import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { members } from "./members.js";
import { events } from "./events.js";
import { users } from "./users.js";

export const attendance = pgTable("attendance", {
  attendanceId: serial("attendance_id").primaryKey(),
  memberId: integer("member_id").references(() => members.memberId, { onDelete: "cascade" }),
  eventId: integer("event_id").references(() => events.eventId, { onDelete: "cascade" }),
  status: varchar("status", { length: 10 }).$type<"present" | "absent">().notNull().default("present"),
  markedBy: integer("marked_by").references(() => users.userId, { onDelete: "set null" }),
  markedAt: timestamp("marked_at").defaultNow(),
});
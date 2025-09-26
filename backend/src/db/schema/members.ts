import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  memberId: serial("member_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  idNo: varchar("id_no", { length: 20 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  ageGroup: varchar("age_group", { length: 20 }).$type<"child" | "youth" | "adult">().notNull(),
  gender: varchar("gender", { length: 10 }).$type<"male" | "female">().notNull(),
  residence: varchar("residence", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});
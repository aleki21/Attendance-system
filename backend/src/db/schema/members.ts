import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  memberId: serial("member_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  ageGroup: varchar("age_group", { length: 20 }).$type<"child" | "youth" | "adult">().notNull(),
  gender: varchar("gender", { length: 10 }).$type<"male" | "female">().notNull(),
  residence: varchar("residence", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});
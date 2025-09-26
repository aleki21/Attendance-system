import { pgTable, serial, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
    userId: serial("user_id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 20 }).$type().notNull(),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

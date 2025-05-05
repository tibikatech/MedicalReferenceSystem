import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test schema
export const tests = pgTable("tests", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  subCategory: varchar("subCategory").notNull(),
  cptCode: varchar("cptCode"),
  loincCode: varchar("loincCode"),
  snomedCode: varchar("snomedCode"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const insertTestSchema = createInsertSchema(tests);
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

// Bookmark schema (if needed for future implementation)
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: serial("userId").notNull(),
  testId: varchar("testId").notNull().references(() => tests.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true });
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// User schema (from the template, keeping for potential authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

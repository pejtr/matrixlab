import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Face swap jobs table
 * Tracks all face swap operations with their status and file references
 */
export const faceSwapJobs = mysqlTable("faceSwapJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // File references (S3 keys)
  sourceImageKey: varchar("sourceImageKey", { length: 512 }).notNull(),
  targetMediaKey: varchar("targetMediaKey", { length: 512 }).notNull(),
  resultMediaKey: varchar("resultMediaKey", { length: 512 }),
  
  // File URLs
  sourceImageUrl: text("sourceImageUrl").notNull(),
  targetMediaUrl: text("targetMediaUrl").notNull(),
  resultMediaUrl: text("resultMediaUrl"),
  
  // Metadata
  targetMediaType: mysqlEnum("targetMediaType", ["image", "video"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type FaceSwapJob = typeof faceSwapJobs.$inferSelect;
export type InsertFaceSwapJob = typeof faceSwapJobs.$inferInsert;

/**
 * AI Jobs table - Unified table for all AI generation tasks
 * Supports: image generation, video generation, music generation, voice cloning
 */
export const aiJobs = mysqlTable("aiJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Job type and configuration
  jobType: mysqlEnum("jobType", [
    "image_generation",
    "video_text_to_video",
    "video_image_to_video",
    "music_generation",
    "voice_text_to_speech",
    "voice_cloning",
    "voice_design"
  ]).notNull(),
  
  // Input parameters (stored as JSON)
  inputParams: text("inputParams").notNull(), // JSON string
  
  // Input file references (if applicable)
  inputFileKey: varchar("inputFileKey", { length: 512 }),
  inputFileUrl: text("inputFileUrl"),
  
  // Output file references
  outputFileKey: varchar("outputFileKey", { length: 512 }),
  outputFileUrl: text("outputFileUrl"),
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  // Metadata
  model: varchar("model", { length: 128 }), // Which AI model was used
  duration: int("duration"), // Processing time in seconds
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AIJob = typeof aiJobs.$inferSelect;
export type InsertAIJob = typeof aiJobs.$inferInsert;

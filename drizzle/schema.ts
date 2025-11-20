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
  progress: int("progress").default(0).notNull(), // 0-100
  retryCount: int("retryCount").default(0).notNull(), // Number of retry attempts
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  sourceDeletedAt: timestamp("sourceDeletedAt"), // Soft delete for source image (hides from Before lightbox)
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

/**
 * Saved Faces table - Store frequently used source faces for quick reuse
 * Users can save their favorite faces to avoid re-uploading
 */
export const savedFaces = mysqlTable("savedFaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Face image references
  faceImageKey: varchar("faceImageKey", { length: 512 }).notNull(),
  faceImageUrl: text("faceImageUrl").notNull(),
  
  // User-defined name for the face
  name: varchar("name", { length: 128 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete timestamp
});

export type SavedFace = typeof savedFaces.$inferSelect;
export type InsertSavedFace = typeof savedFaces.$inferInsert;

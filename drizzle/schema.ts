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
  modelPreference: mysqlEnum("modelPreference", ["high_quality", "permissive"]).default("high_quality").notNull(), // Model selection: high_quality (NSFW filter) vs permissive (NSFW allowed)
  preserveBody: int("preserveBody").default(0).notNull(), // 0 = disabled, 1 = enabled - preserve body proportions during face swap
  faceBoxes: text("faceBoxes"), // JSON array of detected face coordinates [{x, y, width, height, confidence}] - up to 5 faces
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  progress: int("progress").default(0).notNull(), // 0-100
  retryCount: int("retryCount").default(0).notNull(), // Number of retry attempts
  predictionId: varchar("predictionId", { length: 128 }), // Replicate prediction ID for webhook tracking
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  sourceDeletedAt: timestamp("sourceDeletedAt"), // Soft delete for source image (hides from Before lightbox)
  deletedAt: timestamp("deletedAt"), // Soft delete for entire job (allows undo within time window)
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
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
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

/**
 * Custom Templates table - User-uploaded images as templates for face swap
 * Users can upload their own photos to use as target templates
 */
export const customTemplates = mysqlTable("customTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Template name
  name: varchar("name", { length: 128 }).notNull(),
  
  // Template image references
  thumbnailUrl: text("thumbnailUrl").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
  
  // Media type
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  
  // Category (optional, user can categorize their templates)
  category: varchar("category", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete timestamp
});

export type CustomTemplate = typeof customTemplates.$inferSelect;
export type InsertCustomTemplate = typeof customTemplates.$inferInsert;

/**
 * Favorites table - Store user's favorite face swap results
 * Users can bookmark results into 5 categories (Favorites1-5)
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: int("jobId").notNull(), // Reference to faceSwapJobs.id
  category: int("category").notNull(), // 1, 2, 3, 4, or 5 for Favorites1-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Favorite Categories table - Store custom names for favorite categories
 * Users can edit category names (default: "Favorites 1", "Favorites 2", etc.)
 */
export const favoriteCategories = mysqlTable("favoriteCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: int("category").notNull(), // 1, 2, 3, 4, or 5
  name: varchar("name", { length: 64 }).notNull(), // Custom category name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export type FavoriteCategory = typeof favoriteCategories.$inferSelect;
export type InsertFavoriteCategory = typeof favoriteCategories.$inferInsert;
// Note: predictionId field needs to be added to faceSwapJobs table (line 53)

/**
 * Wan Animate Jobs table
 * Tracks character animation and full body replacement operations
 */
export const wanAnimateJobs = mysqlTable("wanAnimateJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Input file references (S3 keys and URLs)
  characterImageKey: varchar("characterImageKey", { length: 512 }).notNull(),
  characterImageUrl: text("characterImageUrl").notNull(),
  referenceVideoKey: varchar("referenceVideoKey", { length: 512 }).notNull(),
  referenceVideoUrl: text("referenceVideoUrl").notNull(),
  
  // Output file references
  resultVideoKey: varchar("resultVideoKey", { length: 512 }),
  resultVideoUrl: text("resultVideoUrl"),
  
  // Mode: "animation" = animate character, "replacement" = replace character in video
  mode: mysqlEnum("mode", ["animation", "replacement"]).notNull(),
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  progress: int("progress").default(0).notNull(), // 0-100
  retryCount: int("retryCount").default(0).notNull(),
  predictionId: varchar("predictionId", { length: 128 }), // Replicate prediction ID for webhook tracking
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WanAnimateJob = typeof wanAnimateJobs.$inferSelect;
export type InsertWanAnimateJob = typeof wanAnimateJobs.$inferInsert;

/**
 * Image-to-Video Animation Jobs table
 * Tracks image-to-video animation operations using Stable Video Diffusion
 */
export const imageToVideoJobs = mysqlTable("imageToVideoJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Input file references (S3 keys and URLs)
  sourceImageKey: varchar("sourceImageKey", { length: 512 }).notNull(),
  sourceImageUrl: text("sourceImageUrl").notNull(),
  
  // Output file references
  resultVideoKey: varchar("resultVideoKey", { length: 512 }),
  resultVideoUrl: text("resultVideoUrl"),
  
  // Animation parameters
  motionBucketId: int("motionBucketId").default(127).notNull(), // 1-255, controls motion amount (higher = more motion)
  fps: int("fps").default(6).notNull(), // Frames per second (6-30)
  numFrames: int("numFrames").default(14).notNull(), // Number of frames to generate (14-25)
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  progress: int("progress").default(0).notNull(), // 0-100
  retryCount: int("retryCount").default(0).notNull(),
  predictionId: varchar("predictionId", { length: 128 }), // Replicate prediction ID for webhook tracking
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImageToVideoJob = typeof imageToVideoJobs.$inferSelect;
export type InsertImageToVideoJob = typeof imageToVideoJobs.$inferInsert;

// ========================================
// MONETIZATION TABLES
// ========================================

/**
 * Subscription Plans table - Defines available subscription tiers
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  priceMonthly: int("priceMonthly").notNull(), // Price in cents (e.g., 900 = $9.00)
  priceYearly: int("priceYearly").notNull(), // Price in cents for yearly billing
  creditsMonthly: int("creditsMonthly").notNull(),
  features: text("features"), // JSON array of features
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User Credits table - Tracks credit balance for each user
 */
export const userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(50).notNull(), // Starting balance for new users
  totalPurchased: int("totalPurchased").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;
export type InsertUserCredit = typeof userCredits.$inferInsert;

/**
 * Credit Transactions table - History of all credit movements
 */
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Positive = add, Negative = subtract
  type: mysqlEnum("type", ["purchase", "earn", "spend", "bonus", "expire", "refund"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  referenceType: varchar("referenceType", { length: 50 }), // e.g., "subscription", "pack", "generation", "bonus_rule"
  referenceId: int("referenceId"), // ID of related record
  balanceAfter: int("balanceAfter").notNull(), // Balance after this transaction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * User Subscriptions table - Active subscriptions for users
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"]).default("active").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Credit Packs table - One-time credit purchase packages
 */
export const creditPacks = mysqlTable("creditPacks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  credits: int("credits").notNull(),
  price: int("price").notNull(), // Price in cents
  bonusCredits: int("bonusCredits").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPack = typeof creditPacks.$inferSelect;
export type InsertCreditPack = typeof creditPacks.$inferInsert;

/**
 * Bonus Rules table - Defines rules for earning bonus credits
 */
export const bonusRules = mysqlTable("bonusRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", [
    "daily_login",
    "first_generation",
    "share",
    "referral",
    "streak_7",
    "streak_30",
    "review",
    "profile_complete"
  ]).notNull(),
  credits: int("credits").notNull(),
  maxClaims: int("maxClaims").default(-1).notNull(), // -1 = unlimited
  cooldownHours: int("cooldownHours").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BonusRule = typeof bonusRules.$inferSelect;
export type InsertBonusRule = typeof bonusRules.$inferInsert;

/**
 * User Bonuses table - History of claimed bonuses
 */
export const userBonuses = mysqlTable("userBonuses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bonusRuleId: int("bonusRuleId").notNull(),
  creditsEarned: int("creditsEarned").notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
});

export type UserBonus = typeof userBonuses.$inferSelect;
export type InsertUserBonus = typeof userBonuses.$inferInsert;

import { eq, desc, and, or, lt, inArray, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  faceSwapJobs,
  InsertFaceSwapJob,
  FaceSwapJob,
  wanAnimateJobs,
  InsertWanAnimateJob,
  WanAnimateJob,
  favorites,
  aiJobs,
  InsertAIJob,
  AIJob,
  savedFaces,
  InsertSavedFace,
  SavedFace,
  customTemplates,
  InsertCustomTemplate,
  CustomTemplate,
  InsertFavorite,
  Favorite,
  favoriteCategories,
  subscriptionPlans,
  SubscriptionPlan,
  InsertSubscriptionPlan,
  userCredits,
  UserCredit,
  InsertUserCredit,
  creditTransactions,
  CreditTransaction,
  InsertCreditTransaction,
  userSubscriptions,
  UserSubscription,
  InsertUserSubscription,
  creditPacks,
  CreditPack,
  InsertCreditPack,
  bonusRules,
  BonusRule,
  InsertBonusRule,
  userBonuses,
  UserBonus,
  InsertUserBonus,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Create the drizzle instance once
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connection established");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Wrapper for database operations with retry logic
export async function withDbRetry<T>(operation: (db: ReturnType<typeof drizzle>) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }
      return await operation(db);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = error.code === 'ECONNRESET' || 
                               error.code === 'ETIMEDOUT' ||
                               error.code === 'ENOTFOUND' ||
                               error.message?.includes('Connection');
      
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[Database] Connection error on attempt ${attempt}/${maxRetries}, retrying...`);
        // Reset connection and retry
        _db = null;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      // Not a connection error or max retries reached
      throw error;
    }
  }
  
  throw lastError || new Error("Database operation failed");
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Face swap job queries
export async function createFaceSwapJob(job: InsertFaceSwapJob): Promise<FaceSwapJob> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(faceSwapJobs).values(job);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(faceSwapJobs).where(eq(faceSwapJobs.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted job");
  }
  
  return inserted[0];
}

export async function getFaceSwapJobById(jobId: number): Promise<FaceSwapJob | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(faceSwapJobs).where(eq(faceSwapJobs.id, jobId)).limit(1);
  return result[0];
}

export async function getUserFaceSwapJobs(
  userId: number,
  options?: { limit?: number; cursor?: number }
): Promise<Array<FaceSwapJob & { favoriteCategory: number | null }>> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // LEFT JOIN with favorites to include favoriteCategory
  const results = await db
    .select({
      id: faceSwapJobs.id,
      userId: faceSwapJobs.userId,
      sourceImageKey: faceSwapJobs.sourceImageKey,
      targetMediaKey: faceSwapJobs.targetMediaKey,
      resultMediaKey: faceSwapJobs.resultMediaKey,
      sourceImageUrl: faceSwapJobs.sourceImageUrl,
      targetMediaUrl: faceSwapJobs.targetMediaUrl,
      resultMediaUrl: faceSwapJobs.resultMediaUrl,
      targetMediaType: faceSwapJobs.targetMediaType,
      modelPreference: faceSwapJobs.modelPreference,
      preserveBody: faceSwapJobs.preserveBody,
      faceBoxes: faceSwapJobs.faceBoxes,
      status: faceSwapJobs.status,
      errorMessage: faceSwapJobs.errorMessage,
      progress: faceSwapJobs.progress,
      retryCount: faceSwapJobs.retryCount,
      predictionId: faceSwapJobs.predictionId,
      createdAt: faceSwapJobs.createdAt,
      updatedAt: faceSwapJobs.updatedAt,
      completedAt: faceSwapJobs.completedAt,
      sourceDeletedAt: faceSwapJobs.sourceDeletedAt,
      favoriteCategory: favorites.category,
    })
    .from(faceSwapJobs)
    .leftJoin(favorites, and(
      eq(favorites.jobId, faceSwapJobs.id),
      eq(favorites.userId, userId)
    ))
    .where(
      options?.cursor
        ? and(
            eq(faceSwapJobs.userId, userId),
            lt(faceSwapJobs.id, options.cursor) // Get jobs with ID less than cursor (older jobs)
          )
        : eq(faceSwapJobs.userId, userId)
    )
    .orderBy(desc(faceSwapJobs.id)) // Order by ID descending (newest first)
    .limit(options?.limit || 60);

  return results as Array<FaceSwapJob & { favoriteCategory: number | null }>;
}

export async function getUniqueSavedSourceFaces(userId: number): Promise<Array<{ sourceImageUrl: string; sourceImageKey: string }>> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get completed jobs with source images that haven't been deleted
  const jobs = await db
    .select({
      sourceImageUrl: faceSwapJobs.sourceImageUrl,
      sourceImageKey: faceSwapJobs.sourceImageKey,
    })
    .from(faceSwapJobs)
    .where(
      and(
        eq(faceSwapJobs.userId, userId),
        eq(faceSwapJobs.status, 'completed'),
        isNull(faceSwapJobs.sourceDeletedAt)
      )
    )
    .orderBy(desc(faceSwapJobs.createdAt));

  // Remove duplicates based on sourceImageUrl
  const uniqueFaces = new Map<string, { sourceImageUrl: string; sourceImageKey: string }>();
  for (const job of jobs) {
    if (job.sourceImageUrl && !uniqueFaces.has(job.sourceImageUrl)) {
      uniqueFaces.set(job.sourceImageUrl, {
        sourceImageUrl: job.sourceImageUrl,
        sourceImageKey: job.sourceImageKey || '',
      });
    }
  }

  return Array.from(uniqueFaces.values());
}

export async function updateFaceSwapJobStatus(
  jobId: number,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  updates?: {
    resultMediaKey?: string;
    resultMediaUrl?: string;
    errorMessage?: string;
    completedAt?: Date;
    progress?: number;
    retryCount?: number;
    predictionId?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Monotonic progress validation: only update if new progress > current progress
  if (updates?.progress !== undefined && status === "processing") {
    const currentJob = await db.select().from(faceSwapJobs).where(eq(faceSwapJobs.id, jobId)).limit(1);
    if (currentJob.length > 0) {
      const currentProgress = currentJob[0].progress || 0;
      if (updates.progress < currentProgress) {
        console.log(`[DB] Skipping progress update: ${updates.progress}% < ${currentProgress}% (job #${jobId})`);
        // Skip progress update but allow other fields to update
        delete updates.progress;
      }
    }
  }

  const updateData: Record<string, unknown> = { status };
  
  if (updates?.resultMediaKey) updateData.resultMediaKey = updates.resultMediaKey;
  if (updates?.resultMediaUrl) updateData.resultMediaUrl = updates.resultMediaUrl;
  if (updates?.errorMessage) updateData.errorMessage = updates.errorMessage;
  if (updates?.completedAt) updateData.completedAt = updates.completedAt;
  if (updates?.progress !== undefined) updateData.progress = updates.progress;
  if (updates?.retryCount !== undefined) updateData.retryCount = updates.retryCount;
  if (updates?.predictionId) updateData.predictionId = updates.predictionId;

  await db.update(faceSwapJobs).set(updateData).where(eq(faceSwapJobs.id, jobId));
}

export async function deleteFaceSwapJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(faceSwapJobs).where(eq(faceSwapJobs.id, jobId));
}

export async function updateFaceSwapJobResult(
  jobId: number,
  resultMediaUrl: string,
  resultMediaKey: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(faceSwapJobs).set({
    resultMediaUrl,
    resultMediaKey,
    updatedAt: new Date(),
  }).where(eq(faceSwapJobs.id, jobId));
}

// AI job queries

export async function createAIJob(job: InsertAIJob): Promise<AIJob> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(aiJobs).values(job);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(aiJobs).where(eq(aiJobs.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted AI job");
  }
  
  return inserted[0];
}

export async function getAIJobById(jobId: number): Promise<AIJob | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1);
  return result[0];
}

export async function getUserAIJobs(userId: number): Promise<AIJob[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(aiJobs).where(eq(aiJobs.userId, userId)).orderBy(desc(aiJobs.createdAt));
}

// Saved faces queries

export async function createSavedFace(face: InsertSavedFace): Promise<SavedFace> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(savedFaces).values(face);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(savedFaces).where(eq(savedFaces.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted saved face");
  }
  
  return inserted[0];
}

export async function getUserSavedFaces(userId: number): Promise<SavedFace[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(savedFaces).where(eq(savedFaces.userId, userId)).orderBy(desc(savedFaces.createdAt));
}

export async function deleteSavedFace(faceId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(savedFaces).where(eq(savedFaces.id, faceId));
}

export async function softDeleteSourceImage(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(faceSwapJobs)
    .set({ sourceDeletedAt: new Date() })
    .where(eq(faceSwapJobs.id, jobId));
}

// Custom templates queries

export async function createCustomTemplate(template: InsertCustomTemplate): Promise<CustomTemplate> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(customTemplates).values(template);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(customTemplates).where(eq(customTemplates.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted custom template");
  }
  
  return inserted[0];
}

export async function getUserCustomTemplates(userId: number): Promise<CustomTemplate[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(customTemplates)
    .where(and(eq(customTemplates.userId, userId), isNull(customTemplates.deletedAt)))
    .orderBy(desc(customTemplates.createdAt));
}

export async function deleteCustomTemplate(templateId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Soft delete
  await db.update(customTemplates)
    .set({ deletedAt: new Date() })
    .where(and(eq(customTemplates.id, templateId), eq(customTemplates.userId, userId)));
}

export async function retryAllFailedJobs(userId: number): Promise<number> {
  return withDbRetry(async (db) => {
    // Reset all failed jobs to pending status for retry
    const result = await db
      .update(faceSwapJobs)
      .set({
        status: "pending",
        errorMessage: null,
        progress: 0,
        retryCount: 0,
        updatedAt: new Date(),
      })
      .where(and(eq(faceSwapJobs.userId, userId), eq(faceSwapJobs.status, "failed")));
    
    // Return number of jobs retried
    return result[0]?.affectedRows || 0;
  });
}

// Favorites queries

export async function addFavorite(userId: number, jobId: number, category: number): Promise<Favorite> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if already favorited in this category
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.jobId, jobId), eq(favorites.category, category)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!;
  }

  const result = await db.insert(favorites).values({ userId, jobId, category });
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(favorites).where(eq(favorites.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to create favorite");
  }

  return inserted[0];
}

export async function removeFavorite(userId: number, jobId: number, category: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.jobId, jobId), eq(favorites.category, category)));
}

export async function getUserFavorites(userId: number, category?: number): Promise<FaceSwapJob[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Join favorites with faceSwapJobs to get full job data
  if (category) {
    return db.select({
      id: faceSwapJobs.id,
      userId: faceSwapJobs.userId,
      sourceImageKey: faceSwapJobs.sourceImageKey,
      targetMediaKey: faceSwapJobs.targetMediaKey,
      resultMediaKey: faceSwapJobs.resultMediaKey,
      sourceImageUrl: faceSwapJobs.sourceImageUrl,
      targetMediaUrl: faceSwapJobs.targetMediaUrl,
      resultMediaUrl: faceSwapJobs.resultMediaUrl,
      targetMediaType: faceSwapJobs.targetMediaType,
      modelPreference: faceSwapJobs.modelPreference,
      preserveBody: faceSwapJobs.preserveBody,
      faceBoxes: faceSwapJobs.faceBoxes,
      status: faceSwapJobs.status,
      errorMessage: faceSwapJobs.errorMessage,
      progress: faceSwapJobs.progress,
      retryCount: faceSwapJobs.retryCount,
      predictionId: faceSwapJobs.predictionId,
      createdAt: faceSwapJobs.createdAt,
      updatedAt: faceSwapJobs.updatedAt,
      completedAt: faceSwapJobs.completedAt,
      sourceDeletedAt: faceSwapJobs.sourceDeletedAt,
      deletedAt: faceSwapJobs.deletedAt,
    })
    .from(favorites)
    .innerJoin(faceSwapJobs, eq(favorites.jobId, faceSwapJobs.id))
    .where(and(eq(favorites.userId, userId), eq(favorites.category, category)))
    .orderBy(desc(favorites.createdAt));
  }

  return db.select({
    id: faceSwapJobs.id,
    userId: faceSwapJobs.userId,
    sourceImageKey: faceSwapJobs.sourceImageKey,
    targetMediaKey: faceSwapJobs.targetMediaKey,
    resultMediaKey: faceSwapJobs.resultMediaKey,
    sourceImageUrl: faceSwapJobs.sourceImageUrl,
    targetMediaUrl: faceSwapJobs.targetMediaUrl,
    resultMediaUrl: faceSwapJobs.resultMediaUrl,
    targetMediaType: faceSwapJobs.targetMediaType,
    modelPreference: faceSwapJobs.modelPreference,
    preserveBody: faceSwapJobs.preserveBody,
    faceBoxes: faceSwapJobs.faceBoxes,
    status: faceSwapJobs.status,
    errorMessage: faceSwapJobs.errorMessage,
    progress: faceSwapJobs.progress,
    retryCount: faceSwapJobs.retryCount,
    predictionId: faceSwapJobs.predictionId,
    createdAt: faceSwapJobs.createdAt,
    updatedAt: faceSwapJobs.updatedAt,
    completedAt: faceSwapJobs.completedAt,
    sourceDeletedAt: faceSwapJobs.sourceDeletedAt,
    deletedAt: faceSwapJobs.deletedAt,
  })
  .from(favorites)
  .innerJoin(faceSwapJobs, eq(favorites.jobId, faceSwapJobs.id))
  .where(eq(favorites.userId, userId))
  .orderBy(desc(favorites.createdAt));
}

export async function getFavoriteByJobAndCategory(userId: number, jobId: number, category: number): Promise<Favorite | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.jobId, jobId), eq(favorites.category, category)))
    .limit(1);

  return result[0];
}

export async function getAllUserFavorites(userId: number): Promise<Favorite[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(favorites).where(eq(favorites.userId, userId));
}

export async function getFavoriteCountsByCategory(userId: number): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
  
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allFavorites.forEach(fav => {
    counts[fav.category] = (counts[fav.category] || 0) + 1;
  });

  return counts;
}

// Category Names Management
export async function getCategoryNames(userId: number): Promise<Record<number, string>> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const categories = await db.select().from(favoriteCategories).where(eq(favoriteCategories.userId, userId));
  
  const defaults: Record<number, string> = {
    1: "Favorites 1",
    2: "Favorites 2",
    3: "Favorites 3",
    4: "Favorites 4",
    5: "Favorites 5",
  };
  
  categories.forEach(cat => {
    defaults[cat.category] = cat.name;
  });
  
  return defaults;
}

export async function updateCategoryName(userId: number, category: number, name: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if category name already exists
  const existing = await db.select().from(favoriteCategories)
    .where(and(eq(favoriteCategories.userId, userId), eq(favoriteCategories.category, category)))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(favoriteCategories)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(favoriteCategories.userId, userId), eq(favoriteCategories.category, category)));
  } else {
    // Insert new
    await db.insert(favoriteCategories).values({
      userId,
      category,
      name,
    });
  }
}


// Wan Animate job queries
export async function createWanAnimateJob(job: InsertWanAnimateJob): Promise<WanAnimateJob> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(wanAnimateJobs).values(job);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(wanAnimateJobs).where(eq(wanAnimateJobs.id, insertedId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted Wan Animate job");
  }
  
  return inserted[0];
}

export async function getWanAnimateJobById(jobId: number): Promise<WanAnimateJob | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(wanAnimateJobs).where(eq(wanAnimateJobs.id, jobId)).limit(1);
  return result[0];
}

export async function getWanAnimateJobsByUserId(userId: number): Promise<WanAnimateJob[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(wanAnimateJobs).where(eq(wanAnimateJobs.userId, userId)).orderBy(desc(wanAnimateJobs.createdAt));
}

export async function updateWanAnimateJob(
  jobId: number,
  updates: Partial<WanAnimateJob>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(wanAnimateJobs).set(updates).where(eq(wanAnimateJobs.id, jobId));
}

export async function updateWanAnimateJobStatus(
  jobId: number,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  updates?: {
    resultVideoKey?: string;
    resultVideoUrl?: string;
    errorMessage?: string;
    completedAt?: Date;
    progress?: number;
    retryCount?: number;
    predictionId?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = { status };
  
  if (updates) {
    Object.assign(updateData, updates);
  }

  await db.update(wanAnimateJobs).set(updateData).where(eq(wanAnimateJobs.id, jobId));
}

export async function deleteWanAnimateJob(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(wanAnimateJobs).where(eq(wanAnimateJobs.id, jobId));
}

// Cleanup old pending/processing jobs (older than 1 hour)
export async function cleanupOldJobs(): Promise<{ deletedCount: number }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Cleanup] Database not available");
    return { deletedCount: 0 };
  }

  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    
    // Delete old PENDING face swap jobs (10 minutes)
    const pendingResult = await db
      .delete(faceSwapJobs)
      .where(
        and(
          eq(faceSwapJobs.status, 'pending'),
          lt(faceSwapJobs.createdAt, tenMinutesAgo)
        )
      );
    
    // Delete old PROCESSING face swap jobs (1 hour - longer timeout for API calls)
    const processingResult = await db
      .delete(faceSwapJobs)
      .where(
        and(
          eq(faceSwapJobs.status, 'processing'),
          lt(faceSwapJobs.createdAt, oneHourAgo)
        )
      );
    
    // Delete old pending/processing Wan Animate jobs
    const wanAnimateResult = await db
      .delete(wanAnimateJobs)
      .where(
        and(
          or(
            eq(wanAnimateJobs.status, 'pending'),
            eq(wanAnimateJobs.status, 'processing')
          ),
          lt(wanAnimateJobs.createdAt, oneHourAgo)
        )
      );
    
    const totalDeleted = (pendingResult[0]?.affectedRows || 0) + (processingResult[0]?.affectedRows || 0) + (wanAnimateResult[0]?.affectedRows || 0);
    
    if (totalDeleted > 0) {
      console.log(`[Cleanup] Deleted ${totalDeleted} old pending/processing jobs`);
    }
    
    return { deletedCount: totalDeleted };
  } catch (error) {
    console.error("[Cleanup] Error cleaning up old jobs:", error);
    return { deletedCount: 0 };
  }
}

// ========================================
// MONETIZATION QUERIES
// ========================================

// --- Subscription Plans ---

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, 1))
    .orderBy(subscriptionPlans.sortOrder);
}

export async function getSubscriptionPlanById(planId: number): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  return result[0];
}

export async function getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, name)).limit(1);
  return result[0];
}

// --- User Credits ---

export async function getUserCredits(userId: number): Promise<UserCredit> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  
  if (result.length > 0) {
    return result[0];
  }

  // Create default credits for new user
  const newCredits: InsertUserCredit = {
    userId,
    balance: 50,
    totalPurchased: 0,
    totalEarned: 0,
    totalSpent: 0,
  };

  await db.insert(userCredits).values(newCredits);
  const inserted = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  
  if (!inserted[0]) {
    throw new Error("Failed to create user credits");
  }

  return inserted[0];
}

export async function updateUserCredits(
  userId: number,
  amount: number,
  type: "purchase" | "earn" | "spend" | "bonus" | "expire" | "refund",
  description: string,
  referenceType?: string,
  referenceId?: number
): Promise<UserCredit> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get current credits
  const currentCredits = await getUserCredits(userId);
  
  // Calculate new balance
  const newBalance = currentCredits.balance + amount;
  
  if (newBalance < 0) {
    throw new Error("Insufficient credits");
  }

  // Update credits
  const updateData: Record<string, number> = { balance: newBalance };
  
  if (type === "purchase") {
    updateData.totalPurchased = currentCredits.totalPurchased + Math.abs(amount);
  } else if (type === "earn" || type === "bonus") {
    updateData.totalEarned = currentCredits.totalEarned + Math.abs(amount);
  } else if (type === "spend") {
    updateData.totalSpent = currentCredits.totalSpent + Math.abs(amount);
  }

  await db.update(userCredits).set(updateData).where(eq(userCredits.userId, userId));

  // Record transaction
  const transaction: InsertCreditTransaction = {
    userId,
    amount,
    type,
    description,
    referenceType: referenceType || null,
    referenceId: referenceId || null,
    balanceAfter: newBalance,
  };

  await db.insert(creditTransactions).values(transaction);

  // Return updated credits
  const updated = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return updated[0];
}

export async function spendCredits(
  userId: number,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: number
): Promise<UserCredit> {
  return updateUserCredits(userId, -amount, "spend", description, referenceType, referenceId);
}

export async function addCredits(
  userId: number,
  amount: number,
  type: "purchase" | "earn" | "bonus",
  description: string,
  referenceType?: string,
  referenceId?: number
): Promise<UserCredit> {
  return updateUserCredits(userId, amount, type, description, referenceType, referenceId);
}

// --- Credit Transactions ---

export async function getCreditTransactions(
  userId: number,
  options?: { limit?: number; offset?: number }
): Promise<CreditTransaction[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

// --- User Subscriptions ---

export async function getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  return result[0];
}

export async function createOrUpdateSubscription(
  userId: number,
  planId: number,
  billingCycle: "monthly" | "yearly",
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
): Promise<UserSubscription> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  
  if (billingCycle === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const existing = await getUserSubscription(userId);

  if (existing) {
    // Update existing subscription
    await db.update(userSubscriptions).set({
      planId,
      billingCycle,
      stripeSubscriptionId: stripeSubscriptionId || existing.stripeSubscriptionId,
      stripeCustomerId: stripeCustomerId || existing.stripeCustomerId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: "active",
      updatedAt: now,
    }).where(eq(userSubscriptions.userId, userId));

    const updated = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
    return updated[0];
  } else {
    // Create new subscription
    const newSubscription: InsertUserSubscription = {
      userId,
      planId,
      billingCycle,
      stripeSubscriptionId: stripeSubscriptionId || null,
      stripeCustomerId: stripeCustomerId || null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: 0,
    };

    await db.insert(userSubscriptions).values(newSubscription);
    const inserted = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
    return inserted[0];
  }
}

// --- Credit Packs ---

export async function getCreditPacks(): Promise<CreditPack[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(creditPacks)
    .where(eq(creditPacks.isActive, 1))
    .orderBy(creditPacks.sortOrder);
}

export async function getCreditPackById(packId: number): Promise<CreditPack | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(creditPacks).where(eq(creditPacks.id, packId)).limit(1);
  return result[0];
}

// --- Bonus Rules ---

export async function getBonusRules(): Promise<BonusRule[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(bonusRules).where(eq(bonusRules.isActive, 1));
}

export async function getBonusRuleById(ruleId: number): Promise<BonusRule | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(bonusRules).where(eq(bonusRules.id, ruleId)).limit(1);
  return result[0];
}

export async function getBonusRuleByType(type: string): Promise<BonusRule | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(bonusRules).where(eq(bonusRules.type, type as any)).limit(1);
  return result[0];
}

// --- User Bonuses ---

export async function claimBonus(
  userId: number,
  bonusRuleId: number
): Promise<{ success: boolean; creditsEarned: number; message: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get bonus rule
  const rule = await getBonusRuleById(bonusRuleId);
  if (!rule) {
    return { success: false, creditsEarned: 0, message: "Bonus rule not found" };
  }

  // Check if user has already claimed max times
  if (rule.maxClaims !== -1) {
    const existingClaims = await db.select().from(userBonuses)
      .where(and(eq(userBonuses.userId, userId), eq(userBonuses.bonusRuleId, bonusRuleId)));
    
    if (existingClaims.length >= rule.maxClaims) {
      return { success: false, creditsEarned: 0, message: "Maximum claims reached" };
    }
  }

  // Check cooldown
  if (rule.cooldownHours > 0) {
    const lastClaim = await db.select().from(userBonuses)
      .where(and(eq(userBonuses.userId, userId), eq(userBonuses.bonusRuleId, bonusRuleId)))
      .orderBy(desc(userBonuses.claimedAt))
      .limit(1);

    if (lastClaim.length > 0) {
      const lastClaimTime = new Date(lastClaim[0].claimedAt).getTime();
      const cooldownMs = rule.cooldownHours * 60 * 60 * 1000;
      const now = Date.now();

      if (now - lastClaimTime < cooldownMs) {
        const hoursLeft = Math.ceil((cooldownMs - (now - lastClaimTime)) / (60 * 60 * 1000));
        return { success: false, creditsEarned: 0, message: `Cooldown active. Try again in ${hoursLeft} hours` };
      }
    }
  }

  // Claim the bonus
  const bonusClaim: InsertUserBonus = {
    userId,
    bonusRuleId,
    creditsEarned: rule.credits,
  };

  await db.insert(userBonuses).values(bonusClaim);

  // Add credits to user
  await addCredits(userId, rule.credits, "bonus", `${rule.name} bonus`);

  return {
    success: true,
    creditsEarned: rule.credits,
    message: `Successfully claimed ${rule.name} bonus!`,
  };
}

export async function getUserBonusHistory(userId: number): Promise<UserBonus[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(userBonuses)
    .where(eq(userBonuses.userId, userId))
    .orderBy(desc(userBonuses.claimedAt));
}

export async function canClaimBonus(userId: number, bonusRuleId: number): Promise<{ canClaim: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const rule = await getBonusRuleById(bonusRuleId);
  if (!rule) {
    return { canClaim: false, reason: "Bonus rule not found" };
  }

  // Check max claims
  if (rule.maxClaims !== -1) {
    const existingClaims = await db.select().from(userBonuses)
      .where(and(eq(userBonuses.userId, userId), eq(userBonuses.bonusRuleId, bonusRuleId)));
    
    if (existingClaims.length >= rule.maxClaims) {
      return { canClaim: false, reason: "Maximum claims reached" };
    }
  }

  // Check cooldown
  if (rule.cooldownHours > 0) {
    const lastClaim = await db.select().from(userBonuses)
      .where(and(eq(userBonuses.userId, userId), eq(userBonuses.bonusRuleId, bonusRuleId)))
      .orderBy(desc(userBonuses.claimedAt))
      .limit(1);

    if (lastClaim.length > 0) {
      const lastClaimTime = new Date(lastClaim[0].claimedAt).getTime();
      const cooldownMs = rule.cooldownHours * 60 * 60 * 1000;
      const now = Date.now();

      if (now - lastClaimTime < cooldownMs) {
        const hoursLeft = Math.ceil((cooldownMs - (now - lastClaimTime)) / (60 * 60 * 1000));
        return { canClaim: false, reason: `Cooldown active. Try again in ${hoursLeft} hours` };
      }
    }
  }

  return { canClaim: true };
}

import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, faceSwapJobs, InsertFaceSwapJob, FaceSwapJob } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

export async function getUserFaceSwapJobs(userId: number): Promise<FaceSwapJob[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(faceSwapJobs).where(eq(faceSwapJobs.userId, userId)).orderBy(desc(faceSwapJobs.createdAt));
}

export async function updateFaceSwapJobStatus(
  jobId: number,
  status: "pending" | "processing" | "completed" | "failed",
  updates?: {
    resultMediaKey?: string;
    resultMediaUrl?: string;
    errorMessage?: string;
    completedAt?: Date;
    progress?: number;
    retryCount?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, unknown> = { status };
  
  if (updates?.resultMediaKey) updateData.resultMediaKey = updates.resultMediaKey;
  if (updates?.resultMediaUrl) updateData.resultMediaUrl = updates.resultMediaUrl;
  if (updates?.errorMessage) updateData.errorMessage = updates.errorMessage;
  if (updates?.completedAt) updateData.completedAt = updates.completedAt;
  if (updates?.progress !== undefined) updateData.progress = updates.progress;
  if (updates?.retryCount !== undefined) updateData.retryCount = updates.retryCount;

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
import { aiJobs, InsertAIJob, AIJob } from "../drizzle/schema";

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
import { savedFaces, InsertSavedFace, SavedFace } from "../drizzle/schema";

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

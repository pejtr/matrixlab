import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createFaceSwapJob, getFaceSwapJobById, getUserFaceSwapJobs, updateFaceSwapJobStatus, deleteFaceSwapJob, softDeleteSourceImage, createAIJob, getAIJobById, getUserAIJobs } from "./db";
import * as minimaxService from "./minimaxService";
import * as replicateService from "./replicateService";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  faceSwap: router({
    // Upload source image and get presigned URL
    uploadSource: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `user-${userId}/source/${timestamp}-${randomSuffix}-${input.filename}`;
        
        return {
          fileKey,
          uploadUrl: `/api/faceswap/upload/${encodeURIComponent(fileKey)}`,
        };
      }),

    // Upload target media and get presigned URL
    uploadTarget: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `user-${userId}/target/${timestamp}-${randomSuffix}-${input.filename}`;
        
        return {
          fileKey,
          uploadUrl: `/api/faceswap/upload/${encodeURIComponent(fileKey)}`,
        };
      }),

    // Confirm upload and store in S3
    confirmUpload: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // First upload to Forge storage
        const result = await storagePut(input.fileKey, buffer, input.contentType);
        
        // Then create a publicly accessible URL using manus-upload-file
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');
        const { execSync } = await import('child_process');
        
        try {
          // Write buffer to temp file
          const tempDir = os.tmpdir();
          const tempFile = path.join(tempDir, `upload-${Date.now()}-${input.fileKey.split('/').pop()}`);
          fs.writeFileSync(tempFile, buffer);
          
          // Upload to public S3 using manus-upload-file
          const publicUrl = execSync(`manus-upload-file "${tempFile}"`, { encoding: 'utf-8' }).trim();
          
          // Clean up temp file
          fs.unlinkSync(tempFile);
          
          console.log(`[Storage] Created public URL: ${publicUrl}`);
          
          return {
            url: publicUrl, // Use public URL for Replicate API
            key: result.key,
          };
        } catch (error) {
          console.error('[Storage] Failed to create public URL, falling back to Forge URL:', error);
          return {
            url: result.url,
            key: result.key,
          };
        }
      }),

    // Create a new face swap job
    createJob: protectedProcedure
      .input(z.object({
        sourceImageKey: z.string(),
        sourceImageUrl: z.string(),
        targetMediaKey: z.string(),
        targetMediaUrl: z.string(),
        targetMediaType: z.enum(["image", "video"]),
        modelPreference: z.enum(["high_quality", "permissive"]).optional(),
        preserveBody: z.number().optional(), // 0 = disabled, 1 = enabled
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await createFaceSwapJob({
          userId: ctx.user.id,
          sourceImageKey: input.sourceImageKey,
          sourceImageUrl: input.sourceImageUrl,
          targetMediaKey: input.targetMediaKey,
          targetMediaUrl: input.targetMediaUrl,
          targetMediaType: input.targetMediaType,
          modelPreference: input.modelPreference || "high_quality",
          preserveBody: input.preserveBody || 0,
          status: "pending",
        });

        // TODO: Trigger worker process to handle the job
        // For now, we'll just return the job
        // In production, you would enqueue this to Redis or similar
        
        return job;
      }),

    // Get job status
    getJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const job = await getFaceSwapJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Verify the job belongs to the user
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to access this job",
          });
        }

        return job;
      }),

    // Get user's job history
    getMyJobs: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserFaceSwapJobs(ctx.user.id);
      }),

    // Update job status (for worker process)
    updateJobStatus: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
        resultMediaKey: z.string().optional(),
        resultMediaUrl: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateFaceSwapJobStatus(input.jobId, input.status, {
          resultMediaKey: input.resultMediaKey,
          resultMediaUrl: input.resultMediaUrl,
          errorMessage: input.errorMessage,
          completedAt: input.status === "completed" ? new Date() : undefined,
        });

        return { success: true };
      }),

    // Soft delete source image (hides from Before lightbox, keeps job visible)
    softDeleteSourceImage: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await getFaceSwapJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Verify the job belongs to the user
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to modify this job",
          });
        }

        // Soft delete source image
        await softDeleteSourceImage(input.jobId);

        return { success: true };
      }),

    // Delete job
    deleteJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await getFaceSwapJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Verify the job belongs to the user
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this job",
          });
        }

        // TODO: Delete files from S3
        // await storageDelete(job.sourceImageKey);
        // await storageDelete(job.targetMediaKey);
        // if (job.resultMediaKey) await storageDelete(job.resultMediaKey);

        // Delete from database
        await deleteFaceSwapJob(input.jobId);

        return { success: true };
      }),

    // Cancel pending/processing job
    cancelJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await getFaceSwapJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Verify the job belongs to the user
        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to cancel this job",
          });
        }

        // Only allow cancelling pending or processing jobs
        if (job.status !== "pending" && job.status !== "processing") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only cancel pending or processing jobs",
          });
        }

        // Update job status to cancelled
        await updateFaceSwapJobStatus(input.jobId, "cancelled");

        return { success: true };
      }),

    // Update job result URL (for cropped images)
    updateJobResult: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        resultMediaUrl: z.string(),
        resultMediaKey: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify job belongs to user
        const job = await getFaceSwapJobById(input.jobId);
        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to update this job",
          });
        }

        // Update job with new result URL
        const { updateFaceSwapJobResult } = await import("./db");
        await updateFaceSwapJobResult(input.jobId, input.resultMediaUrl, input.resultMediaKey);

        return { success: true };
      }),

    // Retry all failed jobs
    retryAllFailed: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { retryAllFailedJobs } = await import("./db");
        const retriedCount = await retryAllFailedJobs(ctx.user.id);
        return { success: true, retriedCount };
      }),

    // Add to favorites
    addFavorite: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        category: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { addFavorite } = await import("./db");
        const favorite = await addFavorite(ctx.user.id, input.jobId, input.category);
        return favorite;
      }),

    // Remove from favorites
    removeFavorite: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        category: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { removeFavorite } = await import("./db");
        await removeFavorite(ctx.user.id, input.jobId, input.category);
        return { success: true };
      }),

    // Get user's favorites
    getMyFavorites: protectedProcedure
      .input(z.object({
        category: z.number().min(1).max(5).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getUserFavorites } = await import("./db");
        return getUserFavorites(ctx.user.id, input?.category);
      }),

    // Get favorite counts by category
    getFavoriteCounts: protectedProcedure
      .query(async ({ ctx }) => {
        const { getFavoriteCountsByCategory } = await import("./db");
        return getFavoriteCountsByCategory(ctx.user.id);
      }),

    // Get all user's favorites (for bookmark UI)
    getAllFavorites: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAllUserFavorites } = await import("./db");
        return getAllUserFavorites(ctx.user.id);
      }),

    // Get category names
    getCategoryNames: protectedProcedure
      .query(async ({ ctx }) => {
        const { getCategoryNames } = await import("./db");
        return getCategoryNames(ctx.user.id);
      }),

    // Update category name
    updateCategoryName: protectedProcedure
      .input(z.object({
        category: z.number().min(1).max(5),
        name: z.string().min(1).max(64),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateCategoryName } = await import("./db");
        return updateCategoryName(ctx.user.id, input.category, input.name);
      }),

    // Download all favorites as ZIP
    downloadFavoritesZip: protectedProcedure
      .input(z.object({
        category: z.number().min(1).max(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserFavorites } = await import("./db");
        const favorites = await getUserFavorites(ctx.user.id, input.category);
        
        // Limit to 50 results
        const limitedFavorites = favorites.slice(0, 50);
        
        if (limitedFavorites.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No favorites to download',
          });
        }

        // Create ZIP file
        const archiver = await import('archiver');
        const { Readable } = await import('stream');
        const fetch = (await import('node-fetch')).default;
        
        const archive = archiver.default('zip', {
          zlib: { level: 9 }
        });

        const chunks: Buffer[] = [];
        archive.on('data', (chunk) => chunks.push(chunk));
        
        // Download and add each result to ZIP
        for (let i = 0; i < limitedFavorites.length; i++) {
          const job = limitedFavorites[i];
          if (!job.resultMediaUrl) continue;
          
          try {
            const response = await fetch(job.resultMediaUrl);
            const buffer = await response.arrayBuffer();
            const ext = job.targetMediaType === 'video' ? 'mp4' : 'jpg';
            archive.append(Buffer.from(buffer), { name: `result-${i + 1}.${ext}` });
          } catch (error) {
            console.error(`Failed to download ${job.resultMediaUrl}:`, error);
          }
        }

        await archive.finalize();
        
        return new Promise<{ zipData: string }>((resolve) => {
          archive.on('end', () => {
            const zipBuffer = Buffer.concat(chunks);
            resolve({ zipData: zipBuffer.toString('base64') });
          });
        });
      }),

    // Download selected jobs as ZIP
    downloadJobsAsZip: protectedProcedure
      .input(z.object({
        jobIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserFaceSwapJobs } = await import("./db");
        const archiver = await import('archiver');
        const { Readable } = await import('stream');
        
        // Get all user's jobs
        const allJobs = await getUserFaceSwapJobs(ctx.user.id);
        
        // Filter only requested jobs that belong to user and are completed
        const jobsToDownload = allJobs.filter(
          job => input.jobIds.includes(job.id) && job.status === 'completed' && job.resultMediaUrl
        );

        if (jobsToDownload.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No completed jobs found to download',
          });
        }

        return new Promise<{ zipData: string }>((resolve, reject) => {
          const archive = archiver.default('zip', { zlib: { level: 9 } });
          const chunks: Buffer[] = [];

          archive.on('data', (chunk: Buffer) => chunks.push(chunk));
          archive.on('error', (err: Error) => reject(err));
          archive.on('end', () => {
            const zipBuffer = Buffer.concat(chunks);
            resolve({ zipData: zipBuffer.toString('base64') });
          });

          // Download each result file and add to ZIP
          Promise.all(
            jobsToDownload.map(async (job, index) => {
              try {
                const response = await fetch(job.resultMediaUrl!);
                if (!response.ok) throw new Error(`Failed to fetch ${job.resultMediaUrl}`);
                
                const buffer = await response.arrayBuffer();
                const extension = job.targetMediaType === 'video' ? 'mp4' : 'jpg';
                const filename = `result-${job.id}-${index + 1}.${extension}`;
                
                archive.append(Buffer.from(buffer), { name: filename });
              } catch (error) {
                console.error(`Failed to download job ${job.id}:`, error);
              }
            })
          ).then(() => {
            archive.finalize();
          }).catch(reject);
        });
      }),

    // Animate result image with MiniMax I2V
    animateResult: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify job belongs to user and is completed image
        const job = await getFaceSwapJobById(input.jobId);
        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to animate this job",
          });
        }

        if (job.status !== 'completed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Can only animate completed jobs',
          });
        }

        if (job.targetMediaType !== 'image') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Can only animate image results, not videos',
          });
        }

        if (!job.resultMediaUrl) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Job has no result to animate',
          });
        }

        // Generate video from result image using Replicate Stable Video Diffusion
        const prompt = input.prompt || "Natural facial expressions and subtle head movement";
        
        console.log(`[I2V] Animating job #${input.jobId} with prompt: ${prompt}`);
        
        const i2vResult = await replicateService.generateVideoFromImage({
          imageUrl: job.resultMediaUrl,
          prompt,
        });

        if (!i2vResult.success || !i2vResult.videoUrl) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: i2vResult.error || 'Failed to generate video animation',
          });
        }

        console.log(`[I2V] Animation generated: ${i2vResult.videoUrl}`);

        return {
          success: true,
          videoUrl: i2vResult.videoUrl,
          predictionId: i2vResult.predictionId,
        };
      }),
  }),

  // MiniMax AI Tools
  minimax: router({    
    // Image Generation
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        aspectRatio: z.enum(["1:1", "16:9", "4:3", "3:2", "2:3", "3:4", "9:16", "21:9"]).optional(),
        n: z.number().min(1).max(9).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create AI job record
        const job = await createAIJob({
          userId: ctx.user.id,
          jobType: "image_generation",
          inputParams: JSON.stringify(input),
          model: "image-01",
          status: "pending",
        });

        // Start generation asynchronously
        minimaxService.generateImage(input)
          .then(async (result) => {
            if (result.success && result.outputPath) {
              // Upload to S3
              const fs = await import("fs");
              const buffer = fs.readFileSync(result.outputPath);
              const { storagePut } = await import("./storage");
              const fileKey = `user-${ctx.user.id}/ai-images/${Date.now()}.png`;
              const uploadResult = await storagePut(fileKey, buffer, "image/png");
              
              // Update job
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "completed",
                    outputFileKey: uploadResult.key,
                    outputFileUrl: uploadResult.url,
                    completedAt: new Date(),
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            } else {
              // Update as failed
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "failed",
                    errorMessage: result.error || "Unknown error",
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            }
          })
          .catch(console.error);

        return job;
      }),

    // Text to Video
    generateVideoFromText: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1).max(2000),
        model: z.enum(["T2V-01", "T2V-01-Director", "MiniMax-Hailuo-02", "MiniMax-Hailuo-2.3"]).optional(),
        duration: z.union([z.literal(6), z.literal(10)]).optional(),
        resolution: z.enum(["720P", "768P", "1080P"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await createAIJob({
          userId: ctx.user.id,
          jobType: "video_text_to_video",
          inputParams: JSON.stringify(input),
          model: input.model || "MiniMax-Hailuo-02",
          status: "processing", // Start processing immediately
        });

        // Start generation asynchronously (similar pattern as image generation)
        minimaxService.generateVideoFromText(input)
          .then(async (result) => {
            if (result.success && result.outputPath) {
              const fs = await import("fs");
              const buffer = fs.readFileSync(result.outputPath);
              const { storagePut } = await import("./storage");
              const fileKey = `user-${ctx.user.id}/ai-videos/${Date.now()}.mp4`;
              const uploadResult = await storagePut(fileKey, buffer, "video/mp4");
              
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "completed",
                    outputFileKey: uploadResult.key,
                    outputFileUrl: uploadResult.url,
                    completedAt: new Date(),
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            } else {
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "failed",
                    errorMessage: result.error || "Unknown error",
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            }
          })
          .catch(console.error);

        return job;
      }),

    // Music Generation
    generateMusic: protectedProcedure
      .input(z.object({
        prompt: z.string().min(10).max(300),
        lyrics: z.string().min(10).max(600),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await createAIJob({
          userId: ctx.user.id,
          jobType: "music_generation",
          inputParams: JSON.stringify(input),
          status: "processing",
        });

        minimaxService.generateMusic(input)
          .then(async (result) => {
            if (result.success && result.outputPath) {
              const fs = await import("fs");
              const buffer = fs.readFileSync(result.outputPath);
              const { storagePut } = await import("./storage");
              const fileKey = `user-${ctx.user.id}/ai-music/${Date.now()}.mp3`;
              const uploadResult = await storagePut(fileKey, buffer, "audio/mpeg");
              
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "completed",
                    outputFileKey: uploadResult.key,
                    outputFileUrl: uploadResult.url,
                    completedAt: new Date(),
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            } else {
              const { getDb } = await import("./db");
              const { aiJobs } = await import("../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                await db.update(aiJobs)
                  .set({
                    status: "failed",
                    errorMessage: result.error || "Unknown error",
                  })
                  .where(eq(aiJobs.id, job.id));
              }
            }
          })
          .catch(console.error);

        return job;
      }),

    // Get AI job status
    getJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const job = await getAIJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to access this job",
          });
        }

        return job;
      }),

    // Get user's AI job history
    getMyJobs: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserAIJobs(ctx.user.id);
      }),
  }),

  savedFaces: router({
    // Get user's saved faces
    getMySavedFaces: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserSavedFaces } = await import("./db");
        return getUserSavedFaces(ctx.user.id);
      }),

    // Save a new face
    saveFace: protectedProcedure
      .input(z.object({
        faceImageKey: z.string(),
        faceImageUrl: z.string(),
        name: z.string().min(1).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserSavedFaces, createSavedFace, deleteSavedFace } = await import("./db");
        
        // Check current count
        const existingFaces = await getUserSavedFaces(ctx.user.id);
        
        // Limit to 8 saved faces
        if (existingFaces.length >= 8) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Maximum 8 saved faces allowed. Please delete an old face first.',
          });
        }
        
        return createSavedFace({
          userId: ctx.user.id,
          faceImageKey: input.faceImageKey,
          faceImageUrl: input.faceImageUrl,
          name: input.name,
        });
      }),

    // Delete a saved face
    deleteFace: protectedProcedure
      .input(z.object({
        faceId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSavedFace } = await import("./db");
        await deleteSavedFace(input.faceId, ctx.user.id);
        return { success: true };
      }),

    // Proxy to fetch saved face image (bypass CORS)
    getFaceImageBlob: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const response = await fetch(input.imageUrl);
          if (!response.ok) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to fetch image: ${response.statusText}`,
            });
          }
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          return {
            data: base64,
            contentType,
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to proxy image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }),
  }),

  customTemplates: router({
    // Get user's custom templates
    getMyTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserCustomTemplates } = await import("./db");
        return getUserCustomTemplates(ctx.user.id);
      }),

    // Upload custom template
    uploadTemplate: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        mediaKey: z.string(),
        mediaUrl: z.string(),
        thumbnailUrl: z.string(),
        mediaType: z.enum(["image", "video"]),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createCustomTemplate } = await import("./db");
        return createCustomTemplate({
          userId: ctx.user.id,
          name: input.name,
          mediaKey: input.mediaKey,
          mediaUrl: input.mediaUrl,
          thumbnailUrl: input.thumbnailUrl,
          mediaType: input.mediaType,
          category: input.category,
        });
      }),

    // Delete custom template
    deleteTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { deleteCustomTemplate } = await import("./db");
        await deleteCustomTemplate(input.templateId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Wan Animate - Character animation and full body replacement
  wanAnimate: router({
    // Create new Wan Animate job
    createJob: protectedProcedure
      .input(z.object({
        characterImageKey: z.string(),
        characterImageUrl: z.string(),
        referenceVideoKey: z.string(),
        referenceVideoUrl: z.string(),
        mode: z.enum(["animation", "replacement"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createWanAnimateJob } = await import("./db");
        
        const job = await createWanAnimateJob({
          userId: ctx.user.id,
          characterImageKey: input.characterImageKey,
          characterImageUrl: input.characterImageUrl,
          referenceVideoKey: input.referenceVideoKey,
          referenceVideoUrl: input.referenceVideoUrl,
          mode: input.mode,
          status: "pending",
          progress: 0,
          retryCount: 0,
        });

        return job;
      }),

    // Get all user's Wan Animate jobs
    getJobs: protectedProcedure.query(async ({ ctx }) => {
      const { getWanAnimateJobsByUserId } = await import("./db");
      return getWanAnimateJobsByUserId(ctx.user.id);
    }),

    // Get specific job by ID
    getJobById: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getWanAnimateJobById } = await import("./db");
        const job = await getWanAnimateJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this job",
          });
        }

        return job;
      }),

    // Delete job
    deleteJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getWanAnimateJobById, deleteWanAnimateJob } = await import("./db");
        const job = await getWanAnimateJobById(input.jobId);
        
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        if (job.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this job",
          });
        }

        await deleteWanAnimateJob(input.jobId);
        return { success: true };
      }),
  }),

  // Upscale - Image upscaling using Real-ESRGAN
  upscale: router({
    // Upscale image
    upscaleImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        scale: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { upscaleImage } = await import("./upscaleService");
        const webhookUrl = process.env.WEBHOOK_URL;
        
        const result = await upscaleImage({
          imageUrl: input.imageUrl,
          scale: input.scale,
          webhookUrl,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Upscale failed",
          });
        }

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;

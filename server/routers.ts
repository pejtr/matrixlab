import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createFaceSwapJob, getFaceSwapJobById, getUserFaceSwapJobs, updateFaceSwapJobStatus, deleteFaceSwapJob, softDeleteSourceImage, createAIJob, getAIJobById, getUserAIJobs } from "./db";
import * as minimaxService from "./minimaxService";
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
        const result = await storagePut(input.fileKey, buffer, input.contentType);
        
        return {
          url: result.url,
          key: result.key,
        };
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

        // Generate video from result image using MiniMax I2V
        const prompt = input.prompt || "Natural facial expressions and subtle head movement";
        
        console.log(`[I2V] Animating job #${input.jobId} with prompt: ${prompt}`);
        
        const i2vResult = await minimaxService.generateVideoFromImage({
          prompt,
          firstFrameImage: job.resultMediaUrl,
        });

        if (!i2vResult.success || !i2vResult.outputPath) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: i2vResult.error || 'Failed to generate video animation',
          });
        }

        console.log(`[I2V] Animation generated: ${i2vResult.outputPath}`);

        return {
          success: true,
          videoUrl: i2vResult.outputPath,
          taskId: i2vResult.taskId,
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
});

export type AppRouter = typeof appRouter;

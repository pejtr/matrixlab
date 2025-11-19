import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createFaceSwapJob, getFaceSwapJobById, getUserFaceSwapJobs, updateFaceSwapJobStatus } from "./db";
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
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await createFaceSwapJob({
          userId: ctx.user.id,
          sourceImageKey: input.sourceImageKey,
          sourceImageUrl: input.sourceImageUrl,
          targetMediaKey: input.targetMediaKey,
          targetMediaUrl: input.targetMediaUrl,
          targetMediaType: input.targetMediaType,
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
  }),
});

export type AppRouter = typeof appRouter;

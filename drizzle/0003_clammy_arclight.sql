ALTER TABLE `faceSwapJobs` ADD `progress` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `faceSwapJobs` ADD `retryCount` int DEFAULT 0 NOT NULL;
CREATE TABLE `aiJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobType` enum('image_generation','video_text_to_video','video_image_to_video','music_generation','voice_text_to_speech','voice_cloning','voice_design') NOT NULL,
	`inputParams` text NOT NULL,
	`inputFileKey` varchar(512),
	`inputFileUrl` text,
	`outputFileKey` varchar(512),
	`outputFileUrl` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`model` varchar(128),
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `aiJobs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `faceSwapJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceImageKey` varchar(512) NOT NULL,
	`targetMediaKey` varchar(512) NOT NULL,
	`resultMediaKey` varchar(512),
	`sourceImageUrl` text NOT NULL,
	`targetMediaUrl` text NOT NULL,
	`resultMediaUrl` text,
	`targetMediaType` enum('image','video') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `faceSwapJobs_id` PRIMARY KEY(`id`)
);

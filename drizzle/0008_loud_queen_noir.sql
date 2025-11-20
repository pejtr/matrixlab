CREATE TABLE `customTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`thumbnailUrl` text NOT NULL,
	`mediaUrl` text NOT NULL,
	`mediaKey` varchar(512) NOT NULL,
	`mediaType` enum('image','video') NOT NULL DEFAULT 'image',
	`category` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `customTemplates_id` PRIMARY KEY(`id`)
);

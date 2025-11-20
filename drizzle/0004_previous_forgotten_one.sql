CREATE TABLE `savedFaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`faceImageKey` varchar(512) NOT NULL,
	`faceImageUrl` text NOT NULL,
	`name` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedFaces_id` PRIMARY KEY(`id`)
);

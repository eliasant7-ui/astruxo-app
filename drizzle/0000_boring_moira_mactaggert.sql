CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`user_id` int NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`follower_id` int NOT NULL,
	`following_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`status` varchar(20) NOT NULL DEFAULT 'live',
	`agora_channel_id` varchar(255),
	`viewer_count` int NOT NULL DEFAULT 0,
	`peak_viewer_count` int NOT NULL DEFAULT 0,
	`total_gifts_received` decimal(10,2) NOT NULL DEFAULT '0.00',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ended_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firebase_uid` varchar(128) NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`display_name` varchar(100),
	`avatar_url` text,
	`bio` text,
	`follower_count` int NOT NULL DEFAULT 0,
	`following_count` int NOT NULL DEFAULT 0,
	`wallet_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`is_live` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_firebase_uid_unique` UNIQUE(`firebase_uid`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `chat_messages` (`stream_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `chat_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `follower_idx` ON `follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `following_idx` ON `follows` (`following_id`);--> statement-breakpoint
CREATE INDEX `unique_follow` ON `follows` (`follower_id`,`following_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `streams` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `streams` (`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `streams` (`started_at`);--> statement-breakpoint
CREATE INDEX `firebase_uid_idx` ON `users` (`firebase_uid`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `is_live_idx` ON `users` (`is_live`);
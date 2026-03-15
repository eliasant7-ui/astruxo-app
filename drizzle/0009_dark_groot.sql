CREATE TABLE `deleted_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`message_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`deleted_by` int NOT NULL,
	`deleted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deleted_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_stream_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`user_id` int NOT NULL,
	`gift_id` int NOT NULL,
	`granted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `private_stream_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_bans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`user_id` int NOT NULL,
	`banned_by` int NOT NULL,
	`reason` varchar(255),
	`ban_type` varchar(20) NOT NULL DEFAULT 'kick',
	`banned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_bans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_moderators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`user_id` int NOT NULL,
	`assigned_by` int NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_moderators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `streams` ADD `is_private` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `streams` ADD `required_gift_id` int;--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `deleted_messages` (`stream_id`);--> statement-breakpoint
CREATE INDEX `message_id_idx` ON `deleted_messages` (`message_id`);--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `private_stream_access` (`stream_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `private_stream_access` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_stream_user` ON `private_stream_access` (`stream_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `stream_bans` (`stream_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `stream_bans` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_stream_user` ON `stream_bans` (`stream_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `stream_moderators` (`stream_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `stream_moderators` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_stream_user` ON `stream_moderators` (`stream_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `is_private_idx` ON `streams` (`is_private`);
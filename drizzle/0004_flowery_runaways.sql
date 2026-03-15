CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_id` int NOT NULL,
	`action_type` varchar(50) NOT NULL,
	`target_user_id` int,
	`target_post_id` int,
	`target_stream_id` int,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporter_user_id` int NOT NULL,
	`reported_user_id` int,
	`reported_post_id` int,
	`reported_stream_id` int,
	`reason` varchar(100) NOT NULL,
	`description` text,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_suspended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_banned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `admin_idx` ON `moderation_logs` (`admin_id`);--> statement-breakpoint
CREATE INDEX `action_type_idx` ON `moderation_logs` (`action_type`);--> statement-breakpoint
CREATE INDEX `target_user_idx` ON `moderation_logs` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `moderation_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `reporter_idx` ON `reports` (`reporter_user_id`);--> statement-breakpoint
CREATE INDEX `reported_user_idx` ON `reports` (`reported_user_id`);--> statement-breakpoint
CREATE INDEX `reported_post_idx` ON `reports` (`reported_post_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);
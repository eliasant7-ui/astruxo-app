CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activity_type` varchar(50) NOT NULL,
	`bot_account_id` int,
	`target_id` int,
	`template_id` int,
	`success` boolean NOT NULL DEFAULT true,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bootstrap_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`auto_posting_enabled` boolean NOT NULL DEFAULT true,
	`auto_comments_enabled` boolean NOT NULL DEFAULT true,
	`stream_announcements_enabled` boolean NOT NULL DEFAULT true,
	`min_post_interval_minutes` int NOT NULL DEFAULT 30,
	`max_post_interval_minutes` int NOT NULL DEFAULT 180,
	`comment_probability` decimal(3,2) NOT NULL DEFAULT '0.15',
	`max_comments_per_post` int NOT NULL DEFAULT 2,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bootstrap_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bot_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`bot_type` varchar(50) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`post_frequency_minutes` int NOT NULL DEFAULT 120,
	`last_posted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bot_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comment_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`sentiment` varchar(20) NOT NULL DEFAULT 'neutral',
	`is_active` boolean NOT NULL DEFAULT true,
	`usage_count` int NOT NULL DEFAULT 0,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`media_url` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`usage_count` int NOT NULL DEFAULT 0,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_type_idx` ON `activity_log` (`activity_type`);--> statement-breakpoint
CREATE INDEX `bot_account_id_idx` ON `activity_log` (`bot_account_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `activity_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `bot_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `bot_type_idx` ON `bot_accounts` (`bot_type`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `bot_accounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `sentiment_idx` ON `comment_templates` (`sentiment`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `comment_templates` (`is_active`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `content_templates` (`category`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `content_templates` (`is_active`);
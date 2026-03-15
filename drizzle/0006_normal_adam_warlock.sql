CREATE TABLE `pwa_installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`device_type` varchar(50),
	`platform` varchar(50),
	`user_agent` text,
	`installed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pwa_installations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`session_id` varchar(255) NOT NULL,
	`ip_address` varchar(45),
	`country` varchar(100),
	`city` varchar(100),
	`device_type` varchar(50),
	`user_agent` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ended_at` timestamp,
	`duration_seconds` int DEFAULT 0,
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `pwa_installations` (`user_id`);--> statement-breakpoint
CREATE INDEX `installed_at_idx` ON `pwa_installations` (`installed_at`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `pwa_installations` (`platform`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `user_sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `device_type_idx` ON `user_sessions` (`device_type`);--> statement-breakpoint
CREATE INDEX `country_idx` ON `user_sessions` (`country`);
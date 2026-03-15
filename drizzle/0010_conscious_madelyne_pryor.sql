CREATE TABLE `site_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`page` varchar(255) NOT NULL,
	`user_id` int,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` text,
	`session_id` varchar(255),
	`visited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `page_idx` ON `site_visits` (`page`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `site_visits` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_id_idx` ON `site_visits` (`session_id`);--> statement-breakpoint
CREATE INDEX `visited_at_idx` ON `site_visits` (`visited_at`);
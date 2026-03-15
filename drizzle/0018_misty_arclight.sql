ALTER TABLE `posts` ADD `stream_id` int;--> statement-breakpoint
ALTER TABLE `streams` ADD `slug` varchar(100);--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `posts` (`stream_id`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `streams` (`slug`);
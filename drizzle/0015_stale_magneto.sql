ALTER TABLE `streams` ADD `is_system_stream` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `streams` ADD `youtube_playlist_id` varchar(255);--> statement-breakpoint
CREATE INDEX `is_system_stream_idx` ON `streams` (`is_system_stream`);
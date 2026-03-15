CREATE TABLE `comment_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `parent_id` int;--> statement-breakpoint
ALTER TABLE `comments` ADD `like_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `reply_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `comment_id_idx` ON `comment_likes` (`comment_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `comment_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_comment_like` ON `comment_likes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `parent_id_idx` ON `comments` (`parent_id`);
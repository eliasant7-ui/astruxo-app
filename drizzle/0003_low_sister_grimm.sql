CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content` text,
	`media_type` varchar(20),
	`media_url` text,
	`thumbnail_url` text,
	`like_count` int NOT NULL DEFAULT 0,
	`comment_count` int NOT NULL DEFAULT 0,
	`view_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `comments` (`created_at`);--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `likes` (`post_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `unique_like` ON `likes` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `media_type_idx` ON `posts` (`media_type`);
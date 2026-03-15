CREATE TABLE `stream_entry_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stream_id` int NOT NULL,
	`user_id` int NOT NULL,
	`amount_paid` int NOT NULL,
	`paid_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_entry_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `streams` ADD `goal_amount` int;--> statement-breakpoint
ALTER TABLE `streams` ADD `current_goal_progress` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `streams` ADD `entry_price` int;--> statement-breakpoint
CREATE INDEX `stream_user_idx` ON `stream_entry_payments` (`stream_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `stream_id_idx` ON `stream_entry_payments` (`stream_id`);
CREATE TABLE `coin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`amount` int NOT NULL,
	`type` varchar(20) NOT NULL,
	`description` text,
	`reference_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coin_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gift_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gift_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`receiver_id` int NOT NULL,
	`stream_id` int NOT NULL,
	`coin_amount` int NOT NULL,
	`message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gift_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`coin_price` int NOT NULL,
	`animation_type` varchar(50) NOT NULL DEFAULT 'bounce',
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `streams` ADD `duration` int;--> statement-breakpoint
ALTER TABLE `users` ADD `coin_balance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `coin_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `coin_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `coin_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `sender_idx` ON `gift_transactions` (`sender_id`);--> statement-breakpoint
CREATE INDEX `receiver_idx` ON `gift_transactions` (`receiver_id`);--> statement-breakpoint
CREATE INDEX `stream_idx` ON `gift_transactions` (`stream_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `gift_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `gifts` (`is_active`);--> statement-breakpoint
CREATE INDEX `sort_order_idx` ON `gifts` (`sort_order`);
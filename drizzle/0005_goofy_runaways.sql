CREATE TABLE `active_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`socket_id` varchar(255) NOT NULL,
	`user_id` int,
	`ip_address` varchar(45),
	`country` varchar(100),
	`city` varchar(100),
	`region` varchar(100),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`user_agent` text,
	`connected_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `active_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `active_connections_socket_id_unique` UNIQUE(`socket_id`)
);
--> statement-breakpoint
CREATE INDEX `socket_id_idx` ON `active_connections` (`socket_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `active_connections` (`user_id`);--> statement-breakpoint
CREATE INDEX `connected_at_idx` ON `active_connections` (`connected_at`);
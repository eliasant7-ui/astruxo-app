ALTER TABLE `site_visits` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `site_visits` ADD `country_code` varchar(2);--> statement-breakpoint
CREATE INDEX `country_code_idx` ON `site_visits` (`country_code`);
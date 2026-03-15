-- ============================================
-- LiveStream Platform - Complete Database Schema
-- MySQL 8.0+
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS livestream_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE livestream_platform;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `firebase_uid` VARCHAR(128) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100),
  `avatar_url` TEXT,
  `bio` TEXT,
  `coin_balance` INT NOT NULL DEFAULT 0,
  `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `follower_count` INT NOT NULL DEFAULT 0,
  `following_count` INT NOT NULL DEFAULT 0,
  `is_live` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `firebase_uid_idx` (`firebase_uid`),
  INDEX `username_idx` (`username`),
  INDEX `is_live_idx` (`is_live`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STREAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `streams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `thumbnail_url` TEXT,
  `agora_channel_name` VARCHAR(64) NOT NULL,
  `agora_token` TEXT,
  `is_live` BOOLEAN NOT NULL DEFAULT TRUE,
  `viewer_count` INT NOT NULL DEFAULT 0,
  `peak_viewer_count` INT NOT NULL DEFAULT 0,
  `total_views` INT NOT NULL DEFAULT 0,
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  `duration` INT DEFAULT 0 COMMENT 'Duration in seconds',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `user_id_idx` (`user_id`),
  INDEX `is_live_idx` (`is_live`),
  INDEX `started_at_idx` (`started_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FOLLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `follows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `follower_id` INT NOT NULL COMMENT 'User who is following',
  `following_id` INT NOT NULL COMMENT 'User being followed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `follower_id_idx` (`follower_id`),
  INDEX `following_id_idx` (`following_id`),
  UNIQUE INDEX `unique_follow` (`follower_id`, `following_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stream_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `stream_id_idx` (`stream_id`),
  INDEX `created_at_idx` (`created_at`),
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GIFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `gifts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `emoji` VARCHAR(10) NOT NULL,
  `coin_cost` INT NOT NULL,
  `tier` INT NOT NULL COMMENT '1-4 (1=cheapest, 4=most expensive)',
  `description` TEXT,
  `animation_url` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `tier_idx` (`tier`),
  INDEX `coin_cost_idx` (`coin_cost`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GIFT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `gift_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `gift_id` INT NOT NULL,
  `sender_id` INT NOT NULL COMMENT 'User who sent the gift',
  `receiver_id` INT NOT NULL COMMENT 'User who received the gift',
  `stream_id` INT COMMENT 'Stream where gift was sent',
  `coin_amount` INT NOT NULL COMMENT 'Coins spent on this gift',
  `message` TEXT COMMENT 'Optional message with gift',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `sender_id_idx` (`sender_id`),
  INDEX `receiver_id_idx` (`receiver_id`),
  INDEX `stream_id_idx` (`stream_id`),
  INDEX `created_at_idx` (`created_at`),
  FOREIGN KEY (`gift_id`) REFERENCES `gifts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- COIN TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `coin_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` INT NOT NULL COMMENT 'Positive for purchase, negative for spending',
  `type` VARCHAR(20) NOT NULL COMMENT 'purchase, gift_sent, gift_received, withdrawal',
  `description` TEXT,
  `reference_id` INT COMMENT 'ID of related transaction (gift, purchase, etc)',
  `stripe_session_id` VARCHAR(255) COMMENT 'Stripe checkout session ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `user_id_idx` (`user_id`),
  INDEX `type_idx` (`type`),
  INDEX `created_at_idx` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA: GIFT CATALOG
-- ============================================

-- Tier 1: Basic Gifts (1-10 coins)
INSERT INTO `gifts` (`name`, `emoji`, `coin_cost`, `tier`, `description`) VALUES
('Heart', '❤️', 1, 1, 'Show some love'),
('Thumbs Up', '👍', 2, 1, 'Like this stream'),
('Star', '⭐', 5, 1, 'You\'re a star!'),
('Fire', '🔥', 10, 1, 'This stream is fire!');

-- Tier 2: Premium Gifts (25-50 coins)
INSERT INTO `gifts` (`name`, `emoji`, `coin_cost`, `tier`, `description`) VALUES
('Rose', '🌹', 25, 2, 'A beautiful rose'),
('Trophy', '🏆', 30, 2, 'You\'re a winner!'),
('Crown', '👑', 40, 2, 'Royalty treatment'),
('Diamond', '💎', 50, 2, 'You\'re precious');

-- Tier 3: Luxury Gifts (100-500 coins)
INSERT INTO `gifts` (`name`, `emoji`, `coin_cost`, `tier`, `description`) VALUES
('Rocket', '🚀', 100, 3, 'To the moon!'),
('Gift Box', '🎁', 150, 3, 'A special gift'),
('Sparkles', '✨', 250, 3, 'Magical moment'),
('Party Popper', '🎉', 500, 3, 'Let\'s celebrate!');

-- Tier 4: Elite Gifts (1000-5000 coins)
INSERT INTO `gifts` (`name`, `emoji`, `coin_cost`, `tier`, `description`) VALUES
('Lightning', '⚡', 1000, 4, 'Electrifying!'),
('Fireworks', '🎆', 2000, 4, 'Spectacular show'),
('Golden Crown', '👑', 3000, 4, 'Ultimate royalty'),
('Mega Star', '🌟', 5000, 4, 'Superstar status');

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Get user profile with stats
-- SELECT 
--   u.*,
--   COUNT(DISTINCT s.id) as total_streams,
--   SUM(s.total_views) as total_views,
--   SUM(s.duration) as total_duration
-- FROM users u
-- LEFT JOIN streams s ON u.id = s.user_id
-- WHERE u.id = ?
-- GROUP BY u.id;

-- Get live streams with streamer info
-- SELECT 
--   s.*,
--   u.username,
--   u.display_name,
--   u.avatar_url
-- FROM streams s
-- JOIN users u ON s.user_id = u.id
-- WHERE s.is_live = TRUE
-- ORDER BY s.viewer_count DESC;

-- Get user earnings
-- SELECT 
--   SUM(coin_amount) * 0.01 as total_earnings_usd
-- FROM gift_transactions
-- WHERE receiver_id = ?;

-- Get gift history for user
-- SELECT 
--   gt.*,
--   g.name as gift_name,
--   g.emoji,
--   sender.username as sender_username,
--   receiver.username as receiver_username
-- FROM gift_transactions gt
-- JOIN gifts g ON gt.gift_id = g.id
-- JOIN users sender ON gt.sender_id = sender.id
-- JOIN users receiver ON gt.receiver_id = receiver.id
-- WHERE gt.sender_id = ? OR gt.receiver_id = ?
-- ORDER BY gt.created_at DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Already created in table definitions above
-- Additional composite indexes can be added based on query patterns

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Clean up old ended streams (optional, run periodically)
-- DELETE FROM streams 
-- WHERE is_live = FALSE 
-- AND ended_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Clean up old chat messages (optional, run periodically)
-- DELETE FROM chat_messages 
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Update follower counts (if needed)
-- UPDATE users u
-- SET follower_count = (
--   SELECT COUNT(*) FROM follows WHERE following_id = u.id
-- ),
-- following_count = (
--   SELECT COUNT(*) FROM follows WHERE follower_id = u.id
-- );

-- ============================================
-- BACKUP COMMANDS
-- ============================================

-- Export database
-- mysqldump -u root -p livestream_platform > backup_$(date +%Y%m%d).sql

-- Import database
-- mysql -u root -p livestream_platform < backup_20260228.sql

-- Export only schema (no data)
-- mysqldump -u root -p --no-data livestream_platform > schema_only.sql

-- Export only data (no schema)
-- mysqldump -u root -p --no-create-info livestream_platform > data_only.sql

-- ============================================
-- END OF SCHEMA
-- ============================================

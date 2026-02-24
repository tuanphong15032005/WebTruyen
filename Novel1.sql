/* ============================================================
  Rebuild Database Script (MySQL 8.0) - OPTION 1 (Minimal) - vNext.1 (UPDATED)
  Applied changes (NEW):
  1) bookmarks: segment_seq -> segment_id (FK to chapter_segments.id)
     + enforce segment belongs to chapter (via triggers)
  2) chapters: remove price_coin_type
  3) Remove visibility from table story
============================================================ */

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Drop triggers (safe re-run)
-- ============================================================
DROP TRIGGER IF EXISTS trg_bookmarks_segment_chapter_ins;
DROP TRIGGER IF EXISTS trg_bookmarks_segment_chapter_upd;

-- ============================================================
-- Clean drop (reverse dependency order) - safe re-run
-- ============================================================
DROP TABLE IF EXISTS user_daily_status;
DROP TABLE IF EXISTS daily_missions;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;

DROP TABLE IF EXISTS moderation_actions;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS comments;

DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS library_entries;
DROP TABLE IF EXISTS follows_stories;
DROP TABLE IF EXISTS follows_users;

DROP TABLE IF EXISTS withdraw_rules;
DROP TABLE IF EXISTS withdraw_requests;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS chapter_unlocks;
DROP TABLE IF EXISTS payment_orders;

DROP TABLE IF EXISTS ledger_entries;

DROP TABLE IF EXISTS drafts;

DROP TABLE IF EXISTS story_tags;
DROP TABLE IF EXISTS tags;

DROP TABLE IF EXISTS chapter_segments;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS volumes;
DROP TABLE IF EXISTS stories;

DROP TABLE IF EXISTS wallets;

DROP TABLE IF EXISTS users_roles;
DROP TABLE IF EXISTS roles;

DROP TABLE IF EXISTS pen_names;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1) Core identity + roles
-- ============================================================

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(512) NOT NULL,
  username VARCHAR(100) NOT NULL,

  bio LONGTEXT NULL,
  display_name VARCHAR(200) NULL,

  author_pen_name VARCHAR(200) NULL,
  author_profile_bio LONGTEXT NULL,

  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  avatar_url VARCHAR(1000) NULL,
  settings_json LONGTEXT NULL,

  pin_hash VARCHAR(255) NULL,

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_author_pen_name (author_pen_name),
  CONSTRAINT ck_users_author_profile_consistency CHECK (
    author_profile_bio IS NULL OR author_pen_name IS NOT NULL
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(1000) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_roles_code (code),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_users_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_users_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2) OPTION 1 Wallet (ONLY A/B inline)
-- ============================================================

CREATE TABLE wallets (
  user_id INT NOT NULL PRIMARY KEY,
  balance_coin_a BIGINT NOT NULL DEFAULT 0,
  balance_coin_b BIGINT NOT NULL DEFAULT 0,
  reserved_coin_b BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT ck_wallets_nonneg CHECK (
    balance_coin_a >= 0 AND balance_coin_b >= 0 AND reserved_coin_b >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3) Content model (Segments) - simplified
-- ============================================================

CREATE TABLE stories (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary LONGTEXT NULL,
  cover_url VARCHAR(1000) NULL,
  
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  INDEX ix_stories_author (author_id),
  CONSTRAINT fk_stories_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE volumes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  title VARCHAR(300) NULL,
  sequence_index INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  INDEX ix_volumes_story (story_id),
  CONSTRAINT fk_volumes_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- UPDATED: removed price_coin_type
CREATE TABLE chapters (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  volume_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  sequence_index INT NOT NULL DEFAULT 0,

  is_free TINYINT(1) NOT NULL DEFAULT 0,
  price_coin BIGINT NULL,

  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_update_at DATETIME(6) NULL,

  INDEX ix_chapters_volume (volume_id),

  CONSTRAINT fk_chapters_volume FOREIGN KEY (volume_id) REFERENCES volumes(id),
  CONSTRAINT ck_chapters_price_nonneg CHECK (price_coin IS NULL OR price_coin >= 0),
  CONSTRAINT ck_chapters_pricing_consistency CHECK (
    (is_free = 1 AND price_coin IS NULL)
    OR
    (is_free = 0 AND price_coin IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chapter_segments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  seq INT NOT NULL,
  segment_text LONGTEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_chapter_segments_chapter_seq (chapter_id, seq),
  INDEX ix_chapter_segments_chapter_seq (chapter_id, seq),
  INDEX ix_chapter_segments_chapter (chapter_id),

  CONSTRAINT fk_chapter_segments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT ck_chapter_segments_seq_pos CHECK (seq > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tags (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE story_tags (
  story_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_story_tags_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_story_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE drafts (
  chapter_id INT NOT NULL PRIMARY KEY,
  content LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_drafts_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4) OPTION 1 Monetization: Ledger + Business tables
-- ============================================================

CREATE TABLE ledger_entries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  coin ENUM('A','B') NOT NULL,
  delta BIGINT NOT NULL,
  balance_after BIGINT NULL,

  reason ENUM('TOPUP','WITHDRAW','EARN','SPEND_CHAPTER','DONATE','ADJUST','REVIEW_REWARD') NOT NULL,
  ref_type VARCHAR(30) NOT NULL,
  ref_id BIGINT NOT NULL,

  idempotency_key VARCHAR(100) NOT NULL,

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_ledger_ref_reason (ref_type, ref_id, reason),
  UNIQUE KEY uq_ledger_idempotency (idempotency_key),
  INDEX ix_ledger_user_time (user_id, created_at),
  INDEX ix_ledger_ref (ref_type, ref_id),

  CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_orders (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  order_code VARCHAR(60) NOT NULL,
  amount_vnd BIGINT NOT NULL,
  coin_b_amount BIGINT NOT NULL,

  status ENUM('PENDING','PAID','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  paid_at DATETIME(6) NULL,

  UNIQUE KEY uq_payment_orders_order_code (order_code),
  INDEX ix_payment_orders_user (user_id),

  CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT ck_payment_orders_amounts CHECK (amount_vnd >= 0 AND coin_b_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE withdraw_rules (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  coin ENUM('B') NOT NULL,
  fee_type ENUM('PERCENT','FIXED') NOT NULL,
  fee_value DECIMAL(10,2) NOT NULL,
  min_withdraw_coin_b BIGINT NOT NULL,
  max_withdraw_coin_b BIGINT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE withdraw_requests (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  coin_b_amount BIGINT NOT NULL,
  fee_coin_b BIGINT NOT NULL DEFAULT 0,
  net_coin_b BIGINT NOT NULL,

  payment_method_details TEXT NOT NULL,
  status ENUM('REQUESTED','APPROVED','REJECTED','PAID','CANCELLED') NOT NULL DEFAULT 'REQUESTED',

  requested_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  paid_at DATETIME(6) NULL,
  admin_id INT NULL,

  INDEX ix_withdraw_user (user_id),
  INDEX ix_withdraw_status (status),
  INDEX ix_withdraw_admin (admin_id),

  CONSTRAINT fk_withdraw_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_withdraw_admin FOREIGN KEY (admin_id) REFERENCES users(id),

  CONSTRAINT ck_withdraw_amounts CHECK (
    coin_b_amount >= 0 AND fee_coin_b >= 0 AND net_coin_b >= 0 AND net_coin_b = coin_b_amount - fee_coin_b
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chapter_unlocks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  chapter_id INT NOT NULL,

  paid_coin ENUM('A','B') NOT NULL,
  coin_cost BIGINT NOT NULL,

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_chapter_unlock_user_chapter (user_id, chapter_id),
  INDEX ix_chapter_unlock_user (user_id),
  INDEX ix_chapter_unlock_chapter (chapter_id),

  CONSTRAINT fk_chunlock_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_chunlock_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT ck_chunlock_cost CHECK (coin_cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE donations (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  paid_coin ENUM('A','B') NOT NULL,
  amount_coin BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  INDEX ix_donations_from_user (from_user_id),
  INDEX ix_donations_to_user (to_user_id),

  CONSTRAINT fk_don_from_user FOREIGN KEY (from_user_id) REFERENCES users(id),
  CONSTRAINT fk_don_to_user FOREIGN KEY (to_user_id) REFERENCES users(id),

  CONSTRAINT ck_don_not_self CHECK (from_user_id <> to_user_id),
  CONSTRAINT ck_don_amount_nonneg CHECK (amount_coin >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5) Social / Library
-- ============================================================

CREATE TABLE follows_users (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  target_user_id INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_follows_users (user_id, target_user_id),
  CONSTRAINT fk_follows_users_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_follows_users_target FOREIGN KEY (target_user_id) REFERENCES users(id),
  CONSTRAINT ck_follow_users_not_self CHECK (user_id <> target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE follows_stories (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_follows_stories (user_id, story_id),
  CONSTRAINT fk_follows_stories_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_follows_stories_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE library_entries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_library_entries_user_story (user_id, story_id),
  CONSTRAINT fk_library_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_library_story FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- UPDATED: bookmarks.segment_id instead of segment_seq
CREATE TABLE bookmarks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  chapter_id INT NOT NULL,
  segment_id BIGINT NOT NULL,                  -- ID thật của đoạn

  position_percent DECIMAL(5,2) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,

  -- tránh duplicate bookmark cùng đoạn trong cùng chapter của user
  UNIQUE KEY uq_bookmarks_user_chapter_segment (user_id, chapter_id, segment_id),

  INDEX ix_bookmarks_user (user_id),
  INDEX ix_bookmarks_chapter (chapter_id),
  INDEX ix_bookmarks_segment (segment_id),

  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookmarks_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT fk_bookmarks_segment FOREIGN KEY (segment_id) REFERENCES chapter_segments(id),

  CONSTRAINT ck_bookmarks_pospct CHECK (
    position_percent IS NULL OR (position_percent >= 0 AND position_percent <= 100)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enforce: segment_id must belong to chapter_id
DELIMITER $$

CREATE TRIGGER trg_bookmarks_segment_chapter_ins
BEFORE INSERT ON bookmarks
FOR EACH ROW
BEGIN
  DECLARE v_seg_chapter_id INT;

  SELECT cs.chapter_id INTO v_seg_chapter_id
  FROM chapter_segments cs
  WHERE cs.id = NEW.segment_id;

  IF v_seg_chapter_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid segment_id: not found in chapter_segments';
  END IF;

  IF NEW.chapter_id <> v_seg_chapter_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'segment_id does not belong to chapter_id';
  END IF;
END$$

CREATE TRIGGER trg_bookmarks_segment_chapter_upd
BEFORE UPDATE ON bookmarks
FOR EACH ROW
BEGIN
  DECLARE v_seg_chapter_id INT;

  SELECT cs.chapter_id INTO v_seg_chapter_id
  FROM chapter_segments cs
  WHERE cs.id = NEW.segment_id;

  IF v_seg_chapter_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid segment_id: not found in chapter_segments';
  END IF;

  IF NEW.chapter_id <> v_seg_chapter_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'segment_id does not belong to chapter_id';
  END IF;
END$$

DELIMITER ;

-- ============================================================
-- 6) Comments & Moderation
-- ============================================================

CREATE TABLE comments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  chapter_id INT NOT NULL,
  parent_comment_id BIGINT NULL,
  root_comment_id BIGINT NULL,

  content LONGTEXT NOT NULL,
  depth INT NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  INDEX ix_comments_chapter (chapter_id),
  INDEX ix_comments_parent (parent_comment_id),
  INDEX ix_comments_root (root_comment_id),

  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(id),
  CONSTRAINT fk_comments_root FOREIGN KEY (root_comment_id) REFERENCES comments(id),
  CONSTRAINT ck_comments_depth_nonneg CHECK (depth >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,

  target_kind ENUM('story','chapter','comment') NOT NULL,
  story_id INT NULL,
  chapter_id INT NULL,
  comment_id BIGINT NULL,

  reason LONGTEXT NULL,
  details LONGTEXT NULL,

  status ENUM('open','in_review','resolved','rejected') NOT NULL DEFAULT 'open',
  action_taken_by INT NULL,
  action VARCHAR(50) NULL,

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at DATETIME(6) NULL,

  INDEX ix_reports_reporter (reporter_id),
  INDEX ix_reports_kind (target_kind),
  INDEX ix_reports_story (story_id),
  INDEX ix_reports_chapter (chapter_id),
  INDEX ix_reports_comment (comment_id),

  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_action_by FOREIGN KEY (action_taken_by) REFERENCES users(id),

  CONSTRAINT fk_reports_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_reports_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  CONSTRAINT fk_reports_comment FOREIGN KEY (comment_id) REFERENCES comments(id),

  CONSTRAINT ck_reports_target_consistency CHECK (
    (target_kind='story'   AND story_id  IS NOT NULL AND chapter_id IS NULL AND comment_id IS NULL)
    OR
    (target_kind='chapter' AND chapter_id IS NOT NULL AND story_id  IS NULL AND comment_id IS NULL)
    OR
    (target_kind='comment' AND comment_id IS NOT NULL AND story_id  IS NULL AND chapter_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE moderation_actions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type VARCHAR(200) NOT NULL,
  target_kind ENUM('story','chapter','comment','user') NOT NULL,
  target_id BIGINT NOT NULL,
  reason LONGTEXT NULL,
  notes LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  CONSTRAINT fk_moderation_actions_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7) Gamification (kept as-is)
-- ============================================================

CREATE TABLE achievements (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description LONGTEXT NULL,
  criteria_json LONGTEXT NULL,
  reward_coin BIGINT NULL,
  reward_coin_type ENUM('A','B') NULL,
  UNIQUE KEY uq_achievements_code (code),
  CONSTRAINT ck_ach_reward_nonneg CHECK (reward_coin IS NULL OR reward_coin >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_achievements (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  achieved_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  is_claimed TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_achievements_ach FOREIGN KEY (achievement_id) REFERENCES achievements(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE daily_missions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  mission_code VARCHAR(100) NOT NULL,
  description LONGTEXT NULL,
  target LONGTEXT NULL,
  reward_coin BIGINT NULL,
  reward_coin_type ENUM('A','B') NULL,
  UNIQUE KEY uq_daily_missions_date_code (date, mission_code),
  CONSTRAINT ck_dm_reward_nonneg CHECK (reward_coin IS NULL OR reward_coin >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_daily_status (
  user_id INT NOT NULL,
  daily_mission_id INT NOT NULL,
  progress LONGTEXT NULL,
  completed_at DATETIME(6) NULL,
  PRIMARY KEY (user_id, daily_mission_id),
  CONSTRAINT fk_user_daily_status_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_daily_status_mission FOREIGN KEY (daily_mission_id) REFERENCES daily_missions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed roles (NO ADMIN)
-- ============================================================

INSERT INTO roles (code, name, description) VALUES
('READER',   'Reader',    'Normal user who reads stories.'),
('AUTHOR',   'Author',    'User who can publish stories/chapters.'),
('MOD',      'Moderator', 'Staff role for moderation/approvals.'),
('REVIEWER', 'Reviewer',  'User who reviews content and earns reward coins.');

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO tags (name, slug) VALUES
('Romance',        'romance'),
('Slice of Life',  'slice-of-life'),
('School Life',    'school-life'),
('Fantasy',        'fantasy'),
('Drama',          'drama'),
('Comedy',         'comedy'),
('Supernatural',   'supernatural'),
('Psychological',  'psychological'),
('Mystery',        'mystery'),
('Adapted to Anime','adapted-to-anime');

-- *****************************************************
-- Minimal migration: add reading_history, story_reviews,
-- extend stories with rating and meta, drop reading_progress
-- *****************************************************

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Create minimal reading_history (one row per user+story)
CREATE TABLE IF NOT EXISTS reading_history (
  user_id INT NOT NULL,
  story_id INT NOT NULL,
  last_chapter_id INT NULL,  -- để hiển thị vị trí chapter/volume; NULL nếu chỉ mở story
  PRIMARY KEY (user_id, story_id),

  INDEX ix_readhist_user (user_id),
  INDEX ix_readhist_story (story_id),

  CONSTRAINT fk_readhist_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_readhist_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_readhist_chapter FOREIGN KEY (last_chapter_id) REFERENCES chapters(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Create story_reviews (no is_approved)
CREATE TABLE IF NOT EXISTS story_reviews (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255) NULL,
  content LONGTEXT NULL,
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NULL,
  UNIQUE KEY uq_review_user_story (user_id, story_id),
  INDEX ix_reviews_story (story_id),
  CONSTRAINT fk_review_story FOREIGN KEY (story_id) REFERENCES stories(id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Extend stories: add rating_sum, rating_count, optional rating_avg
ALTER TABLE stories
  ADD COLUMN rating_sum BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN rating_count INT NOT NULL DEFAULT 0,
  ADD COLUMN rating_avg DECIMAL(4,2) NULL;

-- 4) Add kind + original author info (for translated) and FK to users (optional)
ALTER TABLE stories
  ADD COLUMN kind ENUM('original','translated','ai') NOT NULL DEFAULT 'original',
  ADD COLUMN original_author_name VARCHAR(300) NULL,
  ADD COLUMN original_author_user_id INT NULL,
  ADD CONSTRAINT fk_stories_original_author_user FOREIGN KEY (original_author_user_id) REFERENCES users(id);

-- Enforce: if kind = 'translated' then original_author_name IS NOT NULL
ALTER TABLE stories
  ADD CONSTRAINT ck_story_translated_requires_orig CHECK (
    (kind = 'translated' AND original_author_name IS NOT NULL)
    OR
    (kind <> 'translated' AND original_author_name IS NULL)
  );

-- 5) Add completion_status 
ALTER TABLE stories
  ADD COLUMN completion_status ENUM('ongoing','completed','cancelled') NOT NULL DEFAULT 'ongoing',
  ADD COLUMN completed_at DATETIME(6) NULL;

-- 6) Add profile and 
ALTER TABLE users
  ADD COLUMN  updated_at DATETIME(6) NULL; 
-- 7) 
ALTER TABLE users
ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
ADD COLUMN lock_until DATETIME NULL;
-- 8)
ALTER TABLE stories
ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
 
SET FOREIGN_KEY_CHECKS = 1;

-- Quick checks
SELECT * FROM users_roles;
SELECT * FROM users;
select * from stories; 
select * from users; 
SELECT *
FROM chapters
LEFT JOIN chapter_segments
ON chapters.id = chapter_segments.chapter_id;

ALTER TABLE follows_stories
  ADD COLUMN notify_new_chapter TINYINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                       -- người nhận
  kind ENUM('new_chapter','topup','report','system') NOT NULL,
  message VARCHAR(1000) NOT NULL,            
  ref_type VARCHAR(50) NULL,                  
  ref_id BIGINT NULL,                       
  story_id INT NULL,                          
  chapter_id INT NULL,                        
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX ix_notifications_user_created (user_id, created_at),
  INDEX ix_notifications_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE comments
ADD COLUMN story_id INT NULL,
ADD CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id),
ADD CONSTRAINT ck_comments_target CHECK (
  (chapter_id IS NOT NULL AND story_id IS NULL)
  OR
  (chapter_id IS NULL AND story_id IS NOT NULL)
);
ALTER TABLE comments DROP CHECK ck_comments_target;

ALTER TABLE comments
  MODIFY COLUMN chapter_id INT NULL,
  MODIFY COLUMN story_id INT NULL;

ALTER TABLE comments
  ADD CONSTRAINT ck_comments_target CHECK (
    (chapter_id IS NOT NULL AND story_id IS NULL)
    OR
    (chapter_id IS NULL AND story_id IS NOT NULL)
  );
  ALTER TABLE drafts
  ADD COLUMN  updated_at DATETIME(6)
    NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6);
    select * from users;
    select * from stories;
    select * from daily_missions;
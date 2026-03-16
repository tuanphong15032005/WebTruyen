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

select * from daily_missions;

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
 
 -- 9) Notification 
 -- preference default = 0; 
ALTER TABLE follows_stories
  ADD COLUMN notify_new_chapter TINYINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                       -- người nhận
  kind ENUM('new_chapter','topup','report','system') NOT NULL,
  message VARCHAR(1000) NOT NULL,             -- thông báo text
  ref_type VARCHAR(50) NULL,                  -- tuỳ chọn: 'chapter','order','report' - bảng thực tế được tham chiếu.
  ref_id BIGINT NULL,                         -- tuỳ chọn id tham chiếu - id của bảng được tham chiếu
  story_id INT NULL,                          
  chapter_id INT NULL,                        
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX ix_notifications_user_created (user_id, created_at),
  INDEX ix_notifications_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10 commet cho story 
ALTER TABLE comments
ADD COLUMN story_id INT NULL,
ADD CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id),
ADD CONSTRAINT ck_comments_target CHECK (
  (chapter_id IS NOT NULL AND story_id IS NULL)
  OR
  (chapter_id IS NULL AND story_id IS NOT NULL)
);

-- nếu đã có check cũ thì drop trước
ALTER TABLE comments DROP CHECK ck_comments_target;

-- chapter_id phải cho NULL
ALTER TABLE comments
  MODIFY COLUMN chapter_id INT NULL,
  MODIFY COLUMN story_id INT NULL;

-- tạo lại check đúng logic
ALTER TABLE comments
  ADD CONSTRAINT ck_comments_target CHECK (
    (chapter_id IS NOT NULL AND story_id IS NULL)
    OR
    (chapter_id IS NULL AND story_id IS NOT NULL)
  );
-- updateAt để so bản draft 
ALTER TABLE drafts
  ADD COLUMN  updated_at DATETIME(6)
    NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6);

SET FOREIGN_KEY_CHECKS = 1;
select * from drafts; 
select * from chapters; 

-- Quick checks
SELECT * FROM users_roles;
SELECT * FROM users;
select * from stories; 
select * from users; 
select * from notifications; 
select * from follows_stories; 
select * from bookmarks; 
SELECT *
FROM chapters
LEFT JOIN chapter_segments
ON chapters.id = chapter_segments.chapter_id;



-- Thêm lời nhắn cho donate 
-- Thêm trường message vào bảng donations để lưu lời nhắn
ALTER TABLE donations 
ADD COLUMN message TEXT NULL AFTER amount_coin;

-- Thêm chỉ mục để tìm kiếm nhanh hơn
ALTER TABLE donations 
ADD INDEX ix_donations_message (message(100));

-- thêm cover url cho volume 
ALTER TABLE volumes
ADD COLUMN cover_url VARCHAR(1000) NULL AFTER title;

-- thêm cover cho profile user
ALTER TABLE users
  ADD COLUMN cover_url VARCHAR(1000) NULL AFTER avatar_url;
  
-- Up: thêm 1 cột lưu tỉ giá VND trên 1 coin
ALTER TABLE withdraw_rules
  ADD COLUMN exchange_rate_to_vnd DECIMAL(30,8) NULL COMMENT 'VND per 1 coin (snapshot/default)';
  
-- Thêm: status chờ duyệt cho admin 
ALTER TABLE chapters
  ADD COLUMN approval_status ENUM('pending','approved','rejected')
  NOT NULL DEFAULT 'pending'
  AFTER status;
  
-- xóa default pending
ALTER TABLE chapters
  MODIFY COLUMN approval_status ENUM('pending','approved','rejected')
  NULL DEFAULT NULL;
  
ALTER TABLE volumes
ADD COLUMN is_default TINYINT NOT NULL DEFAULT 0 AFTER cover_url;

-- add page policy cho web/admin dựa trên web này để soạn nội dung cho trang term of service
CREATE TABLE site_pages (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_site_pages_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chỉnh thêm phân loại cho lib
ALTER TABLE library_entries
ADD COLUMN reading_status ENUM('plan_to_read','reading','completed')
NOT NULL DEFAULT 'plan_to_read'
AFTER story_id;

-- thêm tag spoiler cho cmt và review
ALTER TABLE comments
ADD COLUMN is_spoiler TINYINT(1) NOT NULL DEFAULT 0
AFTER content;

ALTER TABLE story_reviews
ADD COLUMN is_spoiler TINYINT NOT NULL DEFAULT 0
AFTER content;

-- Thêm album cho phân loại truyện
CREATE TABLE library_albums (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_library_albums_user_name (user_id, name),
  INDEX ix_library_albums_user (user_id),

  CONSTRAINT fk_library_albums_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE library_album_items (
  album_id BIGINT NOT NULL,
  story_id INT NOT NULL,
  added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (album_id, story_id),
  INDEX ix_library_album_items_story (story_id),

  CONSTRAINT fk_library_album_items_album
    FOREIGN KEY (album_id) REFERENCES library_albums(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_library_album_items_story
    FOREIGN KEY (story_id) REFERENCES stories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




 ALTER TABLE stories
ADD COLUMN approval_status ENUM('pending','approved','rejected')
NULL DEFAULT NULL
AFTER status;
-- Thêm thời gian chính xác 
ALTER TABLE stories
ADD COLUMN approval_updated_at DATETIME(6) NULL
AFTER approval_status;

UPDATE chapters
SET approval_status = 'approved'
WHERE approval_status = 'pending';

select * from users; 
select * from stories; 
ALTER TABLE reading_history
    ADD COLUMN last_segment_id BIGINT NULL,
    ADD INDEX ix_readhist_last_segment (last_segment_id),
    ADD CONSTRAINT fk_readhist_segment
        FOREIGN KEY (last_segment_id) REFERENCES chapter_segments(id);

-- ============================================================
-- Migration 1: prepare achievements for tier system
-- ============================================================

ALTER TABLE achievements
DROP COLUMN reward_coin,
DROP COLUMN reward_coin_type;

-- ============================================================
-- Migration 2: achievement tiers
-- ============================================================

CREATE TABLE achievement_tiers (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,

  achievement_id INT NOT NULL,
  tier_level INT NOT NULL,

  requirement INT NOT NULL,

  reward_coin BIGINT NOT NULL,
  reward_coin_type ENUM('A','B') NOT NULL,

  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_achievement_tier (achievement_id, tier_level),

  INDEX ix_achievement_tiers_achievement (achievement_id),

  CONSTRAINT fk_achievement_tiers_achievement
    FOREIGN KEY (achievement_id)
    REFERENCES achievements(id),

  CONSTRAINT ck_achievement_tiers_requirement CHECK (requirement > 0),
  CONSTRAINT ck_achievement_tiers_reward CHECK (reward_coin >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Migration 3: user achievement progress
-- ============================================================

CREATE TABLE user_achievement_progress (
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,

  progress INT NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),

  PRIMARY KEY (user_id, achievement_id),

  INDEX ix_uap_user (user_id),

  CONSTRAINT fk_uap_user
    FOREIGN KEY (user_id)
    REFERENCES users(id),

  CONSTRAINT fk_uap_achievement
    FOREIGN KEY (achievement_id)
    REFERENCES achievements(id),

  CONSTRAINT ck_uap_progress CHECK (progress >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE user_achievements;

-- ============================================================
-- Migration 4: user achievement claims
-- ============================================================

CREATE TABLE user_achievement_claims (
  user_id INT NOT NULL,
  tier_id INT NOT NULL,

  claimed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (user_id, tier_id),

  INDEX ix_uac_user (user_id),

  CONSTRAINT fk_uac_user
    FOREIGN KEY (user_id)
    REFERENCES users(id),

  CONSTRAINT fk_uac_tier
    FOREIGN KEY (tier_id)
    REFERENCES achievement_tiers(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Cập nhật achievements table
ALTER TABLE achievements 
ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'READING',
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Cập nhật achievement_tiers table  
ALTER TABLE achievement_tiers
ADD COLUMN name VARCHAR(100),
ADD COLUMN description LONGTEXT,
ADD COLUMN code VARCHAR(50),
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;


-- ============================================================
-- Seed Achievements and Tiers for WebTruyen System
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- 1) Insert Achievements for all categories
-- ============================================================

-- READING Category Achievements
INSERT INTO achievements (code, name, description, category, criteria_json, is_active) VALUES
('READ_CHAPTERS', 'Mọt Sách', 'Đọc các chương truyện', 'READING', '{"type":"chapters_read"}', TRUE);

-- COMMENTING Category Achievements  
INSERT INTO achievements (code, name, description, category, criteria_json, is_active) VALUES
('COMMENT_COUNT', 'Bậc Thầy Bình Luận', 'Số lượng bình luận', 'COMMENTING', '{"type":"comment_count"}', TRUE);

-- WRITING Category Achievements
INSERT INTO achievements (code, name, description, category, criteria_json, is_active) VALUES
('WRITTEN_CHAPTERS', 'Ngòi Bút Vàng', 'Số chương đã viết', 'WRITING', '{"type":"chapters_written"}', TRUE);

-- SOCIAL Category Achievements
INSERT INTO achievements (code, name, description, category, criteria_json, is_active) VALUES
('FOLLOWER_COUNT', 'Ngôi Sao Sắp Đổi', 'Số người theo dõi', 'SOCIAL', '{"type":"follower_count"}', TRUE);

-- ============================================================
-- 2) Insert Achievement Tiers (5 levels each)
-- ============================================================

-- READING: READ_CHAPTERS Tiers
INSERT INTO achievement_tiers (achievement_id, tier_level, requirement, reward_coin, reward_coin_type, name, description, code, is_active)
SELECT 
    a.id,
    t.tier_level,
    t.requirement,
    t.reward_coin,
    t.reward_coin_type,
    t.name,
    t.description,
    t.code,
    TRUE
FROM achievements a
JOIN (
    SELECT 1 AS tier_level, 1 AS requirement, 10 AS reward_coin, 'A' AS reward_coin_type, 
           'Mọt Sách Mới' AS name, 'Đọc 1 chương đầu tiên' AS description, 'BEGINNER' AS code
    UNION ALL
    SELECT 2, 5, 50, 'A', 'Mọt Sách Tập Sự', 'Đọc 5 chương', 'NOVICE'
    UNION ALL  
    SELECT 3, 10, 100, 'A', 'Mọt Sách Trung Cấp', 'Đọc 10 chương', 'INTERMEDIATE'
    UNION ALL
    SELECT 4, 50, 200, 'A', 'Mọt Sách Chuyên Nghiệp', 'Đọc 50 chương', 'ADVANCED'
    UNION ALL
    SELECT 5, 100, 500, 'A', 'Mọt Sách Siêu Cấp', 'Đọc 100 chương', 'MASTER'
) t
WHERE a.code = 'READ_CHAPTERS';


-- COMMENTING: COMMENT_COUNT Tiers
INSERT INTO achievement_tiers 
(achievement_id, tier_level, requirement, reward_coin, reward_coin_type, name, description, code, is_active)
SELECT 
    a.id,
    t.tier_level,
    t.requirement,
    t.reward_coin,
    t.reward_coin_type,
    t.name,
    t.description,
    t.code,
    TRUE
FROM achievements a
JOIN (
    SELECT 1, 1, 5, 'A', 'Bình Luận Mới', 'Viết bình luận đầu tiên', 'FIRST_COMMENT'
    UNION ALL
    SELECT 2, 5, 25, 'A', 'Bình Luận Tích Cực', 'Viết 5 bình luận', 'ACTIVE_COMMENTER'
    UNION ALL
    SELECT 3, 10, 50, 'A', 'Bình Luận Trung Cấp', 'Viết 10 bình luận', 'REGULAR_COMMENTER'
    UNION ALL
    SELECT 4, 50, 150, 'A', 'Bình Luận Chuyên Nghiệp', 'Viết 50 bình luận', 'PRO_COMMENTER'
    UNION ALL
    SELECT 5, 100, 300, 'A', 'Bình Luận Siêu Cấp', 'Viết 100 bình luận', 'MASTER_COMMENTER'
) AS t (
    tier_level,
    requirement,
    reward_coin,
    reward_coin_type,
    name,
    description,
    code
)
WHERE a.code = 'COMMENT_COUNT';


-- WRITING: WRITTEN_CHAPTERS Tiers
INSERT INTO achievement_tiers 
(achievement_id, tier_level, requirement, reward_coin, reward_coin_type, name, description, code, is_active)
SELECT 
    a.id,
    t.tier_level,
    t.requirement,
    t.reward_coin,
    t.reward_coin_type,
    t.name,
    t.description,
    t.code,
    TRUE
FROM achievements a
JOIN (
    SELECT 
        tier_level,
        requirement,
        reward_coin,
        reward_coin_type,
        name,
        description,
        code
    FROM (
        SELECT 1 AS tier_level, 1 AS requirement, 10 AS reward_coin, 'A' AS reward_coin_type, 'Ngòi Bút Mới' AS name, 'Viết chương đầu tiên' AS description, 'FIRST_CHAPTER' AS code
        UNION ALL
        SELECT 2, 5, 50, 'A', 'Ngòi Bút Tập Sự', 'Viết 5 chương', 'CHAPTER_WRITER'
        UNION ALL
        SELECT 3, 10, 100, 'A', 'Ngòi Bút Trung Cấp', 'Viết 10 chương', 'STORYTELLER'
        UNION ALL
        SELECT 4, 25, 250, 'A', 'Ngòi Bút Chuyên Nghiệp', 'Viết 25 chương', 'PROLIFIC_WRITER'
        UNION ALL
        SELECT 5, 50, 500, 'A', 'Ngòi Bút Siêu Cấp', 'Viết 50 chương', 'MASTER_WRITER'
    ) temp
) t
WHERE a.code = 'WRITTEN_CHAPTERS';

-- SOCIAL: FOLLOWER_COUNT Tiers
INSERT INTO achievement_tiers 
(achievement_id, tier_level, requirement, reward_coin, reward_coin_type, name, description, code, is_active)

VALUES
((SELECT id FROM achievements WHERE code='FOLLOWER_COUNT'),1,1,15,'A','Ngôi Sao Mới','Có 1 người theo dõi','FIRST_FOLLOWER',TRUE),

((SELECT id FROM achievements WHERE code='FOLLOWER_COUNT'),2,5,75,'A','Ngôi Sao Tập Sự','Có 5 người theo dõi','RISING_STAR',TRUE),

((SELECT id FROM achievements WHERE code='FOLLOWER_COUNT'),3,10,150,'A','Ngôi Sao Trung Cấp','Có 10 người theo dõi','GLOWING_STAR',TRUE),

((SELECT id FROM achievements WHERE code='FOLLOWER_COUNT'),4,25,300,'A','Ngôi Sao Chuyên Nghiệp','Có 25 người theo dõi','SHINING_STAR',TRUE),

((SELECT id FROM achievements WHERE code='FOLLOWER_COUNT'),5,50,750,'A','Ngôi Sao Siêu Cấp','Có 50 người theo dõi','SUPERSTAR',TRUE);

-- ============================================================
-- 3) Verify data insertion
-- ============================================================

SELECT 
    a.code,
    a.name,
    a.category,
    COUNT(t.id) as tier_count,
    MIN(t.requirement) as min_requirement,
    MAX(t.requirement) as max_requirement
FROM achievements a
LEFT JOIN achievement_tiers t ON a.id = t.achievement_id
WHERE a.is_active = TRUE
GROUP BY a.id, a.code, a.name, a.category
ORDER BY a.category, a.code;

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE library_albums
ADD COLUMN visibility ENUM('private','public')
NOT NULL DEFAULT 'private'
AFTER description;

-- Gán role MOD cho user id = 1
INSERT IGNORE INTO users_roles (user_id, role_id)
SELECT 1, id
FROM roles
WHERE code = 'MOD';

-- ============================================================
-- Create Daily Mission Templates using existing table
-- Insert 6 template rows with date = NULL
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET FOREIGN_KEY_CHECKS = 0;

-- IMPORTANT: Allow NULL values in date column for templates
ALTER TABLE daily_missions MODIFY COLUMN date DATE NULL;

-- Delete existing templates if any (cleanup)
DELETE FROM daily_missions WHERE date IS NULL;

-- Insert 6 daily mission templates
INSERT INTO daily_missions (date, mission_code, description, target, reward_coin, reward_coin_type) VALUES
(NULL, 'DAILY_LOGIN', 'Đăng nhập hàng ngày', '1', 10, 'A'),
(NULL, 'READ_CHAPTERS', 'Đọc 5 chương', '5', 20, 'A'),
(NULL, 'UNLOCK_CHAPTER', 'Mở khóa 1 chương trả phí', '1', 15, 'A'),
(NULL, 'MAKE_COMMENTS', 'Bình luận 3 lần', '3', 10, 'A'),
(NULL, 'MAKE_DONATION', 'Donate cho tác giả', '1', 50, 'A'),
(NULL, 'MAKE_TOPUP', 'Nạp tiền lần đầu', '1', 100, 'A');

-- ============================================================
-- Verify templates insertion
-- ============================================================
SELECT 
    id,
    mission_code,
    description,
    target,
    reward_coin,
    reward_coin_type,
    'TEMPLATE' as type
FROM daily_missions 
WHERE date IS NULL
ORDER BY mission_code;

-- ============================================================
-- Check existing daily missions (non-templates)
-- ============================================================
SELECT 
    date,
    COUNT(*) as mission_count,
    GROUP_CONCAT(mission_code ORDER BY mission_code) as missions
FROM daily_missions 
WHERE date IS NOT NULL
GROUP BY date
ORDER BY date DESC
LIMIT 10;

-- ============================================================
-- Instructions
-- ============================================================
/*
1. Chạy script này để tạo 6 template missions
2. Update DailyMissionRepository.java:
   - Thêm method: List<DailyMissionEntity> findByDateIsNull();
3. Update SimpleDailyTaskService.java:
   - Thay đổi createDailyMissionsForDate() để đọc từ templates
4. Update DailyMissionAdminService.java:
   - Thêm methods quản lý templates
5. Test bằng cách:
   - Kiểm tra templates đã được tạo
   - Tạo missions cho ngày mới từ templates
   - Admin edit templates và verify changes

Template management:
- Templates có date = NULL
- Daily missions có date = cụ thể
- Admin có thể edit templates (reward, description)
- Hằng ngày auto-create từ templates
- Event: Admin có thể edit reward cho ngày cụ thể

⚠️  IMPORTANT: Script này sẽ MODIFY table structure để cho phép NULL trong date column.
   Nếu cần rollback, dùng: ALTER TABLE daily_missions MODIFY COLUMN date DATE NOT NULL;
*/

SET FOREIGN_KEY_CHECKS = 1;






USE master;
GO

-- Kiểm tra nếu Database 'NovelDB' đã tồn tại thì xóa bỏ
IF DB_ID('NovelDB') IS NOT NULL
BEGIN
    PRINT '>>> Phat hien Database NovelDB cu. Dang xoa...';
    -- Chuyển sang chế độ Single User để ngắt ngay lập tức các kết nối khác
    ALTER DATABASE NovelDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE NovelDB;
    PRINT '>>> Da xoa Database NovelDB cu.';
END
GO

-- Tạo mới Database
CREATE DATABASE NovelDB;
GO

-- Chuyển sang sử dụng Database vừa tạo
USE NovelDB;
GO
PRINT '>>> Da tao moi va dang su dung Database NovelDB.';

  --PHẦN 1: TẠO CÁC BẢNG (TABLES)

-- 1) users
CREATE TABLE dbo.users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(320) NOT NULL,
    password_hash NVARCHAR(512) NOT NULL,
    username NVARCHAR(100) NOT NULL,
    display_name NVARCHAR(200) NULL,
    is_verified BIT NOT NULL DEFAULT 0,
    verification_code VARCHAR(10) NULL,
    bio NVARCHAR(MAX) NULL,
    avatar_url NVARCHAR(1000) NULL,
    settings_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT UQ_users_email UNIQUE(email),
    CONSTRAINT UQ_users_username UNIQUE(username)
);
GO

-- 2) roles
CREATE TABLE dbo.roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_roles_name UNIQUE(name)
);
GO

-- 3) coin_types
CREATE TABLE dbo.coin_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(10) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    is_withdrawable BIT NOT NULL DEFAULT 0,
    usable_for_donate BIT NOT NULL DEFAULT 0,
    usable_for_read BIT NOT NULL DEFAULT 0,
    description NVARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_coin_types_code UNIQUE(code)
);
GO

-- 4) wallets
CREATE TABLE dbo.wallets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    currency NVARCHAR(10) NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_wallets_user UNIQUE(user_id)
);
GO

-- 5) wallet_balances
CREATE TABLE dbo.wallet_balances (
    id INT IDENTITY(1,1) PRIMARY KEY,
    wallet_id INT NOT NULL,
    coin_type_id INT NOT NULL,
    balance DECIMAL(18,4) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(18,4) NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_wallet_balances_wallet_coin UNIQUE (wallet_id, coin_type_id)
);
GO

-- 6) stories
CREATE TABLE dbo.stories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    author_id INT NOT NULL,
    title NVARCHAR(500) NOT NULL,
    summary NVARCHAR(MAX) NULL,
    cover_url NVARCHAR(1000) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    visibility NVARCHAR(50) NOT NULL DEFAULT 'public',
    language NVARCHAR(20) NULL,
    pen_name_id INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    published_at DATETIME2 NULL
);
GO

-- 7) volumes
CREATE TABLE dbo.volumes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    story_id INT NOT NULL,
    title NVARCHAR(300) NULL,
    sequence_index INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);
GO

-- 8) chapters
CREATE TABLE dbo.chapters (
    id INT IDENTITY(1,1) PRIMARY KEY,
    volume_id INT NULL,
    story_id INT NOT NULL,
    title NVARCHAR(500) NOT NULL,
    sequence_index INT NOT NULL DEFAULT 0,
    content_url NVARCHAR(2000) NULL,
    content NVARCHAR(MAX) NULL,
    is_free BIT NOT NULL DEFAULT 0,
    price_coin DECIMAL(18,4) NULL,
    price_coin_type_id INT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    views_count BIGINT NOT NULL DEFAULT 0,
    likes_count BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    published_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

-- 9) tags
CREATE TABLE dbo.tags (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    slug NVARCHAR(200) NOT NULL
);
CREATE UNIQUE INDEX IX_tags_slug ON dbo.tags(slug);
GO

-- 10) story_tags
CREATE TABLE dbo.story_tags (
    story_id INT NOT NULL,
    tag_id INT NOT NULL,
    CONSTRAINT PK_story_tags PRIMARY KEY (story_id, tag_id)
);
GO

-- 11) transactions
CREATE TABLE dbo.transactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type NVARCHAR(50) NOT NULL,
    coin_type_id INT NOT NULL,
    direction NVARCHAR(10) NOT NULL,
    amount_coin DECIMAL(18,4) NOT NULL,
    fee_coin DECIMAL(18,4) NULL,
    amount_money DECIMAL(18,2) NULL,
    fee_money DECIMAL(18,2) NULL,
    net_amount_coin DECIMAL(18,4) NULL,
    related_story_id INT NULL,
    related_chapter_id INT NULL,
    recipient_user_id INT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_provider_ref NVARCHAR(500) NULL,
    external_ref NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    confirmed_at DATETIME2 NULL
);
CREATE INDEX IX_transactions_external_ref ON dbo.transactions(external_ref);
GO

-- 12) chapter_purchases
CREATE TABLE dbo.chapter_purchases (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    transaction_id BIGINT NULL,
    coin_type_id INT NOT NULL,
    purchased_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UQ_chapter_purchases_user_chapter ON dbo.chapter_purchases(user_id, chapter_id);
GO

-- 13) donations
CREATE TABLE dbo.donations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    story_id INT NULL,
    chapter_id INT NULL,
    coin_type_id INT NOT NULL,
    amount_coin DECIMAL(18,4) NOT NULL,
    is_anonymous BIT NOT NULL DEFAULT 0,
    transaction_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 14) follows
CREATE TABLE dbo.follows (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    target_type NVARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UQ_follows_user_target ON dbo.follows(user_id, target_type, target_id);
GO

-- 15) library_entries
CREATE TABLE dbo.library_entries (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    story_id INT NOT NULL,
    added_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    is_favorite BIT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX UQ_library_entries_user_story ON dbo.library_entries(user_id, story_id);
GO

-- 16) bookmarks
CREATE TABLE dbo.bookmarks (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    story_id INT NOT NULL,
    chapter_id INT NOT NULL,
    element_id NVARCHAR(200) NULL,
    position_percent DECIMAL(5,2) NULL,
    last_read_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    is_favorite BIT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX UQ_bookmarks_user_chapter ON dbo.bookmarks(user_id, chapter_id);
GO

-- 17) content_segments
CREATE TABLE dbo.content_segments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    chapter_id INT NOT NULL,
    segment_id NVARCHAR(200) NOT NULL,
    position_index INT NOT NULL DEFAULT 0,
    position_percent_start DECIMAL(5,2) NULL,
    position_percent_end DECIMAL(5,2) NULL,
    length_estimate INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UQ_content_segments_chapter_segment ON dbo.content_segments(chapter_id, segment_id);
GO

-- 18) reading_sessions
CREATE TABLE dbo.reading_sessions (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    story_id INT NULL,
    started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    last_event_at DATETIME2 NULL,
    ended_at DATETIME2 NULL,
    total_view_time_ms BIGINT NOT NULL DEFAULT 0,
    max_position_percent DECIMAL(5,2) NULL,
    is_completed BIT NOT NULL DEFAULT 0
);
GO

-- 19) reading_events
CREATE TABLE dbo.reading_events (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    session_id UNIQUEIDENTIFIER NOT NULL,
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    element_id NVARCHAR(200) NOT NULL,
    event_type NVARCHAR(50) NOT NULL,
    visible_ratio DECIMAL(5,4) NULL,
    duration_ms INT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_reading_events_session ON dbo.reading_events(session_id);
GO

-- 20) reading_progress_summary
CREATE TABLE dbo.reading_progress_summary (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    story_id INT NOT NULL,
    chapter_id INT NOT NULL,
    best_position_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_read_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    total_view_time_ms BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX UQ_reading_progress_user_chapter ON dbo.reading_progress_summary(user_id, chapter_id);
GO

-- 21) comments
CREATE TABLE dbo.comments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    parent_comment_id BIGINT NULL,
    content NVARCHAR(MAX) NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    is_hidden BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);
CREATE INDEX IX_comments_chapter ON dbo.comments(chapter_id);
GO

-- 22) reports
CREATE TABLE dbo.reports (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    reporter_id INT NOT NULL,
    target_type NVARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    reason NVARCHAR(MAX) NULL,
    details NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'open',
    action_taken_by INT NULL,
    action NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    resolved_at DATETIME2 NULL
);
GO

-- 23) moderation_actions
CREATE TABLE dbo.moderation_actions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type NVARCHAR(200) NOT NULL,
    target_type NVARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    reason NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 24) pen_names
CREATE TABLE dbo.pen_names (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    pen_name NVARCHAR(200) NOT NULL,
    profile_bio NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 25) drafts
CREATE TABLE dbo.drafts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    author_id INT NOT NULL,
    story_id INT NULL,
    chapter_id INT NULL,
    title NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NULL,
    content_url NVARCHAR(2000) NULL,
    autosave_version INT NOT NULL DEFAULT 0,
    is_latest BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);
GO

-- 26) achievements
CREATE TABLE dbo.achievements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(100) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    criteria_json NVARCHAR(MAX) NULL,
    reward_coin DECIMAL(18,4) NULL,
    reward_coin_type_id INT NULL
);
CREATE UNIQUE INDEX IX_achievements_code ON dbo.achievements(code);
GO

-- 27) user_achievements
CREATE TABLE dbo.user_achievements (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    achieved_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    is_claimed BIT NOT NULL DEFAULT 0
);
GO

-- 28) daily_missions
CREATE TABLE dbo.daily_missions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL,
    mission_code NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX) NULL,
    target NVARCHAR(MAX) NULL,
    reward_coin DECIMAL(18,4) NULL,
    reward_coin_type_id INT NULL
);
CREATE UNIQUE INDEX UQ_daily_mission_date_code ON dbo.daily_missions(date, mission_code);
GO

-- 29) user_daily_status
CREATE TABLE dbo.user_daily_status (
    user_id INT NOT NULL,
    daily_mission_id INT NOT NULL,
    progress NVARCHAR(MAX) NULL,
    completed_at DATETIME2 NULL,
    CONSTRAINT PK_user_daily_status PRIMARY KEY (user_id, daily_mission_id)
);
GO

-- 30) payouts
CREATE TABLE dbo.payouts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    author_id INT NOT NULL,
    amount_money DECIMAL(18,2) NULL,
    amount_coin_b DECIMAL(18,4) NULL,
    fee_percent DECIMAL(5,2) NULL,
    fee_coin DECIMAL(18,4) NULL,
    net_amount_money DECIMAL(18,2) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'requested',
    requested_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    paid_at DATETIME2 NULL,
    payment_method_details NVARCHAR(1000) NULL,
    admin_id INT NULL,
    transaction_id BIGINT NULL
);
GO

-- 31) author_analytics_cache
CREATE TABLE dbo.author_analytics_cache (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    author_id INT NOT NULL,
    period NVARCHAR(20) NOT NULL,
    period_start DATETIME2 NOT NULL,
    views BIGINT NOT NULL DEFAULT 0,
    revenue_coin_b DECIMAL(18,4) NOT NULL DEFAULT 0,
    followers_count INT NOT NULL DEFAULT 0,
    chapter_stats_json NVARCHAR(MAX) NULL
);
CREATE INDEX IX_author_analytics_author_period ON dbo.author_analytics_cache(author_id, period, period_start);
GO

-- 32) permissions
CREATE TABLE dbo.permissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(200) NOT NULL,
    description NVARCHAR(1000) NULL
);
CREATE UNIQUE INDEX IX_permissions_code ON dbo.permissions(code);
GO

-- 33) role_permissions
CREATE TABLE dbo.role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    CONSTRAINT PK_role_permissions PRIMARY KEY (role_id, permission_id)
);
GO

-- 34) user_roles
CREATE TABLE dbo.user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_user_roles PRIMARY KEY (user_id, role_id)
);
GO

-- 35) coin_conversion_rules
CREATE TABLE dbo.coin_conversion_rules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    action NVARCHAR(50) NOT NULL,
    from_coin_type_id INT NULL,
    to_coin_type_id INT NULL,
    fee_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    effective_from DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    note NVARCHAR(MAX) NULL
);
CREATE INDEX IX_coin_conversion_action ON dbo.coin_conversion_rules(action, effective_from);
GO

/* =============================================
   PHẦN 2: TẠO KHÓA NGOẠI (FOREIGN KEYS)
   ============================================= */

-- users referenced by multiple tables
ALTER TABLE dbo.wallets
  ADD CONSTRAINT FK_wallets_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.stories
  ADD CONSTRAINT FK_stories_author FOREIGN KEY (author_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.volumes
  ADD CONSTRAINT FK_volumes_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.chapters
  ADD CONSTRAINT FK_chapters_volume FOREIGN KEY (volume_id) REFERENCES dbo.volumes(id);

ALTER TABLE dbo.chapters
  ADD CONSTRAINT FK_chapters_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.story_tags
  ADD CONSTRAINT FK_storytags_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.story_tags
  ADD CONSTRAINT FK_storytags_tag FOREIGN KEY (tag_id) REFERENCES dbo.tags(id);

ALTER TABLE dbo.wallet_balances
  ADD CONSTRAINT FK_walletbalances_wallet FOREIGN KEY (wallet_id) REFERENCES dbo.wallets(id);

ALTER TABLE dbo.wallet_balances
  ADD CONSTRAINT FK_walletbalances_cointype FOREIGN KEY (coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.transactions
  ADD CONSTRAINT FK_tx_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.transactions
  ADD CONSTRAINT FK_tx_cointype FOREIGN KEY (coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.transactions
  ADD CONSTRAINT FK_tx_story FOREIGN KEY (related_story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.transactions
  ADD CONSTRAINT FK_tx_chapter FOREIGN KEY (related_chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.transactions
  ADD CONSTRAINT FK_tx_recipient FOREIGN KEY (recipient_user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.chapter_purchases
  ADD CONSTRAINT FK_chpurchase_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.chapter_purchases
  ADD CONSTRAINT FK_chpurchase_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.chapter_purchases
  ADD CONSTRAINT FK_chpurchase_tx FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id);

ALTER TABLE dbo.chapter_purchases
  ADD CONSTRAINT FK_chpurchase_cointype FOREIGN KEY (coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_from_user FOREIGN KEY (from_user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_to_user FOREIGN KEY (to_user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_cointype FOREIGN KEY (coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.donations
  ADD CONSTRAINT FK_don_tx FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id);

ALTER TABLE dbo.follows
  ADD CONSTRAINT FK_follows_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.library_entries
  ADD CONSTRAINT FK_library_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.library_entries
  ADD CONSTRAINT FK_library_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.bookmarks
  ADD CONSTRAINT FK_bookmarks_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.bookmarks
  ADD CONSTRAINT FK_bookmarks_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.bookmarks
  ADD CONSTRAINT FK_bookmarks_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.content_segments
  ADD CONSTRAINT FK_segments_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.reading_sessions
  ADD CONSTRAINT FK_readingsession_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.reading_sessions
  ADD CONSTRAINT FK_readingsession_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.reading_sessions
  ADD CONSTRAINT FK_readingsession_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.reading_events
  ADD CONSTRAINT FK_re_events_session FOREIGN KEY (session_id) REFERENCES dbo.reading_sessions(id);

ALTER TABLE dbo.reading_events
  ADD CONSTRAINT FK_re_events_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.reading_events
  ADD CONSTRAINT FK_re_events_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.reading_progress_summary
  ADD CONSTRAINT FK_rps_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.reading_progress_summary
  ADD CONSTRAINT FK_rps_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.reading_progress_summary
  ADD CONSTRAINT FK_rps_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.comments
  ADD CONSTRAINT FK_comments_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.comments
  ADD CONSTRAINT FK_comments_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.comments
  ADD CONSTRAINT FK_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES dbo.comments(id);

ALTER TABLE dbo.reports
  ADD CONSTRAINT FK_reports_reporter FOREIGN KEY (reporter_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.reports
  ADD CONSTRAINT FK_reports_action_by FOREIGN KEY (action_taken_by) REFERENCES dbo.users(id);

ALTER TABLE dbo.moderation_actions
  ADD CONSTRAINT FK_modaction_admin FOREIGN KEY (admin_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.pen_names
  ADD CONSTRAINT FK_pen_names_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.drafts
  ADD CONSTRAINT FK_drafts_author FOREIGN KEY (author_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.drafts
  ADD CONSTRAINT FK_drafts_story FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.drafts
  ADD CONSTRAINT FK_drafts_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.chapters(id);

ALTER TABLE dbo.achievements
  ADD CONSTRAINT FK_ach_reward_cointype FOREIGN KEY (reward_coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.user_achievements
  ADD CONSTRAINT FK_userach_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.user_achievements
  ADD CONSTRAINT FK_userach_ach FOREIGN KEY (achievement_id) REFERENCES dbo.achievements(id);

ALTER TABLE dbo.daily_missions
  ADD CONSTRAINT FK_dailymission_cointype FOREIGN KEY (reward_coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.user_daily_status
  ADD CONSTRAINT FK_uds_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.user_daily_status
  ADD CONSTRAINT FK_uds_daily FOREIGN KEY (daily_mission_id) REFERENCES dbo.daily_missions(id);

ALTER TABLE dbo.payouts
  ADD CONSTRAINT FK_payouts_author FOREIGN KEY (author_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.payouts
  ADD CONSTRAINT FK_payouts_admin FOREIGN KEY (admin_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.payouts
  ADD CONSTRAINT FK_payouts_tx FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id);

ALTER TABLE dbo.author_analytics_cache
  ADD CONSTRAINT FK_aac_author FOREIGN KEY (author_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.permissions
  ADD CONSTRAINT DF_permissions_dummy DEFAULT (NULL) FOR description;

ALTER TABLE dbo.role_permissions
  ADD CONSTRAINT FK_rp_role FOREIGN KEY (role_id) REFERENCES dbo.roles(id);

ALTER TABLE dbo.role_permissions
  ADD CONSTRAINT FK_rp_perm FOREIGN KEY (permission_id) REFERENCES dbo.permissions(id);

ALTER TABLE dbo.user_roles
  ADD CONSTRAINT FK_ur_user FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.user_roles
  ADD CONSTRAINT FK_ur_role FOREIGN KEY (role_id) REFERENCES dbo.roles(id);

ALTER TABLE dbo.coin_conversion_rules
  ADD CONSTRAINT FK_conv_from_cointype FOREIGN KEY (from_coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.coin_conversion_rules
  ADD CONSTRAINT FK_conv_to_cointype FOREIGN KEY (to_coin_type_id) REFERENCES dbo.coin_types(id);

-- FK bổ sung
ALTER TABLE dbo.volumes
  ADD CONSTRAINT FK_volumes_story_ref FOREIGN KEY (story_id) REFERENCES dbo.stories(id);

ALTER TABLE dbo.story_tags
  ADD CONSTRAINT FK_storytags_tag_ref FOREIGN KEY (tag_id) REFERENCES dbo.tags(id);

ALTER TABLE dbo.wallets
  ADD CONSTRAINT FK_wallets_user_ref FOREIGN KEY (user_id) REFERENCES dbo.users(id);

ALTER TABLE dbo.chapter_purchases
  ADD CONSTRAINT FK_chpurchase_cointype_ref FOREIGN KEY (coin_type_id) REFERENCES dbo.coin_types(id);

ALTER TABLE dbo.stories
  ADD CONSTRAINT FK_stories_penname FOREIGN KEY (pen_name_id) REFERENCES dbo.pen_names(id);

GO
PRINT '>>> HOAN TAT QUA TRINH KHOI TAO DATABASE.';
select * from users

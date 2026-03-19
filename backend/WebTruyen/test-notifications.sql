-- Add test notifications for user ID 1 (adjust if needed)
INSERT INTO notifications (user_id, kind, message, ref_type, ref_id, story_id, chapter_id, created_at) VALUES
(1, 'new_chapter', 'Chapter 1 of Story Test has been published', 'chapter', 1, 1, 1, NOW()),
(1, 'topup', 'Your wallet has been topped up with 100 coins', 'topup', 1, NULL, NULL, NOW()),
(1, 'report', 'Your report has been reviewed', 'report', 1, NULL, NULL, NOW()),
(1, 'system', 'Welcome to WebTruyen! Your account is now verified', 'system', NULL, NULL, NULL, NOW());

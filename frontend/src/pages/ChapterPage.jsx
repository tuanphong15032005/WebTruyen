import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Type,
  Info,
  Bookmark,
  BookmarkCheck,
  X,
  Heart,
  Flag,
  Send,
  Reply,
  Trash2,
  Check,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import useChapter from '../hooks/useChapter';
import useComments from '../hooks/useComments';
import useBookmarks from '../hooks/useBookmarks';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Ghép tất cả segment thành một mảng câu, mỗi phần tử giữ lại segmentId
 * để bookmark đúng theo API.
 */

const buildSentences = (segments = []) => {
  const result = [];
  segments.forEach((seg) => {
    const raw = seg.segmentText || '';
    const parts = raw.match(/[^.!?]+[.!?]+/g) || [raw];
    parts.forEach((text, i) =>
      result.push({ text, segmentId: seg.id, partIndex: i })
    );
  });
  return result;
};

const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

// ─── Sub-components (UI giữ nguyên 100%) ────────────────────────────────────

const SettingsPopup = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const bgColors = [
    { name: 'Trắng', value: '#FFFFFF', text: '#1a1a1a' },
    { name: 'Xanh nhạt', value: '#E8F5E9', text: '#1b5e20' },
    { name: 'Xanh dương', value: '#E3F2FD', text: '#0d47a1' },
    { name: 'Kem', value: '#FFF8DC', text: '#3e2723' },
    { name: 'Hồng nhạt', value: '#FCE4EC', text: '#880e4f' },
    { name: 'Xám', value: '#ECEFF1', text: '#263238' },
    { name: 'Đen', value: '#1a1a1a', text: '#e0e0e0' },
  ];
  const fonts = [
    { name: 'Crimson Text', value: "'Crimson Text', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Lora', value: "'Lora', serif" },
    { name: 'Spectral', value: "'Spectral', serif" },
  ];
  const alignments = [
    { icon: '≡', value: 'left', label: 'Trái' },
    { icon: '▭', value: 'center', label: 'Giữa' },
    { icon: '≣', value: 'right', label: 'Phải' },
    { icon: '▦', value: 'justify', label: 'Đều' },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Tùy chỉnh giao diện</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-section">
          <label>Màu nền</label>
          <div className="color-grid">
            {bgColors.map((color) => (
              <button
                key={color.value}
                className={`color-option ${settings.bgColor === color.value ? 'active' : ''}`}
                style={{ backgroundColor: color.value, color: color.text }}
                onClick={() =>
                  onSettingsChange({ ...settings, bgColor: color.value, textColor: color.text })
                }
                title={color.name}
              >
                {settings.bgColor === color.value && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <label>Font chữ</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => onSettingsChange({ ...settings, fontFamily: e.target.value })}
            className="font-select"
          >
            {fonts.map((font) => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-section">
          <label>Kích cỡ chữ</label>
          <div className="size-controls">
            <button
              className="size-btn"
              onClick={() =>
                onSettingsChange({ ...settings, fontSize: Math.max(14, settings.fontSize - 2) })
              }
            >
              A-
            </button>
            <span className="size-display">{settings.fontSize}px</span>
            <button
              className="size-btn"
              onClick={() =>
                onSettingsChange({ ...settings, fontSize: Math.min(28, settings.fontSize + 2) })
              }
            >
              A+
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label>Căn chỉnh</label>
          <div className="align-controls">
            {alignments.map((align) => (
              <button
                key={align.value}
                className={`align-btn ${settings.textAlign === align.value ? 'active' : ''}`}
                onClick={() => onSettingsChange({ ...settings, textAlign: align.value })}
                title={align.label}
              >
                {align.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidePanel = ({
  isOpen,
  onClose,
  mode,
  chapters,
  currentChapterId,
  bookmarks,
  onChapterSelect,
  onBookmarkDelete,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidepanel-overlay" onClick={onClose} />
      <div className={`sidepanel ${isOpen ? 'open' : ''}`}>
        <div className="sidepanel-header">
          <h3>{mode === 'chapters' ? 'Danh sách chương' : 'Bookmark của tôi'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sidepanel-content">
          {mode === 'chapters' ? (
            <div className="chapters-list">
              {chapters.map((ch) => {
                const locked = !ch.free && ch.status !== 'PUBLISHED';
                return (
                  <div
                    key={ch.id}
                    className={`chapter-item ${ch.id === currentChapterId ? 'active' : ''} ${
                      locked ? 'locked' : ''
                    }`}
                    onClick={() => {
                      if (!locked) {
                        onChapterSelect(ch.id);
                        onClose();
                      }
                    }}
                  >
                    <div className="chapter-info">
                      <span className="chapter-number">Chương {ch.sequenceIndex}</span>
                      <span className="chapter-title">{ch.title}</span>
                    </div>
                    {locked && <span className="lock-icon">🔒</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bookmarks-list">
              {bookmarks.length === 0 ? (
                <div className="empty-state">
                  <Bookmark size={48} strokeWidth={1} />
                  <p>Chưa có bookmark nào</p>
                  <small>Click vào câu văn để lưu bookmark</small>
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div key={bm.id} className="bookmark-item">
                    <div className="bookmark-text">{bm.text}</div>
                    <button
                      className="delete-bookmark"
                      onClick={() => onBookmarkDelete(bm.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const VerticalToolbar = ({
  onPrevChapter,
  onNextChapter,
  onHome,
  onSettings,
  onInfo,
  onBookmarks,
  hasPrev,
  hasNext,
}) => (
  <div className="vertical-toolbar">
    <button className="toolbar-btn" onClick={onPrevChapter} disabled={!hasPrev} title="Chương trước">
      <ChevronLeft size={20} />
    </button>
    <button className="toolbar-btn" onClick={onHome} title="Trang chủ">
      <Home size={20} />
    </button>
    <button className="toolbar-btn" onClick={onSettings} title="Tùy chỉnh">
      <Type size={20} />
    </button>
    <button className="toolbar-btn" onClick={onInfo} title="Danh sách chương">
      <Info size={20} />
    </button>
    <button className="toolbar-btn" onClick={onBookmarks} title="Bookmarks">
      <Bookmark size={20} />
    </button>
    <button className="toolbar-btn" onClick={onNextChapter} disabled={!hasNext} title="Chương sau">
      <ChevronRight size={20} />
    </button>
  </div>
);

const ChapterContent = ({
  sentences,
  settings,
  selectedIndex,
  onSentenceClick,
  onBookmarkSentence,
  bookmarks,
}) => (
  <div
    className="chapter-content"
    style={{
      fontFamily: settings.fontFamily,
      fontSize: `${settings.fontSize}px`,
      textAlign: settings.textAlign,
      lineHeight: 1.8,
      color: settings.textColor,
    }}
  >
    {sentences.map((s, index) => {
      const isSelected = selectedIndex === index;
      const isBookmarked = bookmarks.some((b) => b.segmentId === s.segmentId);

      return (
        <span key={index} className="sentence-wrapper">
          <span
            className={`sentence ${isSelected ? 'selected' : ''} ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => onSentenceClick(index)}
          >
            {s.text}
          </span>
          {isSelected && (
            <button
              className="bookmark-inline-btn"
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkSentence(s);
              }}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          )}
        </span>
      );
    })}
  </div>
);

const LockedChapter = ({ chapter, onPurchase }) => (
  <div className="locked-chapter">
    <div className="lock-icon-large">🔒</div>
    <h3>Chương này đã bị khóa</h3>
    <p>Vui lòng dùng Vàng để mở khóa chương này và tiếp tục đọc</p>
    <div className="lock-price">
      <span className="coin-icon">🪙</span>
      <span className="price">{chapter.priceCoin ?? 0} Vàng</span>
    </div>
    <button className="purchase-btn" onClick={onPurchase}>
      Mua chương này
    </button>
  </div>
);

const CommentsSection = ({ chapter, storyId }) => {
  const { 
    comments, 
    addComment, 
    loading, 
    error, 
    loadMore, 
    hasMore, 
    totalElements 
  } = useComments(storyId, chapter?.id);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalCount = (list) =>
    list.reduce((acc, c) => acc + 1 + (c.replies ? totalCount(c.replies) : 0), 0);

 const handleSubmit = async (e) => {
   e.preventDefault();

   // Same validation as Metadata
   if (!newComment.trim() || submitting) return;

   setSubmitting(true);

   try {
     // Same API call format as Metadata
     const commentData = {
       content: newComment.trim(),
       ...(replyingTo && { parentCommentId: replyingTo })
     };
     
     await addComment(commentData);

     // Same reset logic as Metadata
     setNewComment('');
     setReplyingTo(null);
   } catch (error) {
     console.error('Comment error:', error);
     alert(error.message || 'Không thể gửi bình luận. Vui lòng thử lại.');
   } finally {
     setSubmitting(false);
   }
 };


  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'reply' : ''}`}>
      <div className="comment-avatar">
        {comment.avatarUrl ? (
          <img src={comment.avatarUrl} alt={comment.displayName} style={{ width: 40, height: 40, borderRadius: '50%' }} />
        ) : (
          '👤'
        )}
      </div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-user">{comment.displayName || comment.username}</span>
          <span className="comment-time">{formatTimestamp(comment.createdAt)}</span>
        </div>
        <div className="comment-content">{comment.content}</div>
        <div className="comment-actions">
          <button className="comment-action">
            <Heart size={14} />
          </button>
          {!isReply && (
            <button className="comment-action" onClick={() => setReplyingTo(comment.id)}>
              <Reply size={14} />
              Trả lời
            </button>
          )}
        </div>
        {comment.replies?.length > 0 && (
          <div className="replies">
            {comment.replies.map((r) => renderComment(r, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="comments-section">
      <h3 className="comments-title">Bình luận ({totalElements})</h3>

      <form onSubmit={handleSubmit} className="comment-form">
        {replyingTo && (
          <div className="replying-to">
            <span>Đang trả lời bình luận</span>
            <button type="button" onClick={() => setReplyingTo(null)}>
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? 'Viết câu trả lời...' : 'Viết bình luận của bạn...'}
          rows="3"
        />
        <button type="submit" className="submit-comment-btn" disabled={submitting}>
          <Send size={16} />
          {submitting ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>

      {error && (
        <div className="comment-error">
          {error}
        </div>
      )}

      <div className="comments-list">
        {comments.map((c) => renderComment(c))}
      </div>

      {hasMore && (
        <button 
          className="load-more-comments-btn" 
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
        </button>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const INITIAL_CHAPTER_ID = 1; // fallback nếu không có query param

const ChapterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialId = Number(searchParams.get('chapterId')) || INITIAL_CHAPTER_ID;

  const { chapterId, chapter, allChapters, loading, error, navigateToChapter } =
    useChapter(initialId);

  const { bookmarks, toggleBookmark, removeBookmark } = useBookmarks(chapterId);

  const [settings, setSettings] = useState({
    bgColor: '#FFF8DC',
    textColor: '#3e2723',
    fontFamily: "'Crimson Text', serif",
    fontSize: 18,
    textAlign: 'justify',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelMode, setSidePanelMode] = useState('chapters');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [liked, setLiked] = useState(false);

  // Sync bgColor vào body
  useEffect(() => {
    document.body.style.backgroundColor = settings.bgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [settings.bgColor]);

  // Sync chapterId vào URL để share link hoạt động
  useEffect(() => {
    const current = Number(searchParams.get('chapterId'));
    if (current !== chapterId) {
      navigate(`?chapterId=${chapterId}`, { replace: true });
    }
  }, [chapterId]);

  const sentences = buildSentences(chapter?.segments);

  const isLocked = chapter && !chapter.free && chapter.status !== 'PUBLISHED';

  const handleSentenceClick = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const handleBookmarkSentence = async (sentence) => {
    await toggleBookmark({
      segmentId: sentence.segmentId,
      text: sentence.text.trim(),
    });
  };

  const handleOpenSidePanel = (mode) => {
    setSidePanelMode(mode);
    setShowSidePanel(true);
  };

  const handlePurchase = () => {
    alert('Chức năng mua chương sẽ được tích hợp với hệ thống thanh toán');
  };

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: settings.bgColor,
          color: settings.textColor,
          fontFamily: settings.fontFamily,
          fontSize: '1.2rem',
        }}
      >
        Đang tải chương...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: settings.bgColor,
          color: '#e53935',
          fontFamily: settings.fontFamily,
          gap: 16,
        }}
      >
        <p>❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div
      className="chapter-reader"
      style={{
        backgroundColor: settings.bgColor,
        color: settings.textColor,
        fontFamily: settings.fontFamily,
      }}
    >
      {/* Vertical Toolbar */}
      <VerticalToolbar
        onPrevChapter={() => chapter.previousChapterId && navigateToChapter(chapter.previousChapterId)}
        onNextChapter={() => chapter.nextChapterId && navigateToChapter(chapter.nextChapterId)}
        onHome={() => navigate('/')}
        onSettings={() => setShowSettings(true)}
        onInfo={() => handleOpenSidePanel('chapters')}
        onBookmarks={() => handleOpenSidePanel('bookmarks')}
        hasPrev={!!chapter.previousChapterId}
        hasNext={!!chapter.nextChapterId}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Story Header */}
        <div className="story-header">
          <h1 className="story-title">
            {/* storyId có thể dùng để fetch tên truyện nếu cần */}
            Chương {chapter.sequenceIndex}
          </h1>
          <div className="chapter-info-bar">
            <h2 className="chapter-title">{chapter.title}</h2>
            <div className="chapter-meta">
              <span className="meta-item">
                📅 {chapter.lastUpdateAt ? new Date(chapter.lastUpdateAt).toLocaleDateString('vi-VN') : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLocked ? (
          <LockedChapter chapter={chapter} onPurchase={handlePurchase} />
        ) : (
          <>
            <ChapterContent
              sentences={sentences}
              settings={settings}
              selectedIndex={selectedIndex}
              onSentenceClick={handleSentenceClick}
              onBookmarkSentence={handleBookmarkSentence}
              bookmarks={bookmarks}
            />

            {/* Chapter Navigation */}
            <div className="chapter-navigation">
              <button
                className="nav-btn prev"
                onClick={() => chapter.previousChapterId && navigateToChapter(chapter.previousChapterId)}
                disabled={!chapter.previousChapterId}
              >
                <ChevronLeft size={20} />
                Chương trước
              </button>
              <button
                className="nav-btn next"
                onClick={() => chapter.nextChapterId && navigateToChapter(chapter.nextChapterId)}
                disabled={!chapter.nextChapterId}
              >
                Chương sau
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Interaction Bar */}
            <div className="interaction-bar">
              <button
                className={`interaction-btn ${liked ? 'liked' : ''}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Đã thích' : 'Thả tim'}
              </button>
              <button className="interaction-btn">
                <Flag size={20} />
                Báo lỗi
              </button>
            </div>

            {/* Comments – using same system as Metadata */}
            <CommentsSection chapter={chapter} storyId={chapter?.storyId} />
          </>
        )}
      </div>

      {/* Settings Popup */}
      <SettingsPopup
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Side Panel */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        mode={sidePanelMode}
        chapters={allChapters}
        currentChapterId={chapterId}
        bookmarks={bookmarks}
        onChapterSelect={navigateToChapter}
        onBookmarkDelete={removeBookmark}
      />

      {/* Preserve original CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;600&family=Spectral:wght@400;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { transition: background-color 0.3s ease; }
        .chapter-reader { min-height: 100vh; transition: all 0.3s ease; position: relative; }

        .vertical-toolbar {
          position: fixed; right: 24px; top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 8px; z-index: 100;
          background: rgba(255,255,255,0.95); padding: 12px 8px; border-radius: 50px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12); backdrop-filter: blur(10px);
        }
        .toolbar-btn {
          width: 52px; height: 52px; border: none; background: transparent;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; color: #2c3e50;
        }
        .toolbar-btn:hover:not(:disabled) { background: #f0f0f0; transform: scale(1.1); }
        .toolbar-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .main-content { max-width: 900px; margin: 0 auto; padding: 60px 40px 100px; }
        .story-header { text-align: center; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px solid rgba(0,0,0,0.1); }
        .story-title {
          font-size: 2.8rem; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.5px;
          background: linear-gradient(135deg,#667eea 0%,#764ba2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .chapter-info-bar { margin-top: 16px; }
        .chapter-title { font-size: 1.8rem; font-weight: 600; margin-bottom: 12px; opacity: 0.9; }
        .chapter-meta { display: flex; gap: 24px; justify-content: center; font-size: 0.95rem; opacity: 0.7; }
        .meta-item { display: flex; align-items: center; gap: 6px; }

        .chapter-content { margin: 48px 0; line-height: 1.8; }
        .sentence-wrapper { position: relative; }
        .sentence { cursor: pointer; transition: all 0.2s ease; padding: 2px 4px; border-radius: 4px; }
        .sentence:hover { background: rgba(0,0,0,0.05); }
        .sentence.selected { background: rgba(255,235,59,0.3); box-shadow: 0 0 0 2px rgba(255,235,59,0.5); }
        .sentence.bookmarked { background: rgba(103,58,183,0.1); }
        .bookmark-inline-btn {
          display: inline-flex; align-items: center; justify-content: center;
          margin-left: 6px; padding: 4px 8px; background: #673ab7; color: white;
          border: none; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; vertical-align: middle;
        }
        .bookmark-inline-btn:hover { background: #5e35b1; transform: scale(1.05); }

        .locked-chapter {
          text-align: center; padding: 80px 40px; background: rgba(255,255,255,0.6);
          border-radius: 16px; margin: 48px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .lock-icon-large { font-size: 64px; margin-bottom: 24px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        .locked-chapter h3 { font-size: 1.8rem; margin-bottom: 12px; }
        .locked-chapter p { font-size: 1.1rem; opacity: 0.7; margin-bottom: 24px; }
        .lock-price { display: inline-flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin-bottom: 24px; padding: 12px 24px; background: rgba(255,193,7,0.2); border-radius: 50px; }
        .purchase-btn { padding: 14px 40px; font-size: 1.1rem; font-weight: 600; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; border: none; border-radius: 50px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(102,126,234,0.4); }
        .purchase-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(102,126,234,0.5); }

        .chapter-navigation { display: flex; gap: 16px; margin: 48px 0; }
        .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px 32px; font-size: 1.1rem; font-weight: 600; background: rgba(255,255,255,0.8); border: 2px solid rgba(0,0,0,0.1); border-radius: 12px; cursor: pointer; transition: all 0.3s ease; color: #000; }
        .nav-btn:hover:not(:disabled) { background: rgba(102,126,234,0.1); border-color: #667eea; transform: translateY(-2px); }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .interaction-bar { display: flex; gap: 16px; margin: 32px 0; padding: 24px; background: rgba(255,255,255,0.6); border-radius: 12px; }
        .interaction-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; font-size: 1rem; font-weight: 600; background: white; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; color: #333; }
        .interaction-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .interaction-btn.liked { background: #ff4757; color: white; border-color: #ff4757; }

        .comments-section { margin-top: 64px; padding-top: 32px; border-top: 2px solid rgba(0,0,0,0.1); }
        .comments-title { font-size: 1.6rem; margin-bottom: 24px; font-weight: 600; }
        .comment-form { margin-bottom: 32px; background: rgba(255,255,255,0.8); padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .replying-to { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(102,126,234,0.1); border-radius: 6px; margin-bottom: 12px; font-size: 0.9rem; }
        .replying-to button { background: none; border: none; cursor: pointer; color: inherit; }
        .comment-form textarea { width: 100%; padding: 12px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; font-family: inherit; font-size: 0.95rem; resize: vertical; transition: all 0.2s ease; }
        .comment-form textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .submit-comment-btn { margin-top: 12px; display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .submit-comment-btn:hover { background: #5568d3; transform: translateY(-1px); }
        .submit-comment-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .comments-list { display: flex; flex-direction: column; gap: 16px; }
        .comment { display: flex; gap: 12px; padding: 16px; background: rgba(255,255,255,0.6); border-radius: 12px; transition: all 0.2s ease; }
        .comment:hover { background: rgba(255,255,255,0.9); }
        .comment.reply { margin-left: 48px; background: rgba(255,255,255,0.4); }
        .comment-avatar { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(102,126,234,0.1); border-radius: 50%; flex-shrink: 0; }
        .comment-body { flex: 1; }
        .comment-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .comment-user { font-weight: 600; font-size: 0.95rem; }
        .comment-time { font-size: 0.85rem; opacity: 0.6; }
        .comment-content { margin-bottom: 8px; line-height: 1.5; }
        .comment-actions { display: flex; gap: 16px; }
        .comment-action { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 0.7; transition: opacity 0.2s; font-size: 0.85rem; }
        .comment-action:hover { opacity: 1; }
        .replies { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }

        .settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .settings-popup { background: white; border-radius: 16px; padding: 24px; width: 360px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .settings-header h3 { font-size: 1.2rem; font-weight: 600; }
        .close-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; transition: background 0.2s; }
        .close-btn:hover { background: #f0f0f0; }
        .settings-section { margin-bottom: 20px; }
        .settings-section label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 10px; opacity: 0.8; }
        .color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .color-option { width: 40px; height: 40px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .color-option.active { border-color: #667eea; transform: scale(1.1); }
        .font-select { width: 100%; padding: 10px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 0.95rem; cursor: pointer; }
        .size-controls { display: flex; align-items: center; gap: 12px; }
        .size-btn { padding: 8px 16px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; background: white; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .size-btn:hover { border-color: #667eea; }
        .size-display { font-size: 1rem; font-weight: 600; min-width: 50px; text-align: center; }
        .align-controls { display: flex; gap: 8px; }
        .align-btn { flex: 1; padding: 10px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; background: white; cursor: pointer; font-size: 1.1rem; transition: all 0.2s; }
        .align-btn.active { border-color: #667eea; background: rgba(102,126,234,0.1); }

        .sidepanel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; }
        .sidepanel { position: fixed; left: 0; top: 0; bottom: 0; width: 320px; background: white; z-index: 151; transform: translateX(-100%); transition: transform 0.3s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
        .sidepanel.open { transform: translateX(0); }
        .sidepanel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .sidepanel-header h3 { font-size: 1.1rem; font-weight: 600; }
        .sidepanel-content { flex: 1; overflow-y: auto; padding: 16px; }
        .chapters-list { display: flex; flex-direction: column; gap: 4px; }
        .chapter-item { padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .chapter-item:hover:not(.locked) { background: rgba(102,126,234,0.1); }
        .chapter-item.active { background: rgba(102,126,234,0.15); font-weight: 600; }
        .chapter-item.locked { opacity: 0.5; cursor: not-allowed; }
        .chapter-item { display: flex; justify-content: space-between; align-items: center; }
        .chapter-info { display: flex; flex-direction: column; gap: 2px; }
        .chapter-number { font-size: 0.85rem; opacity: 0.7; }
        .lock-icon { font-size: 0.9rem; }
        .bookmarks-list { display: flex; flex-direction: column; gap: 8px; }
        .bookmark-item { padding: 12px; background: rgba(103,58,183,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .bookmark-text { font-size: 0.9rem; line-height: 1.5; flex: 1; }
        .delete-bookmark { background: none; border: none; cursor: pointer; color: #e53935; padding: 4px; border-radius: 4px; transition: background 0.2s; flex-shrink: 0; }
        .delete-bookmark:hover { background: rgba(229,57,53,0.1); }
        .empty-state { text-align: center; padding: 48px 24px; opacity: 0.5; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-state p { font-weight: 600; }
        .empty-state small { font-size: 0.85rem; }
      `}</style>
    </div>
  );
};

export default ChapterPage;
// import React, { useState, useEffect } from 'react';
// import {
//   ChevronLeft,
//   ChevronRight,
//   Home,
//   Type,
//   Info,
//   Bookmark,
//   BookmarkCheck,
//   X,
//   Heart,
//   Flag,
//   Send,
//   Reply,
//   Trash2,
//   Menu,
//   Check
// } from 'lucide-react';
//
// // Mock data
// const SAMPLE_STORY = {
//   id: 1,
//   title: "Hành Trình Tu Tiên Của Ta",
//   author: "Mộng Nhập Thần Cơ",
//   currentChapter: 42,
//   totalChapters: 250
// };
//
// const SAMPLE_CHAPTER = {
//   id: 42,
//   number: 42,
//   title: "Đột Phá Cảnh Giới",
//   content: "Ánh trăng lung linh trên mặt hồ, phản chiếu vẻ đẹp kỳ ảo của đêm. Lâm Phong ngồi kiết già giữa khu rừng tịch mịch, tâm thần chìm đắm trong thiền định sâu xa. Chân khí trong đan điền từ từ vận chuyển theo chu thiên, mỗi vòng tuần hoàn đều mạnh mẽ hơn vòng trước. Đây là lần thứ chín mươi chín Lâm Phong vận công liên tục không nghỉ. Tia sáng đầu tiên của bình minh len lỏi qua tán cây rậm rạp. Một luồng chân khí tinh thuần bất ngờ bùng nổ từ đan điền, xung kích khắp tứ chi bách hài. Lâm Phong mở to đôi mắt, ánh sáng lóe lên rồi lại tắt lịm. Cảnh giới Trúc Cơ kỳ ba đã đạt được. Hắn biết rằng con đường phía trước còn vô cùng gian nan. Những tông môn lớn nhỏ trong giang hồ đều đang rình mò cơ hội để tranh đoạt bí tịch. Nhưng Lâm Phong không hề sợ hãi. Sức mạnh mới tràn ngập toàn thân khiến hắn tự tin hơn bao giờ hết.",
//   comments: 127,
//   wordCount: 2834,
//   updatedAt: "2026-02-10",
//   isLocked: false,
//   isPurchased: true,
//   price: 50
// };
//
// const ALL_CHAPTERS = Array.from({ length: 50 }, (_, i) => ({
//   id: i + 1,
//   number: i + 1,
//   title: i + 1 === 42 ? "Đột Phá Cảnh Giới" : `Chương ${i + 1}`,
//   isLocked: i + 1 > 42,
//   isPurchased: i + 1 <= 42
// }));
//
// const SAMPLE_COMMENTS = [
//   {
//     id: 1,
//     user: "PhongVânSư",
//     avatar: "🔥",
//     content: "Chương này hay quá! Tác giả viết rất chân thật cảm xúc của nhân vật!",
//     timestamp: "2 giờ trước",
//     likes: 24,
//     replies: []
//   },
//   {
//     id: 2,
//     user: "KiếmKhách",
//     avatar: "⚔️",
//     content: "Tiến triển tốt đấy, mong chờ chương sau",
//     timestamp: "5 giờ trước",
//     likes: 15,
//     replies: [
//       {
//         id: 3,
//         user: "ThiênCơLão",
//         avatar: "🌟",
//         content: "Đồng ý, cốt truyện đang dần hấp dẫn!",
//         timestamp: "4 giờ trước",
//         likes: 8
//       }
//     ]
//   }
// ];
//
// // Helper function to split content into sentences
// const splitIntoSentences = (text) => {
//   return text.match(/[^.!?]+[.!?]+/g) || [text];
// };
//
// // Settings Popup Component
// const SettingsPopup = ({ isOpen, onClose, settings, onSettingsChange }) => {
//   if (!isOpen) return null;
//
//   const bgColors = [
//     { name: 'Trắng', value: '#FFFFFF', text: '#1a1a1a' },
//     { name: 'Xanh nhạt', value: '#E8F5E9', text: '#1b5e20' },
//     { name: 'Xanh dương', value: '#E3F2FD', text: '#0d47a1' },
//     { name: 'Kem', value: '#FFF8DC', text: '#3e2723' },
//     { name: 'Hồng nhạt', value: '#FCE4EC', text: '#880e4f' },
//     { name: 'Xám', value: '#ECEFF1', text: '#263238' },
//     { name: 'Đen', value: '#1a1a1a', text: '#e0e0e0' }
//   ];
//
//   const fonts = [
//     { name: 'Crimson Text', value: "'Crimson Text', serif" },
//     { name: 'Merriweather', value: "'Merriweather', serif" },
//     { name: 'Lora', value: "'Lora', serif" },
//     { name: 'Spectral', value: "'Spectral', serif" }
//   ];
//   const alignments = [
//     { icon: '≡', value: 'left', label: 'Trái' },
//     { icon: '▭', value: 'center', label: 'Giữa' },
//     { icon: '≣', value: 'right', label: 'Phải' },
//     { icon: '▦', value: 'justify', label: 'Đều' }
//   ];
//
//   return (
//     <div className="settings-overlay" onClick={onClose}>
//       <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
//         <div className="settings-header">
//           <h3>Tùy chỉnh giao diện</h3>
//           <button className="close-btn" onClick={onClose}>
//             <X size={20} />
//           </button>
//         </div>
//
//         <div className="settings-section">
//           <label>Màu nền</label>
//           <div className="color-grid">
//             {bgColors.map((color) => (
//               <button
//                 key={color.value}
//                 className={`color-option ${settings.bgColor === color.value ? 'active' : ''}`}
//                 style={{ backgroundColor: color.value, color: color.text }}
//                 onClick={() => onSettingsChange({ ...settings, bgColor: color.value, textColor: color.text })}
//                 title={color.name}
//               >
//                 {settings.bgColor === color.value && <Check size={16} />}
//               </button>
//             ))}
//           </div>
//         </div>
//
//         <div className="settings-section">
//           <label>Font chữ</label>
//           <select
//             value={settings.fontFamily}
//             onChange={(e) => onSettingsChange({ ...settings, fontFamily: e.target.value })}
//             className="font-select"
//           >
//             {fonts.map(font => (
//               <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
//                 {font.name}
//               </option>
//             ))}
//           </select>
//         </div>
//
//         <div className="settings-section">
//           <label>Kích cỡ chữ</label>
//           <div className="size-controls">
//             <button
//               className="size-btn"
//               onClick={() => onSettingsChange({ ...settings, fontSize: Math.max(14, settings.fontSize - 2) })}
//             >
//               A-
//             </button>
//             <span className="size-display">{settings.fontSize}px</span>
//             <button
//               className="size-btn"
//               onClick={() => onSettingsChange({ ...settings, fontSize: Math.min(28, settings.fontSize + 2) })}
//             >
//               A+
//             </button>
//           </div>
//         </div>
//
//         <div className="settings-section">
//           <label>Căn chỉnh</label>
//           <div className="align-controls">
//             {alignments.map(align => (
//               <button
//                 key={align.value}
//                 className={`align-btn ${settings.textAlign === align.value ? 'active' : ''}`}
//                 onClick={() => onSettingsChange({ ...settings, textAlign: align.value })}
//                 title={align.label}
//               >
//                 {align.icon}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
//
// // Side Panel Component
// const SidePanel = ({ isOpen, onClose, mode, chapters, currentChapter, bookmarks, onChapterSelect, onBookmarkDelete }) => {
//   if (!isOpen) return null;
//
//   return (
//     <>
//       <div className="sidepanel-overlay" onClick={onClose}></div>
//       <div className={`sidepanel ${isOpen ? 'open' : ''}`}>
//         <div className="sidepanel-header">
//           <h3>{mode === 'chapters' ? 'Danh sách chương' : 'Bookmark của tôi'}</h3>
//           <button className="close-btn" onClick={onClose}>
//             <X size={20} />
//           </button>
//         </div>
//
//         <div className="sidepanel-content">
//           {mode === 'chapters' ? (
//             <div className="chapters-list">
//               {chapters.map((chapter) => (
//                 <div
//                   key={chapter.id}
//                   className={`chapter-item ${chapter.number === currentChapter ? 'active' : ''} ${chapter.isLocked && !chapter.isPurchased ? 'locked' : ''}`}
//                   onClick={() => {
//                     if (!chapter.isLocked || chapter.isPurchased) {
//                       onChapterSelect(chapter.number);
//                       onClose();
//                     }
//                   }}
//                 >
//                   <div className="chapter-info">
//                     <span className="chapter-number">Chương {chapter.number}</span>
//                     <span className="chapter-title">{chapter.title}</span>
//                   </div>
//                   {chapter.isLocked && !chapter.isPurchased && (
//                     <span className="lock-icon">🔒</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="bookmarks-list">
//               {bookmarks.length === 0 ? (
//                 <div className="empty-state">
//                   <Bookmark size={48} strokeWidth={1} />
//                   <p>Chưa có bookmark nào</p>
//                   <small>Click vào câu văn để lưu bookmark</small>
//                 </div>
//               ) : (
//                 bookmarks.map((bookmark) => (
//                   <div key={bookmark.id} className="bookmark-item">
//                     <div className="bookmark-text">{bookmark.text}</div>
//                     <button
//                       className="delete-bookmark"
//                       onClick={() => onBookmarkDelete(bookmark.id)}
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };
//
// // Vertical Toolbar Component
// const VerticalToolbar = ({ onPrevChapter, onNextChapter, onHome, onSettings, onInfo, onBookmarks, hasPrev, hasNext }) => {
//   return (
//     <div className="vertical-toolbar">
//       <button
//         className="toolbar-btn"
//         onClick={onPrevChapter}
//         disabled={!hasPrev}
//         title="Chương trước"
//       >
//         <ChevronLeft size={20} />
//       </button>
//       <button className="toolbar-btn" onClick={onHome} title="Trang chủ">
//         <Home size={20} />
//       </button>
//       <button className="toolbar-btn" onClick={onSettings} title="Tùy chỉnh">
//         <Type size={20} />
//       </button>
//       <button className="toolbar-btn" onClick={onInfo} title="Danh sách chương">
//         <Info size={20} />
//       </button>
//       <button className="toolbar-btn" onClick={onBookmarks} title="Bookmarks">
//         <Bookmark size={20} />
//       </button>
//       <button
//         className="toolbar-btn"
//         onClick={onNextChapter}
//         disabled={!hasNext}
//         title="Chương sau"
//       >
//         <ChevronRight size={20} />
//       </button>
//     </div>
//   );
// };
//
// // Chapter Content Component
// const ChapterContent = ({ chapter, settings, selectedSentence, onSentenceClick, onBookmarkSentence, bookmarks }) => {
//   const sentences = splitIntoSentences(chapter.content);
//
//   return (
//     <div
//       className="chapter-content"
//       style={{
//         fontFamily: settings.fontFamily,
//         fontSize: `${settings.fontSize}px`,
//         textAlign: settings.textAlign,
//         lineHeight: 1.8,
//         color: settings.textColor
//       }}
//     >
//       {sentences.map((sentence, index) => {
//         const isSelected = selectedSentence === index;
//         const isBookmarked = bookmarks.some(b => b.sentenceIndex === index);
//
//         return (
//           <span key={index} className="sentence-wrapper">
//             <span
//               className={`sentence ${isSelected ? 'selected' : ''} ${isBookmarked ? 'bookmarked' : ''}`}
//               onClick={() => onSentenceClick(index)}
//             >
//               {sentence}
//             </span>
//             {isSelected && (
//               <button
//                 className="bookmark-inline-btn"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onBookmarkSentence(index, sentence);
//                 }}
//               >
//                 {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
//               </button>
//             )}
//           </span>
//         );
//       })}
//     </div>
//   );
// };
//
// // Locked Chapter Component
// const LockedChapter = ({ chapter, onPurchase }) => {
//   return (
//     <div className="locked-chapter">
//       <div className="lock-icon-large">🔒</div>
//       <h3>Chương này đã bị khóa</h3>
//       <p>Vui lòng dùng Vàng để mở khóa chương này và tiếp tục đọc</p>
//       <div className="lock-price">
//         <span className="coin-icon">🪙</span>
//         <span className="price">{chapter.price} Vàng</span>
//       </div>
//       <button className="purchase-btn" onClick={onPurchase}>
//         Mua chương này
//       </button>
//     </div>
//   );
// };
//
// // Comments Section Component
// const CommentsSection = ({ comments }) => {
//   const [newComment, setNewComment] = useState('');
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [localComments, setLocalComments] = useState(comments);
//
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!newComment.trim()) return;
//
//     if (replyingTo) {
//       const updatedComments = localComments.map(comment => {
//         if (comment.id === replyingTo) {
//           return {
//             ...comment,
//             replies: [
//               ...comment.replies,
//               {
//                 id: Date.now(),
//                 user: "Bạn",
//                 avatar: "👤",
//                 content: newComment,
//                 timestamp: "Vừa xong",
//                 likes: 0
//               }
//             ]
//           };
//         }
//         return comment;
//       });
//       setLocalComments(updatedComments);
//     } else {
//       const newCommentObj = {
//         id: Date.now(),
//         user: "Bạn",
//         avatar: "👤",
//         content: newComment,
//         timestamp: "Vừa xong",
//         likes: 0,
//         replies: []
//       };
//       setLocalComments([newCommentObj, ...localComments]);
//     }
//
//     setNewComment('');
//     setReplyingTo(null);
//   };
//
//   return (
//     <div className="comments-section">
//       <h3 className="comments-title">
//         Bình luận ({localComments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
//       </h3>
//
//       <form onSubmit={handleSubmit} className="comment-form">
//         {replyingTo && (
//           <div className="replying-to">
//             <span>Đang trả lời bình luận</span>
//             <button type="button" onClick={() => setReplyingTo(null)}>
//               <X size={14} />
//             </button>
//           </div>
//         )}
//         <textarea
//           value={newComment}
//           onChange={(e) => setNewComment(e.target.value)}
//           placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận của bạn..."}
//           rows="3"
//         />
//         <button type="submit" className="submit-comment-btn">
//           <Send size={16} />
//           Gửi
//         </button>
//       </form>
//
//       <div className="comments-list">
//         {localComments.map((comment) => (
//           <div key={comment.id} className="comment">
//             <div className="comment-avatar">{comment.avatar}</div>
//             <div className="comment-body">
//               <div className="comment-header">
//                 <span className="comment-user">{comment.user}</span>
//                 <span className="comment-time">{comment.timestamp}</span>
//               </div>
//               <div className="comment-content">{comment.content}</div>
//               <div className="comment-actions">
//                 <button className="comment-action">
//                   <Heart size={14} />
//                   {comment.likes > 0 && <span>{comment.likes}</span>}
//                 </button>
//                 <button className="comment-action" onClick={() => setReplyingTo(comment.id)}>
//                   <Reply size={14} />
//                   Trả lời
//                 </button>
//               </div>
//
//               {comment.replies.length > 0 && (
//                 <div className="replies">
//                   {comment.replies.map((reply) => (
//                     <div key={reply.id} className="comment reply">
//                       <div className="comment-avatar">{reply.avatar}</div>
//                       <div className="comment-body">
//                         <div className="comment-header">
//                           <span className="comment-user">{reply.user}</span>
//                           <span className="comment-time">{reply.timestamp}</span>
//                         </div>
//                         <div className="comment-content">{reply.content}</div>
//                         <div className="comment-actions">
//                           <button className="comment-action">
//                             <Heart size={14} />
//                             {reply.likes > 0 && <span>{reply.likes}</span>}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
//
// // Main Chapter Reader Component
// const ChapterReader = () => {
//   const [settings, setSettings] = useState({
//     bgColor: '#FFF8DC',
//     textColor: '#3e2723',
//     fontFamily: "'Crimson Text', serif",
//     fontSize: 18,
//     textAlign: 'justify'
//   });
//
//   const [showSettings, setShowSettings] = useState(false);
//   const [showSidePanel, setShowSidePanel] = useState(false);
//   const [sidePanelMode, setSidePanelMode] = useState('chapters');
//   const [selectedSentence, setSelectedSentence] = useState(null);
//   const [bookmarks, setBookmarks] = useState([]);
//   const [liked, setLiked] = useState(false);
//   const [currentChapterNum, setCurrentChapterNum] = useState(42);
//
//   const currentChapter = SAMPLE_CHAPTER;
//
//   const handleSentenceClick = (index) => {
//     setSelectedSentence(selectedSentence === index ? null : index);
//   };
//
//   const handleBookmarkSentence = (index, text) => {
//     const existingBookmark = bookmarks.find(b => b.sentenceIndex === index);
//
//     if (existingBookmark) {
//       setBookmarks(bookmarks.filter(b => b.id !== existingBookmark.id));
//     } else {
//       const newBookmark = {
//         id: Date.now(),
//         sentenceIndex: index,
//         text: text.trim(),
//         chapterNumber: currentChapter.number
//       };
//       setBookmarks([...bookmarks, newBookmark]);
//     }
//   };
//
//   const handlePrevChapter = () => {
//     if (currentChapterNum > 1) {
//       setCurrentChapterNum(currentChapterNum - 1);
//       setSelectedSentence(null);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };
//
//   const handleNextChapter = () => {
//     if (currentChapterNum < SAMPLE_STORY.totalChapters) {
//       setCurrentChapterNum(currentChapterNum + 1);
//       setSelectedSentence(null);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };
//
//   const handleChapterSelect = (chapterNum) => {
//     setCurrentChapterNum(chapterNum);
//     setSelectedSentence(null);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };
//
//   const handlePurchase = () => {
//     alert('Chức năng mua chương sẽ được tích hợp với hệ thống thanh toán');
//   };
//
//   const handleOpenSidePanel = (mode) => {
//     setSidePanelMode(mode);
//     setShowSidePanel(true);
//   };
//
//   useEffect(() => {
//     document.body.style.backgroundColor = settings.bgColor;
//     return () => {
//       document.body.style.backgroundColor = '';
//     };
//   }, [settings.bgColor]);
//
//   return (
//     <div className="chapter-reader" style={{ backgroundColor: settings.bgColor, color: settings.textColor, fontFamily: settings.fontFamily }}>
//       {/* Vertical Toolbar */}
//       <VerticalToolbar
//         onPrevChapter={handlePrevChapter}
//         onNextChapter={handleNextChapter}
//         onHome={() => window.location.href = '/'}
//         onSettings={() => setShowSettings(true)}
//         onInfo={() => handleOpenSidePanel('chapters')}
//         onBookmarks={() => handleOpenSidePanel('bookmarks')}
//         hasPrev={currentChapterNum > 1}
//         hasNext={currentChapterNum < SAMPLE_STORY.totalChapters}
//       />
//
//       {/* Main Content */}
//       <div className="main-content">
//         {/* Story Header */}
//         <div className="story-header">
//           <h1 className="story-title">{SAMPLE_STORY.title}</h1>
//           <div className="chapter-info-bar">
//             <h2 className="chapter-title">Chương {currentChapter.number}: {currentChapter.title}</h2>
//             <div className="chapter-meta">
//               <span className="meta-item">💬 {currentChapter.comments}</span>
//               <span className="meta-item">📝 {currentChapter.wordCount.toLocaleString()} chữ</span>
//               <span className="meta-item">📅 {currentChapter.updatedAt}</span>
//             </div>
//           </div>
//         </div>
//
//         {/* Content Area */}
//         {currentChapter.isLocked && !currentChapter.isPurchased ? (
//           <LockedChapter chapter={currentChapter} onPurchase={handlePurchase} />
//         ) : (
//           <>
//             <ChapterContent
//               chapter={currentChapter}
//               settings={settings}
//               selectedSentence={selectedSentence}
//               onSentenceClick={handleSentenceClick}
//               onBookmarkSentence={handleBookmarkSentence}
//               bookmarks={bookmarks}
//             />
//
//             {/* Chapter Navigation */}
//             <div className="chapter-navigation">
//               <button
//                 className="nav-btn prev"
//                 onClick={handlePrevChapter}
//                 disabled={currentChapterNum <= 1}
//               >
//                 <ChevronLeft size={20} />
//                 Chương trước
//               </button>
//               <button
//                 className="nav-btn next"
//                 onClick={handleNextChapter}
//                 disabled={currentChapterNum >= SAMPLE_STORY.totalChapters}
//               >
//                 Chương sau
//                 <ChevronRight size={20} />
//               </button>
//             </div>
//
//             {/* Interaction Bar */}
//             <div className="interaction-bar">
//               <button
//                 className={`interaction-btn ${liked ? 'liked' : ''}`}
//                 onClick={() => setLiked(!liked)}
//               >
//                 <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
//                 {liked ? 'Đã thích' : 'Thả tim'}
//               </button>
//               <button className="interaction-btn">
//                 <Flag size={20} />
//                 Báo lỗi
//               </button>
//             </div>
//
//             {/* Comments */}
//             <CommentsSection comments={SAMPLE_COMMENTS} />
//           </>
//         )}
//       </div>
//
//       {/* Settings Popup */}
//       <SettingsPopup
//         isOpen={showSettings}
//         onClose={() => setShowSettings(false)}
//         settings={settings}
//         onSettingsChange={setSettings}
//       />
//
//       {/* Side Panel */}
//       <SidePanel
//         isOpen={showSidePanel}
//         onClose={() => setShowSidePanel(false)}
//         mode={sidePanelMode}
//         chapters={ALL_CHAPTERS}
//         currentChapter={currentChapterNum}
//         bookmarks={bookmarks}
//         onChapterSelect={handleChapterSelect}
//         onBookmarkDelete={(id) => setBookmarks(bookmarks.filter(b => b.id !== id))}
//       />
//
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;600&family=Spectral:wght@400;600&display=swap');
//
//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }
//
//         body {
//           transition: background-color 0.3s ease;
//         }
//
//         .chapter-reader {
//           min-height: 100vh;
//           transition: all 0.3s ease;
//           position: relative;
//         }
//
//         /* Vertical Toolbar */
//         .vertical-toolbar {
//           position: fixed;
//           right: 24px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: flex;
//           flex-direction: column;
//           gap: 8px;
//           z-index: 100;
//           background: rgba(255, 255, 255, 0.95);
//           padding: 12px 8px;
//           border-radius: 50px;
//           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
//           backdrop-filter: blur(10px);
//         }
//
//         .toolbar-btn {
//           width: 52px;
//           height: 52px;
//           border: none;
//           background: transparent;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           color: #2c3e50;
//         }
//
//         .toolbar-btn:hover:not(:disabled) {
//           background: #f0f0f0;
//           transform: scale(1.1);
//         }
//
//         .toolbar-btn:disabled {
//           opacity: 0.3;
//           cursor: not-allowed;
//         }
//
//         /* Main Content */
//         .main-content {
//           max-width: 900px;
//           margin: 0 auto;
//           padding: 60px 40px 100px;
//         }
//
//         .story-header {
//           text-align: center;
//           margin-bottom: 48px;
//           padding-bottom: 32px;
//           border-bottom: 2px solid rgba(0, 0, 0, 0.1);
//         }
//
//         .story-title {
//           font-size: 2.8rem;
//           font-weight: 700;
//           margin-bottom: 24px;
//           letter-spacing: -0.5px;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//         }
//
//         .chapter-info-bar {
//           margin-top: 16px;
//         }
//
//         .chapter-title {
//           font-size: 1.8rem;
//           font-weight: 600;
//           margin-bottom: 12px;
//           opacity: 0.9;
//         }
//
//         .chapter-meta {
//           display: flex;
//           gap: 24px;
//           justify-content: center;
//           font-size: 0.95rem;
//           opacity: 0.7;
//         }
//
//         .meta-item {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//
//         /* Chapter Content */
//         .chapter-content {
//           margin: 48px 0;
//           line-height: 1.8;
//         }
//
//         .sentence-wrapper {
//           position: relative;
//         }
//
//         .sentence {
//           cursor: pointer;
//           transition: all 0.2s ease;
//           padding: 2px 4px;
//           border-radius: 4px;
//         }
//
//         .sentence:hover {
//           background: rgba(0, 0, 0, 0.05);
//         }
//
//         .sentence.selected {
//           background: rgba(255, 235, 59, 0.3);
//           box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.5);
//         }
//
//         .sentence.bookmarked {
//           background: rgba(103, 58, 183, 0.1);
//         }
//
//         .bookmark-inline-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           margin-left: 6px;
//           padding: 4px 8px;
//           background: #673ab7;
//           color: white;
//           border: none;
//           border-radius: 4px;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           vertical-align: middle;
//         }
//
//         .bookmark-inline-btn:hover {
//           background: #5e35b1;
//           transform: scale(1.05);
//         }
//
//         /* Locked Chapter */
//         .locked-chapter {
//           text-align: center;
//           padding: 80px 40px;
//           background: rgba(255, 255, 255, 0.6);
//           border-radius: 16px;
//           margin: 48px 0;
//           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
//         }
//
//         .lock-icon-large {
//           font-size: 64px;
//           margin-bottom: 24px;
//           animation: pulse 2s infinite;
//         }
//
//         @keyframes pulse {
//           0%, 100% { transform: scale(1); }
//           50% { transform: scale(1.1); }
//         }
//
//         .locked-chapter h3 {
//           font-size: 1.8rem;
//           margin-bottom: 12px;
//         }
//
//         .locked-chapter p {
//           font-size: 1.1rem;
//           opacity: 0.7;
//           margin-bottom: 24px;
//         }
//
//         .lock-price {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           font-size: 1.5rem;
//           font-weight: 600;
//           margin-bottom: 24px;
//           padding: 12px 24px;
//           background: rgba(255, 193, 7, 0.2);
//           border-radius: 50px;
//         }
//
//         .purchase-btn {
//           padding: 14px 40px;
//           font-size: 1.1rem;
//           font-weight: 600;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           border: none;
//           border-radius: 50px;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
//         }
//
//         .purchase-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
//         }
//
//         /* Chapter Navigation */
//         .chapter-navigation {
//           display: flex;
//           gap: 16px;
//           margin: 48px 0;
//         }
//
//         .nav-btn {
//           flex: 1;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           padding: 20px 32px;
//           font-size: 1.1rem;
//           font-weight: 600;
//           background: rgba(255, 255, 255, 0.8);
//           border: 2px solid rgba(0, 0, 0, 0.1);
//           border-radius: 12px;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           color: #000;
//         }
//
//         .nav-btn:hover:not(:disabled) {
//           background: rgba(102, 126, 234, 0.1);
//           border-color: #667eea;
//           transform: translateY(-2px);
//         }
//
//         .nav-btn:disabled {
//           opacity: 0.3;
//           cursor: not-allowed;
//         }
//
//         /* Interaction Bar */
//         .interaction-bar {
//           display: flex;
//           gap: 16px;
//           margin: 32px 0;
//           padding: 24px;
//           background: rgba(255, 255, 255, 0.6);
//           border-radius: 12px;
//         }
//
//         .interaction-btn {
//           flex: 1;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           padding: 12px 24px;
//           font-size: 1rem;
//           font-weight: 600;
//           background: black;
//           border: 2px solid rgba(0, 0, 0, 0.1);
//           border-radius: 8px;
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }
//
//         .interaction-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//         }
//
//         .interaction-btn.liked {
//           background: #ff4757;
//           color: white;
//           border-color: #ff4757;
//         }
//
//         /* Comments Section */
//         .comments-section {
//           margin-top: 64px;
//           padding-top: 32px;
//           border-top: 2px solid rgba(0, 0, 0, 0.1);
//         }
//
//         .comments-title {
//           font-size: 1.6rem;
//           margin-bottom: 24px;
//           font-weight: 600;
//         }
//
//         .comment-form {
//           margin-bottom: 32px;
//           background: rgba(255, 255, 255, 0.8);
//           padding: 20px;
//           border-radius: 12px;
//           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
//         }
//
//         .replying-to {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 8px 12px;
//           background: rgba(102, 126, 234, 0.1);
//           border-radius: 6px;
//           margin-bottom: 12px;
//           font-size: 0.9rem;
//         }
//
//         .replying-to button {
//           background: none;
//           border: none;
//           cursor: pointer;
//           color: inherit;
//         }
//
//         .comment-form textarea {
//           width: 100%;
//           padding: 12px;
//           border: 2px solid rgba(0, 0, 0, 0.1);
//           border-radius: 8px;
//           font-family: inherit;
//           font-size: 0.95rem;
//           resize: vertical;
//           transition: all 0.2s ease;
//         }
//
//         .comment-form textarea:focus {
//           outline: none;
//           border-color: #667eea;
//           box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
//         }
//
//         .submit-comment-btn {
//           margin-top: 12px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding: 10px 24px;
//           background: #667eea;
//           color: white;
//           border: none;
//           border-radius: 8px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }
//
//         .submit-comment-btn:hover {
//           background: #5568d3;
//           transform: translateY(-1px);
//         }
//
//         .comments-list {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }
//
//         .comment {
//           display: flex;
//           gap: 12px;
//           padding: 16px;
//           background: rgba(255, 255, 255, 0.6);
//           border-radius: 12px;
//           transition: all 0.2s ease;
//         }
//
//         .comment:hover {
//           background: rgba(255, 255, 255, 0.9);
//         }
//
//         .comment.reply {
//           margin-left: 48px;
//           background: rgba(255, 255, 255, 0.4);
//         }
//
//         .comment-avatar {
//           width: 40px;
//           height: 40px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 20px;
//           background: rgba(102, 126, 234, 0.1);
//           border-radius: 50%;
//           flex-shrink: 0;
//         }
//
//         .comment-body {
//           flex: 1;
//         }
//
//         .comment-header {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           margin-bottom: 8px;
//         }
//
//         .comment-user {
//           font-weight: 600;
//           font-size: 0.95rem;
//         }
//
//         .comment-time {
//           font-size: 0.85rem;
//           opacity: 0.6;
//         }
//
//         .comment-content {
//           margin-bottom: 8px;
//           line-height: 1.5;
//         }
//
//         .comment-actions {
//           display: flex;
//           gap: 16px;
//         }

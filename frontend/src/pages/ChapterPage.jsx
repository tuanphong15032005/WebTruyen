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
  Menu,
  Check
} from 'lucide-react';

// Mock data
const SAMPLE_STORY = {
  id: 1,
  title: "Hành Trình Tu Tiên Của Ta",
  author: "Mộng Nhập Thần Cơ",
  currentChapter: 42,
  totalChapters: 250
};

const SAMPLE_CHAPTER = {
  id: 42,
  number: 42,
  title: "Đột Phá Cảnh Giới",
  content: "Ánh trăng lung linh trên mặt hồ, phản chiếu vẻ đẹp kỳ ảo của đêm. Lâm Phong ngồi kiết già giữa khu rừng tịch mịch, tâm thần chìm đắm trong thiền định sâu xa. Chân khí trong đan điền từ từ vận chuyển theo chu thiên, mỗi vòng tuần hoàn đều mạnh mẽ hơn vòng trước. Đây là lần thứ chín mươi chín Lâm Phong vận công liên tục không nghỉ. Tia sáng đầu tiên của bình minh len lỏi qua tán cây rậm rạp. Một luồng chân khí tinh thuần bất ngờ bùng nổ từ đan điền, xung kích khắp tứ chi bách hài. Lâm Phong mở to đôi mắt, ánh sáng lóe lên rồi lại tắt lịm. Cảnh giới Trúc Cơ kỳ ba đã đạt được. Hắn biết rằng con đường phía trước còn vô cùng gian nan. Những tông môn lớn nhỏ trong giang hồ đều đang rình mò cơ hội để tranh đoạt bí tịch. Nhưng Lâm Phong không hề sợ hãi. Sức mạnh mới tràn ngập toàn thân khiến hắn tự tin hơn bao giờ hết.",
  comments: 127,
  wordCount: 2834,
  updatedAt: "2026-02-10",
  isLocked: false,
  isPurchased: true,
  price: 50
};

const ALL_CHAPTERS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  title: i + 1 === 42 ? "Đột Phá Cảnh Giới" : `Chương ${i + 1}`,
  isLocked: i + 1 > 42,
  isPurchased: i + 1 <= 42
}));

const SAMPLE_COMMENTS = [
  {
    id: 1,
    user: "PhongVânSư",
    avatar: "🔥",
    content: "Chương này hay quá! Tác giả viết rất chân thật cảm xúc của nhân vật!",
    timestamp: "2 giờ trước",
    likes: 24,
    replies: []
  },
  {
    id: 2,
    user: "KiếmKhách",
    avatar: "⚔️",
    content: "Tiến triển tốt đấy, mong chờ chương sau",
    timestamp: "5 giờ trước",
    likes: 15,
    replies: [
      {
        id: 3,
        user: "ThiênCơLão",
        avatar: "🌟",
        content: "Đồng ý, cốt truyện đang dần hấp dẫn!",
        timestamp: "4 giờ trước",
        likes: 8
      }
    ]
  }
];

// Helper function to split content into sentences
const splitIntoSentences = (text) => {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
};

// Settings Popup Component
const SettingsPopup = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const bgColors = [
    { name: 'Trắng', value: '#FFFFFF', text: '#1a1a1a' },
    { name: 'Xanh nhạt', value: '#E8F5E9', text: '#1b5e20' },
    { name: 'Xanh dương', value: '#E3F2FD', text: '#0d47a1' },
    { name: 'Kem', value: '#FFF8DC', text: '#3e2723' },
    { name: 'Hồng nhạt', value: '#FCE4EC', text: '#880e4f' },
    { name: 'Xám', value: '#ECEFF1', text: '#263238' },
    { name: 'Đen', value: '#1a1a1a', text: '#e0e0e0' }
  ];

  const fonts = [
    { name: 'Crimson Text', value: "'Crimson Text', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Lora', value: "'Lora', serif" },
    { name: 'Spectral', value: "'Spectral', serif" }
  ];
  const alignments = [
    { icon: '≡', value: 'left', label: 'Trái' },
    { icon: '▭', value: 'center', label: 'Giữa' },
    { icon: '≣', value: 'right', label: 'Phải' },
    { icon: '▦', value: 'justify', label: 'Đều' }
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
                onClick={() => onSettingsChange({ ...settings, bgColor: color.value, textColor: color.text })}
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
            {fonts.map(font => (
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
              onClick={() => onSettingsChange({ ...settings, fontSize: Math.max(14, settings.fontSize - 2) })}
            >
              A-
            </button>
            <span className="size-display">{settings.fontSize}px</span>
            <button
              className="size-btn"
              onClick={() => onSettingsChange({ ...settings, fontSize: Math.min(28, settings.fontSize + 2) })}
            >
              A+
            </button>
          </div>
        </div>

        <div className="settings-section">
          <label>Căn chỉnh</label>
          <div className="align-controls">
            {alignments.map(align => (
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

// Side Panel Component
const SidePanel = ({ isOpen, onClose, mode, chapters, currentChapter, bookmarks, onChapterSelect, onBookmarkDelete }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidepanel-overlay" onClick={onClose}></div>
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
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`chapter-item ${chapter.number === currentChapter ? 'active' : ''} ${chapter.isLocked && !chapter.isPurchased ? 'locked' : ''}`}
                  onClick={() => {
                    if (!chapter.isLocked || chapter.isPurchased) {
                      onChapterSelect(chapter.number);
                      onClose();
                    }
                  }}
                >
                  <div className="chapter-info">
                    <span className="chapter-number">Chương {chapter.number}</span>
                    <span className="chapter-title">{chapter.title}</span>
                  </div>
                  {chapter.isLocked && !chapter.isPurchased && (
                    <span className="lock-icon">🔒</span>
                  )}
                </div>
              ))}
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
                bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-item">
                    <div className="bookmark-text">{bookmark.text}</div>
                    <button
                      className="delete-bookmark"
                      onClick={() => onBookmarkDelete(bookmark.id)}
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

// Vertical Toolbar Component
const VerticalToolbar = ({ onPrevChapter, onNextChapter, onHome, onSettings, onInfo, onBookmarks, hasPrev, hasNext }) => {
  return (
    <div className="vertical-toolbar">
      <button
        className="toolbar-btn"
        onClick={onPrevChapter}
        disabled={!hasPrev}
        title="Chương trước"
      >
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
      <button
        className="toolbar-btn"
        onClick={onNextChapter}
        disabled={!hasNext}
        title="Chương sau"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// Chapter Content Component
const ChapterContent = ({ chapter, settings, selectedSentence, onSentenceClick, onBookmarkSentence, bookmarks }) => {
  const sentences = splitIntoSentences(chapter.content);

  return (
    <div
      className="chapter-content"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        textAlign: settings.textAlign,
        lineHeight: 1.8,
        color: settings.textColor
      }}
    >
      {sentences.map((sentence, index) => {
        const isSelected = selectedSentence === index;
        const isBookmarked = bookmarks.some(b => b.sentenceIndex === index);

        return (
          <span key={index} className="sentence-wrapper">
            <span
              className={`sentence ${isSelected ? 'selected' : ''} ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={() => onSentenceClick(index)}
            >
              {sentence}
            </span>
            {isSelected && (
              <button
                className="bookmark-inline-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkSentence(index, sentence);
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
};

// Locked Chapter Component
const LockedChapter = ({ chapter, onPurchase }) => {
  return (
    <div className="locked-chapter">
      <div className="lock-icon-large">🔒</div>
      <h3>Chương này đã bị khóa</h3>
      <p>Vui lòng dùng Vàng để mở khóa chương này và tiếp tục đọc</p>
      <div className="lock-price">
        <span className="coin-icon">🪙</span>
        <span className="price">{chapter.price} Vàng</span>
      </div>
      <button className="purchase-btn" onClick={onPurchase}>
        Mua chương này
      </button>
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({ comments }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (replyingTo) {
      const updatedComments = localComments.map(comment => {
        if (comment.id === replyingTo) {
          return {
            ...comment,
            replies: [
              ...comment.replies,
              {
                id: Date.now(),
                user: "Bạn",
                avatar: "👤",
                content: newComment,
                timestamp: "Vừa xong",
                likes: 0
              }
            ]
          };
        }
        return comment;
      });
      setLocalComments(updatedComments);
    } else {
      const newCommentObj = {
        id: Date.now(),
        user: "Bạn",
        avatar: "👤",
        content: newComment,
        timestamp: "Vừa xong",
        likes: 0,
        replies: []
      };
      setLocalComments([newCommentObj, ...localComments]);
    }

    setNewComment('');
    setReplyingTo(null);
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">
        Bình luận ({localComments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
      </h3>

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
          placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận của bạn..."}
          rows="3"
        />
        <button type="submit" className="submit-comment-btn">
          <Send size={16} />
          Gửi
        </button>
      </form>

      <div className="comments-list">
        {localComments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-avatar">{comment.avatar}</div>
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-user">{comment.user}</span>
                <span className="comment-time">{comment.timestamp}</span>
              </div>
              <div className="comment-content">{comment.content}</div>
              <div className="comment-actions">
                <button className="comment-action">
                  <Heart size={14} />
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                </button>
                <button className="comment-action" onClick={() => setReplyingTo(comment.id)}>
                  <Reply size={14} />
                  Trả lời
                </button>
              </div>

              {comment.replies.length > 0 && (
                <div className="replies">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="comment reply">
                      <div className="comment-avatar">{reply.avatar}</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-user">{reply.user}</span>
                          <span className="comment-time">{reply.timestamp}</span>
                        </div>
                        <div className="comment-content">{reply.content}</div>
                        <div className="comment-actions">
                          <button className="comment-action">
                            <Heart size={14} />
                            {reply.likes > 0 && <span>{reply.likes}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Chapter Reader Component
const ChapterReader = () => {
  const [settings, setSettings] = useState({
    bgColor: '#FFF8DC',
    textColor: '#3e2723',
    fontFamily: "'Crimson Text', serif",
    fontSize: 18,
    textAlign: 'justify'
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelMode, setSidePanelMode] = useState('chapters');
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [liked, setLiked] = useState(false);
  const [currentChapterNum, setCurrentChapterNum] = useState(42);

  const currentChapter = SAMPLE_CHAPTER;

  const handleSentenceClick = (index) => {
    setSelectedSentence(selectedSentence === index ? null : index);
  };

  const handleBookmarkSentence = (index, text) => {
    const existingBookmark = bookmarks.find(b => b.sentenceIndex === index);

    if (existingBookmark) {
      setBookmarks(bookmarks.filter(b => b.id !== existingBookmark.id));
    } else {
      const newBookmark = {
        id: Date.now(),
        sentenceIndex: index,
        text: text.trim(),
        chapterNumber: currentChapter.number
      };
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterNum > 1) {
      setCurrentChapterNum(currentChapterNum - 1);
      setSelectedSentence(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (currentChapterNum < SAMPLE_STORY.totalChapters) {
      setCurrentChapterNum(currentChapterNum + 1);
      setSelectedSentence(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleChapterSelect = (chapterNum) => {
    setCurrentChapterNum(chapterNum);
    setSelectedSentence(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchase = () => {
    alert('Chức năng mua chương sẽ được tích hợp với hệ thống thanh toán');
  };

  const handleOpenSidePanel = (mode) => {
    setSidePanelMode(mode);
    setShowSidePanel(true);
  };

  useEffect(() => {
    document.body.style.backgroundColor = settings.bgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [settings.bgColor]);

  return (
    <div className="chapter-reader" style={{ backgroundColor: settings.bgColor, color: settings.textColor, fontFamily: settings.fontFamily }}>
      {/* Vertical Toolbar */}
      <VerticalToolbar
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onHome={() => window.location.href = '/'}
        onSettings={() => setShowSettings(true)}
        onInfo={() => handleOpenSidePanel('chapters')}
        onBookmarks={() => handleOpenSidePanel('bookmarks')}
        hasPrev={currentChapterNum > 1}
        hasNext={currentChapterNum < SAMPLE_STORY.totalChapters}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Story Header */}
        <div className="story-header">
          <h1 className="story-title">{SAMPLE_STORY.title}</h1>
          <div className="chapter-info-bar">
            <h2 className="chapter-title">Chương {currentChapter.number}: {currentChapter.title}</h2>
            <div className="chapter-meta">
              <span className="meta-item">💬 {currentChapter.comments}</span>
              <span className="meta-item">📝 {currentChapter.wordCount.toLocaleString()} chữ</span>
              <span className="meta-item">📅 {currentChapter.updatedAt}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {currentChapter.isLocked && !currentChapter.isPurchased ? (
          <LockedChapter chapter={currentChapter} onPurchase={handlePurchase} />
        ) : (
          <>
            <ChapterContent
              chapter={currentChapter}
              settings={settings}
              selectedSentence={selectedSentence}
              onSentenceClick={handleSentenceClick}
              onBookmarkSentence={handleBookmarkSentence}
              bookmarks={bookmarks}
            />

            {/* Chapter Navigation */}
            <div className="chapter-navigation">
              <button
                className="nav-btn prev"
                onClick={handlePrevChapter}
                disabled={currentChapterNum <= 1}
              >
                <ChevronLeft size={20} />
                Chương trước
              </button>
              <button
                className="nav-btn next"
                onClick={handleNextChapter}
                disabled={currentChapterNum >= SAMPLE_STORY.totalChapters}
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

            {/* Comments */}
            <CommentsSection comments={SAMPLE_COMMENTS} />
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
        chapters={ALL_CHAPTERS}
        currentChapter={currentChapterNum}
        bookmarks={bookmarks}
        onChapterSelect={handleChapterSelect}
        onBookmarkDelete={(id) => setBookmarks(bookmarks.filter(b => b.id !== id))}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;600&family=Spectral:wght@400;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          transition: background-color 0.3s ease;
        }

        .chapter-reader {
          min-height: 100vh;
          transition: all 0.3s ease;
          position: relative;
        }

        /* Vertical Toolbar */
        .vertical-toolbar {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px 8px;
          border-radius: 50px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(10px);
        }

        .toolbar-btn {
          width: 52px;
          height: 52px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #2c3e50;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: #f0f0f0;
          transform: scale(1.1);
        }

        .toolbar-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Main Content */
        .main-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 40px 100px;
        }

        .story-header {
          text-align: center;
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
        }

        .story-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chapter-info-bar {
          margin-top: 16px;
        }

        .chapter-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .chapter-meta {
          display: flex;
          gap: 24px;
          justify-content: center;
          font-size: 0.95rem;
          opacity: 0.7;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Chapter Content */
        .chapter-content {
          margin: 48px 0;
          line-height: 1.8;
        }

        .sentence-wrapper {
          position: relative;
        }

        .sentence {
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .sentence:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .sentence.selected {
          background: rgba(255, 235, 59, 0.3);
          box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.5);
        }

        .sentence.bookmarked {
          background: rgba(103, 58, 183, 0.1);
        }

        .bookmark-inline-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px;
          padding: 4px 8px;
          background: #673ab7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          vertical-align: middle;
        }

        .bookmark-inline-btn:hover {
          background: #5e35b1;
          transform: scale(1.05);
        }

        /* Locked Chapter */
        .locked-chapter {
          text-align: center;
          padding: 80px 40px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          margin: 48px 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        .lock-icon-large {
          font-size: 64px;
          margin-bottom: 24px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .locked-chapter h3 {
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .locked-chapter p {
          font-size: 1.1rem;
          opacity: 0.7;
          margin-bottom: 24px;
        }

        .lock-price {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 24px;
          padding: 12px 24px;
          background: rgba(255, 193, 7, 0.2);
          border-radius: 50px;
        }

        .purchase-btn {
          padding: 14px 40px;
          font-size: 1.1rem;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }

        .purchase-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
        }

        /* Chapter Navigation */
        .chapter-navigation {
          display: flex;
          gap: 16px;
          margin: 48px 0;
        }

        .nav-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #000;
        }

        .nav-btn:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.1);
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Interaction Bar */
        .interaction-bar {
          display: flex;
          gap: 16px;
          margin: 32px 0;
          padding: 24px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
        }

        .interaction-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 600;
          background: black;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .interaction-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .interaction-btn.liked {
          background: #ff4757;
          color: white;
          border-color: #ff4757;
        }

        /* Comments Section */
        .comments-section {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 2px solid rgba(0, 0, 0, 0.1);
        }

        .comments-title {
          font-size: 1.6rem;
          margin-bottom: 24px;
          font-weight: 600;
        }

        .comment-form {
          margin-bottom: 32px;
          background: rgba(255, 255, 255, 0.8);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .replying-to {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }

        .replying-to button {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
        }

        .comment-form textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .comment-form textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .submit-comment-btn {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-comment-btn:hover {
          background: #5568d3;
          transform: translateY(-1px);
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comment {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .comment:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .comment.reply {
          margin-left: 48px;
          background: rgba(255, 255, 255, 0.4);
        }

        .comment-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .comment-body {
          flex: 1;
        }

        .comment-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .comment-user {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .comment-time {
          font-size: 0.85rem;
          opacity: 0.6;
        }

        .comment-content {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .comment-actions {
          display: flex;
          gap: 16px;
        }

        .comment-action {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          color: inherit;
        }

        .comment-action:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .replies {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Settings Popup */
        .settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .settings-popup {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .settings-header h3 {
          font-size: 1.5rem;
          color: #2c3e50;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #2c3e50;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .settings-section {
          margin-bottom: 24px;
        }

        .settings-section label {
          display: block;
          font-weight: 600;
          margin-bottom: 12px;
          color: #2c3e50;
        }

        .color-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .color-option {
          width: 100%;
          aspect-ratio: 1;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-option:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .color-option.active {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .font-select {
          width: 100%;
          padding: 12px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .font-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .size-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .size-btn {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(102, 126, 234, 0.1);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-btn:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .size-display {
          flex: 1;
          text-align: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .align-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .align-btn {
          padding: 12px;
          background: rgba(0, 0, 0, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .align-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .align-btn.active {
          background: rgba(102, 126, 234, 0.2);
          border-color: #667eea;
        }

        /* Side Panel */
        .sidepanel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          backdrop-filter: blur(4px);
        }

        .sidepanel {
          position: fixed;
          top: 0;
          left: -400px;
          width: 400px;
          height: 100%;
          background: white;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transition: left 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .sidepanel.open {
          left: 0;
        }

        .sidepanel-header {
          padding: 24px;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidepanel-header h3 {
          font-size: 1.3rem;
          color: #2c3e50;
        }

        .sidepanel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .chapters-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chapter-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chapter-item:hover:not(.locked) {
          background: rgba(102, 126, 234, 0.1);
          transform: translateX(4px);
        }

        .chapter-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .chapter-item.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chapter-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chapter-number {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .chapter-title {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .lock-icon {
          font-size: 1.2rem;
        }

        .bookmarks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bookmark-item {
          padding: 16px;
          background: rgba(103, 58, 183, 0.05);
          border-left: 4px solid #673ab7;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .bookmark-item:hover {
          background: rgba(103, 58, 183, 0.1);
        }

        .bookmark-text {
          flex: 1;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .delete-bookmark {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(244, 67, 54, 0.1);
          border: none;
          border-radius: 6px;
          color: #f44336;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .delete-bookmark:hover {
          background: rgba(244, 67, 54, 0.2);
          transform: scale(1.1);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #999;
        }

        .empty-state p {
          margin: 16px 0 8px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .empty-state small {
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .main-content {
            padding: 40px 20px 80px;
          }

          .story-title {
            font-size: 2rem;
          }

          .chapter-title {
            font-size: 1.4rem;
          }

          .vertical-toolbar {
            right: 12px;
            padding: 8px 6px;
          }

          .toolbar-btn {
            width: 40px;
            height: 40px;
          }

          .sidepanel {
            width: 100%;
            left: -100%;
          }

          .chapter-meta {
            flex-direction: column;
            gap: 8px;
          }

          .settings-popup {
            width: 95%;
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChapterReader;
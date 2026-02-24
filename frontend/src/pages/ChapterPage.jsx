import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import { useParams, useNavigate } from 'react-router-dom';

import useChapter from '../hooks/useChapter';
import useComments from '../hooks/useComments';
import useBookmarks from '../hooks/useBookmarks';
import { purchaseChapter } from '../api/walletApi';
import { WalletContext } from '../context/WalletContext';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';
import PurchaseSuccessModal from '../components/PurchaseSuccessModal';
import PurchaseErrorModal from '../components/PurchaseErrorModal';

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
                const locked = !ch.free;
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
    <p>Mua chương này để mở khóa và tiếp tục đọc</p>
    <div className="lock-price">
      <span className="coin-icon">💎</span>
      <span className="price">{chapter.priceCoin ?? 0} Coin</span>
    </div>
    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '12px' }}>
      Ưu tiên trừ: Coin A (free) trước, sau đó đến Coin B (kim cương)
    </p>
    <button className="purchase-btn" onClick={onPurchase}>
      Mua chương này
    </button>
  </div>
);

const CommentsSection = ({ chapterId }) => {
  const { comments, addComment } = useComments(chapterId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalCount = (list) =>
    list.reduce((acc, c) => acc + 1 + (c.replies ? totalCount(c.replies) : 0), 0);

 const handleSubmit = async (e) => {
   e.preventDefault();

   // 1. Kiểm tra nội dung comment
   if (!newComment.trim() || submitting) return;

   setSubmitting(true);

   try {
     // 2. Gọi API tạo comment (backend sẽ tự kiểm tra xác thực)
     await addComment(newComment.trim(), replyingTo);

     // 3. Reset input sau khi gửi thành công
     setNewComment('');
     setReplyingTo(null);
   } catch (error) {
     console.error('Comment error:', error);
     // Hiển thị thông báo từ backend nếu có
     const errorMessage = error.message || 'Không thể gửi bình luận. Vui lòng thử lại.';
     if (errorMessage.includes('đăng nhập')) {
       alert('Vui lòng đăng nhập để gửi bình luận');
     } else {
       alert(errorMessage);
     }
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
      <h3 className="comments-title">Bình luận ({totalCount(comments)})</h3>

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

      <div className="comments-list">{comments.map((c) => renderComment(c))}</div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const INITIAL_CHAPTER_ID = 1; // fallback nếu không có path parameter

const ChapterPage = () => {
  const { chapterId: chapterIdFromParams, storyId } = useParams();
  const navigate = useNavigate();

  console.log('ChapterPage params:', { chapterIdFromParams, storyId });

  const initialId = Number(chapterIdFromParams) || INITIAL_CHAPTER_ID;

  const { chapterId, chapter, allChapters, loading, error, refreshChapter } =
    useChapter(initialId);

  // Force re-fetch when URL params change
  useEffect(() => {
    console.log('ChapterPage: chapterIdFromParams changed to', chapterIdFromParams, 'current chapterId:', chapterId);
    if (chapterIdFromParams && Number(chapterIdFromParams) !== chapterId) {
      console.log('URL chapterId differs from hook chapterId, reloading page');
      window.location.reload();
    }
  }, [chapterIdFromParams, chapterId]);

  // Create a manual refresh function to force chapter update
  const forceRefreshChapter = async () => {
    try {
      const { getChapterDetail } = await import('../services/chapterService');
      const updatedChapter = await getChapterDetail(chapterId);
      // Manually update chapter state to trigger re-render
      if (updatedChapter) {
        // This will trigger a re-render with the updated chapter data
        window.location.reload();
      }
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  };

  const { bookmarks, toggleBookmark, removeBookmark } = useBookmarks(chapterId);
  const { wallet, refreshWallet } = useContext(WalletContext);

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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [purchaseResponse, setPurchaseResponse] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');

  // Sync bgColor vào body
  useEffect(() => {
    document.body.style.backgroundColor = settings.bgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [settings.bgColor]);

  // Sync chapterId vào URL để share link hoạt động
  useEffect(() => {
    if (storyId && chapterId && Number(chapterIdFromParams) !== chapterId) {
      navigate(`/stories/${storyId}/chapters/${chapterId}`, { replace: true });
    }
  }, [chapterId, chapterIdFromParams, storyId, navigate]);

  const sentences = buildSentences(chapter?.segments);
  
  // Debug chapter data
  useEffect(() => {
    if (chapter) {
      console.log('Chapter data:', {
        id: chapter.id,
        title: chapter.title,
        priceCoin: chapter.priceCoin,
        free: chapter.free,
        unlocked: chapter.unlocked,
        status: chapter.status,
        nextChapterId: chapter.nextChapterId,
        previousChapterId: chapter.previousChapterId,
        sequenceIndex: chapter.sequenceIndex
      });
    }
  }, [chapter]);

  // Debug allChapters
  useEffect(() => {
    console.log('All chapters:', allChapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      sequenceIndex: ch.sequenceIndex
    })));
  }, [allChapters]);

  const isLocked = chapter && !chapter.free && !chapter.unlocked;

  // Calculate next/previous chapter from allChapters if backend doesn't provide them
  const nextChapterId = useMemo(() => {
    console.log('Calculating nextChapterId...');
    console.log('chapter.nextChapterId:', chapter?.nextChapterId);
    
    if (chapter?.nextChapterId) {
      console.log('Using backend nextChapterId:', chapter.nextChapterId);
      return chapter.nextChapterId;
    }
    
    // Fallback: calculate from allChapters
    console.log('Calculating from allChapters...');
    console.log('Current chapter ID:', chapter?.id);
    console.log('All chapters:', allChapters);
    
    const currentIndex = allChapters.findIndex(ch => ch.id === chapter?.id);
    console.log('Current index in allChapters:', currentIndex);
    
    if (currentIndex !== -1 && currentIndex < allChapters.length - 1) {
      const nextId = allChapters[currentIndex + 1].id;
      console.log('Next chapter ID from allChapters:', nextId);
      return nextId;
    }
    
    console.log('No next chapter found');
    return null;
  }, [chapter?.nextChapterId, chapter?.id, allChapters]);

  const previousChapterId = useMemo(() => {
    console.log('Calculating previousChapterId...');
    console.log('chapter.previousChapterId:', chapter?.previousChapterId);
    
    if (chapter?.previousChapterId) {
      console.log('Using backend previousChapterId:', chapter.previousChapterId);
      return chapter.previousChapterId;
    }
    
    // Fallback: calculate from allChapters
    console.log('Calculating from allChapters...');
    console.log('Current chapter ID:', chapter?.id);
    console.log('All chapters:', allChapters);
    
    const currentIndex = allChapters.findIndex(ch => ch.id === chapter?.id);
    console.log('Current index in allChapters:', currentIndex);
    
    if (currentIndex > 0) {
      const prevId = allChapters[currentIndex - 1].id;
      console.log('Previous chapter ID from allChapters:', prevId);
      return prevId;
    }
    
    console.log('No previous chapter found');
    return null;
  }, [chapter?.previousChapterId, chapter?.id, allChapters]);

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

  // Handle navigation to chapter with proper URL
  const handleNavigateToChapter = (chapterId) => {
    console.log('handleNavigateToChapter called with:', chapterId, 'storyId:', storyId);
    if (storyId) {
      const newUrl = `/stories/${storyId}/chapters/${chapterId}`;
      console.log('Navigating to:', newUrl);
      navigate(newUrl);
    } else {
      console.error('storyId is undefined, cannot navigate');
    }
  };

  // Logic mở Modal xác nhận mua chương
  const handlePurchase = () => {
    if (!chapter || !chapter.priceCoin) {
      setPurchaseError('Không thể xác định giá chương');
      setShowErrorModal(true);
      return;
    }

    const chapterPrice = chapter.priceCoin;
    const totalCoins = wallet.coinA + wallet.coinB;

    // Kiểm tra số dư
    if (totalCoins < chapterPrice) {
      setPurchaseError(`Không đủ coin để mua chương!\nCần: ${chapterPrice} coin\nCó: ${totalCoins} coin\n\nCoin A: ${wallet.coinA} | Coin B: ${wallet.coinB}`);
      setShowErrorModal(true);
      return;
    }

    // Mở Modal xác nhận thay vì window.confirm
    setShowPurchaseModal(true);
  };

  // Logic gọi API mua chương (được gọi từ PurchaseConfirmationModal)
  const handleConfirmPurchase = async () => {
    if (!chapter) return;
    
    // Check if chapter is free - shouldn't happen but just in case
    if (chapter.free) {
      setPurchaseError('Chương này miễn phí, không cần mua.');
      setShowPurchaseModal(false);
      setShowErrorModal(true);
      return;
    }
    
    if (!chapter.priceCoin) {
      setPurchaseError('Chương này không có giá. Vui lòng tải lại trang.');
      setShowPurchaseModal(false);
      setShowErrorModal(true);
      return;
    }

    const chapterPrice = chapter.priceCoin;
    
    // Validate chapterId before making API call
    if (!chapterId || chapterId <= 0) {
      console.error('Invalid chapterId:', chapterId);
      setPurchaseError('ID chương không hợp lệ. Vui lòng tải lại trang.');
      setShowPurchaseModal(false);
      setShowErrorModal(true);
      return;
    }
    
    // Validate chapterPrice
    if (!chapterPrice || chapterPrice <= 0) {
      console.error('Invalid chapterPrice:', chapterPrice);
      setPurchaseError('Giá chương không hợp lệ. Vui lòng tải lại trang.');
      setShowPurchaseModal(false);
      setShowErrorModal(true);
      return;
    }

    setPurchaseLoading(true);

    try {
      // Call purchase API
      const response = await purchaseChapter(chapterPrice, chapterId);

      if (response.success) {
        // Refresh wallet to update balances
        await refreshWallet();

        // Store response and show success modal
        setPurchaseResponse(response);
        setShowPurchaseModal(false);
        setShowSuccessModal(true);

        // Refresh chapter immediately to unlock
        await forceRefreshChapter();
        
        // Close success modal after showing and refresh again to ensure data is updated
        setTimeout(() => {
          setShowSuccessModal(false);
          refreshChapter();
        }, 2000);
      } else {
        setPurchaseError('Mua chương thất bại. Vui lòng thử lại.');
        setShowPurchaseModal(false);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Không thể mua chương. Vui lòng thử lại.';
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.message || errorData?.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPurchaseError(errorMessage);
      setShowPurchaseModal(false);
      setShowErrorModal(true);
    } finally {
      setPurchaseLoading(false);
    }
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
        onPrevChapter={() => previousChapterId && handleNavigateToChapter(previousChapterId)}
        onNextChapter={() => nextChapterId && handleNavigateToChapter(nextChapterId)}
        onHome={() => navigate('/')}
        onSettings={() => setShowSettings(true)}
        onInfo={() => handleOpenSidePanel('chapters')}
        onBookmarks={() => handleOpenSidePanel('bookmarks')}
        hasPrev={!!previousChapterId}
        hasNext={!!nextChapterId}
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
                onClick={() => previousChapterId && handleNavigateToChapter(previousChapterId)}
                disabled={!previousChapterId}
              >
                <ChevronLeft size={20} />
                Chương trước
              </button>
              <button
                className="nav-btn next"
                onClick={() => nextChapterId && handleNavigateToChapter(nextChapterId)}
                disabled={!nextChapterId}
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

            {/* Comments – tự fetch bằng hook riêng */}
            <CommentsSection chapterId={chapterId} />
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
        onChapterSelect={handleNavigateToChapter}
        onBookmarkDelete={removeBookmark}
      />

      {/* Purchase Modals */}
      <PurchaseConfirmationModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        chapter={chapter}
        wallet={wallet}
        onConfirm={handleConfirmPurchase}
        loading={purchaseLoading}
      />

      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        response={purchaseResponse}
      />

      <PurchaseErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={purchaseError}
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
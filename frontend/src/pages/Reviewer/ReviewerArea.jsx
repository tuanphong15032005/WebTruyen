import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import storyService from '../../services/storyService';
import api from '../../services/api';
import ReviewerApplicationStatus from './ReviewerApplicationStatus';
import '../../styles/admin-content-moderation.css';
import '../../styles/reviewer-area.css';

function ReviewerArea() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderationItems, setModerationItems] = useState([]);
  const [busyKey, setBusyKey] = useState('');

  // Content moderation states
  const [activeContentType, setActiveContentType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [demoItem, setDemoItem] = useState(null);
  const [demoContent, setDemoContent] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [noteModal, setNoteModal] = useState({
    open: false,
    item: null,
    action: '',
    note: '',
  });

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user has reviewer access
  useEffect(() => {
    checkAccess();
    
    // Set up auto-refresh every 30 seconds to check for new role
    const interval = setInterval(() => {
      if (!hasAccess) {
        checkAccess();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [hasAccess]);

  const checkAccess = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Checking reviewer status via API...');
      const response = await api.get('/reviewer/status');
      console.log('🔍 Reviewer status response:', response);
      
      const hasReviewerRole = response.hasReviewerRole || false;
      console.log('🔍 Has reviewer role:', hasReviewerRole);
      
      setHasAccess(hasReviewerRole);
      
      if (hasReviewerRole) {
        loadModerationContent();
      }
    } catch (err) {
      console.error('🔍 Error checking reviewer access:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Load content moderation data
  const loadModerationContent = async () => {
    console.log('🔍 Loading moderation content...');
    setLoading(true);
    setError('');
    try {
      const data = await storyService.getPendingModerationContent();
      console.log('🔍 Moderation data received:', data);
      setModerationItems(Array.isArray(data) ? data : []);
      console.log('🔍 Moderation items set:', Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error('🔍 Error loading moderation content:', err);
      setError(err.message || 'Không thể tải nội dung chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  // Content moderation functions
  const buildActionKey = (contentType, contentId, action) =>
    `${contentType}-${contentId}-${action}`;

  const executeAction = async (item, action, note = '') => {
    const key = buildActionKey(item.contentType, item.contentId, action);
    setBusyKey(key);
    setError('');

    try {
      if (item.contentType === 'story') {
        if (action === 'approve') {
          await storyService.approveModerationStory(item.contentId);
        } else {
          await storyService.rejectModerationStory(item.contentId, note);
        }
      } else if (action === 'approve') {
        await storyService.approveModerationChapter(item.contentId);
      } else {
        await storyService.rejectModerationChapter(item.contentId, note);
      }

      await loadModerationContent();
      closeDemoModal();
      closeNoteModal();
    } catch (err) {
      setError(err.message || 'Thao tác kiểm duyệt thất bại');
    } finally {
      setBusyKey('');
    }
  };

  const openNoteModal = (item, action) => {
    setNoteModal({
      open: true,
      item,
      action,
      note: '',
    });
  };

  const closeNoteModal = () => {
    setNoteModal({ open: false, item: null, action: '', note: '' });
  };

  const handleAction = async (item, action) => {
    if (action === 'approve') {
      await executeAction(item, action);
      return;
    }
    openNoteModal(item, action);
  };

  const handleSubmitNote = async () => {
    if (!noteModal.item || !noteModal.action) return;
    await executeAction(noteModal.item, noteModal.action, noteModal.note.trim());
  };

  const closeDemoModal = () => {
    setDemoItem(null);
    setDemoContent(null);
    setDemoLoading(false);
    setDemoError('');
  };

  const handleViewDemo = async (item) => {
    setDemoItem(item);
    setDemoContent(null);
    setDemoLoading(true);
    setDemoError('');

    try {
      if (item.contentType === 'story') {
        const story = await storyService.getStory(item.storyId);
        setDemoContent(story || null);
      } else {
        const content = await storyService.getChapterContent(item.storyId, item.contentId);
        setDemoContent(content || null);
      }
    } catch (err) {
      setDemoError(err.message || 'Không thể tải nội dung chương');
    } finally {
      setDemoLoading(false);
    }
  };

  // Calculate stats
  const pendingCount = moderationItems.filter((item) => (item.approvalStatus ?? item.moderationStatus) === 'pending').length;
  console.log('🔍 Moderation items:', moderationItems);
  console.log('🔍 Pending count:', pendingCount);

  const displayStatus = (item) => item.approvalStatus ?? item.moderationStatus;
  const statusLabel = (status) => {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'pending') return 'Chờ duyệt';
    return status || 'Đã xử lý';
  };

  const contentTypeLabel = (contentType) => {
    if (contentType === 'story') return 'Truyện';
    if (contentType === 'chapter') return 'Chương';
    return contentType || 'Nội dung';
  };

  console.log('🔍 Rendering ReviewerArea - hasAccess:', hasAccess, 'loading:', loading, 'moderationItems.length:', moderationItems.length);

  if (loading) {
    console.log('🔍 Showing loading state');
    return (
      <div className="reviewer-area">
        <div className="loading-check">
          <div className="spinner"></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    console.log('🔍 Showing no access state');
    return (
      <div className="reviewer-area">
        <div className="reviewer-header">
          <div className="reviewer-header-content">
            <div className="reviewer-title">
              <Shield className="reviewer-icon" />
              <h1>Khu vực Reviewer</h1>
            </div>
            <p className="reviewer-subtitle">
              Trở thành reviewer để kiểm duyệt nội dung và đóng góp cho cộng đồng
            </p>
          </div>
        </div>

        {error && <div className="reviewer-error">{error}</div>}

        <ReviewerApplicationStatus />
      </div>
    );
  }

  // When has access, don't show ReviewerApplicationStatus
  console.log('🔍 Showing reviewer interface with access');
  return (
    <div className="reviewer-area">
      <div className="reviewer-header">
        <div className="reviewer-header-content">
          <div className="reviewer-title">
            <Shield className="reviewer-icon" />
            <h1>Khu vực Reviewer</h1>
          </div>
          <p className="reviewer-subtitle">
            Kiểm duyệt nội dung để duy trì chất lượng cộng đồng
          </p>
        </div>
        
        <div className="reviewer-stats">
          <div className="stat-card pending">
            <Clock className="stat-icon" />
            <div className="stat-info">
              <span className="stat-number">{pendingCount}</span>
              <span className="stat-label">Nội dung chờ duyệt</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="reviewer-error">{error}</div>}

      <div className="content-moderation-section">
        {moderationItems.length === 0 && !loading && !error && (
          <div className="no-content-message">
            <h3>🎉 Hiện tại không có nội dung nào cần kiểm duyệt!</h3>
            <p>Tất cả nội dung đã được xử lý. Hãy kiểm tra lại sau nhé.</p>
          </div>
        )}
        
        {moderationItems.length > 0 && (
          <>
        <div className="admin-moderation__card admin-moderation__controls-card">
          <div className="admin-moderation__toolbar">
            <div className="admin-moderation__stats">
              <span className="admin-moderation__badge">
                Chờ duyệt: {pendingCount}
              </span>
              <span className="admin-moderation__badge admin-moderation__badge--approved">
                Đã duyệt: {moderationItems.filter((item) => displayStatus(item) === 'approved').length}
              </span>
              <span className="admin-moderation__badge admin-moderation__badge--rejected">
                Từ chối: {moderationItems.filter((item) => displayStatus(item) === 'rejected').length}
              </span>
            </div>
            <button
              type="button"
              className="admin-moderation__refresh"
              onClick={loadModerationContent}
              disabled={loading}
            >
              Tải lại
            </button>
          </div>

          <div className="admin-moderation__filters">
            <label className="admin-moderation__filter-label">
              Loại:
              <select
                className="admin-moderation__select"
                value={activeContentType}
                onChange={(e) => setActiveContentType(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="story">Truyện</option>
                <option value="chapter">Chương</option>
              </select>
            </label>
          </div>

          <div className="admin-moderation__tabs">
            <button
              type="button"
              className={activeStatus === 'pending' ? 'active' : ''}
              onClick={() => setActiveStatus('pending')}
            >
              Chờ duyệt
            </button>
            <button
              type="button"
              className={activeStatus === 'approved' ? 'active' : ''}
              onClick={() => setActiveStatus('approved')}
            >
              Đã duyệt
            </button>
            <button
              type="button"
              className={activeStatus === 'rejected' ? 'active' : ''}
              onClick={() => setActiveStatus('rejected')}
            >
              Từ chối
            </button>
          </div>
        </div>

        <div className="admin-moderation__card admin-moderation__card--table">
          <div className="admin-moderation__grid">
            <table>
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Tên truyện</th>
                  <th>Tác giả</th>
                  <th>Thể loại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="admin-moderation__empty">
                      Đang tải hàng chờ kiểm duyệt...
                    </td>
                  </tr>
                ) : moderationItems.filter((item) => displayStatus(item) === activeStatus && (activeContentType === 'all' || item.contentType === activeContentType)).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-moderation__empty">
                      Không có bản ghi ở trạng thái này
                    </td>
                  </tr>
                ) : (
                  moderationItems
                    .filter((item) => displayStatus(item) === activeStatus && (activeContentType === 'all' || item.contentType === activeContentType))
                    .map((item) => {
                      const approveKey = buildActionKey(item.contentType, item.contentId, 'approve');
                      const rejectKey = buildActionKey(item.contentType, item.contentId, 'reject');
                      const isBusy = busyKey === approveKey || busyKey === rejectKey;
                      return (
                        <tr key={`${item.contentType}-${item.contentId}`}>
                          <td>{contentTypeLabel(item.contentType)}</td>
                          <td>{item.storyTitle}</td>
                          <td>{item.authorName}</td>
                          <td>{item.genre}</td>
                          <td>
                            <span className={`admin-moderation__status admin-moderation__status--${displayStatus(item) || 'processed'}`}>
                              {statusLabel(displayStatus(item))}
                            </span>
                          </td>
                          <td className="admin-moderation__actions">
                            <button
                              type="button"
                              className="demo"
                              disabled={isBusy}
                              onClick={() => handleViewDemo(item)}
                            >
                              Xem demo
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Content Moderation Modal */}
      {demoItem && (
        <div className="admin-moderation__modal-backdrop" onClick={closeDemoModal}>
          <div className="admin-moderation__modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-moderation__modal-head">
              <h2>{demoItem.contentType === 'story' ? 'Xem nội dung truyện' : 'Xem nội dung chương'}</h2>
              <button type="button" onClick={closeDemoModal} aria-label="Đóng popup demo">
                x
              </button>
            </div>

            {demoLoading && (
              <p className="admin-moderation__modal-state">Đang tải nội dung demo...</p>
            )}

            {!demoLoading && demoError && (
              <p className="admin-moderation__modal-state admin-moderation__modal-state--error">
                {demoError}
              </p>
            )}

            {!demoLoading && !demoError && (
              <div className="admin-moderation__modal-content">
                <h3>
                  {demoItem.contentType === 'story'
                    ? demoContent?.title || demoContent?.data?.title || demoItem.storyTitle || `Truyện #${demoItem.contentId}`
                    : demoContent?.title || `Chương #${demoItem.contentId}`}
                </h3>
                <p className="admin-moderation__modal-meta">
                  Truyện: {demoItem.storyTitle || '—'}
                </p>
                <p className="admin-moderation__modal-meta">
                  Tác giả: {demoItem.authorName || 'Không có'}
                </p>
                <div className="admin-moderation__modal-summary admin-moderation__modal-chapter-body">
                  {demoItem.contentType === 'story' ? (
                    demoContent?.summaryHtml ? (
                      <div
                        className="admin-moderation__chapter-content"
                        dangerouslySetInnerHTML={{ __html: demoContent.summaryHtml }}
                      />
                    ) : (
                      <p>Truyện chưa có phần giới thiệu.</p>
                    )
                  ) : demoContent?.fullHtml ? (
                    <div
                      className="admin-moderation__chapter-content"
                      dangerouslySetInnerHTML={{ __html: demoContent.fullHtml }}
                    />
                  ) : (
                    <p>Chương chưa có nội dung.</p>
                  )}
                </div>
              </div>
            )}
            {displayStatus(demoItem) === 'pending' && !demoLoading && (
              <div className="admin-moderation__modal-actions">
                <button
                  type="button"
                  className="admin-moderation__modal-btn approve"
                  disabled={busyKey === buildActionKey(demoItem.contentType, demoItem.contentId, 'approve')}
                  onClick={() => handleAction(demoItem, 'approve')}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  className="admin-moderation__modal-btn reject"
                  disabled={busyKey === buildActionKey(demoItem.contentType, demoItem.contentId, 'reject')}
                  onClick={() => openNoteModal(demoItem, 'reject')}
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal.open && (
        <div className="admin-moderation__note-backdrop" onClick={closeNoteModal}>
          <div
            className="admin-moderation__note-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Từ chối</h3>
            <p className="admin-moderation__note-help">
              Ghi chú tùy chọn cho hành động này.
            </p>
            <textarea
              value={noteModal.note}
              onChange={(event) =>
                setNoteModal((prev) => ({ ...prev, note: event.target.value }))
              }
              rows={4}
              placeholder="Nhập ghi chú kiểm duyệt..."
            />
            <div className="admin-moderation__note-actions">
              <button type="button" className="cancel" onClick={closeNoteModal}>
                Hủy
              </button>
              <button type="button" className="confirm" onClick={handleSubmitNote}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewerArea;

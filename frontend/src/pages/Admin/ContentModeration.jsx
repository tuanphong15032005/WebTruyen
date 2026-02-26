import { useEffect, useMemo, useState } from 'react';
import storyService from '../../services/storyService';
import { getChapterDetail } from '../../services/ChapterService';
import '../../styles/admin-content-moderation.css';

// Minhdq - 25/02/2026
// [Fix pagination/content-moderation/id - V2 - branch: minhfinal2]
const PAGE_SIZE = 10;

function ContentModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [demoItem, setDemoItem] = useState(null);
  const [demoChapter, setDemoChapter] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  // Minhdq - 25/02/2026
  // [Fix pagination/content-moderation/id - V2 - branch: minhfinal2]
  const [currentPage, setCurrentPage] = useState(1);
  const [noteModal, setNoteModal] = useState({
    open: false,
    item: null,
    action: '',
    note: '',
  });

  const pendingCount = useMemo(
    () => items.filter((item) => item.moderationStatus === 'pending').length,
    [items]
  );
  const processedCount = useMemo(
    () => items.filter((item) => item.moderationStatus !== 'pending').length,
    [items]
  );
  const approvedCount = useMemo(
    () => items.filter((item) => item.moderationStatus === 'approved').length,
    [items]
  );
  const rejectedCount = useMemo(
    () => items.filter((item) => item.moderationStatus === 'rejected').length,
    [items]
  );
  const requestEditCount = useMemo(
    () => items.filter((item) => item.moderationStatus === 'request_edit').length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.moderationStatus === activeStatus);
  }, [items, activeStatus]);
  // Minhdq - 25/02/2026
  // [Fix pagination/content-moderation/id - V2 - branch: minhfinal2]
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  const showActions = activeStatus === 'pending';
  // Minhdq - 25/02/2026
  // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
  const chapterLabel = (item) =>
    item.chapterTitle || item.contentTitle || item.title || `Chapter #${item.contentId}`;
  // Minhdq - 25/02/2026
  // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
  const chapterSegments = useMemo(
    () => (Array.isArray(demoChapter?.segments) ? demoChapter.segments : []),
    [demoChapter?.segments]
  );

  const loadModerationContent = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storyService.getPendingModerationContent();
      // Minhdq - 25/02/2026
      // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
      const chapterItems = (Array.isArray(data) ? data : []).filter(
        (item) => String(item?.contentType || '').toLowerCase() === 'chapter'
      );
      setItems(chapterItems);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách nội dung chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationContent();
  }, []);

  useEffect(() => {
    if (!demoItem && !noteModal.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (noteModal.open) {
          setNoteModal({ open: false, item: null, action: '', note: '' });
        } else {
          setDemoItem(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [demoItem, noteModal.open]);

  useEffect(() => {
    // Minhdq - 25/02/2026
    // [Fix pagination/content-moderation/id - V2 - branch: minhfinal2]
    setCurrentPage(1);
  }, [activeStatus]);

  useEffect(() => {
    // Minhdq - 25/02/2026
    // [Fix pagination/content-moderation/id - V2 - branch: minhfinal2]
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Minhdq - 25/02/2026
  // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
  const buildActionKey = (contentId, action) =>
    `chapter-${contentId}-${action}`;

  const executeAction = async (item, action, note = '') => {
    const key = buildActionKey(item.contentId, action);
    setBusyKey(key);
    setError('');

    try {
      // Minhdq - 25/02/2026
      // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
      if (action === 'approve') {
        await storyService.approveModerationChapter(item.contentId);
      } else if (action === 'reject') {
        await storyService.rejectModerationChapter(item.contentId, note);
      } else {
        await storyService.requestEditModerationChapter(item.contentId, note);
      }

      await loadModerationContent();
    } catch (err) {
      setError(err.message || 'Moderation action failed');
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
    closeNoteModal();
  };

  const statusLabel = (status) => {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'request_edit') return 'Yêu cầu chỉnh sửa';
    if (status === 'pending') return 'Chờ duyệt';
    return status || 'Đã xử lý';
  };

  const closeDemoModal = () => {
    setDemoItem(null);
    setDemoChapter(null);
    setDemoLoading(false);
    setDemoError('');
  };

  const noteActionLabel = noteModal.action === 'request-edit' ? 'Yêu cầu chỉnh sửa' : 'Từ chối';

  const handleViewDemo = async (item) => {
    setDemoItem(item);
    setDemoChapter(null);
    setDemoLoading(true);
    setDemoError('');

    try {
      // Minhdq - 25/02/2026
      // [Fix chapter-only-moderation/id - V2 - branch: minhfinal2]
      const chapter = await getChapterDetail(item.contentId);
      setDemoChapter(chapter || null);
    } catch (err) {
      setDemoError(err.message || 'Không thể tải nội dung demo chapter');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className='admin-moderation'>
      <header className='admin-moderation__header'>
        <h1>Kiểm duyệt nội dung</h1>
        <p>
          Xem xét chapter mới gửi duyệt trước khi xuất bản để đảm bảo phù hợp với tiêu chuẩn cộng đồng.
        </p>
      </header>

      <div className='admin-moderation__toolbar'>
        <div className='admin-moderation__stats'>
          <span className='admin-moderation__badge'>
            Chờ duyệt: {pendingCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--approved'>
            Đã duyệt: {approvedCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--rejected'>
            Từ chối: {rejectedCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--request-edit'>
            Yêu cầu chỉnh sửa: {requestEditCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--processed'>
            Đã xử lý: {processedCount}
          </span>
        </div>
        <button
          type='button'
          className='admin-moderation__refresh'
          onClick={loadModerationContent}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      <div className='admin-moderation__tabs'>
        <button
          type='button'
          className={activeStatus === 'pending' ? 'active' : ''}
          onClick={() => setActiveStatus('pending')}
        >
          Chờ duyệt
        </button>
        <button
          type='button'
          className={activeStatus === 'approved' ? 'active' : ''}
          onClick={() => setActiveStatus('approved')}
        >
          Đã duyệt
        </button>
        <button
          type='button'
          className={activeStatus === 'rejected' ? 'active' : ''}
          onClick={() => setActiveStatus('rejected')}
        >
          Từ chối
        </button>
        <button
          type='button'
          className={activeStatus === 'request_edit' ? 'active' : ''}
          onClick={() => setActiveStatus('request_edit')}
        >
          Yêu cầu chỉnh sửa
        </button>
      </div>

      {error && <div className='admin-moderation__error'>{error}</div>}

      <div className='admin-moderation__grid'>
        <table>
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Tên truyện</th>
              <th>Tác giả</th>
              <th>Genre</th>
              <th>Phân loại độ tuổi</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Xử lý lúc</th>
              <th>Ghi chú kiểm duyệt</th>
              {showActions && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className='admin-moderation__empty'>
                  Đang tải danh sách chờ duyệt...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className='admin-moderation__empty'>
                  Không có bản ghi ở trạng thái này
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const approveKey = buildActionKey(item.contentId, 'approve');
                const rejectKey = buildActionKey(item.contentId, 'reject');
                const editKey = buildActionKey(item.contentId, 'request-edit');
                const isBusy = busyKey === approveKey || busyKey === rejectKey || busyKey === editKey;
                const canModerate = item.moderationStatus === 'pending';
                return (
                  <tr key={`chapter-${item.contentId}`}>
                    <td>{chapterLabel(item)}</td>
                    <td>{item.storyTitle}</td>
                    <td>{item.authorName}</td>
                    <td>{item.genre}</td>
                    <td>{item.ratingAgeClassification}</td>
                    <td>
                      {item.submissionDate
                        ? new Date(item.submissionDate).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`admin-moderation__status admin-moderation__status--${item.moderationStatus || 'processed'}`}>
                        {statusLabel(item.moderationStatus)}
                      </span>
                    </td>
                    <td>
                      {item.moderationProcessedAt
                        ? new Date(item.moderationProcessedAt).toLocaleString()
                        : '-'}
                    </td>
                    <td>{item.moderationNote || '-'}</td>
                    {showActions && (
                      <td className='admin-moderation__actions'>
                        <button
                          type='button'
                          className='demo'
                          disabled={isBusy}
                          onClick={() => handleViewDemo(item)}
                        >
                          Xem demo
                        </button>
                        <button
                          type='button'
                          className='approve'
                          disabled={isBusy || !canModerate}
                          onClick={() => handleAction(item, 'approve')}
                        >
                          Duyệt
                        </button>
                        <button
                          type='button'
                          className='reject'
                          disabled={isBusy || !canModerate}
                          onClick={() => handleAction(item, 'reject')}
                        >
                          Từ chối
                        </button>
                        <button
                          type='button'
                          className='edit'
                          disabled={isBusy || !canModerate}
                          onClick={() => handleAction(item, 'request-edit')}
                        >
                          Yêu cầu sửa
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Minhdq - 25/02/2026 */}
      {/* [Fix pagination/content-moderation/id - V2 - branch: minhfinal2] */}
      {!loading && filteredItems.length > 0 && (
        <div className='admin-moderation__pagination'>
          <span className='admin-moderation__pagination-summary'>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredItems.length)} / {filteredItems.length}
          </span>
          <div className='admin-moderation__pagination-controls'>
            <button
              type='button'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              type='button'
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      )}
      {demoItem && (
        <div className='admin-moderation__modal-backdrop' onClick={closeDemoModal}>
          <div className='admin-moderation__modal' onClick={(event) => event.stopPropagation()}>
            <div className='admin-moderation__modal-head'>
              <h2>Xem demo chapter chờ duyệt</h2>
              <button type='button' onClick={closeDemoModal} aria-label='Đóng popup demo'>
                x
              </button>
            </div>

            {demoLoading && (
              <p className='admin-moderation__modal-state'>Đang tải nội dung demo...</p>
            )}

            {!demoLoading && demoError && (
              <p className='admin-moderation__modal-state admin-moderation__modal-state--error'>
                {demoError}
              </p>
            )}

            {!demoLoading && !demoError && (
              <div className='admin-moderation__modal-content'>
                <h3>{demoChapter?.title || chapterLabel(demoItem)}</h3>
                <p className='admin-moderation__modal-meta'>
                  Truyện: {demoItem.storyTitle || 'N/A'}
                </p>
                <p className='admin-moderation__modal-meta'>
                  Tác giả: {demoItem.authorName || 'N/A'}
                </p>
                <p className='admin-moderation__modal-meta'>
                  Chương: {demoChapter?.sequenceIndex ? `Chương ${demoChapter.sequenceIndex}` : chapterLabel(demoItem)}
                </p>
                <div className='admin-moderation__modal-summary'>
                  {chapterSegments.length > 0 ? (
                    chapterSegments.map((segment) => (
                      <div
                        key={segment.id}
                        dangerouslySetInnerHTML={{ __html: segment.segmentText || '' }}
                      />
                    ))
                  ) : (
                    <p>Chapter chưa có nội dung để xem demo.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {noteModal.open && (
        <div className='admin-moderation__note-backdrop' onClick={closeNoteModal}>
          <div
            className='admin-moderation__note-modal'
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{noteActionLabel} - Ghi chú kiểm duyệt</h3>
            <p className='admin-moderation__note-help'>
              Ghi chú tùy chọn cho thao tác này.
            </p>
            <textarea
              value={noteModal.note}
              onChange={(event) =>
                setNoteModal((prev) => ({ ...prev, note: event.target.value }))
              }
              rows={4}
              placeholder='Nhập ghi chú kiểm duyệt...'
            />
            <div className='admin-moderation__note-actions'>
              <button type='button' className='cancel' onClick={closeNoteModal}>
                Hủy
              </button>
              <button type='button' className='confirm' onClick={handleSubmitNote}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ContentModeration;

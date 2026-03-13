import { useEffect, useMemo, useState } from 'react';
import storyService from '../../services/storyService';
import '../../styles/admin-content-moderation.css';

function ContentModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
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

  const displayStatus = (item) => item.approvalStatus ?? item.moderationStatus;

  const pendingCount = useMemo(
    () => items.filter((item) => displayStatus(item) === 'pending').length,
    [items]
  );
  const processedCount = useMemo(
    () => items.filter((item) => displayStatus(item) !== 'pending').length,
    [items]
  );
  const approvedCount = useMemo(
    () => items.filter((item) => displayStatus(item) === 'approved').length,
    [items]
  );
  const rejectedCount = useMemo(
    () => items.filter((item) => displayStatus(item) === 'rejected').length,
    [items]
  );
  const filteredItems = useMemo(() => {
    let list = items.filter((item) => displayStatus(item) === activeStatus);
    if (activeContentType !== 'all') {
      list = list.filter((item) => item.contentType === activeContentType);
    }
    return list;
  }, [items, activeStatus, activeContentType]);

  const showActions = activeStatus === 'pending';

  const loadModerationContent = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storyService.getPendingModerationContent();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải nội dung chờ duyệt');
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

  const buildActionKey = (contentType, contentId, action) =>
    `${contentType}-${contentId}-${action}`;

  const executeAction = async (item, action, note = '') => {
    const key = buildActionKey(item.contentType, item.contentId, action);
    setBusyKey(key);
    setError('');

    try {
      if (action === 'approve') {
        if (item.contentType === 'story') {
          await storyService.approveModerationStory(item.contentId);
        } else {
          await storyService.approveModerationChapter(item.contentId);
        }
      } else {
        if (item.contentType === 'story') {
          await storyService.rejectModerationStory(item.contentId, note);
        } else {
          await storyService.rejectModerationChapter(item.contentId, note);
        }
      }

      await loadModerationContent();
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
    closeNoteModal();
  };

  const statusLabel = (status) => {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'pending') return 'Chờ duyệt';
    return status || 'Đã xử lý';
  };

  const closeDemoModal = () => {
    setDemoItem(null);
    setDemoContent(null);
    setDemoLoading(false);
    setDemoError('');
  };

  const noteActionLabel = 'Từ chối';

  const handleViewDemo = async (item) => {
    setDemoItem(item);
    setDemoContent(null);
    setDemoLoading(true);
    setDemoError('');

    try {
      if (item.contentType === 'story') {
        const res = await storyService.getStory(item.contentId);
        setDemoContent({ type: 'story', data: res?.data || res });
      } else {
        const content = await storyService.getChapterContent(item.storyId, item.contentId);
        setDemoContent({ type: 'chapter', data: content });
      }
    } catch (err) {
      setDemoError(err.message || 'Không thể tải nội dung');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className='admin-moderation'>
      <header className='admin-moderation__header'>
        <h1>Kiểm duyệt nội dung</h1>
        <p>
          Xem xét các chương truyện trước khi xuất bản để đảm bảo bản quyền, phù hợp với độ tuổi và tiêu chuẩn cộng đồng.
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
          Tải lại
        </button>
      </div>

      <div className='admin-moderation__type-tabs'>
        <button
          type='button'
          className={activeContentType === 'all' ? 'active' : ''}
          onClick={() => setActiveContentType('all')}
        >
          Tất cả
        </button>
        <button
          type='button'
          className={activeContentType === 'story' ? 'active' : ''}
          onClick={() => setActiveContentType('story')}
        >
          Kiểm duyệt Truyện
        </button>
        <button
          type='button'
          className={activeContentType === 'chapter' ? 'active' : ''}
          onClick={() => setActiveContentType('chapter')}
        >
          Kiểm duyệt Chương
        </button>
      </div>

      <div className='admin-moderation__status-tabs'>
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
      </div>

      {error && <div className='admin-moderation__error'>{error}</div>}

      <div className='admin-moderation__grid'>
        <table>
          <thead>
            <tr>
              <th>Loại</th>
              <th>Tên truyện</th>
              <th>Tác giả</th>
              <th>Thể loại</th>
              <th>Phân loại độ tuổi</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              {showActions && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-moderation__empty'>
                  Đang tải hàng chờ kiểm duyệt...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-moderation__empty'>
                  Không có bản ghi ở trạng thái này
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const approveKey = buildActionKey(item.contentType, item.contentId, 'approve');
                const rejectKey = buildActionKey(item.contentType, item.contentId, 'reject');
                const isBusy = busyKey === approveKey || busyKey === rejectKey;
                const canModerate = (item.approvalStatus ?? item.moderationStatus) === 'pending';
                return (
                  <tr key={`${item.contentType}-${item.contentId}`}>
                    <td>{item.contentType === 'story' ? 'Truyện' : 'Chương'}</td>
                    <td>{item.storyTitle}</td>
                    <td>{item.authorName}</td>
                    <td>{item.genre}</td>
                    <td>{item.ratingAgeClassification}</td>
                    <td>
                      {item.submissionDate
                        ? new Date(item.submissionDate).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    <td>
                      <span className={`admin-moderation__status admin-moderation__status--${displayStatus(item) || 'processed'}`}>
                        {statusLabel(displayStatus(item))}
                      </span>
                    </td>
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
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {demoItem && (
        <div className='admin-moderation__modal-backdrop' onClick={closeDemoModal}>
          <div className='admin-moderation__modal' onClick={(event) => event.stopPropagation()}>
            <div className='admin-moderation__modal-head'>
              <h2>
                {demoItem.contentType === 'story'
                  ? 'Xem nội dung truyện'
                  : 'Xem nội dung chương'}
              </h2>
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

            {!demoLoading && !demoError && demoContent && (
              <div className='admin-moderation__modal-content'>
                {demoContent.type === 'story' ? (
                  <>
                    <h3>{demoContent.data?.title || demoItem.storyTitle}</h3>
                    <p className='admin-moderation__modal-meta'>
                      Tác giả: {demoItem.authorName || '—'}
                    </p>
                    <div className='admin-moderation__modal-summary'>
                      {demoContent.data?.summary ? (
                        <p>{demoContent.data.summary}</p>
                      ) : (
                        <p>Truyện chưa có tóm tắt.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{demoContent.data?.title || `Chương #${demoItem.contentId}`}</h3>
                    <p className='admin-moderation__modal-meta'>
                      Truyện: {demoItem.storyTitle || '—'}
                    </p>
                    <p className='admin-moderation__modal-meta'>
                      Tác giả: {demoItem.authorName || 'Không có'}
                    </p>
                    <div className='admin-moderation__modal-summary admin-moderation__modal-chapter-body'>
                      {demoContent.data?.fullHtml ? (
                        <div
                          className='admin-moderation__chapter-content'
                          dangerouslySetInnerHTML={{ __html: demoContent.data.fullHtml }}
                        />
                      ) : (
                        <p>Chương chưa có nội dung.</p>
                      )}
                    </div>
                  </>
                )}
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
            <h3>{noteActionLabel}</h3>
            <p className='admin-moderation__note-help'>
              Ghi chú tùy chọn cho hành động này.
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

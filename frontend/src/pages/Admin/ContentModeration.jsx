import { useEffect, useMemo, useState } from 'react';
import storyService from '../../services/storyService';
import '../../styles/admin-content-moderation.css';

const htmlToText = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toPreviewText = (value, maxLength = 160) => {
  const text = htmlToText(value);
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

function ContentModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [activeContentType, setActiveContentType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
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
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;
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

  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems;
    const list = [...filteredItems];
    const mult = sortOrder === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === 'type') {
        const va = (a.contentType || '').toLowerCase();
        const vb = (b.contentType || '').toLowerCase();
        return mult * (va < vb ? -1 : va > vb ? 1 : 0);
      }
      if (sortBy === 'author') {
        const va = (a.authorName || '').toLowerCase();
        const vb = (b.authorName || '').toLowerCase();
        return mult * va.localeCompare(vb);
      }
      return 0;
    });
    return list;
  }, [filteredItems, sortBy, sortOrder]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedItems = useMemo(
    () => sortedItems.slice(startIndex, startIndex + PAGE_SIZE),
    [sortedItems, startIndex]
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

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
    setCurrentPage(1);
  }, [activeStatus, activeContentType]);

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

  const contentTypeLabel = (contentType) => {
    if (contentType === 'story') return 'Truyện';
    if (contentType === 'chapter') return 'Chương';
    return contentType || 'Nội dung';
  };

  const handleViewDemo = async (item) => {
    setDemoItem(item);
    setDemoContent(null);
    setDemoLoading(true);
    setDemoError('');

    try {
      if (item.contentType === 'story') {
        const story = await storyService.getStory(item.contentId || item.storyId);
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

  const isStoryDemo = demoItem?.contentType === 'story';
  const demoModalTitle = isStoryDemo ? 'Xem nội dung truyện' : 'Xem nội dung chương';
  const demoTitle = !demoItem
    ? ''
    : isStoryDemo
      ? demoContent?.title ||
        demoContent?.data?.title ||
        demoItem.storyTitle ||
        `Truyện #${demoItem.contentId}`
      : demoContent?.title || `Chương #${demoItem.contentId}`;
  const demoDescription = isStoryDemo
    ? toPreviewText(demoContent?.summaryHtml || demoContent?.summary || demoItem?.description || '')
    : '';
  const demoModerationNote = String(
    demoItem?.moderationNote ||
      demoItem?.note ||
      demoItem?.rejectionNote ||
      demoContent?.moderationNote ||
      demoContent?.note ||
      '',
  ).trim();

  return (
    <section className='admin-moderation'>
      <header className='admin-moderation__header'>
        <h1>Kiểm duyệt nội dung</h1>
        <p>
          Xem xét các chương truyện trước khi xuất bản để đảm bảo bản quyền, phù hợp với độ tuổi và tiêu chuẩn cộng đồng.
        </p>
      </header>

      <div className='admin-moderation__card admin-moderation__controls-card'>
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

        <div className='admin-moderation__filters'>
          <label className='admin-moderation__filter-label'>
            Loại:
            <select
              className='admin-moderation__select'
              value={activeContentType}
              onChange={(e) => setActiveContentType(e.target.value)}
            >
              <option value='all'>Tất cả</option>
              <option value='story'>Truyện</option>
              <option value='chapter'>Chương</option>
            </select>
          </label>
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
      </div>
      </div>

      {error && <div className='admin-moderation__error'>{error}</div>}

      <div className='admin-moderation__card admin-moderation__card--table'>
        <div className='admin-moderation__grid'>
        <table>
          <thead>
            <tr>
              <th
                className='admin-moderation__th--sortable admin-moderation__col--type'
                onClick={() => handleSort('type')}
              >
                Loại {sortBy === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th>Tên truyện</th>
              <th
                className='admin-moderation__th--sortable admin-moderation__col--author'
                onClick={() => handleSort('author')}
              >
                Tác giả {sortBy === 'author' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th>Thể loại</th>
              <th className='admin-moderation__col--processed'>Xử lý</th>
              <th className='admin-moderation__col--status'>Trạng thái</th>
              <th className='admin-moderation__col--actions'>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className='admin-moderation__empty'>
                  Đang tải hàng chờ kiểm duyệt...
                </td>
              </tr>
            ) : sortedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className='admin-moderation__empty'>
                  Không có bản ghi ở trạng thái này
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const approveKey = buildActionKey(item.contentType, item.contentId, 'approve');
                const rejectKey = buildActionKey(item.contentType, item.contentId, 'reject');
                const isBusy = busyKey === approveKey || busyKey === rejectKey;
                return (
                  <tr key={`${item.contentType}-${item.contentId}`}>
                    <td className='admin-moderation__col--type'>{contentTypeLabel(item.contentType)}</td>
                    <td>{item.storyTitle}</td>
                    <td className='admin-moderation__col--author'>{item.authorName}</td>
                    <td>{item.genre}</td>
                    <td className='admin-moderation__col--processed'>
                      {item.moderationProcessedAt
                        ? new Date(item.moderationProcessedAt).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    <td className='admin-moderation__col--status'>
                      <span className={`admin-moderation__status admin-moderation__status--${displayStatus(item) || 'processed'}`}>
                        {statusLabel(displayStatus(item))}
                      </span>
                    </td>
                    <td className='admin-moderation__col--actions'>
                      <div className='admin-moderation__actions'>
                        <button
                          type='button'
                          className='demo'
                          disabled={isBusy}
                          onClick={() => handleViewDemo(item)}
                        >
                          Xem demo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && totalItems > 0 && (
          <div className='admin-moderation__pagination'>
            <span className='admin-moderation__pagination-info'>
              Trang {safePage} / {totalPages} ({totalItems} bản ghi)
            </span>
            <div className='admin-moderation__pagination-btns'>
              <button
                type='button'
                className='admin-moderation__pagination-btn'
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                type='button'
                className='admin-moderation__pagination-btn'
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
      {demoItem && (
        <div className='admin-moderation__modal-backdrop' onClick={closeDemoModal}>
          <div className='admin-moderation__modal' onClick={(event) => event.stopPropagation()}>
            <div className='admin-moderation__modal-head'>
              <h2>{demoModalTitle}</h2>
              <button
                type='button'
                className='admin-moderation__modal-close'
                onClick={closeDemoModal}
                aria-label='Đóng popup demo'
              >
                ×
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
                {isStoryDemo && demoContent?.coverUrl && (
                  <div className='admin-moderation__modal-cover'>
                    <img
                      src={demoContent.coverUrl}
                      alt={`Bìa: ${demoTitle || 'Truyện'}`}
                    />
                  </div>
                )}
                <h3>{demoTitle}</h3>
                {!isStoryDemo && (
                  <p className='admin-moderation__modal-meta'>
                    {`Truyện: ${demoItem.storyTitle || '—'}`}
                  </p>
                )}
                <p className='admin-moderation__modal-meta'>
                  Tác giả: {demoItem.authorName || 'Không có'}
                </p>
                {displayStatus(demoItem) === 'rejected' && demoModerationNote && (
                  <div className='admin-moderation__modal-note'>
                    <h4 className='admin-moderation__modal-note-title'>
                      Note từ admin
                    </h4>
                    <p>{demoModerationNote}</p>
                  </div>
                )}
                <div className='admin-moderation__modal-summary admin-moderation__modal-chapter-body'>
                  {isStoryDemo ? (
                    demoContent?.summaryHtml ? (
                      <div
                        className='admin-moderation__chapter-content'
                        dangerouslySetInnerHTML={{ __html: demoContent.summaryHtml }}
                      />
                    ) : (
                      <p>Truyện chưa có phần giới thiệu.</p>
                    )
                  ) : demoContent?.fullHtml ? (
                    <div
                      className='admin-moderation__chapter-content'
                      dangerouslySetInnerHTML={{ __html: demoContent.fullHtml }}
                    />
                  ) : (
                    <p>Chương chưa có nội dung.</p>
                  )}
                </div>
              </div>
            )}
            {displayStatus(demoItem) === 'pending' && !demoLoading && (
              <div className='admin-moderation__modal-actions'>
                <button
                  type='button'
                  className='admin-moderation__modal-btn approve'
                  disabled={busyKey === buildActionKey(demoItem.contentType, demoItem.contentId, 'approve')}
                  onClick={() => handleAction(demoItem, 'approve')}
                >
                  Duyệt
                </button>
                <button
                  type='button'
                  className='admin-moderation__modal-btn reject'
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

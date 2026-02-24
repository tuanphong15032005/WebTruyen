import { useEffect, useMemo, useState } from 'react';
import storyService from '../../services/storyService';
import '../../styles/admin-content-moderation.css';

function ContentModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [activeStatus, setActiveStatus] = useState('pending');
  const [demoItem, setDemoItem] = useState(null);
  const [demoStory, setDemoStory] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

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

  const showActions = activeStatus === 'pending';

  const loadModerationContent = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storyService.getPendingModerationContent();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load pending content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationContent();
  }, []);

  useEffect(() => {
    if (!demoItem) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDemoItem(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [demoItem]);

  const buildActionKey = (contentType, contentId, action) =>
    `${contentType}-${contentId}-${action}`;

  const askForNote = (actionLabel) => {
    const input = window.prompt(`Optional note for "${actionLabel}" action:`, '');
    if (input === null) return null;
    return input.trim();
  };

  const handleAction = async (item, action) => {
    const key = buildActionKey(item.contentType, item.contentId, action);
    setBusyKey(key);
    setError('');

    try {
      if (item.contentType === 'story') {
        if (action === 'approve') {
          await storyService.approveModerationStory(item.contentId);
        } else if (action === 'reject') {
          const note = askForNote('Reject');
          if (note === null) return;
          await storyService.rejectModerationStory(item.contentId, note);
        } else {
          const note = askForNote('Request Edit');
          if (note === null) return;
          await storyService.requestEditModerationStory(item.contentId, note);
        }
      } else {
        if (action === 'approve') {
          await storyService.approveModerationChapter(item.contentId);
        } else if (action === 'reject') {
          const note = askForNote('Reject');
          if (note === null) return;
          await storyService.rejectModerationChapter(item.contentId, note);
        } else {
          const note = askForNote('Request Edit');
          if (note === null) return;
          await storyService.requestEditModerationChapter(item.contentId, note);
        }
      }

      await loadModerationContent();
    } catch (err) {
      setError(err.message || 'Moderation action failed');
    } finally {
      setBusyKey('');
    }
  };

  const statusLabel = (status) => {
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    if (status === 'request_edit') return 'Request Edit';
    if (status === 'pending') return 'Pending';
    return status || 'Processed';
  };

  const closeDemoModal = () => {
    setDemoItem(null);
    setDemoStory(null);
    setDemoLoading(false);
    setDemoError('');
  };

  const handleViewDemo = async (item) => {
    setDemoItem(item);
    setDemoStory(null);
    setDemoLoading(true);
    setDemoError('');

    const storyId = item.storyId || item.contentId;
    try {
      const story = await storyService.getStory(storyId);
      setDemoStory(story || null);
    } catch (err) {
      setDemoError(err.message || 'Failed to load story demo');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className='admin-moderation'>
      <header className='admin-moderation__header'>
        <h1>Content Moderation</h1>
        <p>
          Review stories and chapters before publication to ensure copyright,
          age suitability, and community standards.
        </p>
      </header>

      <div className='admin-moderation__toolbar'>
        <div className='admin-moderation__stats'>
          <span className='admin-moderation__badge'>
            Pending: {pendingCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--approved'>
            Approved: {approvedCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--rejected'>
            Rejected: {rejectedCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--request-edit'>
            Request Edit: {requestEditCount}
          </span>
          <span className='admin-moderation__badge admin-moderation__badge--processed'>
            Processed: {processedCount}
          </span>
        </div>
        <button
          type='button'
          className='admin-moderation__refresh'
          onClick={loadModerationContent}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className='admin-moderation__tabs'>
        <button
          type='button'
          className={activeStatus === 'pending' ? 'active' : ''}
          onClick={() => setActiveStatus('pending')}
        >
          Pending
        </button>
        <button
          type='button'
          className={activeStatus === 'approved' ? 'active' : ''}
          onClick={() => setActiveStatus('approved')}
        >
          Approved
        </button>
        <button
          type='button'
          className={activeStatus === 'rejected' ? 'active' : ''}
          onClick={() => setActiveStatus('rejected')}
        >
          Rejected
        </button>
        <button
          type='button'
          className={activeStatus === 'request_edit' ? 'active' : ''}
          onClick={() => setActiveStatus('request_edit')}
        >
          Request Edit
        </button>
      </div>

      {error && <div className='admin-moderation__error'>{error}</div>}

      <div className='admin-moderation__grid'>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Story Title</th>
              <th>Author Name</th>
              <th>Genre</th>
              <th>Rating / Age Classification</th>
              <th>Submission Date</th>
              <th>Status</th>
              <th>Processed At</th>
              <th>Moderation Note</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className='admin-moderation__empty'>
                  Loading moderation queue...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 10 : 9} className='admin-moderation__empty'>
                  No records in this status
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const approveKey = buildActionKey(item.contentType, item.contentId, 'approve');
                const rejectKey = buildActionKey(item.contentType, item.contentId, 'reject');
                const editKey = buildActionKey(item.contentType, item.contentId, 'request-edit');
                const isBusy = busyKey === approveKey || busyKey === rejectKey || busyKey === editKey;
                const canModerate = item.moderationStatus === 'pending';
                return (
                  <tr key={`${item.contentType}-${item.contentId}`}>
                    <td>{item.contentType}</td>
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
                          disabled={isBusy || item.contentType !== 'story'}
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
                          Approve
                        </button>
                        <button
                          type='button'
                          className='reject'
                          disabled={isBusy || !canModerate}
                          onClick={() => handleAction(item, 'reject')}
                        >
                          Reject
                        </button>
                        <button
                          type='button'
                          className='edit'
                          disabled={isBusy || !canModerate}
                          onClick={() => handleAction(item, 'request-edit')}
                        >
                          Request Edit
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
              <h2>Demo truyện chờ duyệt</h2>
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
                <h3>{demoStory?.title || demoItem.storyTitle}</h3>
                <p className='admin-moderation__modal-meta'>
                  Tác giả: {demoStory?.authorPenName || demoItem.authorName || 'N/A'}
                </p>
                <p className='admin-moderation__modal-meta'>
                  Thể loại: {demoStory?.kind || demoItem.genre || 'N/A'}
                </p>
                <p className='admin-moderation__modal-meta'>
                  Phân loại độ tuổi: {demoItem.ratingAgeClassification || 'N/A'}
                </p>
                <div className='admin-moderation__modal-summary'>
                  {demoStory?.summaryHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: demoStory.summaryHtml }} />
                  ) : (
                    <p>Truyện chưa có mô tả để xem demo.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default ContentModeration;

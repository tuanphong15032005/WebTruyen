import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import storyService from '../../services/storyService';
import useNotify from '../../hooks/useNotify';
import '../../styles/manage-stories.css';

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleString('vi-VN');
};

const DraftManagement = () => {
  const [drafts, setDrafts] = useState({ stories: [], chapters: [] });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { notify } = useNotify();
  const navigate = useNavigate();

  const hasNoDrafts = useMemo(
    () =>
      (!drafts.stories || drafts.stories.length === 0) &&
      (!drafts.chapters || drafts.chapters.length === 0),
    [drafts],
  );

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        setLoading(true);
        const data = await storyService.getAuthorDrafts();
        setDrafts({
          stories: Array.isArray(data?.stories) ? data.stories : [],
          chapters: Array.isArray(data?.chapters) ? data.chapters : [],
        });
      } catch (error) {
        console.error('getAuthorDrafts error', error);
        notify('Không tải được danh sách bản nháp', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadDrafts();
  }, [notify]);

  const handleDeleteStoryDraft = async (storyId) => {
    if (!storyId) return;
    const confirm = window.confirm(
      'Bạn có chắc muốn xóa bản nháp truyện này? Hành động này không thể hoàn tác.',
    );
    if (!confirm) return;
    try {
      setDeletingId(`story-${storyId}`);
      await storyService.deleteDraftStory(storyId);
      setDrafts((prev) => ({
        ...prev,
        stories: prev.stories.filter((s) => s.id !== storyId),
      }));
      notify('Đã xóa nháp truyện', 'success');
    } catch (error) {
      console.error('deleteDraftStory error', error);
      notify('Không thể xóa nháp truyện', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteChapterDraft = async (chapterId) => {
    if (!chapterId) return;
    const confirm = window.confirm(
      'Bạn có chắc muốn xóa bản nháp chương này? Hành động này không thể hoàn tác.',
    );
    if (!confirm) return;
    try {
      setDeletingId(`chapter-${chapterId}`);
      await storyService.deleteDraftChapter(chapterId);
      setDrafts((prev) => ({
        ...prev,
        chapters: prev.chapters.filter((c) => c.id !== chapterId),
      }));
      notify('Đã xóa nháp chương', 'success');
    } catch (error) {
      console.error('deleteDraftChapter error', error);
      notify('Không thể xóa nháp chương', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className='story-hub'>
      <header className='story-hub__header'>
        <h1>Quản lý bản nháp</h1>
        <p>Xem và tiếp tục viết các truyện / chương đang ở trạng thái nháp.</p>
      </header>

      {loading && (
        <p className='story-hub__muted'>Đang tải danh sách bản nháp...</p>
      )}

      {!loading && hasNoDrafts && (
        <div className='story-hub__empty'>
          Hiện bạn chưa có bản nháp nào. Hãy bắt đầu viết truyện mới hoặc chương mới.
        </div>
      )}

      {!loading && drafts.stories?.length > 0 && (
        <article className='story-hub__card' style={{ marginTop: 16 }}>
          <h2>Truyện nháp</h2>
          <div className='story-hub__table-wrap'>
            <table className='story-hub__table'>
              <thead>
                <tr>
                  <th>Tiêu đề truyện</th>
                  <th>Cập nhật lần cuối</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {drafts.stories.map((story) => (
                  <tr key={story.id}>
                    <td>{story.title}</td>
                    <td>{formatDateTime(story.lastUpdatedAt)}</td>
                    <td>
                      <div className='story-hub__actions'>
                        <button
                          type='button'
                          className='story-hub__action-btn ghost'
                          onClick={() =>
                            navigate(`/author/stories/${story.id}/edit`)
                          }
                        >
                          Sửa
                        </button>
                        <button
                          type='button'
                          className='story-hub__action-btn'
                          onClick={() =>
                            navigate(`/author/stories/${story.id}/edit`)
                          }
                        >
                          Tiếp tục viết
                        </button>
                        <button
                          type='button'
                          className='story-hub__action-btn ghost'
                          onClick={() => handleDeleteStoryDraft(story.id)}
                          disabled={deletingId === `story-${story.id}`}
                        >
                          {deletingId === `story-${story.id}`
                            ? 'Đang xóa...'
                            : 'Xóa nháp'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {!loading && drafts.chapters?.length > 0 && (
        <article className='story-hub__card' style={{ marginTop: 24 }}>
          <h2>Chương nháp</h2>
          <div className='story-hub__table-wrap'>
            <table className='story-hub__table'>
              <thead>
                <tr>
                  <th>Truyện</th>
                  <th>Chương</th>
                  <th>Cập nhật lần cuối</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {drafts.chapters.map((chapter) => (
                  <tr key={chapter.id}>
                    <td>{chapter.storyTitle || 'Không rõ truyện'}</td>
                    <td>{chapter.chapterTitle}</td>
                    <td>{formatDateTime(chapter.lastUpdatedAt)}</td>
                    <td>
                      <div className='story-hub__actions'>
                        <Link
                          className='story-hub__action-btn ghost'
                          to={`/author/stories/${chapter.storyId}/volumes/${chapter.volumeId}/create-chapter?chapterId=${chapter.id}`}
                        >
                          Sửa
                        </Link>
                        <Link
                          className='story-hub__action-btn'
                          to={`/author/stories/${chapter.storyId}/volumes/${chapter.volumeId}/create-chapter?chapterId=${chapter.id}`}
                        >
                          Tiếp tục viết
                        </Link>
                        <button
                          type='button'
                          className='story-hub__action-btn ghost'
                          onClick={() => handleDeleteChapterDraft(chapter.id)}
                          disabled={deletingId === `chapter-${chapter.id}`}
                        >
                          {deletingId === `chapter-${chapter.id}`
                            ? 'Đang xóa...'
                            : 'Xóa nháp'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
};

export default DraftManagement;


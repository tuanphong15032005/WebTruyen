import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button';
import CreateVolume from './CreateVolume';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/story-detail.css';

const StoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useNotify();
  const [story, setStory] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'volumes' ? 'volumes' : 'info',
  );

  const fetchStory = useCallback(async () => {
    try {
      setLoadingStory(true);
      const response = await storyService.getStory(storyId);
      setStory(response?.data || null);
    } catch (error) {
      console.error('getStory error', error);
      notify('Không tải được thông tin truyện', 'error');
    } finally {
      setLoadingStory(false);
    }
  }, [notify, storyId]);

  const fetchVolumes = useCallback(async () => {
    try {
      setLoadingVolumes(true);
      const response = await storyService.getVolumes(storyId);
      const list = Array.isArray(response?.data) ? response.data : [];
      setVolumes(list);
    } catch (error) {
      console.error('getVolumes error', error);
      notify('Không tải được danh sách volume', 'error');
    } finally {
      setLoadingVolumes(false);
    }
  }, [notify, storyId]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'volumes') {
      setActiveTab('volumes');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'volumes') {
      fetchVolumes();
    }
  }, [activeTab, fetchVolumes]);

  useEffect(() => {
    const volumeId = searchParams.get('volumeId');
    if (!volumeId) return;
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      next.add(String(volumeId));
      return next;
    });
  }, [searchParams]);

  const categoryTag = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags[0] || null;
  }, [story]);

  const extraTags = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags.slice(1);
  }, [story]);

  const toggleVolume = (volumeId) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
      }
      return next;
    });
  };

  return (
    <div className='story-detail'>
      <div className='story-detail__top'>
        <h2>Chi tiết truyện</h2>
        {activeTab === 'volumes' && (
          <Button type='button' onClick={() => setShowCreateVolume((s) => !s)}>
            {showCreateVolume ? 'Đóng' : 'Tạo tập mới'}
          </Button>
        )}
      </div>

      <div className='story-detail__tabs'>
        <button
          type='button'
          className={`story-detail__tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Thông tin
        </button>
        <button
          type='button'
          className={`story-detail__tab ${activeTab === 'volumes' ? 'active' : ''}`}
          onClick={() => setActiveTab('volumes')}
        >
          Danh sách Tập & Chương
        </button>
      </div>

      {activeTab === 'info' && (
        <div className='story-detail__info'>
          {loadingStory && <p className='story-detail__muted'>Đang tải dữ liệu...</p>}
          {story && (
            <div className='story-detail__card'>
              <div className='story-detail__cover'>
                {story.coverUrl ? (
                  <img src={story.coverUrl} alt={story.title} />
                ) : (
                  <div className='story-detail__cover-placeholder'>Chưa có ảnh bìa</div>
                )}
                <Button
                  type='button'
                  className='story-detail__edit'
                  onClick={() => navigate(`/author/stories/${storyId}/edit`)}
                >
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M4 17.25V20h2.75l8.1-8.1-2.75-2.75-8.1 8.1zm15.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.84 1.84 2.75 2.75 1.99-1.67z'/>
                  </svg>
                  Sửa truyện
                </Button>
              </div>

              <div className='story-detail__content'>
                <h3>{story.title}</h3>
                <div className='story-detail__grid'>
                  <div>
                    <span className='story-detail__label'>Tác giả</span>
                    <p>{story.authorPenName || 'Chưa có bút danh'}</p>
                  </div>
                  <div>
                    <span className='story-detail__label'>Danh mục</span>
                    <p>{categoryTag ? categoryTag.name : 'Chưa chọn'}</p>
                    {extraTags.length > 0 && (
                      <div className='story-detail__tags'>
                        {extraTags.map((tag) => (
                          <span key={tag.id} className='story-detail__tag'>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className='story-detail__summary'>
                    <span className='story-detail__label'>Tóm tắt</span>
                    <div className='story-detail__summary-box'>
                      {story.summaryHtml || story.summary || 'Chưa có tóm tắt.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'volumes' && (
        <div className='story-detail__volumes'>
          {showCreateVolume && (
            <CreateVolume
              storyId={storyId}
              onCreated={(volumeId) => {
                setShowCreateVolume(false);
                fetchVolumes();
                if (volumeId) {
                  setExpandedVolumes((prev) => {
                    const next = new Set(prev);
                    next.add(String(volumeId));
                    return next;
                  });
                }
              }}
              onCancel={() => setShowCreateVolume(false)}
            />
          )}

          {loadingVolumes && (
            <p className='story-detail__muted'>Đang tải danh sách volume...</p>
          )}

          {!loadingVolumes && volumes.length === 0 && (
            <div className='story-detail__empty'>Chưa có volume nào.</div>
          )}

          {volumes.map((volume) => {
            const id = String(volume.id || volume.volumeId);
            const isOpen = expandedVolumes.has(id);
            const chapters = Array.isArray(volume.chapters) ? volume.chapters : [];
            return (
              <div key={id} className='story-detail__volume'>
                <div className='story-detail__volume-header'>
                  <button
                    type='button'
                    className='story-detail__volume-toggle'
                    onClick={() => toggleVolume(id)}
                  >
                    <span>{volume.title || `Tập ${volume.sequenceIndex || ''}`}</span>
                    <span className='story-detail__muted'>
                      {volume.chapterCount ?? chapters.length} chương
                    </span>
                  </button>
                  <Link
                    className='story-detail__chapter-link'
                    to={`/author/stories/${storyId}/volumes/${id}/create-chapter?tab=volumes&volumeId=${id}`}
                  >
                    + Thêm chương mới
                  </Link>
                </div>

                {isOpen && (
                  <div className='story-detail__chapters'>
                    {chapters.length === 0 && (
                      <p className='story-detail__muted'>Chưa có chương nào.</p>
                    )}
                    {chapters.map((chapter) => (
                      <div key={chapter.id} className='story-detail__chapter'>
                        <span>
                          {chapter.sequenceIndex ? `Chương ${chapter.sequenceIndex}: ` : ''}
                          {chapter.title}
                        </span>
                        {chapter.lastUpdateAt && (
                          <span className='story-detail__muted'>
                            Cập nhật: {new Date(chapter.lastUpdateAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoryDetail;

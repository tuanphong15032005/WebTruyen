import React, { useEffect, useState } from 'react';
import ConfirmActionModal from './ConfirmActionModal';
import SkeletonBlock from './SkeletonBlock';
import storyService from '../services/storyService';
import libraryAlbumService from '../services/libraryAlbumService';
import '../styles/story-library-modal.css';

const READING_OPTIONS = [
  { value: 'none', label: 'Gỡ khỏi thư viện' },
  { value: 'reading', label: 'Đang đọc' },
  { value: 'plan_to_read', label: 'Sẽ đọc' },
  { value: 'completed', label: 'Đã đọc xong' },
];

const DEFAULT_ALBUM_FORM = {
  name: '',
  description: '',
  visibility: 'private',
};

const normalizeAlbums = (albums) => (Array.isArray(albums) ? albums : []);

const getSelectedAlbumIds = (albums) =>
  normalizeAlbums(albums)
    .filter((album) => album?.containsStory)
    .map((album) => Number(album.id))
    .filter((id) => Number.isFinite(id) && id > 0);

const StoryLibraryModal = ({
  isOpen,
  story,
  onClose,
  onSaved,
  notify,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [readingStatus, setReadingStatus] = useState('none');
  const [selectedAlbumIds, setSelectedAlbumIds] = useState([]);
  const [showCreateAlbumForm, setShowCreateAlbumForm] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [albumForm, setAlbumForm] = useState(DEFAULT_ALBUM_FORM);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [hydratedStoryId, setHydratedStoryId] = useState(null);
  const currentStoryId = story?.id == null ? null : String(story.id);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setAlbums([]);
      setReadingStatus('none');
      setSelectedAlbumIds([]);
      setShowCreateAlbumForm(false);
      setCreatingAlbum(false);
      setAlbumForm(DEFAULT_ALBUM_FORM);
      setShowRemoveConfirm(false);
      setHydratedStoryId(null);
      return undefined;
    }

    if (!story?.id || !currentStoryId) return undefined;

    let isMounted = true;

    const fetchDialog = async () => {
      try {
        setLoading(true);
        setHydratedStoryId(null);
        const response = await storyService.getStoryLibraryDialog(story.id);
        if (!isMounted) return;
        const nextAlbums = normalizeAlbums(response?.albums);
        setAlbums(nextAlbums);
        setReadingStatus(response?.readingStatus || 'none');
        setSelectedAlbumIds(getSelectedAlbumIds(nextAlbums));
        setHydratedStoryId(currentStoryId);
      } catch (error) {
        if (!isMounted) return;
        notify?.(error?.message || 'Không tải được dữ liệu thư viện', 'error');
        onClose?.();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDialog();

    return () => {
      isMounted = false;
    };
  }, [currentStoryId, isOpen, notify, onClose, story?.id]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !saving) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !story) return null;

  const handleAlbumToggle = (albumId) => {
    if (readingStatus === 'none' || saving) return;

    setSelectedAlbumIds((prev) =>
      prev.includes(albumId)
        ? prev.filter((id) => id !== albumId)
        : [...prev, albumId],
    );
  };

  const handleReadingStatusChange = (event) => {
    const nextStatus = event.target.value;
    setReadingStatus(nextStatus);
    if (nextStatus === 'none') {
      setSelectedAlbumIds([]);
    }
  };

  const handleAlbumFormChange = (field, value) => {
    setAlbumForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateAlbum = async () => {
    const trimmedName = String(albumForm.name || '').trim();
    if (!trimmedName) {
      notify?.('Tên bộ sưu tập không được để trống', 'error');
      return;
    }

    try {
      setCreatingAlbum(true);
      const response = await libraryAlbumService.createAlbum({
        name: trimmedName,
        description: String(albumForm.description || '').trim(),
        visibility: albumForm.visibility || 'private',
      });

      const newAlbum = {
        ...response,
        containsStory: false,
      };

      setAlbums((prev) => [newAlbum, ...prev]);
      if (readingStatus !== 'none' && Number.isFinite(Number(newAlbum.id))) {
        setSelectedAlbumIds((prev) => {
          const normalizedId = Number(newAlbum.id);
          return prev.includes(normalizedId) ? prev : [normalizedId, ...prev];
        });
      }
      setAlbumForm(DEFAULT_ALBUM_FORM);
      setShowCreateAlbumForm(false);
      notify?.('Đã tạo bộ sưu tập mới', 'success');
    } catch (error) {
      notify?.(error?.message || 'Không thể tạo bộ sưu tập', 'error');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const applySave = async () => {
    try {
      setSaving(true);
      const payload = {
        readingStatus: readingStatus === 'none' ? 'none' : readingStatus,
        albumIds: readingStatus === 'none' ? [] : selectedAlbumIds,
      };
      const response = await storyService.updateStoryLibraryDialog(
        story.id,
        payload,
      );
      onSaved?.(response);
      notify?.(
        readingStatus === 'none'
          ? 'Đã gỡ truyện khỏi thư viện, yêu thích và mọi bộ sưu tập'
          : 'Đã cập nhật thư viện',
        'success',
      );
      onClose?.();
    } catch (error) {
      notify?.(error?.message || 'Không thể lưu thay đổi thư viện', 'error');
    } finally {
      setSaving(false);
      setShowRemoveConfirm(false);
    }
  };

  const handleSave = async () => {
    if (readingStatus === 'none') {
      setShowRemoveConfirm(true);
      return;
    }
    await applySave();
  };

  const selectedCount = selectedAlbumIds.length;
  const showLoadingSkeleton =
    Boolean(currentStoryId) && (loading || hydratedStoryId !== currentStoryId);

  const renderLoadingSkeleton = () => (
    <div className='story-library-modal__loading' aria-hidden='true'>
      <div className='story-library-modal__story story-library-modal__story--loading'>
        <div className='story-library-modal__cover-wrap'>
          <SkeletonBlock className='story-library-modal__cover-skeleton' />
        </div>

        <div className='story-library-modal__story-main story-library-modal__story-main--loading'>
          <SkeletonBlock className='story-library-modal__title-skeleton' />
          <SkeletonBlock className='story-library-modal__title-skeleton story-library-modal__title-skeleton--short' />
          <SkeletonBlock className='story-library-modal__desc-skeleton' />

          <div className='story-library-modal__field story-library-modal__field--loading'>
            <SkeletonBlock className='story-library-modal__label-skeleton' />
            <SkeletonBlock className='story-library-modal__select-skeleton' />
          </div>
        </div>
      </div>

      <div className='story-library-modal__albums story-library-modal__albums--loading'>
        <div className='story-library-modal__albums-head'>
          <div className='story-library-modal__albums-head-copy'>
            <SkeletonBlock className='story-library-modal__albums-title-skeleton' />
            <SkeletonBlock className='story-library-modal__albums-subtitle-skeleton' />
          </div>
          <SkeletonBlock className='story-library-modal__inline-btn-skeleton' />
        </div>

        <div className='story-library-modal__album-list story-library-modal__album-list--loading'>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className='story-library-modal__album-item story-library-modal__album-item--skeleton'
            >
              <SkeletonBlock className='story-library-modal__album-thumb-skeleton' />
              <div className='story-library-modal__album-copy'>
                <SkeletonBlock className='story-library-modal__album-line-skeleton story-library-modal__album-line-skeleton--title' />
                <SkeletonBlock className='story-library-modal__album-line-skeleton story-library-modal__album-line-skeleton--meta' />
                <SkeletonBlock className='story-library-modal__album-line-skeleton story-library-modal__album-line-skeleton--desc' />
              </div>
              <SkeletonBlock className='story-library-modal__album-mark-skeleton' />
            </div>
          ))}
        </div>
      </div>

      <div className='story-library-modal__actions story-library-modal__actions--loading'>
        <SkeletonBlock className='story-library-modal__ghost-btn-skeleton' />
        <SkeletonBlock className='story-library-modal__solid-btn-skeleton' />
      </div>
    </div>
  );

  return (
    <>
      <div
        className='story-library-modal__backdrop'
        onClick={() => !saving && onClose?.()}
      >
        <div
          className='story-library-modal__panel'
          onClick={(event) => event.stopPropagation()}
        >
          <div className='story-library-modal__header'>
            <div>
              <p className='story-library-modal__eyebrow'>Thư viện của bạn</p>
              <h2>Lưu truyện và quản lý bộ sưu tập</h2>
            </div>
            <button
              type='button'
              className='story-library-modal__close'
              onClick={() => !saving && onClose?.()}
              aria-label='Đóng hộp thoại thư viện'
            >
              ×
            </button>
          </div>

          {showLoadingSkeleton ? (
            renderLoadingSkeleton() /*
              Đang tải dữ liệu thư viện...
          */ ) : (
            <>
              <div className='story-library-modal__story'>
                <div className='story-library-modal__cover-wrap'>
                  {story.coverUrl ? (
                    <img
                      className='story-library-modal__cover'
                      src={story.coverUrl}
                      alt={story.title}
                    />
                  ) : (
                    <div className='story-library-modal__cover story-library-modal__cover--empty'>
                      Chưa có bìa
                    </div>
                  )}
                </div>

                <div className='story-library-modal__story-main'>
                  <h3>{story.title}</h3>
                  <p>
                    Chọn trạng thái đọc và các bộ sưu tập muốn lưu truyện này.
                  </p>

                  <label
                    className='story-library-modal__field'
                    htmlFor='story-library-reading-status'
                  >
                    <span>Trạng thái đọc</span>
                    <select
                      id='story-library-reading-status'
                      value={readingStatus}
                      onChange={handleReadingStatusChange}
                      disabled={saving}
                    >
                      {READING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {readingStatus === 'none' && (
                    <div className='story-library-modal__warning'>
                      Nếu lưu với trạng thái này, truyện sẽ bị gỡ khỏi thư viện,
                      bỏ yêu thích và xoá khỏi toàn bộ bộ sưu tập.
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`story-library-modal__albums ${readingStatus === 'none' ? 'is-disabled' : ''}`}
              >
                <div className='story-library-modal__albums-head'>
                  <div>
                    <h4>Thêm vào bộ sưu tập</h4>
                    <p>
                      {selectedCount > 0
                        ? `Đã chọn ${selectedCount} bộ sưu tập`
                        : 'Chưa chọn bộ sưu tập nào'}
                    </p>
                  </div>
                  <button
                    type='button'
                    className='story-library-modal__inline-btn'
                    onClick={() =>
                      readingStatus !== 'none' &&
                      setShowCreateAlbumForm((prev) => !prev)
                    }
                    disabled={saving || readingStatus === 'none'}
                  >
                    {showCreateAlbumForm ? 'Ẩn form tạo' : 'Tạo bộ sưu tập mới'}
                  </button>
                </div>

                {showCreateAlbumForm && (
                  <div className='story-library-modal__create-box'>
                    <label className='story-library-modal__field'>
                      <span>Tên bộ sưu tập</span>
                      <input
                        type='text'
                        value={albumForm.name}
                        onChange={(event) =>
                          handleAlbumFormChange('name', event.target.value)
                        }
                        placeholder='Nhập tiêu đề bộ sưu tập'
                        maxLength={255}
                        disabled={creatingAlbum}
                      />
                    </label>

                    <label className='story-library-modal__field'>
                      <span>Mô tả</span>
                      <textarea
                        value={albumForm.description}
                        onChange={(event) =>
                          handleAlbumFormChange(
                            'description',
                            event.target.value,
                          )
                        }
                        placeholder='Mô tả ngắn cho bộ sưu tập'
                        maxLength={1000}
                        rows={3}
                        disabled={creatingAlbum}
                      />
                    </label>

                    <label className='story-library-modal__field'>
                      <span>Chế độ hiển thị</span>
                      <select
                        value={albumForm.visibility}
                        onChange={(event) =>
                          handleAlbumFormChange('visibility', event.target.value)
                        }
                        disabled={creatingAlbum}
                      >
                        <option value='private'>Riêng tư</option>
                        <option value='public'>Công khai</option>
                      </select>
                    </label>

                    <div className='story-library-modal__create-actions'>
                      <button
                        type='button'
                        className='story-library-modal__ghost-btn'
                        onClick={() => {
                          setAlbumForm(DEFAULT_ALBUM_FORM);
                          setShowCreateAlbumForm(false);
                        }}
                        disabled={creatingAlbum}
                      >
                        Hủy
                      </button>
                      <button
                        type='button'
                        className='story-library-modal__solid-btn'
                        onClick={handleCreateAlbum}
                        disabled={creatingAlbum}
                      >
                        {creatingAlbum ? 'Đang tạo...' : 'Tạo bộ sưu tập'}
                      </button>
                    </div>
                  </div>
                )}

                <div className='story-library-modal__album-list'>
                  {albums.length === 0 ? (
                    <div className='story-library-modal__empty'>
                      Chưa có bộ sưu tập nào. Hãy tạo một bộ sưu tập mới.
                    </div>
                  ) : (
                    albums.map((album) => {
                      const albumId = Number(album.id);
                      const isSelected = selectedAlbumIds.includes(albumId);
                      const thumbLabel = String(album.name || '?')
                        .trim()
                        .charAt(0)
                        .toUpperCase();

                      return (
                        <button
                          key={album.id}
                          type='button'
                          className={`story-library-modal__album-item ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleAlbumToggle(albumId)}
                          disabled={readingStatus === 'none' || saving}
                        >
                          <div className='story-library-modal__album-thumb'>
                            {album.coverUrl ? (
                              <img src={album.coverUrl} alt={album.name} />
                            ) : (
                              <span>{thumbLabel || 'A'}</span>
                            )}
                          </div>

                          <div className='story-library-modal__album-copy'>
                            <strong>{album.name}</strong>
                            <span>
                              {album.visibility === 'public'
                                ? 'Công khai'
                                : 'Riêng tư'}
                              {Number(album.itemCount || 0) > 0
                                ? ` • ${album.itemCount} truyện`
                                : ''}
                            </span>
                            {album.description && (
                              <p>{album.description}</p>
                            )}
                          </div>

                          <span
                            className={`story-library-modal__album-mark ${isSelected ? 'is-selected' : ''}`}
                            aria-hidden='true'
                          >
                            <svg viewBox='0 0 24 24'>
                              <path d='M6 3h12a2 2 0 0 1 2 2v16l-8-3.75L4 21V5a2 2 0 0 1 2-2z' />
                            </svg>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className='story-library-modal__actions'>
                <button
                  type='button'
                  className='story-library-modal__ghost-btn'
                  onClick={() => !saving && onClose?.()}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type='button'
                  className='story-library-modal__solid-btn'
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={showRemoveConfirm}
        title='Gỡ truyện khỏi toàn bộ thư viện?'
        message='Thao tác này sẽ bỏ lưu truyện, bỏ yêu thích và xóa truyện khỏi tất cả bộ sưu tập của bạn.'
        cancelText='Quay lại'
        confirmText='Xác nhận gỡ'
        onCancel={() => !saving && setShowRemoveConfirm(false)}
        onConfirm={applySave}
      />
    </>
  );
};

export default StoryLibraryModal;

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/create-story.css';

const STORY_STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'published', label: 'Công khai' },
  { value: 'archived', label: 'Lưu trữ' },
];

const STORY_KIND_OPTIONS = [
  { value: 'original', label: 'Truyện gốc' },
  { value: 'translated', label: 'Truyện dịch' },
  { value: 'ai', label: 'Truyện AI' },
];

const COMPLETION_STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Đang tiến hành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Tạm ngưng' },
];

const CreateStory = () => {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const isEditing = Boolean(storyId);
  const { notify } = useNotify();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('draft');
  const [kind, setKind] = useState('original');
  const [originalAuthorName, setOriginalAuthorName] = useState('');
  const [completionStatus, setCompletionStatus] = useState('ongoing');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedLabels, setSelectedLabels] = useState([]);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await storyService.getTags();
        const raw = response?.data?.data || response?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list
          .filter((tag) => tag && tag.id != null)
          .map((tag) => ({
            value: String(tag.id),
            label: tag.name || String(tag.id),
          }));
        setTags(normalized);
      } catch (error) {
        console.error('getTags error', error);
        notify('Không tải được danh sách thể loại', 'error');
      }
    };
    fetchTags();
  }, [notify]);

  useEffect(() => {
    if (!storyId) return;
    const fetchStory = async () => {
      try {
        setLoadingStory(true);
        const response = await storyService.getStory(storyId);
        const data = response?.data || {};
        setTitle(data.title || '');
        setSummary(data.summaryHtml || data.summary || '');
        setStatus((data.status || 'draft').toLowerCase());
        setKind((data.kind || 'original').toLowerCase());
        setOriginalAuthorName(data.originalAuthorName || '');
        setCompletionStatus((data.completionStatus || 'ongoing').toLowerCase());
        setExistingCoverUrl(data.coverUrl || '');
        const apiTags = Array.isArray(data.tags) ? data.tags : [];
        const tagIdList = apiTags.map((tag) => String(tag.id));
        if (tagIdList.length > 0) {
          setCategoryId(tagIdList[0]);
          setTagIds(tagIdList.slice(1));
        } else {
          setCategoryId('');
          setTagIds([]);
        }
      } catch (error) {
        console.error('getStory error', error);
        notify('Không tải được thông tin truyện', 'error');
      } finally {
        setLoadingStory(false);
      }
    };
    fetchStory();
  }, [notify, storyId]);

  useEffect(() => {
    const labelById = new Map(tags.map((t) => [String(t.value), t.label]));
    const combined = [];
    if (categoryId) {
      combined.push({
        id: String(categoryId),
        label: labelById.get(String(categoryId)) || String(categoryId),
        type: 'category',
      });
    }
    for (const tagId of tagIds) {
      if (!tagId) continue;
      combined.push({
        id: String(tagId),
        label: labelById.get(String(tagId)) || String(tagId),
        type: 'tag',
      });
    }
    const unique = [];
    const seen = new Set();
    for (const item of combined) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push(item);
    }
    setSelectedLabels(unique);
  }, [categoryId, tagIds, tags]);

  const handleAddTag = (id) => {
    setTagIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const handleRemoveTag = (id) => {
    setTagIds((prev) => prev.filter((item) => item !== id));
  };

  const handleCoverChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setCoverFile(selected);
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc';
    if (!summary.trim()) nextErrors.summary = 'Tóm tắt là bắt buộc';
    if (!categoryId) nextErrors.category = 'Danh mục là bắt buộc';
    if (kind === 'translated' && !originalAuthorName.trim()) {
      nextErrors.originalAuthorName = 'Tên tác giả gốc là bắt buộc với truyện dịch';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };
      const combinedIds = [categoryId, ...tagIds].filter(Boolean);
      const uniqueIds = Array.from(new Set(combinedIds));
      const payload = {
        title: title.trim(),
        summaryHtml: summary.trim(),
        tagIds: uniqueIds.map(toNumber).filter((id) => id != null),
        status,
        visibility: status === 'published' ? 'PUBLIC' : 'DRAFT',
        kind,
        originalAuthorName: kind === 'translated' ? originalAuthorName.trim() : null,
        completionStatus,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const response = isEditing
        ? await storyService.updateStory(storyId, formData)
        : await storyService.createStory(formData);

      const nextStoryId = response?.data?.id || response?.data?.storyId || storyId;
      if (nextStoryId) {
        notify(
          isEditing ? 'Cập nhật truyện thành công' : 'Tạo truyện thành công',
          'success',
        );
        navigate(`/author/stories/${nextStoryId}`);
      } else {
        notify('Lưu truyện thành công nhưng không có ID trả về', 'info');
      }
    } catch (error) {
      console.error('saveStory error', error);
      notify('Không thể lưu truyện. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='page create-story-page'>
      <div className='create-story-page__hero'>
        <h2>{isEditing ? 'Sửa truyện' : 'Tạo truyện mới'}</h2>
        <p className='create-story-page__subtitle'>
          Bắt đầu hành trình sáng tác và chia sẻ câu chuyện của bạn với hàng triệu độc giả.
        </p>
      </div>

      {loadingStory && <p className='field-hint'>Đang tải dữ liệu...</p>}

      <form className='create-story-form' onSubmit={handleSubmit}>
        <div className='create-story-form__grid'>
          <div className='create-story-form__left'>
            <label className='field create-story-cover'>
              <span className='field-label'>Ảnh bìa truyện</span>
              <input
                ref={coverInputRef}
                className='create-story-cover__input'
                type='file'
                accept='image/*'
                onChange={handleCoverChange}
              />
              <button
                className='create-story-cover__box'
                type='button'
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreviewUrl || existingCoverUrl ? (
                  <img
                    src={coverPreviewUrl || existingCoverUrl}
                    alt='cover'
                    className='create-story-cover__preview'
                  />
                ) : (
                  <span className='create-story-cover__placeholder'>Tải ảnh lên</span>
                )}
              </button>
              <span className='field-hint create-story-cover__hint'>
                Mẹo: Một ảnh bìa đẹp sẽ giúp truyện của bạn thu hút nhiều độc giả hơn.
              </span>
            </label>

            <Select
              label='Trạng thái truyện'
              options={STORY_STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              placeholder='Chọn trạng thái'
            />

            <Select
              label='Tình trạng'
              options={COMPLETION_STATUS_OPTIONS}
              value={completionStatus}
              onChange={setCompletionStatus}
              placeholder='Chọn tình trạng'
            />
          </div>

          <div className='create-story-form__right'>
            <Input
              label='Tiêu đề truyện'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder='Nhập tiêu đề truyện'
            />

            <Input
              label='Tóm tắt nội dung'
              as='textarea'
              rows='5'
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              error={errors.summary}
              placeholder='Viết một đoạn ngắn giới thiệu về nội dung truyện của bạn...'
            />

            <div className='create-story-form__row'>
              <Select
                label='Loại truyện'
                options={STORY_KIND_OPTIONS}
                value={kind}
                onChange={(value) => {
                  setKind(value);
                  if (value !== 'translated') {
                    setOriginalAuthorName('');
                  }
                }}
                placeholder='Chọn loại truyện'
              />

              <Select
                label='Danh mục chính'
                options={tags}
                value={categoryId}
                onChange={setCategoryId}
                error={errors.category}
                placeholder='Chọn danh mục'
              />
            </div>

            {kind === 'translated' && (
              <Input
                label='Tác giả gốc'
                value={originalAuthorName}
                onChange={(e) => setOriginalAuthorName(e.target.value)}
                error={errors.originalAuthorName}
                placeholder='Nhập tên tác giả gốc'
              />
            )}

            <div className='field'>
              <span className='field-label'>Thể loại (Tags)</span>
              <div className='create-story-tags'>
                {tags.map((tag) => {
                  const selected = tagIds.includes(String(tag.value));
                  return (
                    <button
                      key={tag.value}
                      type='button'
                      className={`create-story-tag ${selected ? 'is-selected' : ''}`}
                      onClick={() => handleAddTag(String(tag.value))}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              {tags.length === 0 && <span className='field-hint'>Chưa có thể loại.</span>}
            </div>

            {selectedLabels.length > 0 && (
              <div className='field'>
                <span className='field-label'>Đã chọn</span>
                <div className='create-story-selected'>
                  {selectedLabels.map((item) => (
                    <span key={item.id} className='create-story-selected__chip'>
                      {item.label}
                      {item.type === 'tag' && (
                        <button
                          type='button'
                          className='create-story-selected__remove'
                          onClick={() => handleRemoveTag(item.id)}
                          aria-label={`Bỏ ${item.label}`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='create-story-form__actions'>
          <Button
            type='button'
            variant='ghost'
            className='create-story-form__cancel'
            onClick={() => navigate(-1)}
          >
            Hủy bỏ
          </Button>
          <Button type='submit' loading={loading} className='create-story-form__submit'>
            {isEditing ? 'Cập nhật truyện' : 'Tạo truyện ngay'}
          </Button>
        </div>
      </form>

      <div className='create-story-meta-cards'>
        <article className='create-story-meta-card'>
          <h4>
            <span className='create-story-meta-card__icon' aria-hidden='true'>
              <svg viewBox='0 0 24 24'>
                <path d='M12 2 4 5v6c0 5.2 3.4 10 8 11 4.6-1 8-5.8 8-11V5l-8-3Zm0 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm3.5 9h-7a3.5 3.5 0 0 1 7 0Z' />
              </svg>
            </span>
            Bản quyền
          </h4>
          <p>Hãy đảm bảo bạn sở hữu bản quyền hoặc có quyền đăng tải truyện này.</p>
        </article>
        <article className='create-story-meta-card'>
          <h4>
            <span className='create-story-meta-card__icon' aria-hidden='true'>
              <svg viewBox='0 0 24 24'>
                <path d='M12 5c5.5 0 9.8 4.6 10 4.8l.7.8-.7.8c-.2.2-4.5 4.8-10 4.8S2.2 11.6 2 11.4l-.7-.8.7-.8C2.2 9.6 6.5 5 12 5Zm0 3.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z' />
              </svg>
            </span>
            Kiểm duyệt
          </h4>
          <p>Truyện sẽ được phản hồi nhanh nếu tuân thủ đúng quy định cộng đồng.</p>
        </article>
        <article className='create-story-meta-card'>
          <h4>
            <span className='create-story-meta-card__icon' aria-hidden='true'>
              <svg viewBox='0 0 24 24'>
                <path d='M4 17h2.8l4-5 3 2.7 5.1-6.4L21 10V4h-6l2.5 2.3-3.9 4.8-3-2.6L6.1 14H4v3Z' />
              </svg>
            </span>
            Phát triển
          </h4>
          <p>Cập nhật chương mới thường xuyên để giữ chân độc giả và tăng thứ hạng.</p>
        </article>
      </div>
    </div>
  );
};

export default CreateStory;

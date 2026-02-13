import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import FileUpload from '../../components/FileUpload';
import Input from '../../components/Input';
import Select from '../../components/Select';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';

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
  const [tags, setTags] = useState([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedLabels, setSelectedLabels] = useState([]);

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
    <div className='page'>
      <h2>{isEditing ? 'Sửa truyện' : 'Tạo truyện mới'}</h2>
      {loadingStory && <p className='field-hint'>Đang tải dữ liệu...</p>}
      <form className='card form' onSubmit={handleSubmit}>
        <Input
          label='Tiêu đề'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder='Nhập tiêu đề truyện'
        />

        <Input
          label='Tóm tắt'
          as='textarea'
          rows='4'
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          error={errors.summary}
          placeholder='Tóm tắt nội dung'
        />

        <Select
          label='Trạng thái truyện'
          options={STORY_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          placeholder='Chọn trạng thái'
        />

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

        {kind === 'translated' && (
          <Input
            label='Tác giả gốc'
            value={originalAuthorName}
            onChange={(e) => setOriginalAuthorName(e.target.value)}
            error={errors.originalAuthorName}
            placeholder='Nhập tên tác giả gốc'
          />
        )}

        <Select
          label='Tình trạng'
          options={COMPLETION_STATUS_OPTIONS}
          value={completionStatus}
          onChange={setCompletionStatus}
          placeholder='Chọn tình trạng'
        />

        <FileUpload label='Ảnh bìa' onFileSelect={setCoverFile} />
        {existingCoverUrl && !coverFile && (
          <div className='file-preview'>
            <img src={existingCoverUrl} alt='cover' />
          </div>
        )}

        <Select
          label='Danh mục'
          options={tags}
          value={categoryId}
          onChange={setCategoryId}
          error={errors.category}
          placeholder='Chọn danh mục'
        />

        <div className='field'>
          <span className='field-label'>Thể loại</span>
          <div className='segment-ids' style={{ gap: '10px', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <button
                key={tag.value}
                type='button'
                className='chip'
                onClick={() => handleAddTag(String(tag.value))}
                style={{
                  border: tagIds.includes(String(tag.value))
                    ? '1px solid #3b82f6'
                    : '1px solid var(--border)',
                  background: tagIds.includes(String(tag.value)) ? '#1c2a3b' : '#141f2d',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
          {tags.length === 0 && <span className='field-hint'>Chưa có thể loại.</span>}
        </div>

        {selectedLabels.length > 0 && (
          <div className='field'>
            <span className='field-label'>Đã chọn</span>
            <div className='segment-ids'>
              {selectedLabels.map((item) => (
                <span key={item.id} className='chip'>
                  {item.label}
                  {item.type === 'tag' && (
                    <button
                      type='button'
                      onClick={() => handleRemoveTag(item.id)}
                      style={{
                        marginLeft: '6px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: 'inherit',
                      }}
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

        <div className='form-actions'>
          <Button type='submit' loading={loading}>
            {isEditing ? 'Cập nhật truyện' : 'Tạo truyện'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateStory;

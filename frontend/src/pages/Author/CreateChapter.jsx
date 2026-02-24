
﻿import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/editor.css';
import Button from '../../components/Button';
import Input from '../../components/Input';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import uploadService from '../../services/uploadService';
import { isEmptyHtml } from '../../utils/helpers';

const CHAPTER_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  archived: 'Lưu trữ',
};

const AUTOSAVE_INTERVAL_MS = 10_000;

const CreateChapter = () => {
  const { storyId, volumeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editChapterId = searchParams.get('chapterId');
  const { notify } = useNotify();
  const quillRef = useRef(null);

  const [title, setTitle] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceCoin, setPriceCoin] = useState('');
  const [status, setStatus] = useState('draft');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [chapterId, setChapterId] = useState(editChapterId || '');
  const [segmentIds, setSegmentIds] = useState([]);
  const [savedHtml, setSavedHtml] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [draftStatusText, setDraftStatusText] = useState('');
  const isEditing = Boolean(editChapterId);
  const autosaveInFlightRef = useRef(false);
  const hasManualSavedRef = useRef(false);
  const dirtyRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const draftCheckedRef = useRef(false);
  const applyingDraftRef = useRef(false);
  const apiBaseUrl = useMemo(
    () =>
      (import.meta.env.VITE_API_BASE || 'http://localhost:8081').replace(
        /\/$/,
        '',
      ),
    [],
  );

  const formatTime = useCallback((iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN');
  }, []);

  const getAuthToken = useCallback(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return '';
    try {
      return JSON.parse(raw)?.token || '';
    } catch {
      return '';
    }
  }, []);

  const getDraftKey = useCallback(
    (targetChapterId) =>
      targetChapterId
        ? `chapter-draft:${storyId}:${volumeId}:${targetChapterId}`
        : `chapter-draft:new:${storyId}:${volumeId}`,
    [storyId, volumeId],
  );

  const parseDraftSnapshot = useCallback((rawContent) => {
    if (!rawContent || typeof rawContent !== 'string') return null;
    try {
      const parsed = JSON.parse(rawContent);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        notify('Đang tải ảnh lên...', 'info');
        const url = await uploadService.uploadImage(file);
        if (!url) {
          notify('Tải ảnh thất bại', 'error');
          return;
        }
        const quill = quillRef.current?.getEditor();
        if (!quill) {
          notify('Editor chưa sẵn sàng', 'error');
          return;
        }
        const range = quill.getSelection(true);
        const insertIndex = range ? range.index : quill.getLength();
        quill.insertEmbed(insertIndex, 'image', url);
        quill.setSelection(insertIndex + 1);
      } catch (error) {
        console.error('uploadImage error', error);
        notify('Tải ảnh thất bại', 'error');
      }
    };
    input.click();
  }, [notify]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
        ],
        handlers: {
          image: () => handleImageUpload(),
        },
      },
    }),
    [handleImageUpload],
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'list',
    'bullet',
    'link',
    'image',
  ];

  const buildDraftSnapshot = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    const contentHtml = quill?.root?.innerHTML || content || '';
    const delta = quill?.getContents();
    return {
      title: title.trim(),
      isFree,
      priceCoin: isFree ? null : Number(priceCoin),
      status,
      contentHtml,
      contentDelta: delta ? JSON.stringify(delta) : '',
      savedAt: new Date().toISOString(),
    };
  }, [content, isFree, priceCoin, status, title]);

  const saveLocalDraft = useCallback(
    (targetChapterId, snapshot, source = 'fallback') => {
      const savedAt = new Date().toISOString();
      const key = getDraftKey(targetChapterId);
      const payload = { savedAt, source, payload: snapshot };
      localStorage.setItem(key, JSON.stringify(payload));
      setDraftStatusText(`Đã lưu nháp cục bộ lúc ${formatTime(savedAt)}`);
      return savedAt;
    },
    [formatTime, getDraftKey],
  );

  const clearLocalDraft = useCallback(
    (targetChapterId) => {
      const keys = new Set([getDraftKey(targetChapterId), getDraftKey('')]);
      keys.forEach((key) => localStorage.removeItem(key));
    },
    [getDraftKey],
  );

  const applyDraftSnapshot = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    applyingDraftRef.current = true;
    setTitle(snapshot.title || '');
    setIsFree(typeof snapshot.isFree === 'boolean' ? snapshot.isFree : true);
    setPriceCoin(
      snapshot.priceCoin !== null && snapshot.priceCoin !== undefined
        ? String(snapshot.priceCoin)
        : '',
    );
    if (typeof snapshot.status === 'string' && snapshot.status.trim()) {
      setStatus(snapshot.status.toLowerCase());
    }
    const html = snapshot.contentHtml || '';
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(html);
    }
    setContent(html);
    applyingDraftRef.current = false;
  }, []);

  const tryRestoreDraft = useCallback(
    async (targetChapterId) => {
      const localKey = getDraftKey(targetChapterId);
      const localRaw = localStorage.getItem(localKey);
      let localCandidate = null;

      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          const snapshot =
            parsed?.payload && typeof parsed.payload === 'object'
              ? parsed.payload
              : parseDraftSnapshot(parsed?.payload);
          const ts = Date.parse(parsed?.savedAt || snapshot?.savedAt || '');
          if (snapshot) {
            localCandidate = {
              source: 'local',
              snapshot,
              updatedAt:
                !Number.isNaN(ts) && ts > 0
                  ? new Date(ts).toISOString()
                  : snapshot.savedAt || null,
              ts: !Number.isNaN(ts) ? ts : 0,
            };
          }
        } catch {
          // ignore invalid local draft
        }
      }

      let serverCandidate = null;
      if (targetChapterId) {
        try {
          const response = await storyService.getChapterDraft(
            storyId,
            volumeId,
            targetChapterId,
          );
          const data = response || {};
          if (data.hasDraft && typeof data.content === 'string') {
            const snapshot = parseDraftSnapshot(data.content);
            if (snapshot) {
              const ts = Date.parse(data.updatedAt || snapshot.savedAt || '');
              serverCandidate = {
                source: 'server',
                snapshot,
                updatedAt:
                  !Number.isNaN(ts) && ts > 0
                    ? new Date(ts).toISOString()
                    : snapshot.savedAt || null,
                ts: !Number.isNaN(ts) ? ts : 0,
              };
            }
          }
        } catch {
          // ignore server draft errors, local draft still usable
        }
      }

      const candidate = [serverCandidate, localCandidate]
        .filter(Boolean)
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];

      if (!candidate) return;

      const confirmMessage = `Phát hiện bản nháp ${
        candidate.source === 'server' ? 'trên server' : 'cục bộ'
      } lúc ${formatTime(candidate.updatedAt)}. Bạn có muốn khôi phục không?`;
      const shouldRestore = window.confirm(confirmMessage);
      if (!shouldRestore) return;

      applyDraftSnapshot(candidate.snapshot);
      dirtyRef.current = true;
      setDraftStatusText(
        `Đã khôi phục bản nháp ${
          candidate.source === 'server' ? 'từ server' : 'từ máy'
        } lúc ${formatTime(candidate.updatedAt)}`,
      );
    },
    [
      applyDraftSnapshot,
      formatTime,
      getDraftKey,
      parseDraftSnapshot,
      storyId,
      volumeId,
    ],
  );

  const persistDraft = useCallback(
    async ({ reason = 'autosave' } = {}) => {
      if (
        hasManualSavedRef.current ||
        !initialLoadDoneRef.current ||
        !dirtyRef.current
      ) {
        return;
      }
      const snapshot = buildDraftSnapshot();
      const hasMeaningfulContent =
        snapshot.title ||
        (snapshot.contentHtml && !isEmptyHtml(snapshot.contentHtml)) ||
        (!snapshot.isFree && snapshot.priceCoin);
      if (!hasMeaningfulContent) {
        return;
      }

      const targetChapterId = editChapterId || chapterId;
      if (!targetChapterId) {
        saveLocalDraft('', snapshot, 'local-only');
        dirtyRef.current = false;
        return;
      }

      const payload = {
        draftContent: JSON.stringify(snapshot),
        updatedAtClient: snapshot.savedAt,
      };

      try {
        const response = await storyService.saveChapterDraft(
          storyId,
          volumeId,
          targetChapterId,
          payload,
        );
        const data = response || {};
        if (data?.updatedAt) {
          setDraftStatusText(
            `Đã lưu nháp server lúc ${formatTime(data.updatedAt)}`,
          );
        } else {
          setDraftStatusText(`Đã lưu nháp server (${reason})`);
        }
        clearLocalDraft(targetChapterId);
        dirtyRef.current = false;
      } catch {
        saveLocalDraft(targetChapterId, snapshot, reason);
        dirtyRef.current = false;
      }
    },
    [
      buildDraftSnapshot,
      chapterId,
      clearLocalDraft,
      editChapterId,
      formatTime,
      saveLocalDraft,
      storyId,
      volumeId,
    ],
  );

  const flushDraftOnExit = useCallback(() => {
    if (
      hasManualSavedRef.current ||
      !initialLoadDoneRef.current ||
      !dirtyRef.current
    ) {
      return;
    }
    const snapshot = buildDraftSnapshot();
    const hasMeaningfulContent =
      snapshot.title ||
      (snapshot.contentHtml && !isEmptyHtml(snapshot.contentHtml)) ||
      (!snapshot.isFree && snapshot.priceCoin);
    if (!hasMeaningfulContent) return;

    const targetChapterId = editChapterId || chapterId;
    const savedAt = saveLocalDraft(targetChapterId || '', snapshot, 'exit');

    if (!targetChapterId) return;
    const token = getAuthToken();
    if (!token) return;

    const payload = {
      draftContent: JSON.stringify(snapshot),
      updatedAtClient: savedAt,
    };

    const draftUrl = `${apiBaseUrl}/api/stories/${storyId}/volumes/${volumeId}/chapters/${targetChapterId}/draft`;
    try {
      fetch(draftUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // ignore keepalive errors
    }

    if (navigator.sendBeacon) {
      try {
        const beaconUrl = `${apiBaseUrl}/api/stories/${storyId}/volumes/${volumeId}/chapters/${targetChapterId}/draft/beacon?token=${encodeURIComponent(token)}`;
        const body = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(beaconUrl, body);
      } catch {
        // ignore beacon errors
      }
    }
  }, [
    apiBaseUrl,
    buildDraftSnapshot,
    chapterId,
    editChapterId,
    getAuthToken,
    saveLocalDraft,
    storyId,
    volumeId,
  ]);

  useEffect(() => {
    if (quillRef.current) {
      setEditorReady(true);
    }
  }, []);

  // Load content immediately when editChapterId is available
  useEffect(() => {
    draftCheckedRef.current = false;
    initialLoadDoneRef.current = false;
    dirtyRef.current = false;
    hasManualSavedRef.current = false;
    setDraftStatusText('');
  }, [editChapterId, storyId, volumeId]);

  useEffect(() => {
    if (!editChapterId || !editorReady) return;
    const loadContent = async () => {
      try {
        setLoadingContent(true);
        applyingDraftRef.current = true;
        const response = await storyService.getChapterContent(
          storyId,
          editChapterId,
        );
        const data = response || {};
        setChapterId(editChapterId);
        setTitle(data.title ?? '');
        setIsFree(typeof data.isFree === 'boolean' ? data.isFree : true);
        setPriceCoin(
          data.priceCoin !== null && data.priceCoin !== undefined
            ? String(data.priceCoin)
            : '',
        );
        if (typeof data.status === 'string' && data.status.trim()) {
          setStatus(data.status.toLowerCase());
        }
        setSavedHtml(data.fullHtml || '');
        
        // Set content in editor when it's ready
        const setEditorContent = () => {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            if (data.contentDelta) {
              try {
                quill.setContents(JSON.parse(data.contentDelta));
                setContent(quill.root.innerHTML);
              } catch (err) {
                quill.clipboard.dangerouslyPasteHTML(data.fullHtml || '');
                setContent(data.fullHtml || '');
              }
            } else {
              quill.clipboard.dangerouslyPasteHTML(data.fullHtml || '');
              setContent(data.fullHtml || '');
            }
          } else {
            setTimeout(setEditorContent, 500);
          }
        };
        
        if (quillRef.current?.getEditor()) {
          setEditorContent();
        } else {
          setTimeout(setEditorContent, 500);
        }
        dirtyRef.current = false;
      } catch (error) {
        console.error('getChapterContent error', error);
        notify('Không tải được nội dung chapter', 'error');
      } finally {
        applyingDraftRef.current = false;
        setLoadingContent(false);
      }
    };
    loadContent();
  }, [editChapterId, notify, storyId]);

  useEffect(() => {
    if (!editorReady) return;
    if (draftCheckedRef.current) return;
    if (isEditing && loadingContent) return;

    draftCheckedRef.current = true;
    const targetChapterId = editChapterId || chapterId || '';
    Promise.resolve(tryRestoreDraft(targetChapterId)).finally(() => {
      initialLoadDoneRef.current = true;
    });
  }, [
    chapterId,
    editChapterId,
    editorReady,
    isEditing,
    loadingContent,
    tryRestoreDraft,
  ]);

  useEffect(() => {
    if (
      !initialLoadDoneRef.current ||
      applyingDraftRef.current ||
      hasManualSavedRef.current
    ) {
      return;
    }
    dirtyRef.current = true;
  }, [title, isFree, priceCoin, status, content]);

  useEffect(() => {
    if (!editorReady) return;
    const intervalId = window.setInterval(() => {
      if (autosaveInFlightRef.current) return;
      autosaveInFlightRef.current = true;
      Promise.resolve(persistDraft({ reason: 'autosave-10s' })).finally(() => {
        autosaveInFlightRef.current = false;
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [editorReady, persistDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (
        hasManualSavedRef.current ||
        !initialLoadDoneRef.current ||
        !dirtyRef.current
      ) {
        return;
      }
      flushDraftOnExit();
      event.preventDefault();
      event.returnValue = '';
    };

    const handlePageHide = () => {
      flushDraftOnExit();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [flushDraftOnExit]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handlePaste = (event) => {
      const items = event.clipboardData?.items || [];
      const hasImage = Array.from(items).some((item) =>
        item.type?.startsWith('image/'),
      );
      if (hasImage) {
        event.preventDefault();
        notify('Vui lòng dùng nút Upload ảnh', 'info');
      }
    };

    const handleDrop = (event) => {
      const files = event.dataTransfer?.files || [];
      const hasImage = Array.from(files).some((file) =>
        file.type?.startsWith('image/'),
      );
      if (hasImage) {
        event.preventDefault();
        notify('Vui lòng dùng nút Upload ảnh', 'info');
      }
    };

    quill.root.addEventListener('paste', handlePaste);
    quill.root.addEventListener('drop', handleDrop);

    return () => {
      quill.root.removeEventListener('paste', handlePaste);
      quill.root.removeEventListener('drop', handleDrop);
    };
  }, [notify]);

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Tiêu đề chapter là bắt buộc';
    const quill = quillRef.current?.getEditor();
    const html = quill?.root?.innerHTML || content;
    if (!html || isEmptyHtml(html)) {
      nextErrors.content = 'Nội dung không được để trống';
    }
    if (!isFree && (!priceCoin || Number(priceCoin) <= 0)) {
      nextErrors.priceCoin = 'Giá phải lớn hơn 0';
    }
    return nextErrors;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!volumeId) {
      notify('Thiếu thông tin volume để lưu chapter', 'error');
      return;
    }
    const targetChapterId = editChapterId || chapterId;
    if (isEditing && !targetChapterId) {
      notify('Không tìm thấy chapter để cập nhật', 'error');
      return;
    }
    try {
      setSaving(true);
      const quill = quillRef.current?.getEditor();
      const contentHtml = quill?.root?.innerHTML || content;
      const payload = {
        title: title.trim(),
        isFree,
        priceCoin: isFree ? null : Number(priceCoin),
        status,
        contentHtml,
        contentDelta: JSON.stringify(quill?.getContents() || {}),
      };
      const response = isEditing
        ? await storyService.updateChapter(
            storyId,
            volumeId,
            targetChapterId,
            payload,
          )
        : await storyService.createChapter(storyId, volumeId, payload);
      const data = response || {};
      const persistedChapterId = data.chapterId || targetChapterId || '';
      setChapterId(persistedChapterId);
      setSegmentIds(data.segmentIds || []);
      hasManualSavedRef.current = true;
      dirtyRef.current = false;
      clearLocalDraft(persistedChapterId);
      if (persistedChapterId) {
        try {
          await storyService.deleteChapterDraft(
            storyId,
            volumeId,
            persistedChapterId,
          );
        } catch {
          // ignore cleanup errors
        }
      }
      setDraftStatusText('');
      notify(
        isEditing ? 'Cập nhật chapter thành công' : 'Lưu chapter thành công',
        'success',
      );
      navigate(`/author/stories/${storyId}?tab=volumes&volumeId=${volumeId}`);
    } catch (error) {
      console.error('saveChapter error', error);
      notify(
        isEditing
          ? 'Không thể cập nhật chapter. Vui lòng thử lại.'
          : 'Không thể lưu chapter. Vui lòng thử lại.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewChapter = async () => {
    if (!chapterId) return;
    try {
      const response = await storyService.getChapterContent(storyId, chapterId);
      const data = response || {};
      setSavedHtml(data.fullHtml || '');
      notify('Đã tải nội dung chapter', 'success');
    } catch (error) {
      console.error('getChapterContent error', error);
      notify('Không tải được nội dung chapter', 'error');
    }
  };

  return (
    <div className='page story-detail__chapter-page'>
      <div className='page-header story-detail__chapter-header'>
        <h2 className='story-detail__chapter-title'>
          {isEditing ? 'Chỉnh sửa Chapter' : 'Tạo Chapter'}
        </h2>
      </div>

      <div className='card form story-detail__chapter-form'>
        <Input
          label='Tiêu đề Chapter'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder='Nhập tiêu đề chapter'
        />
        <div className='field'>
          <span className='field-label'>Miễn phí</span>
          <label className='switch'>
            <input
              type='checkbox'
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            <span>{isFree ? 'Miễn phí' : 'Trả phí'}</span>
          </label>
        </div>
        {!isFree && (
          <Input
            label='Giá (coin)'
            type='number'
            min='1'
            value={priceCoin}
            onChange={(e) => setPriceCoin(e.target.value)}
            error={errors.priceCoin}
          />
        )}
        <div className='field'>
          <span className='field-label'>Trạng thái chapter</span>
          <select
            className='field-input'
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value='draft'>Nháp</option>
            <option value='published'>Công khai</option>
            <option value='archived'>Lưu trữ</option>
          </select>
          <span className='field-hint'>
            Tình trạng hiện tại: {CHAPTER_STATUS_LABELS[status] || 'Nháp'}
          </span>
        </div>
        <div className='field'>
          <span className='field-label'>Nội dung</span>
          {errors.content && (
            <span className='field-error'>{errors.content}</span>
          )}
          <div className='editor-wrapper'>
            <ReactQuill
              ref={quillRef}
              theme='snow'
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder='Viết nội dung chapter...'
            />
          </div>
          <span className='field-hint'>
            Không hỗ trợ dán ảnh trực tiếp. Dùng nút Upload ảnh.
          </span>
        </div>
        <div className='form-actions'>
          <Button type='button' loading={saving} onClick={handleSave}>
            Lưu Chapter
          </Button>
          {loadingContent && (
            <span className='field-hint'>Đang tải nội dung...</span>
          )}
          {!loadingContent && draftStatusText && (
            <span className='field-hint'>{draftStatusText}</span>
          )}
        </div>
      </div>

      {segmentIds.length > 0 && (
        <div className='card'>
          <h3>Danh sách Segment ID</h3>
          <div className='segment-ids'>
            {segmentIds.map((id) => (
              <span key={id} className='chip'>
                {id}
              </span>
            ))}
          </div>
          <div className='form-actions'>
            <Button type='button' variant='ghost' onClick={handleViewChapter}>
              Xem Chapter
            </Button>
          </div>
        </div>
      )}

      </div>
  );
};

export default CreateChapter;

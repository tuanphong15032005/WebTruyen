import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import useNotify from '../../hooks/useNotify';
import api from '../../services/api';

const ReportChapterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const storyId = searchParams.get('storyId');
  const chapterId = searchParams.get('chapterId');

  const [chapterInfo, setChapterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    description: '',
  });

  const reportReasons = [
    'Vui lòng chọn',
    'Nội dung 18+ hoặc nhạy cảm',
    'Vi phạm bản quyền / reup trái phép',
    'Vi phạm thuần phong mỹ tục',
    'Nội dung bạo lực hoặc kích động',
    'Nội dung xúc phạm, thù địch',
    'Nội dung chống phá CHXHCN Việt Nam ',
    'Vấn đề khác',
  ];

  useEffect(() => {
    if (!storyId || !chapterId) {
      notify('Thiếu thông tin storyId hoặc chapterId', 'error');
      navigate(-1);
      return;
    }

    fetchChapterInfo();
  }, [storyId, chapterId]);

  const fetchChapterInfo = async () => {
    try {
      const response = await api.get(`/chapters/${chapterId}`);
      setChapterInfo(response);
    } catch (error) {
      console.error('Error fetching chapter info:', error);
      notify('Không thể tải thông tin chương', 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason || formData.reason === 'Vui lòng chọn') {
      notify('Vui lòng chọn lý do báo cáo', 'error');
      return;
    }

    if (formData.description && formData.description.length > 1000) {
      notify('Mô tả không được vượt quá 1000 ký tự', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await reportApi.submitReport({
        chapterId: parseInt(chapterId),
        reason: formData.reason,
        description: formData.description || null,
      });

      notify('Báo cáo đã được gửi. Cảm ơn bạn!', 'success');
      navigate(-1);
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể gửi báo cáo';
      notify(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!chapterInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Không thể tải thông tin chương</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Quay lại
          </button>
        </div>

        {/* Report Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle size={24} className="text-orange-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Báo cáo nội dung
            </h1>
            <p className="text-gray-600">
              Nếu bạn phát hiện nội dung vi phạm quy định của Trạm Đọc, vui lòng gửi báo cáo để chúng tôi kiểm tra.
            </p>
          </div>

          {/* Content being reported */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Báo cáo cho:</h3>
            <div className="text-gray-900">
              <div className="font-medium">{chapterInfo.storyTitle || 'Unknown Story'}</div>
              <div className="text-sm text-gray-600">
                Tập {chapterInfo.volumeNumber || chapterInfo.volumeId} – Chapter {chapterInfo.sequenceIndex || chapterInfo.id} – {chapterInfo.title || 'Untitled'}
              </div>
            </div>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Dropdown */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Lý do báo cáo *
              </label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              >
                {reportReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết (tùy chọn)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={1000}
                rows={4}
                placeholder="Hãy mô tả chi tiết vấn đề bạn gặp phải..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 ký tự
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.reason || formData.reason === 'Vui lòng chọn'}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportChapterPage;

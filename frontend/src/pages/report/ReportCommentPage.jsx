import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageSquare } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import useNotify from '../../hooks/useNotify';

const ReportCommentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const commentId = searchParams.get('commentId');
  const commentContent = searchParams.get('content') || 'Nội dung bình luận';
  const commentUsername = searchParams.get('username') || 'Người dùng';

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
    'Nội dung xúc phạm, thù địch hoặc ',
    'Nội dung chống phá CHXHCN Việt Nam ',
    'Spam hoặc quảng cáo',
    'Troll hoặc gây gổ',
    'Vấn đề khác',
  ];

  useEffect(() => {
    if (!commentId) {
      notify('Thiếu thông tin commentId', 'error');
      navigate(-1);
      return;
    }
  }, [commentId]);

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
        commentId: parseInt(commentId),
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
              Báo cáo bình luận
            </h1>
            <p className="text-gray-600">
              Nếu bạn phát hiện bình luận vi phạm quy định của Trạm Đọc, vui lòng gửi báo cáo để chúng tôi kiểm tra.
            </p>
          </div>

          {/* Content being reported */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MessageSquare size={16} className="mr-2" />
              Bình luận bị báo cáo:
            </h3>
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="font-medium text-blue-600">
                  {commentUsername}
                </div>
              </div>
              <div className="text-gray-900">
                {commentContent}
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

export default ReportCommentPage;

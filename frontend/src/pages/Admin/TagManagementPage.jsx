import React, { useState, useEffect } from 'react';
import { tagService } from '../../services/tagService';
import TagStats from '../../components/admin/TagStats';
import TagTable from '../../components/admin/TagTable';
import TagModal from '../../components/admin/TagModal';
import MergeModal from '../../components/admin/MergeModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { Search, Plus, GitMerge } from 'lucide-react';

const TagManagementPage = () => {
  const toast = useToast();
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    trending: 0,
    unused: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [modalError, setModalError] = useState('');
  const [allTagsForMerge, setAllTagsForMerge] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    tagId: null,
    tagName: ''
  });

  const fetchAllTags = async () => {
    try {
      // Fetch all tags without pagination for merge modal
      const response = await tagService.getTags(0, 100); // Reduced size to avoid timeout
      setAllTagsForMerge(response.content || []);
    } catch (error) {
      toast.error('Không thể tải danh sách tags. Vui lòng thử lại.');
    }
  };

  const fetchTags = async (page = pagination.page, size = pagination.size) => {
    try {
      setLoading(true);
      const response = await tagService.getTags(page, size);
      setTags(response.content || []);
      setPagination({
        page: response.number || 0,
        size: response.size || 10,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [trending, unused] = await Promise.all([
        tagService.getTrendingTags(),
        tagService.getUnusedTags()
      ]);
      
      setStats({
        total: pagination.totalElements,
        trending: trending.length || 0,
        unused: unused.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      fetchTags();
      return;
    }

    try {
      setLoading(true);
      const response = await tagService.searchTags(term);
      setTags(response || []);
    } catch (error) {
      console.error('Error searching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (data) => {
    try {
      await tagService.createTag(data);
      fetchTags();
      fetchStats();
      setShowTagModal(false);
      setModalError('');
      
      // Refresh all tags for merge modal after create
      setTimeout(async () => {
        await fetchAllTags();
      }, 300);
      
      toast.success('Tạo tag thành công!');
    } catch (error) {
      // Show error in modal instead of toast
      const errorMessage = error.response?.data?.message || 
                        (error.response?.status === 400 ? 'Tên tag đã tồn tại hoặc dữ liệu không hợp lệ' : 
                        'Có lỗi xảy ra khi tạo tag. Vui lòng thử lại.');
      setModalError(errorMessage);
    }
  };

  const handleUpdateTag = async (id, data) => {
    try {
      await tagService.updateTag(id, data);
      fetchTags();
      setShowTagModal(false);
      setEditingTag(null);
      setModalError('');
      
      // Refresh all tags for merge modal after update
      setTimeout(async () => {
        await fetchAllTags();
      }, 300);
      
      toast.success('Cập nhật tag thành công!');
    } catch (error) {
      // Show error in modal instead of toast
      const errorMessage = error.response?.data?.message || 
                        (error.response?.status === 400 ? 'Tên tag đã tồn tại hoặc dữ liệu không hợp lệ' : 
                        'Có lỗi xảy ra khi cập nhật tag. Vui lòng thử lại.');
      setModalError(errorMessage);
    }
  };

  const handleDeleteTag = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      tagId: id,
      tagName: name
    });
  };

  const confirmDeleteTag = async () => {
    try {
      await tagService.deleteTag(confirmDialog.tagId);
      fetchTags();
      fetchStats();
      
      // Refresh all tags for merge modal after delete
      setTimeout(async () => {
        await fetchAllTags();
      }, 300);
      
      setConfirmDialog({ isOpen: false, tagId: null, tagName: '' });
      toast.success('Xóa tag thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa tag. Vui lòng thử lại.');
    }
  };

  const cancelDeleteTag = () => {
    setConfirmDialog({ isOpen: false, tagId: null, tagName: '' });
  };

  const handleMergeTags = async (data) => {
    try {
      await tagService.mergeTags(data);
      fetchTags(); // Refresh current page tags
      fetchStats(); // Refresh stats
      
      // Add small delay to ensure backend has processed the merge
      setTimeout(async () => {
        await fetchAllTags(); // Refresh all tags for merge modal
      }, 500);
      
      setShowMergeModal(false);
      toast.success('Gộp tag thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gộp tag. Vui lòng thử lại.');
    }
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setModalError(''); // Clear error when opening modal
    setShowTagModal(true);
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setModalError(''); // Clear error when opening modal
    setShowTagModal(true);
  };

  const openMergeModal = async () => {
    await fetchAllTags(); // Fetch all tags for merge modal
    setShowMergeModal(true);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [pagination.totalElements]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="admin-tags-page p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Tags</h1>
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Thêm Tag
          </button>
          <button
            onClick={openMergeModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <GitMerge size={20} />
            Gộp Tags
          </button>
        </div>
      </div>

      <TagStats stats={stats} />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <TagTable
          tags={tags}
          loading={loading}
          onEdit={openEditModal}
          onDelete={(id) => {
            const tag = tags.find(t => t.id === id);
            handleDeleteTag(id, tag?.name || '');
          }}
        />

        {!searchTerm && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => fetchTags(pagination.page - 1)}
              disabled={pagination.page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <span className="px-4 py-2">
              Trang {pagination.page + 1} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchTags(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {showTagModal && (
        <TagModal
          tag={editingTag}
          error={modalError}
          onError={setModalError}
          onClose={() => {
            setShowTagModal(false);
            setEditingTag(null);
            setModalError('');
          }}
          onSubmit={editingTag ? (data) => handleUpdateTag(editingTag.id, data) : handleCreateTag}
        />
      )}

      {showMergeModal && (
        <MergeModal
          tags={allTagsForMerge}
          onClose={() => setShowMergeModal(false)}
          onSubmit={handleMergeTags}
        />
      )}

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={cancelDeleteTag}
          onConfirm={confirmDeleteTag}
          title="Xác nhận xóa tag"
          message={`Bạn có chắc chắn muốn xóa tag "${confirmDialog.tagName}"?`}
          confirmText="Xóa"
          cancelText="Hủy"
          type="danger"
        />
      )}
    </div>
  );
};

export default TagManagementPage;

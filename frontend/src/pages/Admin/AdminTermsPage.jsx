import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getAllTerms, deleteTerm } from '../../api/termApi';
import useNotify from '../../hooks/useNotify';
import TermFormModal from '../../components/TermFormModal';
import '../../styles/admin-terms.css';

const AdminTermsPage = () => {
  const { notify } = useNotify();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTermCode, setSelectedTermCode] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await getAllTerms();
      // The response is already the array, not nested in response.data
      setTerms(Array.isArray(response) ? response : (response.data || []));
    } catch (error) {
      console.error('Error fetching terms:', error);
      notify('Không thể tải danh sách terms', 'error');
      setTerms([]); // Ensure terms is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setModalMode('create');
    setSelectedTermCode(null);
    setShowModal(true);
  };

  const handleEdit = (termCode) => {
    setModalMode('edit');
    setSelectedTermCode(termCode);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTerm(deleteId);
      notify('Xóa term thành công', 'success');
      fetchTerms(); // Refresh list
      setShowConfirm(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting term:', error);
      notify('Không thể xóa term', 'error');
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
  };

  const handleModalSuccess = () => {
    fetchTerms();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-terms-page">
      <div className="page-header">
        <h1>Quản Lý Terms</h1>
        <button className="btn-primary" onClick={handleAddNew}>
          <Plus size={16} />
          Thêm Term Mới
        </button>
      </div>

      <div className="terms-table-container">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : !terms || terms.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có term nào</p>
            <button className="btn-primary" onClick={handleAddNew}>
              <Plus size={16} />
              Thêm Term Mới
            </button>
          </div>
        ) : (
          <table className="terms-table">
            <thead>
              <tr>
                <th>Term Code</th>
                <th>Title</th>
                <th>Updated At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.code}>
                  <td className="term-code">{term.code}</td>
                  <td className="term-title">{term.title}</td>
                  <td className="term-date">{formatDate(term.updatedAt)}</td>
                  <td className="term-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(term.code)}
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(term.code)}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TermFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        termCode={selectedTermCode}
        onSuccess={handleModalSuccess}
      />

      {/* Custom Confirm Popup */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Bạn có chắc chắn muốn xóa term "{deleteId}"?</h3>
            <div className="confirm-actions">
              <button onClick={cancelDelete} className="btn-cancel">Hủy</button>
              <button onClick={confirmDelete} className="btn-confirm-delete">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTermsPage;

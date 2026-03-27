import { useState, useEffect } from 'react';
import { Users, Search, Edit } from 'lucide-react';
import adminUserService from '../../services/adminUserService';
import { useToast } from '../../hooks/useToast';
import '../../styles/admin-content-moderation.css';

function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Available roles for selection (excluding ROOT/ADMIN if MOD is highest)
  const AVAILABLE_ROLES = [
    { code: 'MOD', label: 'Moderator' },
    { code: 'REVIEWER', label: 'Reviewer' },
    { code: 'AUTHOR', label: 'Tác giả' },
    { code: 'READER', label: 'Độc giả' },
  ];

  const fetchUsers = async (page = 0, search = searchTerm) => {
    setLoading(true);
    try {
      const response = await adminUserService.searchUsers({ username: search, page, size: 10 });
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.number || 0);
    } catch (error) {
      addToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Return empty results if it contains anything other than alphanumeric or underscore
      if (/[^a-zA-Z0-9_]/.test(searchTerm)) {
        setUsers([]);
        setTotalPages(1);
        return;
      }
      fetchUsers(0, searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (/[^a-zA-Z0-9_]/.test(searchTerm)) {
      setUsers([]);
      setTotalPages(1);
      return;
    }
    fetchUsers(0, searchTerm);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setSelectedRoles([]);
    setEditModalOpen(false);
  };

  const handleRoleToggle = (roleCode) => {
    setSelectedRoles((prev) => 
      prev.includes(roleCode)
        ? prev.filter((r) => r !== roleCode)
        : [...prev, roleCode]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    
    const updateId = selectedUser.id;
    const newRoles = [...selectedRoles];
    
    // Đóng modal ngay lập tức để người dùng không phải chờ
    closeEditModal();
    
    // Cập nhật giao diện TỨC THÌ (Optimistic UI Update) - Không bật màn hình Loading làm chớp/nháy bảng
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === updateId ? { ...u, roles: newRoles } : u
      )
    );

    try {
      // Gọi API chạy ngầm phía sau
      await adminUserService.updateUserRoles(updateId, newRoles);
      addToast('Cập nhật quyền thành công', 'success');
    } catch (error) {
      addToast(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật quyền', 'error');
      // Nếu có lỗi do đường truyền mạng, fetch lại list chuẩn từ server để rollback UI
      fetchUsers(currentPage, searchTerm);
    }
  };

  return (
    <div className="admin-moderation">
      <div className="admin-moderation__header">
        <div className="admin-moderation__title">
          <Users className="icon" size={24} />
          <h1>Quản lý Người Dùng</h1>
        </div>
        <p className="admin-moderation__subtitle">Tra cứu và phân quyền cho người dùng hệ thống</p>
      </div>

      <div className="admin-moderation__card admin-moderation__controls-card">
        <div className="admin-moderation__toolbar">
          <form className="admin-moderation__search" onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-moderation__search-input"
              style={{ padding: '8px 12px', border: '1px solid var(--theme-input-border, #ddd)', background: 'var(--theme-input-bg, #fff)', color: 'var(--theme-text-primary, #111827)', borderRadius: '4px', flex: 1 }}
            />
            <button type="submit" className="admin-moderation__btn" style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', visibility: 'hidden', position: 'absolute' }}>
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="admin-moderation__card admin-moderation__card--table">
        <div className="admin-moderation__grid">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th style={{ whiteSpace: 'nowrap' }}>Email</th>
                <th>Vai trò hiện tại</th>
                <th className="admin-moderation__col--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="admin-moderation__empty">Đang tải dữ liệu...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-moderation__empty">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{user.username}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{user.email || 'Chưa cập nhật'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <span key={role} style={{ background: 'var(--theme-surface-muted, #f3f4f6)', color: 'var(--theme-text-primary, #111827)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                              {role}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--theme-text-secondary, #9ca3af)', fontSize: '12px' }}>Không có</span>
                        )}
                      </div>
                    </td>
                    <td className="admin-moderation__col--actions">
                      <button
                        type="button"
                        className="admin-moderation__btn admin-moderation__btn--primary"
                        onClick={() => openEditModal(user)}
                        title="Chỉnh sửa quyền"
                        style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit size={16} /> Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder if needed */}
        {totalPages > 1 && (
          <div className="admin-moderation__pagination" style={{ display: 'flex', justifyContent: 'center', padding: '16px', gap: '8px' }}>
            <button 
              disabled={currentPage === 0} 
              onClick={() => fetchUsers(currentPage - 1)}
              style={{ padding: '6px 12px', border: '1px solid var(--theme-input-border, #ddd)', borderRadius: '4px', background: currentPage === 0 ? 'var(--theme-surface-muted, #f3f4f6)' : 'var(--theme-input-bg, white)', color: 'var(--theme-text-primary, #111827)', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
            >
              Trang trước
            </button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--theme-text-primary, #111827)' }}>{currentPage + 1} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages - 1} 
              onClick={() => fetchUsers(currentPage + 1)}
              style={{ padding: '6px 12px', border: '1px solid var(--theme-input-border, #ddd)', borderRadius: '4px', background: currentPage === totalPages - 1 ? 'var(--theme-surface-muted, #f3f4f6)' : 'var(--theme-input-bg, white)', color: 'var(--theme-text-primary, #111827)', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {editModalOpen && selectedUser && (
        <div className="admin-moderation__modal-backdrop" onClick={closeEditModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-moderation__modal" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', color: 'var(--theme-text-primary, #111827)' }}>Sửa quyền cho User</h2>
            <p style={{ color: 'var(--theme-text-secondary, #4b5563)', marginBottom: '20px', fontSize: '14px' }}>
              Username: <strong style={{color: 'var(--theme-text-primary, #111827)'}}>{selectedUser.username}</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', color: 'var(--theme-text-primary, #111827)' }}>
              {AVAILABLE_ROLES.map((role) => (
                <label key={role.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.code)}
                    onChange={() => handleRoleToggle(role.code)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '15px' }}>{role.code} <span style={{ color: 'var(--theme-text-secondary, #6b7280)', fontSize: '13px' }}>({role.label})</span></span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={closeEditModal}
                style={{ padding: '8px 16px', border: '1px solid var(--theme-input-border, #d1d5db)', background: 'var(--theme-input-bg, white)', color: 'var(--theme-text-primary, #111827)', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleSaveRoles}
                style={{ padding: '8px 16px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserRoleManagement;

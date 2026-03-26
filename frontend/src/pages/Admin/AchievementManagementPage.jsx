import React, { useState, useEffect } from 'react';
import adminAchievementApi from '../../services/adminAchievementApi';
import useNotify from '../../hooks/useNotify';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Target,
  BarChart3,
  Settings,
  Save,
  X,
  Search,
  Lock
} from 'lucide-react';

const AchievementManagementPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAchievements, setExpandedAchievements] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [editingTier, setEditingTier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // 'active', 'inactive', or null
  const [tierRestrictions, setTierRestrictions] = useState({});
  const [loadingRestrictions, setLoadingRestrictions] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: ''
  });
  const { notify } = useNotify();

  // Form states
  const [achievementForm, setAchievementForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'READING',
    isActive: true
  });

  const [tierForm, setTierForm] = useState({
    tierLevel: 1,
    requirement: 1,
    name: '',
    description: '',
    code: '',
    rewardCoin: 0,
    rewardCoinType: 'A',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [achievementsData, statsData] = await Promise.all([
        adminAchievementApi.getAllAchievements(),
        adminAchievementApi.getAchievementStats()
      ]);
      // Đảm bảo achievements luôn là mảng
      setAchievements(Array.isArray(achievementsData) ? achievementsData : []);
      setStats(statsData);
      
      // Update selectedAchievement with fresh data if it exists
      if (selectedAchievement) {
        const updatedAchievement = achievementsData.find(a => a.id === selectedAchievement.id);
        if (updatedAchievement) {
          setSelectedAchievement(updatedAchievement);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      notify('Lỗi tải dữ liệu', 'error');
      setAchievements([]); // Đặt về mảng rỗng khi có lỗi
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (achievementId) => {
    setExpandedAchievements(prev => ({
      ...prev,
      [achievementId]: !prev[achievementId]
    }));
  };

  const fetchTiersForAchievement = async (achievementId) => {
    try {
      setLoadingRestrictions(true);
      const tiersData = await adminAchievementApi.getTiersByAchievement(achievementId);
      setTiers(Array.isArray(tiersData) ? tiersData : []);
      
      // Fetch restrictions for each tier
      const restrictionsPromises = tiersData.map(async (tier) => {
        try {
          const restriction = await adminAchievementApi.getTierRestrictions(tier.id);
          return { [tier.id]: restriction };
        } catch (error) {
          console.error(`Error fetching restrictions for tier ${tier.id}:`, error);
          return { [tier.id]: { canEdit: true, canDelete: true } };
        }
      });
      
      const restrictionsResults = await Promise.all(restrictionsPromises);
      const newRestrictions = restrictionsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setTierRestrictions(newRestrictions);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      notify('Lỗi tải tiers', 'error');
      setTiers([]);
      setTierRestrictions({});
    } finally {
      setLoadingRestrictions(false);
    }
  };

  const handleSelectAchievement = async (achievement) => {
    // Nếu achievement đã được chọn, deselect và tắt tiers
    if (selectedAchievement && selectedAchievement.id === achievement.id) {
      setSelectedAchievement(null);
      setTiers([]);
      setTierRestrictions({});
      return;
    }
    
    // Nếu chưa chọn hoặc chọn achievement khác, hiển thị tiers
    setSelectedAchievement(achievement);
    await fetchTiersForAchievement(achievement.id);
  };

  const handleCreateAchievement = async () => {
    try {
      await adminAchievementApi.createAchievement(achievementForm);
      notify('Tạo thành công!', 'success');
      setShowCreateModal(false);
      resetAchievementForm();
      fetchData();
    } catch (error) {
      console.error('Error creating achievement:', error);
      notify(error.response?.data?.message || 'Lỗi tạo thành tựu', 'error');
    }
  };

  const handleUpdateAchievement = async () => {
    try {
      console.log('Updating achievement with data:', achievementForm);
      await adminAchievementApi.updateAchievement(editingAchievement.id, achievementForm);
      notify('Cập nhật thành công!', 'success');
      setEditingAchievement(null);
      resetAchievementForm();
      
      // If the updated achievement is currently selected, refresh its tiers
      if (selectedAchievement && selectedAchievement.id === editingAchievement.id) {
        try {
          const tiersData = await adminAchievementApi.getTiersByAchievement(editingAchievement.id);
          setTiers(Array.isArray(tiersData) ? tiersData : []);
        } catch (error) {
          console.error('Error refreshing tiers:', error);
          setTiers([]);
        }
      }
      
      fetchData(); // Refresh achievements list and stats
    } catch (error) {
      console.error('Error updating achievement:', error);
      notify(error.response?.data?.message || 'Lỗi cập nhật thành tựu', 'error');
    }
  };

  const handleDeleteAchievement = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa thành tựu này?',
      confirmText: 'Xóa',
      onConfirm: () => deleteAchievement(id)
    });
  };

  const deleteAchievement = async (id) => {
    try {
      await adminAchievementApi.deleteAchievement(id);
      notify('Xóa thành công!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      notify('Lỗi xóa thành tựu', 'error');
    }
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, type: '' });
  };

  const handleCreateTier = async () => {
    try {
      await adminAchievementApi.createTier(selectedAchievement.id, tierForm);
      notify('Tạo tier thành công!', 'success');
      setShowTierModal(false);
      resetTierForm();
      await fetchTiersForAchievement(selectedAchievement.id); // Refresh tiers
    } catch (error) {
      console.error('Error creating tier:', error);
      notify(error.response?.data?.message || 'Lỗi tạo tier', 'error');
    }
  };

  const handleUpdateTier = async () => {
    try {
      await adminAchievementApi.updateTier(editingTier.id, tierForm);
      notify('Cập nhật tier thành công!', 'success');
      setEditingTier(null);
      resetTierForm();
      await fetchTiersForAchievement(selectedAchievement.id); // Refresh tiers
    } catch (error) {
      console.error('Error updating tier:', error);
      // Hiển thị thông báo lỗi cụ thể từ backend
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi cập nhật tier';
      notify(errorMessage, 'error');
    }
  };

  const handleDeleteTier = async (tierId) => {
    // Check if tier can be deleted
    const restrictions = tierRestrictions[tierId];
    if (restrictions && !restrictions.canDelete) {
      notify(restrictions.reason || 'Không thể xóa tier này', 'error');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa tier này?',
      confirmText: 'Xóa',
      onConfirm: () => deleteTier(tierId)
    });
  };

  const deleteTier = async (tierId) => {
    try {
      await adminAchievementApi.deleteTier(tierId);
      notify('Xóa tier thành công!', 'success');
      await fetchTiersForAchievement(selectedAchievement.id); // Refresh tiers
    } catch (error) {
      console.error('Error deleting tier:', error);
      // Hiển thị thông báo lỗi cụ thể từ backend
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi xóa tier';
      notify(errorMessage, 'error');
    }
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, type: '' });
  };

  const resetAchievementForm = () => {
    setAchievementForm({
      code: '',
      name: '',
      description: '',
      category: 'READING',
      isActive: true
    });
  };

  const resetTierForm = () => {
    setTierForm({
      tierLevel: 1,
      requirement: 1,
      name: '',
      description: '',
      code: '',
      rewardCoin: 0,
      rewardCoinType: 'A',
      isActive: true
    });
  };

  const openEditAchievement = (achievement) => {
    setEditingAchievement(achievement);
    setAchievementForm({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      isActive: achievement.isActive
    });
  };

  const openEditTier = (tier) => {
    // Check if tier can be edited
    const restrictions = tierRestrictions[tier.id];
    if (restrictions && !restrictions.canEdit) {
      notify(restrictions.reason || 'Không thể sửa tier này', 'error');
      return;
    }
    
    setEditingTier(tier);
    setTierForm({
      tierLevel: tier.tierLevel,
      requirement: tier.requirement,
      name: tier.name,
      description: tier.description,
      code: tier.code,
      rewardCoin: tier.rewardCoin,
      rewardCoinType: tier.rewardCoinType,
      isActive: tier.isActive
    });
  };

  const filteredAchievements = achievements.filter(achievement => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      achievement.name.toLowerCase().includes(searchLower) ||
      achievement.code.toLowerCase().includes(searchLower) ||
      achievement.category.toLowerCase().includes(searchLower) ||
      achievement.description.toLowerCase().includes(searchLower)
    );
    
    const matchesActiveFilter = activeFilter === null || 
      (activeFilter === 'active' && achievement.isActive) ||
      (activeFilter === 'inactive' && !achievement.isActive);
    
    return matchesSearch && matchesActiveFilter;
  });

  if (loading) {
    return (
      <div className="admin-achievements-page w-full overflow-x-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-full">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-achievements-page w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Quản lý Thành tựu</h1>
            <p className="text-gray-600 text-sm sm:text-base">Quản lý hệ thống thành tựu và phần thưởng</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Plus size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Tạo Thành tựu</span>
            <span className="sm:hidden">Tạo</span>
          </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tổng thành tựu</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalAchievements}</p>
              </div>
              <Trophy className="text-blue-600 sm:w-6 sm:h-6" size={20} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Đang hoạt động</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.activeAchievements}</p>
              </div>
              <Target className="text-green-600 sm:w-6 sm:h-6" size={20} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Không hoạt động</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.inactiveAchievements || 0}</p>
              </div>
              <BarChart3 className="text-gray-600 sm:w-6 sm:h-6" size={20} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Achievements List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Danh sách Thành tựu</h2>
          </div>
          <div className="p-3 sm:p-4 border-b">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, code, category hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter(activeFilter === 'active' ? null : 'active')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hoạt động
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === 'inactive' ? null : 'inactive')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeFilter === 'inactive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Không hoạt động
              </button>
            </div>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredAchievements && filteredAchievements.length > 0 ? (
              filteredAchievements.map((achievement) => (
                <div key={achievement.id} className="p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{achievement.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                          achievement.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {achievement.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">Code: {achievement.code} | Category: {achievement.category}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSelectAchievement(achievement)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem tiers"
                      >
                        <Settings size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => openEditAchievement(achievement)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Sửa"
                      >
                        <Edit size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
                <p>{searchTerm ? 'Không tìm thấy thành tựu nào phù hợp' : 'Chưa có thành tựu nào'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tiers Management */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {selectedAchievement ? `Tiers: ${selectedAchievement.name}` : 'Chọn thành tựu để xem tiers'}
              </h2>
              {selectedAchievement && (
                <button
                  onClick={() => setShowTierModal(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex-shrink-0"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Thêm Tier</span>
                </button>
              )}
            </div>
          </div>
          {selectedAchievement ? (
            <div className="divide-y max-h-96 overflow-y-auto">
              {/* Information banner */}
              <div className="p-3 bg-blue-50 border-b">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Tier sẽ bị vô hiệu hóa sửa/xóa khi có người dùng đã đạt đến mức yêu cầu của tier đó hoặc đã nhận thưởng. Các tier cao hơn vẫn có thể sửa/xóa bình thường.
                </p>
              </div>
              <div className="divide-y">
                {tiers && tiers.length > 0 ? (
                  tiers.map((tier) => (
                  <div key={tier.id} className="p-3 sm:p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm sm:text-base">Level {tier.tierLevel}</span>
                          <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">{tier.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            tier.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tier.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tier.description}</p>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                          <span>Yêu cầu: {tier.requirement}</span>
                          <span>Thưởng: {tier.rewardCoin} coin {tier.rewardCoinType}</span>
                          {tierRestrictions[tier.id]?.usersReachedThisTier > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              {tierRestrictions[tier.id].usersReachedThisTier} người dùng đã đạt
                            </span>
                          )}
                          {tierRestrictions[tier.id]?.hasClaims && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Đã có người nhận
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {loadingRestrictions ? (
                          <>
                            <div className="p-1.5 sm:p-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                            <div className="p-1.5 sm:p-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditTier(tier)}
                              className={`p-1.5 sm:p-2 rounded transition-colors flex items-center gap-1 ${
                                tierRestrictions[tier.id]?.canEdit
                                  ? 'text-blue-600 hover:bg-blue-50'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={tierRestrictions[tier.id]?.canEdit ? 'Sửa' : tierRestrictions[tier.id]?.reason || 'Không thể sửa'}
                              disabled={!tierRestrictions[tier.id]?.canEdit}
                            >
                              {tierRestrictions[tier.id]?.canEdit ? (
                                <Edit size={14} className="sm:w-4 sm:h-4" />
                              ) : (
                                <Lock size={14} className="sm:w-4 sm:h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteTier(tier.id)}
                              className={`p-1.5 sm:p-2 rounded transition-colors flex items-center gap-1 ${
                                tierRestrictions[tier.id]?.canDelete
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={tierRestrictions[tier.id]?.canDelete ? 'Xóa' : tierRestrictions[tier.id]?.reason || 'Không thể xóa'}
                              disabled={!tierRestrictions[tier.id]?.canDelete}
                            >
                              {tierRestrictions[tier.id]?.canDelete ? (
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              ) : (
                                <Lock size={14} className="sm:w-4 sm:h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Chưa có tier nào cho thành tựu này</p>
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Chọn một thành tựu để quản lý tiers</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Create/Edit Modal */}
      {(showCreateModal || editingAchievement) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingAchievement ? 'Sửa Thành tựu' : 'Tạo Thành tựu Mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={achievementForm.code}
                  onChange={(e) => setAchievementForm({...achievementForm, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: READ_CHAPTERS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  type="text"
                  value={achievementForm.name}
                  onChange={(e) => setAchievementForm({...achievementForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Đọc Chương"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Mô tả thành tựu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={achievementForm.category}
                  onChange={(e) => setAchievementForm({...achievementForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="READING">Đọc truyện</option>
                  <option value="COMMENTING">Bình luận</option>
                  <option value="WRITING">Viết truyện</option>
                  <option value="SOCIAL">Xã hội</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={achievementForm.isActive}
                  onChange={(e) => setAchievementForm({...achievementForm, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Đang hoạt động</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAchievement(null);
                  resetAchievementForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={editingAchievement ? handleUpdateAchievement : handleCreateAchievement}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {editingAchievement ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Create/Edit Modal */}
      {(showTierModal || editingTier) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingTier ? 'Sửa Tier' : 'Tạo Tier Mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Level</label>
                <input
                  type="number"
                  value={tierForm.tierLevel}
                  onChange={(e) => setTierForm({...tierForm, tierLevel: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu</label>
                <input
                  type="number"
                  value={tierForm.requirement}
                  onChange={(e) => setTierForm({...tierForm, requirement: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  type="text"
                  value={tierForm.name}
                  onChange={(e) => setTierForm({...tierForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Người mới bắt đầu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={tierForm.description}
                  onChange={(e) => setTierForm({...tierForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Mô tả tier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={tierForm.code}
                  onChange={(e) => setTierForm({...tierForm, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: BEGINNER"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thưởng Coin</label>
                <input
                  type="number"
                  value={tierForm.rewardCoin}
                  onChange={(e) => setTierForm({...tierForm, rewardCoin: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Coin</label>
                <select
                  value={tierForm.rewardCoinType}
                  onChange={(e) => setTierForm({...tierForm, rewardCoinType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Coin A</option>
                  <option value="B">Coin B</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tierIsActive"
                  checked={tierForm.isActive}
                  onChange={(e) => setTierForm({...tierForm, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="tierIsActive" className="text-sm text-gray-700">Đang hoạt động</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTierModal(false);
                  setEditingTier(null);
                  resetTierForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={editingTier ? handleUpdateTier : handleCreateTier}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {editingTier ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      
      {/* Confirm Action Modal */}
      {confirmModal.isOpen && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText || 'Xóa'}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, type: '' })}
          onConfirm={confirmModal.onConfirm}
        />
      )}
  </div>
);
};

export default AchievementManagementPage;

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import dailyMissionAdminApi from '../../services/dailyMissionAdminApi';

const DailyMissionManagement = () => {
  const [missions, setMissions] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  
  // Template management states
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' or 'templates'
  const [templateLoading, setTemplateLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Custom modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState({
    title: '',
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  // Form states
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    missionCode: 'DAILY_LOGIN',
    description: '',
    target: '1',
    rewardCoin: 10,
    rewardCoinType: 'A',
  });
  const [existingMissionCodes, setExistingMissionCodes] = useState([]);

  // Helper function to show custom alert modal
  const showAlert = (title, message, type = 'info') => {
    setAlertModalContent({
      title,
      message,
      type
    });
    setShowAlertModal(true);
  };

  // Helper function to show confirmation modal
  const showConfirm = (title, message, onConfirm) => {
    setAlertModalContent({
      title,
      message,
      type: 'confirm',
      onConfirm
    });
    setShowAlertModal(true);
  };

  // Mission code options with recommended rewards
  const missionCodeOptions = [
    { value: 'DAILY_LOGIN', label: 'Đăng nhập hàng ngày', recommendedReward: 10 },
    { value: 'READ_CHAPTERS', label: 'Đọc chương', recommendedReward: 20 },
    { value: 'UNLOCK_CHAPTER', label: 'Mở khóa chương', recommendedReward: 15 },
    { value: 'MAKE_COMMENTS', label: 'Bình luận', recommendedReward: 10 },
    { value: 'MAKE_DONATION', label: 'Donate', recommendedReward: 50 },
    { value: 'MAKE_TOPUP', label: 'Nạp tiền', recommendedReward: 100 },
  ];

  // Load data
  useEffect(() => {
    if (activeTab === 'missions') {
      loadMissions();
      loadAvailableDates();
      loadStats();
      loadExistingMissionCodes();
    } else if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [selectedDate, activeTab]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await dailyMissionAdminApi.getMissionsByDateWithStats(selectedDate);
      setMissions(data);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const data = await dailyMissionAdminApi.getAvailableDates();
      setAvailableDates(data);
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await dailyMissionAdminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadExistingMissionCodes = async () => {
    try {
      const data = await dailyMissionAdminApi.getMissionsByDateWithStats(selectedDate);
      const codes = data.map(mission => mission.missionCode);
      setExistingMissionCodes(codes);
    } catch (error) {
      console.error('Error loading existing mission codes:', error);
    }
  };

  const handleUpdateMission = async () => {
    // Validate form data
    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả nhiệm vụ');
      return;
    }
    if (!formData.target.trim()) {
      alert('Vui lòng nhập mục tiêu nhiệm vụ');
      return;
    }
    if (!formData.rewardCoin || formData.rewardCoin <= 0) {
      alert('Phần thưởng phải lớn hơn 0');
      return;
    }

    try {
      await dailyMissionAdminApi.updateMission(editingMission.id, formData);
      setShowCreateModal(false);
      setEditingMission(null);
      resetForm();
      loadMissions();
      loadExistingMissionCodes(); // Reload existing codes
    } catch (error) {
      console.error('Error updating mission:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Không thể cập nhật nhiệm vụ. Vui lòng thử lại.';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      missionCode: 'DAILY_LOGIN',
      description: '',
      target: '1',
      rewardCoin: 10,
      rewardCoinType: 'A',
    });
  };

  const handleGenerateMissions = async () => {
    // First check if missions already exist for this date
    const existingMissions = missions.filter(mission => mission.date === selectedDate);
    const existingCount = existingMissions.length;
    
    if (existingCount === 0) {
      // Case 1: No missions exist - create all 6
      showConfirm(
        'Tạo nhiệm vụ mới',
        `Bạn có chắc chắn muốn tạo tự động tất cả nhiệm vụ cho ngày ${selectedDate}?`,
        async () => {
          await generateMissions();
        }
      );
    } else if (existingCount >= 6) {
      // Case 2: Already have 6+ missions - ask if want to update from templates
      showConfirm(
        'Cập nhật từ Template',
        `Đã có đủ ${existingCount} nhiệm vụ cho ngày ${selectedDate}. Bạn có muốn cập nhật các nhiệm vụ chưa có ai làm theo template không? Các nhiệm vụ đang có người làm sẽ được giữ nguyên.`,
        async () => {
          await regenerateMissions();
        }
      );
    } else {
      // Case 3: Have some missions but less than 6 - create missing ones
      showConfirm(
        'Tạo nhiệm vụ thiếu',
        `Đã có ${existingCount} nhiệm vụ cho ngày ${selectedDate}. Bạn có chắc chắn muốn tạo thêm ${6 - existingCount} nhiệm vụ còn thiếu không?`,
        async () => {
          await generateMissions();
        }
      );
    }
  };

  const generateMissions = async () => {
    try {
      const response = await dailyMissionAdminApi.generateMissionsForDate(selectedDate);
      console.log('Generate missions response:', response);
      
      if (response && response.message) {
        // Show appropriate message based on action type
        if (response.actionType === 'created_all') {
          showAlert('Thành công', response.message, 'success');
        } else if (response.actionType === 'added_missing') {
          showAlert('Thành công', response.message, 'success');
        } else if (response.actionType === 'already_complete') {
          showAlert('Thông tin', response.message, 'info');
        } else {
          showAlert('Thành công', response.message, 'success');
        }
      } else {
        showAlert('Thành công', 'Đã xử lý yêu cầu tạo nhiệm vụ', 'success');
      }
      
      loadMissions();
      loadExistingMissionCodes(); // Reload existing codes
    } catch (error) {
      console.error('Error generating missions:', error);
      console.error('Error response:', error.response);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Không thể tạo nhiệm vụ. Vui lòng thử lại.';
      showAlert('Lỗi', errorMessage, 'error');
    }
  };

  const regenerateMissions = async () => {
    try {
      const response = await dailyMissionAdminApi.regenerateMissionsFromTemplates(selectedDate);
      console.log('Regenerate missions response:', response);
      
      if (response && response.message) {
        showAlert('Thành công', response.message, 'success');
      } else {
        showAlert('Thành công', 'Đã cập nhật nhiệm vụ từ template', 'success');
      }
      
      loadMissions();
      loadExistingMissionCodes(); // Reload existing codes
    } catch (error) {
      console.error('Error regenerating missions:', error);
      console.error('Error response:', error.response);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Không thể cập nhật nhiệm vụ từ template. Vui lòng thử lại.';
      showAlert('Lỗi', errorMessage, 'error');
    }
  };

  const handleDeleteMission = async (missionId) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa nhiệm vụ này không? Hành động này không thể hoàn tác.',
      async () => {
        try {
          await dailyMissionAdminApi.deleteMission(missionId);
          showAlert('Thành công', 'Đã xóa nhiệm vụ thành công', 'success');
          loadMissions();
          loadExistingMissionCodes(); // Reload existing codes
        } catch (error) {
          console.error('Error deleting mission:', error);
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.message || 
                              error.message || 
                              'Không thể xóa nhiệm vụ. Vui lòng thử lại.';
          showAlert('Lỗi', errorMessage, 'error');
        }
      }
    );
  };

  const handleBatchDeleteMissions = async () => {
    const missionsWithoutProgress = missions.filter(mission => !mission.hasProgress);
    
    if (missionsWithoutProgress.length === 0) {
      showAlert('Thông tin', 'Không có nhiệm vụ nào chưa có người làm để xóa', 'info');
      return;
    }

    showConfirm(
      'Xác nhận xóa hàng loạt',
      `Bạn có chắc chắn muốn xóa ${missionsWithoutProgress.length} nhiệm vụ chưa có người làm không? Hành động này không thể hoàn tác.`,
      async () => {
        try {
          console.log('Calling batch delete API for date:', selectedDate);
          const response = await dailyMissionAdminApi.batchDeleteMissionsWithoutProgress(selectedDate);
          console.log('Batch delete response:', response);
          
          // Handle response safely - check if response exists and has message
          let message = 'Đã xóa nhiệm vụ thành công';
          if (response) {
            if (typeof response === 'object' && response !== null) {
              message = response.message || message;
              console.log('Response message:', message);
            } else if (typeof response === 'string') {
              message = response;
            }
          } else {
            console.log('Response is undefined or null');
          }
          
          showAlert('Thành công', message, 'success');
          loadMissions();
          loadExistingMissionCodes(); // Reload existing codes
        } catch (error) {
          console.error('Error batch deleting missions:', error);
          console.error('Error response:', error.response);
          
          // Handle error message safely
          let errorMessage = 'Không thể xóa nhiệm vụ hàng loạt. Vui lòng thử lại.';
          if (error.response && error.response.data) {
            errorMessage = error.response.data.error || error.response.data.message || errorMessage;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          showAlert('Lỗi', errorMessage, 'error');
        }
      }
    );
  };

  const openEditModal = (mission) => {
    setEditingMission(mission);
    setFormData({
      date: mission.date,
      missionCode: mission.missionCode,
      description: mission.description,
      target: mission.target.toString(),
      rewardCoin: mission.rewardCoin,
      rewardCoinType: mission.rewardCoinType,
    });
    setShowCreateModal(true);
  };

  // Template management functions
  const loadTemplates = async () => {
    try {
      setTemplateLoading(true);
      const data = await dailyMissionAdminApi.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      missionCode: template.missionCode,
      description: template.description,
      target: template.target.toString(),
      rewardCoin: template.rewardCoin,
      rewardCoinType: template.rewardCoinType,
    });
    setShowCreateModal(true);
  };

  const handleUpdateTemplate = async () => {
    showConfirm(
      'Lưu ý quan trọng',
      '⚠️ Thay đổi template này sẽ chỉ có hiệu lực từ NGÀY MAI. Nhiệm vụ của HÔM NAY sẽ giữ nguyên như cũ. Bạn có chắc chắn muốn tiếp tục?',
      async () => {
        try {
          await dailyMissionAdminApi.updateTemplate(editingTemplate.id, formData);
          setShowCreateModal(false);
          setEditingTemplate(null);
          resetForm();
          loadTemplates();
          showAlert('Thành công', 'Template đã được cập nhật. Thay đổi sẽ áp dụng từ ngày mai.', 'success');
        } catch (error) {
          console.error('Error updating template:', error);
          showAlert('Lỗi', error.response?.data?.error || 'Không thể cập nhật template. Vui lòng thử lại.', 'error');
        }
      }
    );
  };

  return (
    <div className="admin-daily-page p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Nhiệm vụ Hàng ngày</h1>
        <p className="text-gray-600">Quản lý và theo dõi các nhiệm vụ hàng ngày của người dùng</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'missions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Nhiệm vụ theo ngày
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <>
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={handleGenerateMissions}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Tự động tạo và cập nhật nhiệm vụ
                </button>
                <button
                  onClick={handleBatchDeleteMissions}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Xóa hàng loạt nhiệm vụ chưa có người làm
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Tổng nhiệm vụ</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMissions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Đang thực hiện</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressMissions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Đã hoàn thành</h3>
                <p className="text-2xl font-bold text-green-600">{stats.completedMissions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Tỷ lệ hoàn thành</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
              </div>
            </div>
          )}

          {/* Missions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nhiệm vụ ngày {selectedDate}</h2>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã nhiệm vụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mục tiêu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phần thưởng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số user hoàn thành
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng coin đã phát
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {missions.map((mission) => (
                      <tr key={mission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {mission.missionCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {mission.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mission.target}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            mission.rewardCoinType === 'A' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {mission.rewardCoin} {mission.rewardCoinType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(mission.completedUsers / mission.totalUsers) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {mission.completedUsers}/{mission.totalUsers}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-green-600">
                            {mission.totalCoinsDistributed || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {mission.hasProgress ? (
                            <span className="text-gray-400 italic">Đã có người làm</span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(mission)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteMission(mission.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {missions.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    Không có nhiệm vụ nào cho ngày này. Nhấn "Tự động tạo nhiệm vụ cho ngày" để tạo 6 nhiệm vụ mặc định.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Templates Nhiệm vụ</h2>
            </div>
          </div>
          
          {templateLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải templates...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã nhiệm vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mục tiêu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phần thưởng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại Coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {template.missionCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {template.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {template.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {template.rewardCoin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.rewardCoinType === 'A' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {template.rewardCoinType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {templates.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  Không có templates nào. Hãy chạy migration script để tạo templates mặc định.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingTemplate ? 'Chỉnh sửa Template' : 'Chỉnh sửa Nhiệm vụ'}
            </h3>
            
            <div className="space-y-4">
              {!editingTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Mission code field removed for editing to prevent duplication */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mục tiêu</label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phần thưởng (coin)</label>
                <input
                  type="number"
                  value={formData.rewardCoin}
                  onChange={(e) => setFormData({ ...formData, rewardCoin: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editingMission && (
                  <p className="mt-1 text-sm text-gray-500">
                    Gợi ý: {missionCodeOptions.find(opt => opt.value === formData.missionCode)?.recommendedReward || 10} coin cho loại nhiệm vụ này
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại coin</label>
                <select
                  value={formData.rewardCoinType}
                  onChange={(e) => setFormData({ ...formData, rewardCoinType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Coin A</option>
                  <option value="B">Coin B</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingMission(null);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleUpdateMission}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert/Confirm Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              {alertModalContent.type === 'success' && (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
              {alertModalContent.type === 'error' && (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
              {alertModalContent.type === 'info' && (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              )}
              {alertModalContent.type === 'confirm' && (
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{alertModalContent.title}</h3>
            </div>
            
            <p className="text-gray-600 mb-6">{alertModalContent.message}</p>
            
            <div className="flex justify-end">
              {alertModalContent.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 mr-3"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (alertModalContent.onConfirm) {
                        alertModalContent.onConfirm();
                      }
                      setShowAlertModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAlertModal(false)}
                  className={`px-4 py-2 rounded-md text-white ${
                    alertModalContent.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    alertModalContent.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMissionManagement;

import React, { useState, useEffect } from 'react';
import { achievementApi } from '../services/achievementApi';
import useNotify from '../hooks/useNotify';

const AchievementsPage = () => {
  const [activeTab, setActiveTab] = useState('my');
  const [myAchievements, setMyAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [unclaimedAchievements, setUnclaimedAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const { notify } = useNotify();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myRes, unlockedRes, unclaimedRes] = await Promise.all([
        achievementApi.getMyAchievements(),
        achievementApi.getUnlockedAchievements(),
        achievementApi.getUnclaimedAchievements()
      ]);

      // api.js response interceptor already extracts data, so use response directly
      setMyAchievements(myRes || []);
      setUnlockedAchievements(unlockedRes || []);
      setUnclaimedAchievements(unclaimedRes || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        notify('Vui lòng đăng nhập để xem thành tích', 'error');
      } else if (error.response?.status === 400) {
        notify('Yêu cầu không hợp lệ', 'error');
      } else {
        notify('Lỗi khi tải thành tích. Vui lòng thử lại sau.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAchievement = async (achievementId) => {
    try {
      setClaiming(achievementId);
      await achievementApi.claimAchievement(achievementId);
      notify('Nhận thưởng thành công!', 'success');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error claiming achievement:', error);
      notify(error.response?.data?.message || 'Lỗi khi nhận thưởng', 'error');
    } finally {
      setClaiming(null);
    }
  };

  const AchievementCard = ({ achievement, userAchievement, showClaimButton = false }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {achievement.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {achievement.description}
          </p>
          
          {userAchievement && (
            <div className="text-xs text-gray-500 mb-2">
              Đạt được vào: {new Date(userAchievement.achievedAt).toLocaleDateString('vi-VN')}
            </div>
          )}

          {achievement.rewardCoin && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                🪙 {achievement.rewardCoin} {achievement.rewardCoinType}
              </span>
              {userAchievement?.isClaimed && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Đã nhận
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ml-4">
          {userAchievement ? (
            <div className="text-2xl">🏆</div>
          ) : (
            <div className="text-2xl opacity-30">🏆</div>
          )}
        </div>
      </div>

      {showClaimButton && userAchievement && !userAchievement.isClaimed && achievement.rewardCoin && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleClaimAchievement(achievement.id)}
            disabled={claiming === achievement.id}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {claiming === achievement.id ? 'Đang nhận...' : `Nhận thưởng 🪙 ${achievement.rewardCoin}`}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thành tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thành tích</h1>
          <p className="text-gray-600">Hoàn thành nhiệm vụ và nhận thưởng</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Thành tích của tôi ({myAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'unlocked'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Chưa mở khóa ({unlockedAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors relative ${
              activeTab === 'rewards'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phần thưởng
            {unclaimedAchievements.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unclaimedAchievements.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'my' && (
            <>
              {myAchievements.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thành tích</h3>
                  <p className="text-gray-600">Hãy đọc truyện, bình luận và tham gia các hoạt động để mở khóa thành tích!</p>
                </div>
              ) : (
                myAchievements.map((ua) => (
                  <AchievementCard
                    key={ua.id}
                    achievement={ua.achievement}
                    userAchievement={ua}
                    showClaimButton={true}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'unlocked' && (
            <>
              {unlockedAchievements.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tuyệt vời!</h3>
                  <p className="text-gray-600">Bạn đã mở khóa tất cả thành tích!</p>
                </div>
              ) : (
                unlockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'rewards' && (
            <>
              {unclaimedAchievements.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có phần thưởng nào</h3>
                  <p className="text-gray-600">Bạn đã nhận tất cả phần thưởng có sẵn</p>
                </div>
              ) : (
                unclaimedAchievements.map((ua) => (
                  <AchievementCard
                    key={ua.id}
                    achievement={ua.achievement}
                    userAchievement={ua}
                    showClaimButton={true}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;

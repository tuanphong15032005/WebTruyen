import React, { useState, useEffect, useContext } from 'react';
import { achievementApi } from '../services/achievementApi';
import useNotify from '../hooks/useNotify';
import { WalletContext } from '../context/WalletContext';

const AchievementsPage = () => {
  const [achievementProgress, setAchievementProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [expandedAchievements, setExpandedAchievements] = useState({});
  const { notify } = useNotify();
  const { refreshWallet } = useContext(WalletContext);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const progressData = await achievementApi.getAchievementProgress();
      
      // Parse JSON if needed
      let parsedData = progressData || [];
      if (typeof progressData === 'string') {
        try {
          parsedData = JSON.parse(progressData);
        } catch (parseError) {
          console.error('Error parsing progress data:', parseError);
          parsedData = [];
        }
      }
      
      setAchievementProgress(parsedData);
    } catch (error) {
      console.error('Error fetching achievement progress:', error);
      notify('Lỗi tải dữ liệu thành tựu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (achievementCode) => {
    setExpandedAchievements(prev => ({
      ...prev,
      [achievementCode]: !prev[achievementCode]
    }));
  };

  const handleClaimTier = async (tierId) => {
    try {
      setClaiming(tierId);
      await achievementApi.claimTier(tierId);
      notify('Nhận thưởng thành công!', 'success');
      await refreshWallet(); // Refresh wallet to update header
      fetchProgress(); // Refresh data
    } catch (error) {
      console.error('Error claiming tier:', error);
      notify(error.response?.data?.message || 'Lỗi nhận thưởng', 'error');
    } finally {
      setClaiming(null);
    }
  };

  const ProgressCard = ({ achievement }) => {
    const { currentTierInfo, nextTierInfo, progressPercentage } = achievement;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{achievement.achievementName}</h3>
            <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {achievement.currentProgress}/{nextTierInfo?.requirement || currentTierInfo?.requirement || 0}
            </div>
            <div className="text-sm text-gray-500">chương đã đọc</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Tiến độ</span>
            <div className="flex items-center gap-2">
              {nextTierInfo && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full border border-gray-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold">
                    C
                  </span>
                  <span className="text-blue-800 font-semibold text-sm">
                    {nextTierInfo.rewardCoin}
                  </span>
                </div>
              )}
              <span>{progressPercentage?.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Current Tier Info */}
        {currentTierInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-blue-800">{currentTierInfo.name}</h4>
                <p className="text-blue-600 text-sm mt-1">{currentTierInfo.description}</p>
                <div className="flex items-center mt-2 text-sm text-blue-700">
                  <span className="font-medium">Yêu cầu:</span>
                  <span className="ml-2">{currentTierInfo.requirement} chương</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-blue-700">
                  <span className="font-medium">Thưởng:</span>
                  <span className="ml-2">{currentTierInfo.rewardCoin} coin {currentTierInfo.rewardCoinType}</span>
                </div>
              </div>
              <button
                onClick={() => handleClaimTier(currentTierInfo.id)}
                disabled={claiming === currentTierInfo.id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {claiming === currentTierInfo.id ? 'Đang xử lý...' : 'Nhận thưởng'}
              </button>
            </div>
          </div>
        )}

        {/* Tiers List - Dropdown */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => toggleExpanded(achievement.achievementCode)}
          >
            <h4 className="font-semibold text-gray-700">Các mốc đã đạt</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {achievement.allTiers?.filter(tier => tier.visible).length} mốc
              </span>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${expandedAchievements[achievement.achievementCode] ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {expandedAchievements[achievement.achievementCode] && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              {achievement.allTiers?.filter(tier => tier.visible).map((tier) => (
                <div 
                  key={tier.id}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    tier.claimed 
                      ? 'bg-green-50 border-green-200' 
                      : tier.current 
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      tier.claimed 
                        ? 'bg-green-600 text-white' 
                        : tier.current 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {tier.tierLevel}
                    </div>
                    <div className="ml-3">
                      <div className={`font-medium ${
                        tier.claimed 
                          ? 'text-green-800' 
                          : tier.current 
                          ? 'text-blue-800'
                          : 'text-gray-600'
                      }`}>
                        {tier.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tier.requirement} chương → {tier.rewardCoin} coin {tier.rewardCoinType}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {tier.claimed && (
                      <span className="text-green-600 font-medium">✓ Đã nhận</span>
                    )}
                    {tier.current && !tier.claimed && (
                      <span className="text-blue-600 font-medium">Hiện tại</span>
                    )}
                    {!tier.current && !tier.claimed && (
                      <span className="text-gray-500">Chưa mở khóa</span>
                    )}
                  </div>
                </div>
              ))}
              {achievement.allTiers?.filter(tier => tier.visible).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>Chưa đạt mốc nào. Hãy đọc truyện để bắt đầu!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completion Status */}
        {achievement.isCompleted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Hoàn thành tất cả các mốc!</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Thành tựu đọc truyện</h1>
        <p className="text-gray-600">Theo dõi tiến độ đọc truyện và nhận thưởng theo từng mốc</p>
      </div>

      {achievementProgress.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có thành tựu nào</h3>
          <p className="text-gray-600">Bắt đầu đọc truyện để mở khóa các thành tựu đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {achievementProgress.map((achievement) => (
            <ProgressCard key={achievement.achievementCode} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;

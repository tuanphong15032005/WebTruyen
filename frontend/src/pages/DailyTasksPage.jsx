import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle, Circle, Coins, Gift, Calendar, Trophy } from 'lucide-react';
import simpleDailyTaskService from '../services/simpleDailyTaskService';
import SimpleNotification from '../components/Notifications/SimpleNotification';
import { WalletContext } from '../context/WalletContext';
import '../styles/site-shell.css';

function DailyTasksPage() {
  const [tasksData, setTasksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });
  const { refreshWallet } = useContext(WalletContext);

  useEffect(() => {
    fetchDailyTasks();
  }, []);

  const fetchDailyTasks = async () => {
    try {
      setLoading(true);
      const data = await simpleDailyTaskService.getDailyTasks();
      setTasksData(data);
    } catch (error) {
      showNotification('Không thể tải nhiệm vụ hằng ngày', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({
      isVisible: true,
      message,
      type
    });
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleClaimReward = async (missionId) => {
    try {
      console.log('Claiming reward for mission:', missionId);
      const result = await simpleDailyTaskService.claimTaskReward(missionId);
      console.log('Claim result:', result);
      
      if (result.success) {
        // Find the task to get reward info
        const task = tasksData.tasks.find(t => t.id === missionId);
        const rewardAmount = task ? task.rewardCoin : 10;
        showNotification(`Nhận thành công ${rewardAmount} coin!`, 'success');
        await fetchDailyTasks(); // Refresh tasks
        await refreshWallet(); // Refresh wallet balance in header
      } else {
        showNotification(result.message || 'Không thể nhận thưởng', 'error');
      }
    } catch (error) {
      console.error('Claim reward error:', error);
      showNotification('Lỗi khi nhận thưởng: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const handleClaimAllRewards = async () => {
    try {
      console.log('Claiming all rewards');
      const result = await simpleDailyTaskService.claimAllRewards();
      console.log('Claim all result:', result);
      
      if (result.claimedTasks > 0) {
        showNotification(
          `Nhận thành công ${result.claimedTasks} nhiệm vụ và ${result.totalCoins} coin!`, 
          'success'
        );
        await fetchDailyTasks(); // Refresh tasks
        await refreshWallet(); // Refresh wallet balance in header
      } else {
        showNotification(result.message || 'Không có nhiệm vụ nào để nhận', 'error');
      }
    } catch (error) {
      console.error('Claim all rewards error:', error);
      showNotification('Lỗi khi nhận tất cả thưởng: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const handleTrackLogin = async () => {
    try {
      const result = await simpleDailyTaskService.trackLogin();
      showNotification('Đã hoàn thành nhiệm vụ đăng nhập!', 'success');
      await fetchDailyTasks(); // Refresh data
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const getProgressPercentage = (current, target) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="daily-tasks-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải nhiệm vụ hằng ngày...</p>
        </div>
      </div>
    );
  }

  if (!tasksData) {
    return (
      <div className="daily-tasks-page">
        <div className="error-container">
          <p>Không thể tải nhiệm vụ hằng ngày. Vui lòng thử lại sau.</p>
          <button onClick={fetchDailyTasks} className="retry-btn">Thử lại</button>
        </div>
      </div>
    );
  }

  // Calculate if there are tasks that can be claimed
  const hasClaimableTasks = tasksData.tasks.some(task => task.completed && task.canClaim);
  const allTasksClaimed = tasksData.tasks.every(task => !task.canClaim);

  return (
    <div className="daily-tasks-page">
      <div className="daily-tasks-header">
        <div className="daily-tasks-header__content">
          <h1 className="daily-tasks-title">
            <Calendar size={28} />
            Nhiệm vụ hằng ngày
          </h1>
          <p className="daily-tasks-subtitle">
            Hoàn thành nhiệm vụ để nhận coin và mở khóa thêm nội dung hấp dẫn
          </p>
        </div>
        
        <div className="daily-tasks-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Trophy size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{tasksData.completedTasks}/{tasksData.totalTasks}</span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Coins size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{tasksData.totalAvailableCoins}</span>
              <span className="stat-label">Coin có thể nhận</span>
            </div>
          </div>
        </div>
      </div>

      <div className="daily-tasks-content">
        <div className="tasks-list">
          {tasksData.tasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-left">
                <div className="task-checkbox">
                  {task.completed ? (
                    <CheckCircle size={24} className="checkbox-checked" />
                  ) : (
                    <Circle size={24} className="checkbox-unchecked" />
                  )}
                </div>
                
                <div className="task-info">
                  <h3 className="task-title">{task.description}</h3>
                  <p className="task-description">{task.missionCode}</p>
                  
                  {task.currentProgress !== undefined && task.targetProgress !== undefined && (
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getProgressPercentage(task.currentProgress, task.targetProgress)}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {task.progressText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="task-reward">
                <div className="reward-amount">
                  <Coins size={16} />
                  <span>{task.rewardCoin}</span>
                </div>
                
                {/* Completed but not claimed - bright clickable button */}
                {task.completed && task.canClaim && (
                  <button 
                    className="claim-btn claim-btn--available"
                    onClick={() => handleClaimReward(task.id)}
                  >
                    Nhận thưởng
                  </button>
                )}
                
                {/* Completed but already claimed - disabled button */}
                {task.completed && !task.canClaim && (
                  <button className="claim-btn claim-btn--claimed" disabled>
                    Đã nhận
                  </button>
                )}
                
                {/* Not completed - grayed out button */}
                {!task.completed && (
                  <button className="claim-btn claim-btn--incomplete" disabled>
                    Chưa hoàn thành
                  </button>
                )}
                
                {/* Special case: DAILY_LOGIN task with manual completion */}
                {!task.completed && task.missionCode === 'DAILY_LOGIN' && (
                  <button 
                    className="complete-btn"
                    onClick={() => handleTrackLogin()}
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="daily-tasks-actions">
          <button 
            className="claim-all-btn"
            onClick={handleClaimAllRewards}
            disabled={!hasClaimableTasks}
          >
            <Gift size={18} />
            {allTasksClaimed ? 'Đã hoàn thành tất cả' : 'Nhận tất cả thưởng'}
          </button>
        </div>
      </div>

      {/* Notification */}
      <SimpleNotification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={handleNotificationClose}
      />
    </div>
  );
}

export default DailyTasksPage;

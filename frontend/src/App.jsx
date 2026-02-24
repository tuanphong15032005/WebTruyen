import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WalletTopupPage from './pages/WalletTopupPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import CoinTransactionHistoryPage from './pages/DonationHistoryPage';
import UserProfile from './pages/UserProfile';
import CreateStory from './pages/Author/CreateStory';
import StoryDetail from './pages/Author/StoryDetail';
import StoryMetadata from './pages/Reader/StoryMetadata';
import StoryReviews from './pages/Reader/StoryReviews';
import ChapterPage from './pages/ChapterPage';
import CreateChapter from './pages/Author/CreateChapter';
import CommentManagement from './pages/Author/CommentManagement';
import PerformanceAnalytics from './pages/Author/PerformanceAnalytics';
import ContentModeration from './pages/Admin/ContentModeration';
import ViolationReportManagement from './pages/Admin/ViolationReportManagement';
import { getStoredUser, hasAnyRole } from './utils/helpers';
import './App.css';

function RoleProtectedRoute({ allowedRoles, children }) {
  const user = getStoredUser();
  if (!user?.token) {
    return <Navigate to='/login' replace />;
  }

  if (!hasAnyRole(allowedRoles, user)) {
    return <Navigate to='/' replace />;
  }

  return children;
}

function App() {
  return (
    <MainLayout>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyCode />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/wallet/topup" element={<WalletTopupPage />} />
            <Route path="/wallet/confirmation/:id" element={<PaymentConfirmationPage />} />
            <Route path="/donation-history" element={<CoinTransactionHistoryPage />} />
            <Route path="/profile" element={<UserProfile />} />

            <Route path='/author/create-story' element={<CreateStory />} />
            <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
            <Route path='/author/stories/:storyId' element={<StoryDetail />} />
            <Route
              path='/author/comments'
              element={
                <RoleProtectedRoute allowedRoles={['AUTHOR']}>
                  <CommentManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path='/author/performance-analytics'
              element={
                <RoleProtectedRoute allowedRoles={['AUTHOR']}>
                  <PerformanceAnalytics />
                </RoleProtectedRoute>
              }
            />
            <Route
              path='/admin/content-moderation'
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
                  <ContentModeration />
                </RoleProtectedRoute>
              }
            />
            <Route
              path='/admin/violation-reports'
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
                  <ViolationReportManagement />
                </RoleProtectedRoute>
              }
            />
            <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
            <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
            <Route path='/stories/:storyId/chapters/:chapterId' element={<ChapterPage />} />
            <Route
              path='/author/stories/:storyId/volumes/:volumeId/create-chapter'
              element={<CreateChapter />}
            />
        </Routes>
    </MainLayout>
  );
}

export default App;

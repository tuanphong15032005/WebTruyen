import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DocsLayout from './layouts/DocsLayout';
import HomePage from './pages/HomePage';

import SearchPage from './pages/SearchPage';

import Login from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';
import VerifyCode from './pages/Authentication/VerifyCode';
import ForgotPassword from './pages/Authentication/ForgotPassword';
import ResetPassword from './pages/Authentication/ResetPassword';

import WalletTopupPage from './pages/Payment/WalletTopupPage';
import PaymentConfirmationPage from './pages/Payment/PaymentConfirmationPage';
import CoinTransactionHistoryPage from './pages/Payment/TransactionHistoryPage';
import DonatePage from './pages/Payment/DonatePage';
import UserProfile from './pages/UserProfile';
import UserPortfolioPage from './pages/profile/UserPortfolioPage';
import DailyTasksPage from './pages/DailyTasksPage';
import ManageStories from './pages/ManageStories';
import LibraryStories from './pages/LibraryStories';
import CreateStory from './pages/Author/CreateStory';
import StoryDetail from './pages/Author/StoryDetail';
import StoryMetadata from './pages/Reader/StoryMetadata';
import StoryReviews from './pages/Reader/StoryReviews';
import ChapterPage from './pages/ChapterPage';
import AuthorDashboard from './pages/Author/AuthorDashboard';
import CreateChapter from './pages/Author/CreateChapter';

import CommentManagement from './pages/Author/CommentManagement';
import PerformanceAnalytics from './pages/Author/PerformanceAnalytics';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ContentModeration from './pages/Admin/ContentModeration';
import ViolationReportManagement from './pages/Admin/ViolationReportManagement';
import TermsOfService from './pages/docs/TermsOfService';
import PrivacyPolicy from './pages/docs/PrivacyPolicy';
import UploadRule from './pages/docs/UploadRule';
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
// >>>>>>> origin/minhfinal1

function RouteScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    if (location.hash) return;

    const mainContent = document.querySelector('main.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search, location.hash]);

  return null;
}
function App() {
  const location = useLocation();

  return (
    <Routes>
      {/* Documentation Routes */}
      <Route path="/policy" element={<DocsLayout />}>
        <Route index element={<TermsOfService />} />
        <Route path="terms-of-service" element={<TermsOfService />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="upload-rule" element={<UploadRule />} />
      </Route>

      {/* Main App Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<><RouteScrollManager /><HomePage /></>} />
        <Route path='search' element={<><RouteScrollManager /><SearchPage /></>} />
        <Route path='login' element={<><RouteScrollManager /><Login /></>} />
        <Route path='register' element={<><RouteScrollManager /><Register /></>} />
        <Route path='verify' element={<><RouteScrollManager /><VerifyCode /></>} />
        <Route path='forgot-password' element={<><RouteScrollManager /><ForgotPassword /></>} />
        <Route path='reset-password' element={<><RouteScrollManager /><ResetPassword /></>} />
        <Route path='wallet/topup' element={<><RouteScrollManager /><WalletTopupPage /></>} />
        <Route
          path='wallet/confirmation/:id'
          element={<><RouteScrollManager /><PaymentConfirmationPage /></>}
        />
        <Route
          path='donation-history'
          element={<><RouteScrollManager /><CoinTransactionHistoryPage /></>}
        />
        <Route path='profile' element={<><RouteScrollManager /><UserProfile /></>} />
        <Route path='daily-tasks' element={<><RouteScrollManager /><DailyTasksPage /></>} />
        <Route path='user/:userId' element={<><RouteScrollManager /><UserPortfolioPage /></>} />
        <Route path='donate/:userId' element={<><RouteScrollManager /><DonatePage /></>} />
        <Route path='authordashboard' element={<><RouteScrollManager /><AuthorDashboard /></>} />
        <Route path='author/my-stories' element={<><RouteScrollManager /><ManageStories /></>} />
        <Route path='manage-stories' element={<><RouteScrollManager /><ManageStories /></>} />
        <Route path='library' element={<><RouteScrollManager /><LibraryStories /></>} />
        <Route path='author/create-story' element={<><RouteScrollManager /><CreateStory /></>} />
        <Route path='author/stories/:storyId/edit' element={<><RouteScrollManager /><CreateStory /></>} />
        <Route path='author/stories/:storyId' element={<><RouteScrollManager /><StoryDetail /></>} />
        <Route path='stories/:storyId/metadata' element={<><RouteScrollManager /><StoryMetadata /></>} />
        <Route path='stories/:storyId/reviews' element={<><RouteScrollManager /><StoryReviews /></>} />
        <Route
          path='stories/:storyId/chapters/:chapterId'
          element={<><RouteScrollManager /><ChapterPage /></>}
        />
        <Route
          path='author/stories/:storyId/volumes/:volumeId/create-chapter'
          element={<><RouteScrollManager /><CreateChapter /></>}
        />
        <Route
          path='author/comments'
          element={
            <><RouteScrollManager /><RoleProtectedRoute allowedRoles={['AUTHOR']}>
              <CommentManagement />
            </RoleProtectedRoute></>
          }
        />
        <Route
          path='author/performance-analytics'
          element={
            <><RouteScrollManager /><RoleProtectedRoute allowedRoles={['AUTHOR']}>
              <PerformanceAnalytics />
            </RoleProtectedRoute></>
          }
        />
        <Route
          path='admin/dashboard'
          element={
            <><RouteScrollManager /><RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
              <AdminDashboard />
            </RoleProtectedRoute></>
          }
        />
        <Route
          path='admin/content-moderation'
          element={
            <><RouteScrollManager /><RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
              <ContentModeration />
            </RoleProtectedRoute></>
          }
        />
        <Route
          path='admin/violation-reports'
          element={
            <><RouteScrollManager /><RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
              <ViolationReportManagement />
            </RoleProtectedRoute></>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;

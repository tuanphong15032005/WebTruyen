import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';

import SearchPage from './pages/SearchPage';

import Login from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';
import VerifyCode from './pages/Authentication/VerifyCode';
import ForgotPassword from './pages/Authentication/ForgotPassword';
import ResetPassword from './pages/Authentication/ResetPassword';

import WalletTopupPage from './pages/WalletTopupPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import CoinTransactionHistoryPage from './pages/TransactionHistoryPage';
import UserProfile from './pages/UserProfile';
import UserPortfolioPage from './pages/profile/UserPortfolioPage';
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
import { getStoredUser, hasAnyRole } from './utils/helpers';
import DonatePage from './pages/DonatePage';
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
  return (
    <MainLayout>
      <RouteScrollManager />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/search' element={<SearchPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/verify' element={<VerifyCode />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/wallet/topup' element={<WalletTopupPage />} />
        <Route
          path='/wallet/confirmation/:id'
          element={<PaymentConfirmationPage />}
        />
        <Route
          path='/donation-history'
          element={<CoinTransactionHistoryPage />}
        />
        <Route path='/profile' element={<UserProfile />} />
        <Route path='/user/:userId' element={<UserPortfolioPage />} />
        <Route path='/donate/:userId' element={<DonatePage />} />
        <Route path='/authordashboard' element={<AuthorDashboard />} />
        <Route path='/author/my-stories' element={<ManageStories />} />
        <Route path='/manage-stories' element={<ManageStories />} />
        <Route path='/library' element={<LibraryStories />} />
        <Route path='/author/create-story' element={<CreateStory />} />
        <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
        <Route path='/author/stories/:storyId' element={<StoryDetail />} />
        <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
        <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
        <Route
          path='/stories/:storyId/chapters/:chapterId'
          element={<ChapterPage />}
        />
        <Route
          path='/author/stories/:storyId/volumes/:volumeId/create-chapter'
          element={<CreateChapter />}
        />
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
                                  path='/admin/dashboard'
                                  element={
                                    <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
                                      <AdminDashboard />
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
      </Routes>
    </MainLayout>
  );
}

export default App;

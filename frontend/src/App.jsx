import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DocsLayout from './layouts/DocsLayout';
import HomePage from './pages/HomePage';
import { ToastProvider, ToastContainer } from './hooks/useToast';

import SearchPage from './pages/SearchPage';
import AuthorSearchPage from './pages/AuthorSearchPage';

import Login from './pages/Authentication/Login';
import Register from './pages/Authentication/Register';
import VerifyCode from './pages/Authentication/VerifyCode';
import ForgotPassword from './pages/Authentication/ForgotPassword';
import ResetPassword from './pages/Authentication/ResetPassword';

import WalletTopupPage from './pages/Payment/WalletTopupPage';
import PaymentConfirmationPage from './pages/Payment/PaymentConfirmationPage';
import CoinTransactionHistoryPage from './pages/Payment/TransactionHistoryPage';
import DonatePage from './pages/Payment/DonatePage';
import PaymentSuccessPage from './pages/Payment/PaymentSuccessPage';
import VNPayReturnHandler from './components/VNPayReturnHandler';
import UserProfile from './pages/UserProfile';
import UserPortfolioPage from './pages/profile/UserPortfolioPage';
import DailyTasksPage from './pages/DailyTasksPage';
import AchievementsPage from './pages/AchievementsPage';
import ManageStories from './pages/ManageStories';
import LibraryStories from './pages/LibraryStories';

import BookmarkStoriesPage from './pages/BookmarkStoriesPage';
import BookmarkDetailPage from './pages/BookmarkDetailPage';
import ReadingHistoryPage from './pages/ReadingHistoryPage';

import LibraryAlbumDetail from './pages/LibraryAlbumDetail';
import PublicAlbumDetail from './pages/PublicAlbumDetail';

import CreateStory from './pages/Author/CreateStory';
import StoryDetail from './pages/Author/StoryDetail';
import StoryMetadata from './pages/Reader/StoryMetadata';
import StoryReviews from './pages/Reader/StoryReviews';
import RefundRequestPage from './pages/Reader/RefundRequestPage';
import ChapterPage from './pages/ChapterPage';
import ReportChapterPage from './pages/report/ReportChapterPage';
import ReportStoryPage from './pages/report/ReportStoryPage';
import ReportCommentPage from './pages/report/ReportCommentPage';
import AuthorDashboard from './pages/Author/AuthorDashboard';
import CreateChapter from './pages/Author/CreateChapter';
import CommentManagement from './pages/Author/CommentManagement';
import PerformanceAnalytics from './pages/Author/PerformanceAnalytics';
import WithdrawalRequestPage from './pages/Author/WithdrawalRequestPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ContentModeration from './pages/Admin/ContentModeration';
import ViolationReportManagement from './pages/Admin/ViolationReportManagement';
import AdminTermsPage from './pages/Admin/AdminTermsPage';
import DynamicPage from './pages/docs/DynamicPage';
import AchievementManagementPage from './pages/Admin/AchievementManagementPage';
import FinanceManagementPage from './pages/Admin/FinanceManagementPage';
import DailyMissionManagement from './pages/Admin/DailyMissionManagement';
import ApplicationManagementPage from './pages/Admin/ApplicationManagementPage';
import TagManagementPage from './pages/Admin/TagManagementPage';
import ReviewerArea from './pages/Reviewer/ReviewerArea';
import { getStoredUser, hasAnyRole } from './utils/helpers';
import AuthorRankingPage from './pages/Ranking/AuthorRankingPage';
import RecentlyUpdatedStoriesPage from './pages/Ranking/RecentlyUpdatedStoriesPage';
import StoryRankingPage from './pages/Ranking/StoryRankingPage';
import RankingPage from './pages/Ranking/RankingPage';
import NotificationPage from './pages/NotificationPage';

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
    const hasResumeSegment =
      /^\/stories\/[^/]+\/chapters\/[^/]+$/.test(location.pathname) &&
      new URLSearchParams(location.search).has('segmentId');
    if (hasResumeSegment) return;

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

function StoryReportRoute() {
  const { storyId } = useParams();

  if (!storyId) {
    return <Navigate to='/' replace />;
  }

  return <Navigate to={`/report-story?storyId=${encodeURIComponent(storyId)}`} replace />;
}

function MainLayoutWrapper() {
  return (
    <MainLayout>
      <RouteScrollManager />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/search' element={<SearchPage />} />
        <Route path='/authors' element={<AuthorSearchPage />} />
        <Route path='/ranking' element={<RankingPage />} />
        <Route
          path='/ranking/authors'
          element={<Navigate to='/ranking?view=authors' replace />}
        />
        <Route
          path='/stories/recent'
          element={<Navigate to='/ranking?view=recent' replace />}
        />
        <Route
          path='/ranking/stories'
          element={<Navigate to='/ranking?view=stories' replace />}
        />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/verify' element={<VerifyCode />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/payment/vnpay-return' element={<VNPayReturnHandler />} />
        <Route path='/payment/success' element={<PaymentSuccessPage />} />
        <Route path='/wallet/topup' element={<WalletTopupPage />} />
        <Route path='/stories/:storyId/report' element={<StoryReportRoute />} />

        <Route
          path='wallet/confirmation/:id'
          element={<PaymentConfirmationPage />}
        />
        <Route
          path='donation-history'
          element={<CoinTransactionHistoryPage />}
        />

        <Route path='/profile' element={<UserProfile />} />
        <Route path='/notifications' element={<NotificationPage />} />
        <Route path='/user/:username' element={<UserProfile />} />
        <Route path='/portfolio/:userId' element={<UserPortfolioPage />} />
        <Route path='/portfolio/username/:username' element={<UserPortfolioPage />} />
        <Route path='/daily-tasks' element={<DailyTasksPage />} />
        <Route path='/achievements' element={<AchievementsPage />} />
        <Route path='/donate/:userId' element={<DonatePage />} />
        <Route
          path='/reader/refund-request'
          element={
            <RoleProtectedRoute allowedRoles={['READER']}>
              <RefundRequestPage />
            </RoleProtectedRoute>
          }
        />
        <Route path='/authordashboard' element={<AuthorDashboard />} />
        <Route path='/author/my-stories' element={<ManageStories />} />
        <Route path='/manage-stories' element={<ManageStories />} />
        <Route path='/library' element={<LibraryStories />} />

        <Route path='/bookmarks' element={<BookmarkStoriesPage />} />
        <Route
          path='/bookmarks/story/:storyId'
          element={<BookmarkDetailPage />}
        />
        <Route path='/reading-history' element={<ReadingHistoryPage />} />

        <Route path='/reviewer-area' element={<ReviewerArea />} />

        <Route
          path='/library/albums/:albumId'
          element={<LibraryAlbumDetail />}
        />
        <Route
          path='/library/albums/public/:albumId'
          element={<PublicAlbumDetail />}
        />

        <Route path='/author/create-story' element={<CreateStory />} />
        <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
        <Route path='/author/stories/:storyId' element={<StoryDetail />} />
        <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
        <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
        <Route
          path='stories/:storyId/chapters/:chapterId'
          element={<ChapterPage />}
        />
        <Route path='/report' element={<ReportChapterPage />} />
        <Route path='/report-story' element={<ReportStoryPage />} />
        <Route path='/report-comment' element={<ReportCommentPage />} />
        <Route path='/reader' element={<ChapterPage />} />
        <Route
          path='author/stories/:storyId/volumes/:volumeId/create-chapter'
          element={<CreateChapter />}
        />
        <Route
          path='author/comments'
          element={
            <RoleProtectedRoute allowedRoles={['AUTHOR']}>
              <CommentManagement />
            </RoleProtectedRoute>
          }
        />
        <Route
          path='author/performance-analytics'
          element={
            <RoleProtectedRoute allowedRoles={['AUTHOR']}>
              <PerformanceAnalytics />
            </RoleProtectedRoute>
          }
        />
        <Route
          path='/author/withdrawal-request'
          element={
            <RoleProtectedRoute allowedRoles={['AUTHOR']}>
              <WithdrawalRequestPage />
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
        >
          <Route index element={<Navigate to='moderation' replace />} />
          <Route path='moderation' element={<ContentModeration />} />
          <Route path='reports' element={<ViolationReportManagement />} />
          <Route path='achievements' element={<AchievementManagementPage />} />
          <Route path='finance' element={<FinanceManagementPage />} />
          <Route path='daily-missions' element={<DailyMissionManagement />} />
          <Route path='achievement-management' element={<AchievementManagementPage />} />
          <Route path='applications' element={<ApplicationManagementPage />} />
          <Route path='tags' element={<TagManagementPage />} />

        </Route>
        <Route
          path='/admin/content-moderation'
          element={<Navigate to='/admin/dashboard/moderation' replace />}
        />
        <Route
          path='/admin/violation-reports'
          element={<Navigate to='/admin/dashboard/reports' replace />}
        />
        <Route
          path='/admin/achievements'
          element={<Navigate to='/admin/dashboard/achievements' replace />}
        />
        <Route
          path='/admin/finance'
          element={<Navigate to='/admin/dashboard/finance' replace />}
        />
        <Route
          path='admin/terms'
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}>
              <AdminTermsPage />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  );
}

function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <Routes>
        {/* Documentation Routes */}
        <Route path="/policy" element={<DocsLayout />}>
          <Route index element={<DynamicPage code="terms" />} />
          <Route path="terms-of-service" element={<DynamicPage code="terms" />} />
          <Route path="privacy-policy" element={<DynamicPage code="privacy" />} />
          <Route path="upload-rule" element={<DynamicPage code="author-rules" />} />
        </Route>

        {/* Main Routes with Layout */}
        <Route path="/*" element={<MainLayoutWrapper />} />
      </Routes>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;

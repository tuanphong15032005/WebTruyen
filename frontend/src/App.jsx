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
import CoinTransactionHistoryPage from './pages/DonationHistoryPage';
import UserProfile from './pages/UserProfile';
import ManageStories from './pages/ManageStories';
import LibraryStories from './pages/LibraryStories';
import CreateStory from './pages/Author/CreateStory';
import StoryDetail from './pages/Author/StoryDetail';
import StoryMetadata from './pages/Reader/StoryMetadata';
import StoryReviews from './pages/Reader/StoryReviews';
// Minhdq - 26/02/2026
// [Add reader-author-public-profile-route-import - V1 - branch: clone-minhfinal2]
import AuthorPublicProfile from './pages/Reader/AuthorPublicProfile';
import ChapterPage from './pages/ChapterPage';
import AuthorDashboard from './pages/Author/AuthorDashboard';
import CreateChapter from './pages/Author/CreateChapter';
// <<<<<<< HEAD
// =======
import CommentManagement from './pages/Author/CommentManagement';
import PerformanceAnalytics from './pages/Author/PerformanceAnalytics';
import FollowerAnalytics from './pages/Author/FollowerAnalytics';
// Minhdq - 25/02/2026
// [Fix admin-dashboard/route/id - V2 - branch: minhfinal2]
import AdminDashboard from './pages/Admin/AdminDashboard';
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
// >>>>>>> origin/minhfinal1

function App() {
  return (
    <MainLayout>
{/* <<<<<<< HEAD */}
      <Routes>
        <Route path='/' element={<HomePage />} />
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
        <Route path='/authordashboard' element={<AuthorDashboard />} />
        <Route path='/author/my-stories' element={<ManageStories />} />
        <Route path='/manage-stories' element={<ManageStories />} />
        <Route path='/library' element={<LibraryStories />} />
        <Route path='/author/create-story' element={<CreateStory />} />
        <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
        <Route path='/author/stories/:storyId' element={<StoryDetail />} />
        <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
        {/* Minhdq - 26/02/2026 */}
        {/* [Add reader-author-public-profile-route - V1 - branch: clone-minhfinal2] */}
        <Route path='/authors/:authorId' element={<AuthorPublicProfile />} />
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
                                  path='/author/followers'
                                  element={
                                    <RoleProtectedRoute allowedRoles={['AUTHOR']}>
                                      <FollowerAnalytics />
                                    </RoleProtectedRoute>
                                  }
                                />
                                {/* Minhdq - 25/02/2026 */}
                                {/* [Fix admin-dashboard/route/id - V2 - branch: minhfinal2] */}
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
{/* ======= */}
{/*         <Routes> */}
{/*             <Route path="/" element={<HomePage />} /> */}
{/*             <Route path="/login" element={<Login />} /> */}
{/*             <Route path="/register" element={<Register />} /> */}
{/*             <Route path="/verify" element={<VerifyCode />} /> */}
{/*             <Route path="/forgot-password" element={<ForgotPassword />} /> */}
{/*             <Route path="/reset-password" element={<ResetPassword />} /> */}
{/*             <Route path="/wallet/topup" element={<WalletTopupPage />} /> */}
{/*             <Route path="/wallet/confirmation/:id" element={<PaymentConfirmationPage />} /> */}
{/*             <Route path="/donation-history" element={<CoinTransactionHistoryPage />} /> */}
{/*             <Route path="/profile" element={<UserProfile />} /> */}

{/*             <Route path='/author/create-story' element={<CreateStory />} /> */}
{/*             <Route path='/author/stories/:storyId/edit' element={<CreateStory />} /> */}
{/*             <Route path='/author/stories/:storyId' element={<StoryDetail />} /> */}
{/*             <Route */}
{/*               path='/author/comments' */}
{/*               element={ */}
{/*                 <RoleProtectedRoute allowedRoles={['AUTHOR']}> */}
{/*                   <CommentManagement /> */}
{/*                 </RoleProtectedRoute> */}
{/*               } */}
{/*             /> */}
{/*             <Route */}
{/*               path='/author/performance-analytics' */}
{/*               element={ */}
{/*                 <RoleProtectedRoute allowedRoles={['AUTHOR']}> */}
{/*                   <PerformanceAnalytics /> */}
{/*                 </RoleProtectedRoute> */}
{/*               } */}
{/*             /> */}
{/*             <Route */}
{/*               path='/admin/content-moderation' */}
{/*               element={ */}
{/*                 <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}> */}
{/*                   <ContentModeration /> */}
{/*                 </RoleProtectedRoute> */}
{/*               } */}
{/*             /> */}
{/*             <Route */}
{/*               path='/admin/violation-reports' */}
{/*               element={ */}
{/*                 <RoleProtectedRoute allowedRoles={['ADMIN', 'MOD']}> */}
{/*                   <ViolationReportManagement /> */}
{/*                 </RoleProtectedRoute> */}
{/*               } */}
{/*             /> */}
{/*             <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} /> */}
{/*             <Route path='/stories/:storyId/reviews' element={<StoryReviews />} /> */}
{/*             <Route path='/stories/:storyId/chapters/:chapterId' element={<ChapterPage />} /> */}
{/*             <Route */}
{/*               path='/author/stories/:storyId/volumes/:volumeId/create-chapter' */}
{/*               element={<CreateChapter />} */}
{/*             /> */}
{/*         </Routes> */}
{/* >>>>>>> origin/minhfinal1 */}
    </MainLayout>
  );
}

export default App;

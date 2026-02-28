import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
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
import DonatePage from './pages/DonatePage';

function App() {
  return (
    <MainLayout>
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
      </Routes>
    </MainLayout>
  );
}

export default App;

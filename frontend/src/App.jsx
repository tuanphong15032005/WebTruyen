// <<<<<<< HEAD
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import './App.css';
import UserProfile from './pages/UserProfile';
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

            <Route path='/' element={<Navigate to='/author/create-story' />} />
                        <Route path='/author/create-story' element={<CreateStory />} />
                        <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
                        <Route path='/author/stories/:storyId' element={<StoryDetail />} />
                        <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
                        <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
                        <Route
                          path='/author/stories/:storyId/volumes/:volumeId/create-chapter'
                          element={<CreateChapter />}
                        />

                        <Route path='*' element={<Navigate to='/author/create-story' />} />
        </Routes>
    </MainLayout>
  );
}

export default App;
// =======
// import React from 'react';
// import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
// import Footer from './components/Footer';
// import Header from './components/Header';
// import CreateChapter from './pages/Author/CreateChapter';
// import CreateStory from './pages/Author/CreateStory';
// import StoryDetail from './pages/Author/StoryDetail';
// import StoryMetadata from './pages/Reader/StoryMetadata';
// import StoryReviews from './pages/Reader/StoryReviews';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import VerifyCode from './pages/VerifyCode';
//
// const App = () => {
//   return (
//     <BrowserRouter>
//       <div className='app'>
//         <Header />
//         <main className='container'>
//           <Routes>
//             <Route path='/' element={<Navigate to='/author/create-story' />} />
//             <Route path='/author/create-story' element={<CreateStory />} />
//             <Route path='/author/stories/:storyId/edit' element={<CreateStory />} />
//             <Route path='/author/stories/:storyId' element={<StoryDetail />} />
//             <Route path='/stories/:storyId/metadata' element={<StoryMetadata />} />
//             <Route path='/stories/:storyId/reviews' element={<StoryReviews />} />
//             <Route
//               path='/author/stories/:storyId/volumes/:volumeId/create-chapter'
//               element={<CreateChapter />}
//             />
//             <Route path='/login' element={<Login />} />
//             <Route path='/register' element={<Register />} />
//             <Route path='/verify-code' element={<VerifyCode />} />
//             <Route path='*' element={<Navigate to='/author/create-story' />} />
//           </Routes>
//         </main>
//         <Footer />
//       </div>
//     </BrowserRouter>
//   );
// };
//
// export default App;
// >>>>>>> author-create-content

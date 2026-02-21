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
        </Routes>
    </MainLayout>
  );
}

export default App;
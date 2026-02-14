import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ContentModeration from './pages/ContentModeration';
import './App.css';

// Trang chủ đơn giản
function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
       <h1>Danh Sách Truyện Hot</h1>
       <p>Nội dung truyện sẽ hiển thị ở đây...</p>
    </div>
  );
}

function App() {
  return (
    <MainLayout>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyCode />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/moderation" element={<ContentModeration mode="pending" />} />
            <Route path="/admin/moderation/approved" element={<ContentModeration mode="approved" />} />
            <Route path="/admin/moderation/rejected" element={<ContentModeration mode="rejected" />} />
        </Routes>
    </MainLayout>
  );
}

export default App;
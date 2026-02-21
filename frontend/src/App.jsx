import { Navigate, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ContentModeration from './pages/ContentModeration';
import AuthorCommentManagement from './pages/AuthorCommentManagement';
import ViolationReportModeration from './pages/ViolationReportModeration';
import AuthorAnalytics from './pages/AuthorAnalytics';
import ConversionRateManagement from './pages/ConversionRateManagement';
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

const getUserRoles = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const roles = Array.isArray(parsed?.roles) ? parsed.roles : [];
    const normalized = roles
      .filter((role) => typeof role === 'string' && role.trim() !== '')
      .map((role) => role.trim().toUpperCase());

    if (normalized.includes('MOD') && !normalized.includes('ADMIN')) {
      normalized.push('ADMIN');
    }

    return [...new Set(normalized)];
  } catch {
    return [];
  }
};

function ProtectedRoute({ allowedRoles, children }) {
  const roles = getUserRoles();
  const isAllowed = allowedRoles.some((role) => roles.includes(role));
  return isAllowed ? children : <Navigate to="/login" replace />;
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
            <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ContentModeration mode="pending" /></ProtectedRoute>} />
            <Route path="/admin/moderation/approved" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ContentModeration mode="approved" /></ProtectedRoute>} />
            <Route path="/admin/moderation/rejected" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ContentModeration mode="rejected" /></ProtectedRoute>} />
            <Route path="/admin/moderation/reports" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ViolationReportModeration mode="pending" /></ProtectedRoute>} />
            <Route path="/admin/moderation/reports/resolved" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ViolationReportModeration mode="resolved" /></ProtectedRoute>} />
            <Route path="/admin/moderation/reports/rejected" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ViolationReportModeration mode="rejected" /></ProtectedRoute>} />
            <Route path="/admin/conversion-rate" element={<ProtectedRoute allowedRoles={['MOD', 'ADMIN']}><ConversionRateManagement /></ProtectedRoute>} />
            <Route path="/author/comments" element={<ProtectedRoute allowedRoles={['AUTHOR']}><AuthorCommentManagement /></ProtectedRoute>} />
            <Route path="/author/analytics" element={<ProtectedRoute allowedRoles={['AUTHOR']}><AuthorAnalytics /></ProtectedRoute>} />
        </Routes>
    </MainLayout>
  );
}

export default App;
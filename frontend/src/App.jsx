import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import UserProfile from './pages/UserProfile';
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
            <Route path="/profile" element={<UserProfile />} />
        </Routes>
    </MainLayout>
  );
}

export default App;
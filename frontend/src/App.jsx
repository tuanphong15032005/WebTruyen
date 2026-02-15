import { Routes, Route, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import UserProfile from './pages/UserProfile';
import ChapterPage from './pages/ChapterPage';
import './App.css';

// Trang chủ đơn giản
function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
       <h1>Danh Sách Truyện Hot</h1>
       <p>Nội dung truyện sẽ hiển thị ở đây...</p>
       <div style={{ marginTop: '30px' }}>
         <button 
           onClick={() => navigate('/chapter')}
           style={{
             padding: '12px 24px',
             fontSize: '16px',
             backgroundColor: '#667eea',
             color: 'white',
             border: 'none',
             borderRadius: '8px',
             cursor: 'pointer',
             transition: 'all 0.3s ease'
           }}
           onMouseOver={(e) => e.target.style.backgroundColor = '#5a67d8'}
           onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
         >
           Đọc Chương Test
         </button>
       </div>
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
            <Route path="/chapter" element={<ChapterPage />} />
        </Routes>
    </MainLayout>
  );
}

export default App;
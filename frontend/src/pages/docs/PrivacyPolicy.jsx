import React from 'react';
import { Shield, Home, FileText, User, Activity, Cookie, Share2, Lock, Settings } from 'lucide-react';
import PolicyNavigation from '../../components/docs/PolicyNavigation';

function PrivacyPolicy() {
  const navigationData = {
    previous: {
      name: 'Điều khoản dịch vụ',
      href: '/policy/terms-of-service'
    },
    next: {
      name: 'Rule đăng truyện',
      href: '/policy/upload-rule'
    },
    current: 'Chính sách bảo mật'
  };

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Home className="w-4 h-4" />
        <span className="text-gray-500">{'>'}</span>
        <span>Chính sách bảo mật</span>
      </nav>

      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">🛡️</span>
        <h1 className="text-4xl font-bold text-gray-900">
          Chính sách bảo mật
        </h1>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-600 mb-8">
        Cập nhật lần cuối: 31/10/2025
      </p>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-gray-800 leading-relaxed">
          Tại WebTruyen, chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính sách bảo mật này 
          giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng dịch vụ của chúng tôi.
        </p>
      </div>

      {/* Section 1 */}
      <section id="thong-tin-thu-thap" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          1. Thông tin chúng tôi thu thập
        </h2>
        
        <div className="space-y-6 ml-8">
          {/* Sub-section 1.1 */}
          <div id="thong-tin-tai-khoan">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Thông tin tài khoản
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800 ml-7">
              <li>Tên đăng nhập và email</li>
              <li>Mật khẩu (được mã hóa)</li>
              <li>Thông tin cá nhân tự nguyện cung cấp</li>
              <li>Ảnh đại diện và thông tin hồ sơ</li>
            </ul>
          </div>

          {/* Sub-section 1.2 */}
          <div id="thong-tin-su-dung">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Thông tin sử dụng
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800 ml-7">
              <li>Lịch sử đọc truyện</li>
              <li>Danh sách truyện yêu thích</li>
              <li>Thời gian hoạt động trên trang</li>
              <li>Các tương tác với nội dung</li>
            </ul>
          </div>

          {/* Sub-section 1.3 */}
          <div id="cookie-cong-nghe">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Cookie className="w-5 h-5 mr-2 text-orange-600" />
              Cookie & công nghệ tương tự
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800 ml-7">
              <li>Cookie để duy trì phiên đăng nhập</li>
              <li>Cookie để ghi nhớ sở thích của bạn</li>
              <li>Công nghệ tracking để cải thiện trải nghiệm</li>
              <li>Local storage để lưu cài đặt người dùng</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="cach-su-dung" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          2. Cách chúng tôi sử dụng thông tin
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Cung cấp và duy trì dịch vụ đọc truyện</li>
          <li>Cá nhân hóa trải nghiệm đọc của bạn</li>
          <li>Gửi thông báo về cập nhật nội dung</li>
          <li>Cải thiện và phát triển dịch vụ</li>
          <li>Bảo vệ an ninh và chống spam</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="chia-se-thong-tin" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Share2 className="w-6 h-6 mr-2" />
          3. Chia sẻ thông tin
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Chúng tôi không bán thông tin cá nhân của bạn</li>
          <li>Chỉ chia sẻ khi có sự cho phép của bạn</li>
          <li>Chia sẻ với đối tác để cung cấp dịch vụ</li>
          <li>Cung cấp cho cơ quan pháp lý khi yêu cầu</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="bao-mat-thong-tin" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Lock className="w-6 h-6 mr-2" />
          4. Bảo mật thông tin
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Sử dụng mã hóa SSL/TLS cho tất cả kết nối</li>
          <li>Mã hóa mật khẩu với thuật toán hiện đại</li>
          <li>Định kỳ backup dữ liệu</li>
          <li>Hạn chế quyền truy cập thông tin người dùng</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="quyen-nguoi-dung" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          5. Quyền của người dùng
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Xem và chỉnh sửa thông tin cá nhân</li>
          <li>Xóa tài khoản và dữ liệu liên quan</li>
          <li>Tắt cookie và tracking</li>
          <li>Yêu cầu xuất dữ liệu cá nhân</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section id="thay-doi-chinh-sach" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          6. Thay đổi chính sách
        </h2>
        <p className="text-gray-800 leading-relaxed">
          Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được thông báo 
          trên trang web và gửi email cho người dùng đăng ký.
        </p>
      </section>

      {/* Section 7 */}
      <section id="lien-he" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          7. Liên hệ
        </h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <ul className="space-y-3 text-gray-800">
            <li><strong>Email:</strong> privacy@webtruyen.com</li>
            <li><strong>Discord:</strong> WebTruyen Community</li>
            <li><strong>Facebook:</strong> /WebTruyenOfficial</li>
          </ul>
        </div>
      </section>

      {/* Navigation */}
      <PolicyNavigation {...navigationData} />
    </div>
  );
}

export default PrivacyPolicy;

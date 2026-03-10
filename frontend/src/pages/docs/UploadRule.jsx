import React from 'react';
import { BookOpen, Home, FileText, AlertTriangle, CheckCircle, XCircle, Star, Users } from 'lucide-react';
import PolicyNavigation from '../../components/docs/PolicyNavigation';

function UploadRule() {
  const navigationData = {
    previous: {
      name: 'Chính sách bảo mật',
      href: '/policy/privacy-policy'
    },
    next: null,
    current: 'Rule đăng truyện'
  };

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Home className="w-4 h-4" />
        <span className="text-gray-500">{'>'}</span>
        <span>Rule đăng truyện</span>
      </nav>

      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">📖</span>
        <h1 className="text-4xl font-bold text-gray-900">
          Rule đăng truyện
        </h1>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-600 mb-8">
        Cập nhật lần cuối: 31/10/2025
      </p>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-gray-800 leading-relaxed">
          Để đảm bảo chất lượng nội dung và trải nghiệm tốt nhất cho người đọc, 
          vui lòng tuân thủ các quy định đăng truyện dưới đây.
        </p>
      </div>

      {/* Section 1 */}
      <section id="dieu-kien-dang-truyen" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          1. Điều kiện đăng truyện
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Tài khoản phải được xác thực email</li>
          <li>Tối thiểu 3 ngày hoạt động trên trang</li>
          <li>Không vi phạm điều khoản dịch vụ trước đó</li>
          <li>Đã đọc và đồng ý với quy định đăng tải</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section id="noi-dung-cho-phep" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
          2. Nội dung được phép
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Truyện sáng tác gốc của bạn</li>
          <li>Truyện dịch có giấy phép</li>
          <li>Nội dung phù hợp với văn hóa Việt Nam</li>
          <li>Truyện đã hoàn thiện hoặc đang viết</li>
          <li>Các thể loại: tình cảm, phiêu lưu, khoa học viễn tưởng, etc.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="noi-dung-bi-cam" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <XCircle className="w-6 h-6 mr-2 text-red-600" />
          3. Nội dung bị cấm
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Truyện vi phạm bản quyền</li>
          <li>Nội dung 18+, khiêu dâm</li>
          <li>Bạo lực, máu me quá mức</li>
          <li>Chính trị, tôn giáo nhạy cảm</li>
          <li>Phân biệt chủng tộc, giới tính</li>
          <li>Nội dung sai sự thật gây hoang mang</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="yeu-cau-chat-luong" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Star className="w-6 h-6 mr-2 text-yellow-600" />
          4. Yêu cầu chất lượng
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Tiêu đề rõ ràng, không gây hiểu lầm</li>
          <li>Mô tả chi tiết và hấp dẫn</li>
          <li>Bìa truyện chất lượng cao</li>
          <li>Không lỗi chính tả nhiều</li>
          <li>Cấu trúc chương hợp lý</li>
          <li>Tối thiểu 1000 từ/chương</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="quy-trinh-dang" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          5. Quy trình đăng
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-800">
          <li>Chọn "Đăng truyện" từ menu</li>
          <li>Điền thông tin cơ bản (tên, tác giả, thể loại)</li>
          <li>Upload ảnh bìa</li>
          <li>Viết mô tả và tóm tắt</li>
          <li>Đăng chương đầu tiên</li>
          <li>Kiểm tra và xác nhận đăng tải</li>
        </ol>
      </section>

      {/* Section 6 */}
      <section id="kiem-duyet" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2" />
          6. Kiểm duyệt
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Mọi truyện đều được kiểm duyệt trước khi đăng</li>
          <li>Thời gian kiểm duyệt: 24-48 giờ</li>
          <li>Nếu vi phạm sẽ nhận thông báo và hướng dẫn sửa</li>
          <li>Có quyền từ chối đăng không cần lý do chi tiết</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="vi-pham" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          7. Xử lý vi phạm
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Lần đầu: Cảnh cảnh và yêu cầu sửa</li>
          <li>Lần hai: Gỡ truyện và khóa đăng 7 ngày</li>
          <li>Lần ba: Khóa tài khoản vĩnh viễn</li>
          <li>Vi phạm nghiêm trọng: Khóa ngay lập tức</li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="quyen-loi-tac-gia" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          8. Quyền lợi tác giả
        </h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li>Nhận 70% doanh thu từ quảng cáo</li>
          <li>Được hỗ trợ marketing</li>
          <li>Có quyền chỉnh sửa hoặc gỡ truyện</li>
          <li>Nhận thống kê đọc hàng tháng</li>
        </ul>
      </section>

      {/* Section 9 */}
      <section id="lien-he" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          9. Liên hệ hỗ trợ
        </h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <ul className="space-y-3 text-gray-800">
            <li><strong>Email hỗ trợ:</strong> author@webtruyen.com</li>
            <li><strong>Discord:</strong> #author-support</li>
            <li><strong>Hotline:</strong> 1900-XXXX</li>
          </ul>
        </div>
      </section>

      {/* Navigation */}
      <PolicyNavigation {...navigationData} />
    </div>
  );
}

export default UploadRule;

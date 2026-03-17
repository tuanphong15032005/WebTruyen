import React from 'react';
import { Home } from 'lucide-react';
import PolicyNavigation from '../../components/docs/PolicyNavigation';

function TermsOfService() {
  const navigationData = {
    previous: null,
    next: {
      name: 'Chính sách bảo mật',
      href: '/policy/privacy-policy'
    },
    current: 'Điều khoản dịch vụ'
  };

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Home className="w-4 h-4" />
        <span className="text-gray-500">{'>'}</span>
        <span>Điều khoản dịch vụ</span>
      </nav>

      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">📜</span>
        <h1 className="text-4xl font-bold text-gray-900">
          Điều khoản Dịch vụ
        </h1>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-600 mb-8">
        Cập nhật lần cuối: 31/10/2025
      </p>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-gray-800 leading-relaxed mb-4">
          Chào mừng bạn đến với Trạm Đọc — nền tảng đọc truyện trực tuyến dành cho cộng đồng yêu thích truyện chữ, manga, manhwa, manhua và các thể loại truyện khác.
        </p>
        <p className="text-gray-800 leading-relaxed">
          Khi truy cập hoặc sử dụng dịch vụ của Trạm Đọc, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân thủ các điều khoản dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của Điều khoản, vui lòng ngừng sử dụng dịch vụ.
        </p>
      </div>

      {/* Section 1 */}
      <section id="gioi-thieu" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          1. Giới thiệu
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Trạm Đọc là một nền tảng cho phép người dùng:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Đọc truyện trực tuyến</li>
          <li>Theo dõi truyện và lưu lịch sử đọc</li>
          <li>Bình luận và tương tác với cộng đồng</li>
          <li>Đăng tải bản dịch truyện từ các nhóm dịch</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Trạm Đọc hoạt động như một nền tảng chia sẻ nội dung do cộng đồng đóng góp.
        </p>
      </section>

      {/* Section 2 */}
      <section id="do-tuoi-su-dung" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          2. Độ tuổi sử dụng
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Người dùng phải từ 13 tuổi trở lên để sử dụng nền tảng.</li>
          <li>Nếu bạn dưới 13 tuổi, vui lòng không tạo tài khoản hoặc sử dụng dịch vụ.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="noi-dung-bi-cam" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          3. Nội dung bị cấm
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Trạm Đọc không cho phép đăng tải hoặc chia sẻ các nội dung sau:
        </p>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            Nội dung 18+
          </h3>
          <p className="text-gray-800 mb-3 ml-7">
            Bao gồm nhưng không giới hạn:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800 ml-12">
            <li>Nội dung khiêu dâm</li>
            <li>Nội dung tình dục</li>
            <li>Hình ảnh nhạy cảm</li>
            <li>Nội dung gợi dục</li>
            <li>Nội dung khai thác tình dục</li>
          </ul>
          <p className="text-gray-800 leading-relaxed mt-3 ml-7">
            Các truyện hoặc hình ảnh có nội dung 18+ sẽ bị xóa ngay lập tức khi phát hiện hoặc khi có báo cáo từ người dùng.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            Nội dung vi phạm pháp luật
          </h3>
          <p className="text-gray-800 mb-3 ml-7">
            Không được đăng tải:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800 ml-12">
            <li>Nội dung kích động bạo lực</li>
            <li>Nội dung xúc phạm cá nhân hoặc tổ chức</li>
            <li>Nội dung phân biệt chủng tộc, giới tính hoặc tôn giáo</li>
            <li>Nội dung chống phá Nhà nước Cộng hoà Xã hội Chủ nghĩa Việt Nam</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            Nội dung bóc lột trẻ em
          </h3>
          <p className="text-gray-800 ml-7">
            Mọi nội dung liên quan đến:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-800 ml-12">
            <li>khai thác trẻ em</li>
            <li>hình ảnh trẻ em nhạy cảm</li>
            <li>nội dung không phù hợp với trẻ vị thành niên</li>
          </ul>
          <p className="text-gray-800 leading-relaxed mt-3 ml-7">
            đều bị nghiêm cấm tuyệt đối.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section id="quyen-va-nghia-vu-nguoi-dung" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          4. Quyền và nghĩa vụ của người dùng
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Người dùng khi sử dụng Trạm Đọc phải:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Sử dụng dịch vụ cho mục đích hợp pháp</li>
          <li>Không spam hoặc phá hoại hệ thống</li>
          <li>Không gây ảnh hưởng tiêu cực đến cộng đồng</li>
          <li>Bảo mật tài khoản và mật khẩu của mình</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Mọi hoạt động được thực hiện từ tài khoản sẽ được xem là trách nhiệm của chủ tài khoản.
        </p>
      </section>

      {/* Section 5 */}
      <section id="quyen-so-huu-noi-dung-ban-quyen" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          5. Quyền sở hữu nội dung & bản quyền
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Trạm Đọc không sở hữu bản quyền của các bộ truyện được đăng tải trên hệ thống.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Bản quyền truyện thuộc về tác giả hoặc nhà xuất bản</li>
          <li>Bản dịch thuộc về nhóm dịch hoặc người đăng tải</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Nếu bạn là chủ sở hữu bản quyền và không muốn nội dung xuất hiện trên Trạm Đọc, vui lòng liên hệ với chúng tôi.
        </p>
        <p className="text-gray-800 leading-relaxed mt-2">
          Sau khi xác minh, nội dung có thể được ẩn hoặc gỡ bỏ trong vòng 1–7 ngày làm việc.
        </p>
      </section>

      {/* Section 6 */}
      <section id="quyen-cua-nhom-dich" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          6. Quyền của nhóm dịch
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nhóm dịch có quyền:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Đăng tải truyện do mình dịch</li>
          <li>Chỉnh sửa hoặc xóa nội dung đã đăng</li>
          <li>Ghi credit và thông tin nhóm dịch</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Trạm Đọc chỉ can thiệp khi nội dung vi phạm quy định của nền tảng.
        </p>
      </section>

      {/* Section 7 */}
      <section id="hanh-vi-bi-cam" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          7. Hành vi bị cấm
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nghiêm cấm các hành vi sau:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Spam bình luận hoặc quảng cáo trái phép</li>
          <li>Tấn công hệ thống hoặc khai thác lỗ hổng bảo mật</li>
          <li>Sử dụng bot hoặc công cụ tự động gây quá tải server</li>
          <li>Sao chép hoặc reup trái phép nội dung của nhóm khác</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Vi phạm có thể dẫn đến:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Cảnh cáo</li>
          <li>Khoá tài khoản tạm thời</li>
          <li>Khoá tài khoản vĩnh viễn</li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="gioi-han-trach-nhiem" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          8. Giới hạn trách nhiệm
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Trạm Đọc cung cấp nền tảng để cộng đồng chia sẻ nội dung.
        </p>
        <p className="text-gray-800 leading-relaxed mb-4">
          Chúng tôi:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Không đảm bảo tính chính xác của mọi nội dung</li>
          <li>Không chịu trách nhiệm cho nội dung do người dùng đăng tải</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Tuy nhiên, chúng tôi sẽ xử lý các báo cáo vi phạm khi nhận được thông báo hợp lệ.
        </p>
      </section>

      {/* Section 9 */}
      <section id="thay-doi-dich-vu-va-dieu-khoan" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          9. Thay đổi dịch vụ và điều khoản
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Trạm Đọc có quyền:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-800 ml-6">
          <li>Cập nhật hoặc thay đổi dịch vụ</li>
          <li>Điều chỉnh điều khoản sử dụng</li>
          <li>Tạm ngưng hệ thống khi cần thiết</li>
        </ul>
        <p className="text-gray-800 leading-relaxed mt-4">
          Việc tiếp tục sử dụng nền tảng đồng nghĩa với việc bạn chấp nhận phiên bản điều khoản mới nhất.
        </p>
      </section>

      {/* Section 10 */}
      <section id="lien-he" className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          10. Liên hệ
        </h2>
        <p className="text-gray-800 leading-relaxed mb-4">
          Nếu bạn có câu hỏi hoặc yêu cầu liên quan đến Điều khoản Dịch vụ, vui lòng liên hệ:
        </p>
        <div className="bg-gray-50 rounded-lg p-6">
          <ul className="space-y-3 text-gray-800">
            <li><span className="mr-2">📩</span><strong>Discord:</strong> https://discord.tramdoc.com</li>
            <li><span className="mr-2">🌐</span><strong>Facebook:</strong> https://facebook.com/tramdoc</li>
            <li><span className="mr-2">💌</span><strong>Email:</strong> contact@tramdoc.com</li>
          </ul>
        </div>
        <p className="text-gray-800 leading-relaxed mt-6 text-center">
          Cảm ơn bạn đã sử dụng Trạm Đọc — nơi kết nối cộng đồng yêu thích truyện 📚
        </p>
      </section>

      {/* Navigation */}
      <PolicyNavigation {...navigationData} />
    </div>
  );
}

export default TermsOfService;

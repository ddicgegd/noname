import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Lock, 
  UserCheck, 
  PackageCheck, 
  CreditCard, 
  Scale, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  Building2,
  RefreshCw,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TermsPageProps {
  onNavigate: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
}

type TabType = "terms" | "privacy" | "warranty";

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("terms");

  return (
    <div className="min-h-screen bg-[#E4E4E4] text-[#111111] p-4 sm:p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 md:p-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.07)] border border-white/80">
        {/* Navigation & Header Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => {
              window.location.hash = "login";
              onNavigate("auth");
            }}
            className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-slate-200/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Đăng nhập</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-[#FF4D24]/10 text-[#FF4D24] border border-[#FF4D24]/20">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Chính sách chính thức 2026</span>
          </div>
        </div>

        {/* Title Header */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-xs text-slate-700 tracking-wider uppercase">
              Hệ thống bán lẻ công nghệ <span className="text-[#FF4D24]">HORIZON MOBILE</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Điều khoản Dịch vụ & Chính sách Bảo vệ Dữ liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Cam kết minh bạch về quyền lợi mua sắm thiết bị công nghệ chính hãng, an toàn định danh tài khoản IAM và quyền riêng tư theo tiêu chuẩn pháp luật Việt Nam.
          </p>
        </div>

        {/* Tab Selection Filter */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-200/60 rounded-2xl mb-8 border border-slate-300/40">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={cn(
              "flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "terms"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-[#FF4D24]" />
            <span>1. Điều khoản dịch vụ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={cn(
              "flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "privacy"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Chính sách bảo mật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("warranty")}
            className={cn(
              "flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "warranty"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Bảo hành & Đổi trả</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8 text-sm text-slate-600 leading-relaxed"
            >
              {/* Section 1 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#FF4D24] flex items-center justify-center font-bold text-xs shrink-0">
                    1.1
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Phạm vi điều chỉnh & Chấp nhận thỏa thuận
                  </h2>
                </div>
                <p>
                  Thỏa thuận này quy định các điều kiện khi khách hàng đăng ký tài khoản, tra cứu danh mục, mua sắm sản phẩm công nghệ (Điện thoại thông minh, Máy tính bảng, Thiết bị phụ trợ AI & Điện toán), cũng như tương tác với hệ thống quản lý thành viên <strong>Horizon Mobile</strong> (thuộc sở hữu của Hệ thống Synapse Digital Việt Nam).
                </p>
                <p className="text-xs text-slate-500 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/60">
                  Bằng cách nhấn &quot;Đăng ký&quot;, &quot;Đặt hàng&quot; hoặc truy cập hệ thống dịch vụ, quý khách xác nhận đã đủ năng lực hành vi dân sự và đồng ý tuân thủ toàn bộ các quy định tại văn bản này.
                </p>
              </section>

              {/* Section 2 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#FF4D24] flex items-center justify-center font-bold text-xs shrink-0">
                    1.2
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quy chuẩn Tài khoản IAM & Cơ chế Bảo vệ Hai Lớp
                  </h2>
                </div>
                <p>
                  Để đảm bảo tính xác thực và an toàn cao nhất cho giao dịch, mỗi khách hàng chỉ được sở hữu một tài khoản định danh gắn liền với địa chỉ email chính chủ:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-[#FF4D24]" />
                      <span>Xác thực qua Email chuẩn UUID v4</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Liên kết kích hoạt tài khoản sử dụng token bảo mật RFC 4122 (36 ký tự). Tài khoản chỉ hoạt động sau khi hoàn tất xác thực email.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thời gian chờ đổi Tên (Cooldown 30 ngày)</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Tên đăng nhập (3–50 ký tự, không dấu cách) có chu kỳ đổi an toàn 30 ngày một lần nhằm hạn chế mạo danh tài khoản và giữ vững lịch sử đơn hàng.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ủy quyền Đổi Mật Khẩu (5 phút)</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mọi yêu cầu cập nhật mật khẩu nhạy cảm phải thông qua liên kết xác thực gửi đến email chính chủ, có hiệu lực tối đa 300 giây.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bảo vệ quyền riêng tư ngày sinh</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Người dùng có toàn quyền chọn tính năng ẩn năm sinh (`hideBirthYear`) khi cập nhật thông tin cá nhân tại trang hồ sơ.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#FF4D24] flex items-center justify-center font-bold text-xs shrink-0">
                    1.3
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quy định Đặt hàng, Giá niêm yết & Đồng bộ ERP
                  </h2>
                </div>
                <p>
                  Mọi mức giá hiển thị trên website Horizon Mobile đều là giá bán lẻ cuối cùng đã bao gồm thuế Giá trị gia tăng (VAT).
                </p>
                <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1 text-slate-600">
                  <li>
                    <strong>Xác nhận đơn hàng:</strong> Sau khi quý khách đặt hàng trực tuyến, hệ thống sẽ gửi email xác nhận và mã đơn hàng tự động.
                  </li>
                  <li>
                    <strong>Đồng bộ kế toán ERP:</strong> Đơn hàng được đồng bộ trực tiếp vào hệ thống quản lý tài chính doanh nghiệp để bảo đảm tính toàn vẹn của hóa đơn điện tử và chứng từ nguồn gốc xuất xứ.
                  </li>
                  <li>
                    <strong>Chương trình khuyến mãi & Voucher:</strong> Mã giảm giá, ưu đãi Smember và quà tặng kèm có thể áp dụng theo từng đợt khuyến mãi và không có giá trị quy đổi thành tiền mặt.
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#FF4D24] flex items-center justify-center font-bold text-xs shrink-0">
                    1.4
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Trách nhiệm của người sử dụng
                  </h2>
                </div>
                <p>
                  Quý khách cam kết không sử dụng website và tài nguyên của Horizon Mobile vào mục đích:
                </p>
                <div className="flex flex-col gap-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <p>• Gian lận đặt hàng ảo, khai báo thông tin người nhận giả mạo hoặc lạm dụng voucher khuyến mại.</p>
                  <p>• Sử dụng công cụ tự động (bot, crawl trái phép) gây nghẽn tài nguyên máy chủ hoặc can thiệp dữ liệu giỏ hàng/bookmark.</p>
                  <p>• Phát tán mã độc hại, xâm phạm an ninh mạng hoặc gây phương hại đến quyền sở hữu trí tuệ của Horizon Mobile.</p>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8 text-sm text-slate-600 leading-relaxed"
            >
              {/* Compliance Badge */}
              <div className="flex items-center gap-3 p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-900 font-medium">
                  Chính sách tuân thủ nghiêm ngặt <strong>Nghị định 13/2023/NĐ-CP</strong> của Chính phủ về Bảo vệ Dữ liệu Cá nhân và Luật An toàn Thông tin Mạng Việt Nam.
                </p>
              </div>

              {/* Privacy 1 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    2.1
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Các loại dữ liệu chúng tôi thu thập
                  </h2>
                </div>
                <p>
                  Để xử lý giao dịch mua sắm thiết bị và hỗ trợ dịch vụ hậu mãi, chúng tôi chỉ thu thập các trường dữ liệu cần thiết:
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">Thông tin tài khoản & định danh:</span> Họ và tên, địa chỉ email, số điện thoại, ngày tháng năm sinh (hỗ trợ tùy chọn bảo mật năm sinh), mật khẩu được mã hóa một chiều an toàn bằng thuật toán Bcrypt.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">Thông tin giao nhận & hóa đơn:</span> Địa chỉ nhận hàng, họ tên người nhận, số điện thoại liên lạc, thông tin xuất hóa đơn VAT (nếu có yêu cầu từ doanh nghiệp).
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">Tương tác sản phẩm:</span> Danh mục sản phẩm yêu thích đã lưu (Bookmarks), lịch sử duyệt giỏ hàng, nhằm tối ưu hóa trải nghiệm tìm kiếm và đề xuất cấu hình phù hợp.
                  </div>
                </div>
              </section>

              {/* Privacy 2 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    2.2
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Mục đích sử dụng & Thời gian lưu trữ
                  </h2>
                </div>
                <p>
                  Dữ liệu của quý khách chỉ được sử dụng cho các mục đích cụ thể:
                </p>
                <ul className="list-disc list-inside flex flex-col gap-1 pl-1 text-xs text-slate-600">
                  <li>Xử lý xác nhận, đóng gói và vận chuyển đơn hàng thiết bị công nghệ.</li>
                  <li>Kích hoạt bảo hành điện tử chính hãng từ nhà sản xuất (Apple, Samsung, Xiaomi...).</li>
                  <li>Gửi thông báo mã kích hoạt email, đặt lại mật khẩu và hỗ trợ tài khoản.</li>
                  <li>Ngăn chặn các hành vi tấn công, giả mạo tài khoản và bảo vệ an ninh hệ thống.</li>
                </ul>
                <p className="text-xs text-slate-500 mt-1">
                  Dữ liệu được lưu trữ trong suốt thời gian quý khách duy trì tài khoản hoạt động tại Horizon Mobile hoặc cho đến khi nhận được văn bản/yêu cầu xóa hợp lệ từ chủ thể dữ liệu.
                </p>
              </section>

              {/* Privacy 3 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    2.3
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Cam kết không chia sẻ dữ liệu & Quyền của khách hàng
                  </h2>
                </div>
                <p>
                  <strong>Horizon Mobile cam kết tuyệt đối KHÔNG bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của quý khách</strong> cho bất kỳ bên thứ ba nào vì mục đích tiếp thị hoặc quảng cáo không mong muốn.
                </p>
                <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col gap-1.5">
                  <span className="font-bold text-slate-800">Quyền lợi của quý khách:</span>
                  <p>• <strong>Quyền tra cứu & chỉnh sửa:</strong> Quý khách có thể tự do xem và cập nhật thông tin cá nhân trực tiếp tại trang <button onClick={() => onNavigate("profile")} className="text-[#FF4D24] font-semibold hover:underline cursor-pointer">Hồ sơ cá nhân (/m#profile)</button>.</p>
                  <p>• <strong>Quyền thu hồi & xóa dữ liệu:</strong> Quý khách có quyền yêu cầu tạm khóa hoặc xóa hoàn toàn tài khoản bằng cách liên hệ bộ phận hỗ trợ chính thức.</p>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "warranty" && (
            <motion.div
              key="warranty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8 text-sm text-slate-600 leading-relaxed"
            >
              {/* Warranty 1 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    3.1
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chính sách Đồng Kiểm & 1 Đổi 1 Trong 30 Ngày
                  </h2>
                </div>
                <p>
                  Nhằm bảo vệ tối đa quyền lợi khách hàng khi mua sắm thiết bị giá trị cao:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Quyền đồng kiểm tận nơi
                    </span>
                    <p className="text-slate-500">
                      Quý khách được mở niêm phong hộp vận chuyển bên ngoài để kiểm tra hình thức máy, phụ kiện đi kèm và tính toàn vẹn của tem seal trước khi thanh toán.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      Đổi mới 30 ngày lỗi NSX
                    </span>
                    <p className="text-slate-500">
                      Sản phẩm phát sinh lỗi phần cứng được xác nhận bởi Trung tâm Bảo hành Ủy quyền sẽ được đổi ngay máy mới 100% cùng model và màu sắc.
                    </p>
                  </div>
                </div>
              </section>

              {/* Warranty 2 */}
              <section className="flex flex-col gap-2.5 bg-white/50 border border-slate-200/70 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    3.2
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Thời hạn bảo hành chính hãng
                  </h2>
                </div>
                <p>
                  100% thiết bị bán ra tại Horizon Mobile là sản phẩm phân phối chính thức tại thị trường Việt Nam:
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">Điện thoại thông minh (iPhone, Galaxy, Xiaomi...)</span>
                    <span className="font-bold text-emerald-600">12 - 24 tháng theo hãng</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">Máy tính bảng, Laptop & Thiết bị điện toán</span>
                    <span className="font-bold text-emerald-600">12 tháng tiêu chuẩn</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-700">Phụ kiện công nghệ, sạc nhanh & tai nghe</span>
                    <span className="font-bold text-emerald-600">6 - 12 tháng 1 đổi 1</span>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corporate Legal & Support Contact Footer */}
        <div className="mt-12 pt-6 border-t border-slate-300/70 flex flex-col gap-4 text-xs text-slate-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#FF4D24]" />
                Hệ thống Bán lẻ Công nghệ Synapse Digital Việt Nam
              </span>
              <p>Thương hiệu đại diện: <strong>HORIZON MOBILE</strong></p>
              <p>Mã số Doanh nghiệp: 0109283746 (Sở KH&ĐT TP. Hồ Chí Minh cấp ngày 15/08/2022)</p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                Bitexco Financial Tower, Q.1, TP. Hồ Chí Minh.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 md:items-end">
              <span className="font-bold text-slate-800 text-xs">Tổng đài Hỗ trợ Khách hàng</span>
              <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Phone className="w-3 h-3 text-[#FF4D24]" />
                Hotline: 1900 6789 (8:00 - 21:30 hàng ngày)
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                Email: support@synapsedigital.vn
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Cập nhật lần cuối: 28 tháng 09 năm 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

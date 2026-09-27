import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingBag, ShieldCheck, Lock, UserCheck } from "lucide-react";

interface TermsPageProps {
  onNavigate: (page: "landing" | "product" | "order" | "auth" | "auth-report" | "profile" | "terms") => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <div className="min-h-screen bg-[#E4E4E4] text-[#111111] p-4 sm:p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 md:p-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.07)] border border-white/80">
        {/* Back Button */}
        <button
          onClick={() => {
            window.location.hash = "login";
            onNavigate("auth");
          }}
          className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center gap-1.5 mb-8 -ml-1 py-1 px-2 rounded-lg hover:bg-slate-200/50 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-500">
              HORIZON <span className="text-[#FF4D24]">MOBILE</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Điều khoản Dịch vụ & Bảo mật Tài khoản
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Quy định sử dụng giao diện mua sắm trực tuyến và chính sách bảo vệ tài khoản người dùng tại Horizon Mobile.
            </p>
          </div>

          <div className="h-px bg-slate-200/80 w-full" />

          {/* Main Content Sections */}
          <div className="flex flex-col gap-6 text-sm text-slate-600 leading-relaxed">
            {/* 1. Mua sắm & Đơn hàng */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#FF4D24] shrink-0" />
                <h2 className="text-base font-bold text-slate-800">
                  1. Mua sắm & Đặt hàng trực tuyến
                </h2>
              </div>
              <p>
                Khách hàng có thể tìm kiếm, lưu danh mục yêu thích (Bookmarks), thêm sản phẩm vào giỏ hàng và tiến hành đặt hàng trực tiếp trên giao diện web. Mọi mức giá hiển thị là giá bán chính thức đã bao gồm thuế GTGT (VAT). Thông tin đơn hàng sẽ được gửi xác nhận tự động đến email của bạn ngay sau khi hoàn tất đặt hàng.
              </p>
            </section>

            {/* 2. Bảo mật Tài khoản */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h2 className="text-base font-bold text-slate-800">
                  2. Định danh & Bảo mật Tài khoản
                </h2>
              </div>
              <p>
                Tài khoản người dùng được định danh an toàn qua email chính chủ và mã xác thực bảo mật. Mật khẩu được mã hóa an toàn trên hệ thống. Mọi thao tác thay đổi mật khẩu đều cần bước xác thực quyền gửi qua email (hiệu lực trong 5 phút). Tên đăng nhập có thời gian chờ (cooldown) 30 ngày giữa các lần thay đổi nhằm đảm bảo an toàn lịch sử tài khoản.
              </p>
            </section>

            {/* 3. Quyền riêng tư Dữ liệu */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <h2 className="text-base font-bold text-slate-800">
                  3. Quyền riêng tư & Bảo vệ Dữ liệu
                </h2>
              </div>
              <p>
                Chúng tôi chỉ thu thập thông tin cần thiết phục vụ xử lý giao hàng và hỗ trợ khách hàng (Họ tên, email, số điện thoại, địa chỉ nhận hàng). Bạn có toàn quyền quản lý, cập nhật thông tin và tùy chọn ẩn năm sinh tại trang hồ sơ cá nhân. Chúng tôi cam kết không chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích tiếp thị ngoài luồng.
              </p>
            </section>

            {/* 4. Trách nhiệm Người dùng */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <h2 className="text-base font-bold text-slate-800">
                  4. Trách nhiệm của Người dùng
                </h2>
              </div>
              <p>
                Bạn có trách nhiệm bảo mật thiết bị đăng nhập và mật khẩu cá nhân. Tuyệt đối không sử dụng công cụ tự động để can thiệp giỏ hàng, gian lận khuyến mại, đặt đơn hàng ảo hoặc thực hiện các hành vi gây ảnh hưởng đến trải nghiệm mua sắm chung trên hệ thống.
              </p>
            </section>
          </div>

          <div className="h-px bg-slate-200/80 w-full mt-2" />

          {/* Footer note */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>Cập nhật lần cuối: Tháng 9 năm 2026.</span>
            <span>Hệ thống Horizon Mobile • Hỗ trợ: 1900 6789</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

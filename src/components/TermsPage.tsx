import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

interface TermsPageProps {
  onNavigate: (page: "landing" | "product" | "auth" | "terms") => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <div className="min-h-screen bg-[#E4E4E4] text-[#111111] p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.07)] border border-white/80">
        <button
          onClick={() => {
            window.location.hash = "login";
            onNavigate("auth");
          }}
          className="text-xs font-bold text-slate-500 hover:text-[#FF4D24] transition-all cursor-pointer flex items-center gap-1 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-black text-slate-900 mb-6">Điều khoản Dịch vụ & Chính sách Bảo mật</h1>
          
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">1. Chấp nhận điều khoản</h2>
              <p>
                Bằng việc đăng ký và sử dụng dịch vụ của Horizon Mobile, bạn đồng ý tuân thủ các quy định và điều kiện được nêu tại đây. Nếu bạn không đồng ý, vui lòng ngừng sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">2. Quyền riêng tư và Bảo vệ Dữ liệu</h2>
              <p>
                Chúng tôi tôn trọng và cam kết bảo vệ dữ liệu cá nhân của bạn. Mọi thông tin như tên, địa chỉ email, và số điện thoại được thu thập chỉ nhằm mục đích cung cấp và cải thiện trải nghiệm dịch vụ. Horizon Mobile cam kết không chia sẻ dữ liệu của bạn cho bất kỳ bên thứ ba nào mà không có sự đồng ý rõ ràng, ngoại trừ các trường hợp theo yêu cầu của pháp luật.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">3. Trách nhiệm của người dùng</h2>
              <p>
                Bạn có trách nhiệm bảo mật thông tin tài khoản của mình. Mọi hoạt động xảy ra dưới tài khoản của bạn sẽ do bạn hoàn toàn chịu trách nhiệm. Bạn không được sử dụng dịch vụ của chúng tôi cho các mục đích bất hợp pháp, phát tán phần mềm độc hại, hoặc quấy rối người khác.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">4. Sửa đổi Điều khoản</h2>
              <p>
                Horizon Mobile bảo lưu quyền thay đổi hoặc cập nhật các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web chính thức. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>
            </section>

            <p className="text-xs text-slate-400 mt-12">
              Cập nhật lần cuối: Tháng 8 năm 2026.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

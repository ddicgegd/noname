import React from "react";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import { Star, StarHalf } from "lucide-react";

interface Review {
  name: string;
  username: string;
  body: string;
  img: string;
  rating: 5 | 4.5;
}

const reviews: Review[] = [
  {
    name: "Tuấn Anh",
    username: "@tuananh.dev",
    body: "Máy nguyên seal, giao siêu tốc chỉ 2 tiếng tại nội thành. Nhân viên tư vấn nhiệt tình, 10/10 điểm!",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Minh Thư",
    username: "@thu.minh",
    body: "Đóng gói cẩn thận 3 lớp chống sốc. Sản phẩm chính hãng kích hoạt bảo hành điện tử chuẩn chỉ.",
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Hoàng Nam",
    username: "@nam.hoang99",
    body: "Hàng đẹp nguyên bản, pin 100%. Giao trễ 10p do trời mưa nhưng bạn shipper hỗ trợ rất chu đáo.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 4.5,
  },
  {
    name: "Lan Hương",
    username: "@huong.lan",
    body: "Săn được voucher giá tốt nhất thị trường. Thanh toán quét mã duyệt tự động trong 30s cực kỳ tiện!",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Đức Trọng",
    username: "@trong.duc",
    body: "Trải nghiệm mua sắm mượt mà từ lúc đặt tới lúc nhận. Hỗ trợ kỹ thuật chuyển dữ liệu rất tận tâm.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Khánh Vy",
    username: "@vy.khanh",
    body: "Chất lượng máy tuyệt vời, camera nét căng. Shop tặng kèm đầy đủ ốp lưng và sạc nhanh chính hãng.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    rating: 4.5,
  },
  {
    name: "Quốc Bảo",
    username: "@bao.quoc",
    body: "Đổi trả bảo hành 1 đổi 1 nhanh chóng không làm khó khách. Chắc chắn sẽ quay lại ủng hộ tiếp.",
    img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Phương Linh",
    username: "@phuonglinh",
    body: "Máy màu Titan Sa Mạc bên ngoài sang hơn trong ảnh nhiều. Hài lòng tuyệt đối với dịch vụ của shop!",
    img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
  rating,
}: Review) => {
  return (
    <figure
      className={cn(
        "group/card relative h-[180px] w-[350px] sm:w-[414px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300",
        // Viền và khung card đầy đủ
        "border-black/[0.08] bg-white/60 hover:bg-white shadow-sm hover:shadow-md backdrop-blur-md",
        "dark:border-white/[0.1] dark:bg-white/[0.06] dark:hover:bg-white/[0.12]"
      )}
    >
      <div className="flex flex-row items-center justify-between gap-3.5 opacity-30 blur-[0.6px] transition-all duration-300 group-hover/card:opacity-100 group-hover/card:blur-none select-none">
        <div className="flex flex-row items-center gap-3.5 min-w-0">
          <img className="rounded-full ring-2 ring-white/80 shadow-xs shrink-0 object-cover size-11" width="44" height="44" alt={name} src={img} />
          <div className="flex flex-col min-w-0">
            <figcaption className="text-base font-bold text-slate-800 dark:text-white leading-tight truncate">
              {name}
            </figcaption>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-white/40 truncate">{username}</p>
          </div>
        </div>

        {/* Rating Stars (5.0 or 4.5) */}
        <div className="flex items-center gap-0.5 shrink-0" title={`Đánh giá ${rating}/5 sao`}>
          {[...Array(4)].map((_, i) => (
            <Star key={i} className="size-3.5 sm:size-4 text-amber-400 fill-amber-400" />
          ))}
          {rating === 5 ? (
            <Star className="size-3.5 sm:size-4 text-amber-400 fill-amber-400" />
          ) : (
            <StarHalf className="size-3.5 sm:size-4 text-amber-400 fill-amber-400" />
          )}
        </div>
      </div>

      <blockquote className="mt-2 text-sm sm:text-[15px] text-slate-900 dark:text-white leading-snug font-medium line-clamp-3">
        {body}
      </blockquote>
    </figure>
  );
};

export default function ShowcaseSection() {
  return (
    <section id="showcase" className="py-12 bg-transparent relative overflow-hidden">
      <div className="relative flex w-full flex-col items-center justify-center gap-2.5 overflow-hidden">
        {/* Row 1 */}
        <Marquee pauseOnHover className="[--duration:28s] [--gap:0.75rem]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Row 2 (Staggered offset with reverse) */}
        <Marquee reverse pauseOnHover className="[--duration:28s] [--gap:0.75rem] -ml-[215px]">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Fading side gradient edges */}
        <div className="from-[#E4E4E4] pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r z-10"></div>
        <div className="from-[#E4E4E4] pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l z-10"></div>
      </div>
    </section>
  );
}

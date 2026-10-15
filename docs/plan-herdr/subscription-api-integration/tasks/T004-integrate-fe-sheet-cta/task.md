# Task T004: Tích Hợp Nút CTA, Tối Ưu Khung 767x413px & Đồng Bộ Mã Gói (UI Polish)

## 1. Kết Quả Nghiệp Vụ Mong Đợi (Observable Business Outcome)
Giao diện thẻ thanh toán [`HoloCardPaymentSheet.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCardPaymentSheet.tsx) được bổ sung nút CTA chính (`h-11`, 3D Bevel) để kích hoạt thanh toán, nén kích thước 4 thẻ phương thức thanh toán về `min-h-[48px] sm:min-h-[50px]` để triệt tiêu hoàn toàn thanh cuộn dọc trên khung `767x413px`, và đồng bộ mã gói theo chu kỳ trong [`PricingSection.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/PricingSection.tsx) (`SILVER_3M`, `PLATINUM_12M`).

## 2. Vì Sao Cần Task Này?
Khắc phục defect nghiêm trọng: người dùng chọn được gói nhưng không có nút bấm hoàn tất giao dịch; đồng thời giải quyết rủi ro layout vỡ và lệch mã gói cước giữa client và DB backend.

## 3. Tiền Đề & Handoff Artifacts
- Tiền đề: T003 đã chuẩn hóa tầng gọi API `subscriptionService.ts`.
- Handoff bàn giao: Giao diện thanh toán hoàn chỉnh, tương tác trơn tru và gắn kết API thực tế.

## 4. Quy Tắc Áp Dụng
- [BR-SUB-01](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-01-quy-tắc-đồng-bộ-mã-gói-cước-theo-chu-kỳ-plancode-alignment)
- [BR-SUB-02](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-02-phân-định-bản-chất-dòng-tiền--sổ-cái-fineract-payment-flow-separation)
- [BR-SUB-04](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-04-hạn-mức-không-gian-vật-lý--trải-nghiệm-thị-giác-physical-layout-budget--zero-scrollbar)

## 5. Ranh Giới Tệp Tin
- **Read**:
  - `src/components/HoloCard.tsx`
- **Creates**:
  - `docs/plan-herdr/subscription-api-integration/tasks/T004-integrate-fe-sheet-cta/session-log.md`
- **Modifies**:
  - `src/components/HoloCardPaymentSheet.tsx`
  - `src/components/PricingSection.tsx`

## 6. Trình Tự Thực Hiện
1. Tối ưu kích thước 4 thẻ phương thức thanh toán trong `HoloCardPaymentSheet.tsx`:
   - Chỉnh `min-h-[58px] sm:min-h-[64px]` thành `min-h-[48px] sm:min-h-[50px]`.
   - Chỉnh padding thẻ `py-2 sm:py-2.5 px-3.5 sm:px-4`.
   - Chỉnh `gap-2.5 sm:gap-3` thành `gap-2 sm:gap-2.5`.
2. Bổ sung nút Checkout CTA Button ở chân cột phải:
   - Chiều cao: `h-11 sm:h-12 w-full rounded-2xl`.
   - Hiệu ứng: 3D tactile bevel highlight (`border-t border-t-white/40`, active scale `0.98`).
   - Nhãn động:
     - Google Pay: *"Dùng thử miễn phí với Google Pay"*.
     - MoMo / VNPay / Card: *"Thanh toán {displayPrice} qua {methodName}"*.
   - Gắn sự kiện `onClick={handlePay}`.
   - Quản lý trạng thái: Hiển thị `<Loader2 className="animate-spin" />` và disable khi `isProcessing`.
3. Đồng bộ mã gói trong `PricingSection.tsx`:
   - Map động theo chu kỳ được chọn: chu kỳ 3 tháng -> `SILVER_3M`, chu kỳ 1 năm -> `PLATINUM_12M`.
4. Ghi nhận kết quả vào `session-log.md`.

## 7. Tiêu Chí Nghiệm Thu
- [ ] Nút CTA xuất hiện đầy đủ và bấm được.
- [ ] Không xuất hiện thanh cuộn dọc trên modal `767x413px`.
- [ ] Payload gửi đi mang mã gói cước `SILVER_3M` hoặc `PLATINUM_12M`.

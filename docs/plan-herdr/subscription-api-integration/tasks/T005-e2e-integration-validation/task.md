# Task T005: Kiểm Thử Tích Hợp Toàn Trình & Nghiệm Thu Trực Quan (E2E Validation)

## 1. Kết Quả Nghiệp Vụ Mong Đợi (Observable Business Outcome)
Toàn bộ luồng chọn gói, mở sheet modal FLIP Morphing, chọn chu kỳ, chọn phương thức thanh toán, nhấn nút CTA, gửi API và nhận phản hồi được kiểm chứng hoạt động trơn tru trên trình duyệt thực tế, không có lỗi runtime hay lỗi console.

## 2. Vì Sao Cần Task Này?
Tuân thủ điều khoản "Zero-Tolerance on Verification Fraud" trong AGENTS.md: Một build xanh chưa đủ, cần bằng chứng thị giác trực tiếp trên trình duyệt chứng minh kích thước hiển thị (`rect.width > 0 && rect.height > 0`), không lỗi Error Boundary và trải nghiệm người dùng hoàn hảo.

## 3. Tiền Đề & Handoff Artifacts
- Tiền đề: T004 đã hoàn thành tích hợp giao diện và nút CTA.
- Handoff bàn giao: Bằng chứng nghiệm thu sản phẩm cuối cùng.

## 4. Quy Tắc Áp Dụng
- [BR-SUB-01](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-01-quy-tắc-đồng-bộ-mã-gói-cước-theo-chu-kỳ-plancode-alignment)
- [BR-SUB-02](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-02-phân-định-bản-chất-dòng-tiền--sổ-cái-fineract-payment-flow-separation)
- [BR-SUB-04](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-04-hạn-mức-không-gian-vật-lý--trải-nghiệm-thị-giác-physical-layout-budget--zero-scrollbar)
- [BR-SUB-05](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-05-chuẩn-hóa-thông-báo-lỗi-người-dùng-deterministic-error-normalization)

## 5. Ranh Giới Tệp Tin
- **Read**:
  - `src/components/HoloCardPaymentSheet.tsx`
  - `src/services/subscriptionService.ts`
- **Creates**:
  - `docs/plan-herdr/subscription-api-integration/tasks/T005-e2e-integration-validation/session-log.md`
- **Modifies**: Không

## 6. Trình Tự Thực Hiện
1. Chạy `npx tsc --noEmit` để đảm bảo 0 lỗi kiểu dữ liệu toàn bộ frontend.
2. Kiểm tra layout DOM trên trình duyệt `http://localhost:3000`:
   - Xác nhận modal hiển thị kích thước `767x413px`.
   - Xác nhận `overflow-y` không kích hoạt scrollbar.
   - Xác nhận nút CTA hiển thị rõ, có text tương ứng theo phương thức.
3. Thử nghiệm click nút CTA:
   - Kiểm tra hiệu ứng loading spinner `isProcessing`.
   - Kiểm tra xử lý phản hồi khi thành công (Success banner) hoặc khi có lỗi (Error notice).
4. Ghi nhận toàn bộ bằng chứng vào `session-log.md`.

## 7. Tiêu Chí Nghiệm Thu
- [ ] TypeScript compile 0 lỗi (`npx tsc --noEmit`).
- [ ] Trình duyệt render trọn vẹn không bị clipping, không scrollbar ngoài ý muốn.
- [ ] Báo cáo nghiệm thu hoàn tất sáng kiến.

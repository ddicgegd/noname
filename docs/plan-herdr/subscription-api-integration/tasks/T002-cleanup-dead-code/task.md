# Task T002: Lập Kế Hoạch & Đào Thải Code Rác Cục Bộ (Dead Code Removal)

## 1. Kết Quả Nghiệp Vụ Mong Đợi (Observable Business Outcome)
Loại bỏ hoàn toàn các chuỗi token kiểm thử hardcoded, token giả lập Google Pay, mã giao dịch client tự sinh và các hằng số mã gói không tồn tại trong DB, làm sạch tầng code trước khi tích hợp endpoint.

## 2. Vì Sao Cần Task Này?
Giữ code sạch (Hygiene), tuân thủ nguyên tắc "Zero Hallucination", ngăn chặn rò rỉ dữ liệu kiểm thử và lỗi `PLAN_NOT_FOUND` khi gửi request.

## 3. Tiền Đề & Handoff Artifacts
- Tiền đề: T001 đã xác minh cấu trúc gói cước và hợp đồng backend.
- Handoff bàn giao: Bộ mã nguồn sạch không còn token rác hoặc mã gói hardcoded.

## 4. Quy Tắc Áp Dụng
- [BR-SUB-01](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-01-quy-tắc-đồng-bộ-mã-gói-cước-theo-chu-kỳ-plancode-alignment)
- [BR-SUB-03](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-03-bảo-mật-phiên-làm-việc--token-xác-thực-session--token-integrity)

## 5. Ranh Giới Tệp Tin
- **Read**:
  - `src/services/subscriptionService.ts`
  - `src/components/HoloCardPaymentSheet.tsx`
  - `src/components/PricingSection.tsx`
- **Creates**:
  - `docs/plan-herdr/subscription-api-integration/tasks/T002-cleanup-dead-code/session-log.md`
- **Modifies**:
  - `src/services/subscriptionService.ts`
  - `src/components/HoloCardPaymentSheet.tsx`

## 6. Trình Tự Thực Hiện
1. Xóa hằng số `TEST_USER_ACCESS_TOKEN` tại `src/services/subscriptionService.ts:16-17`.
2. Thay thế logic `getEffectiveAccessToken()` bằng `getUnifiedAccessToken()`. Nếu không có token, trả về chuỗi rỗng để kích hoạt luồng yêu cầu đăng nhập.
3. Trong `HoloCardPaymentSheet.tsx`:
   - Xóa bỏ việc tự sinh chuỗi giả `"tok_gpay_wallet_" + Date.now()`.
   - Xóa bỏ việc tự sinh mã giao dịch `${method}_TXN_${Date.now()}`.
4. Ghi nhận kết quả vào `session-log.md`.

## 7. Tiêu Chí Nghiệm Thu
- [ ] Không còn chuỗi `TEST_USER_ACCESS_TOKEN` nào trong codebase.
- [ ] TypeScript biên dịch thành công không có lỗi type error.

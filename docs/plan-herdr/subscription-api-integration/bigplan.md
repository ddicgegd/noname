# Kế Hoạch Sáng Kiến (BigPlan): Tích Hợp API Thuê Bao Thực Tế & Chuẩn Hóa Giao Diện Thanh Toán

- **Tên sáng kiến**: `subscription-api-integration`
- **Mục tiêu cốt lõi**:
  1. Kiểm thử và xác thực hợp đồng API của toàn bộ các endpoint thuê bao trên backend Spring Boot ERP (:8080) và sổ cái Apache Fineract (:8443).
  2. Dọn dẹp triệt để mã rác, các chuỗi token test hardcode (`TEST_USER_ACCESS_TOKEN`), transaction ID giả lập và mã gói cước không tồn tại trong database Oracle.
  3. Cập nhật và chuẩn hóa tầng dịch vụ API phía Frontend (`subscriptionService.ts`).
  4. Hoàn thiện giao diện [`HoloCardPaymentSheet.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/HoloCardPaymentSheet.tsx) với nút CTA kích hoạt thanh toán, tối ưu layout không gian `767x413px` chống tràn viền/scrollbar, và đồng bộ mã gói chu kỳ trong [`PricingSection.tsx`](file:///C:/Users/ddicg/orca/noname/src/components/PricingSection.tsx).
- **Trạng thái**: COMPLETED
- **Môi trường điều phối (Selected Runtime)**: **Herdr Runtime** (Pane `w3:pF`, Herdr daemon `0.9.3` running).
- **Chiến lược phân nhánh Git**:
  - Nhánh gốc: `main`
  - Nhánh sáng kiến: `feat/subscription-real-api-integration`

---

## 1. Bản Đồ Tài Liệu Quy Chuẩn (Canonical Documents Index)

- [Bối cảnh & Quyết định (context-and-decisions.md)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/context-and-decisions.md)
- [Quy tắc Nghiệp vụ Chuẩn hóa (business-rules.md)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md)
- [Thiết kế Giải pháp & Hợp đồng Kỹ thuật (solution-design.md)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/solution-design.md)
- [Đồ thị Phụ thuộc Công việc (work-map.yaml)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/work-map.yaml)
- [Kế hoạch Kiểm định & Tích hợp (validation-and-integration.md)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/validation-and-integration.md)
- [Sổ tay Vận hành Điều phối (herdr-runbook.md)](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/herdr-runbook.md)

---

## 2. Tiêu Chuẩn Nghiệm Thu & Cổng Hoàn Thành (Completion Gates)

- [x] **Gate 1: Contract Verification**: Toàn bộ 5 endpoint backend (`plans`, `my`, `purchase-onetime`, `google-pay/register`, `renew`) được kiểm chứng trực tiếp với Spring Boot backend hoặc mock adapter đúng chuẩn OpenAPI.
- [x] **Gate 2: Zero Dead Code**: Loại bỏ hoàn toàn `TEST_USER_ACCESS_TOKEN`, chuỗi token giả `tok_gpay_wallet_...`, transaction tự chế client-side, và các mã gói cước mồ côi (`ANH_KIM`, `MA_THUAT`).
- [x] **Gate 3: Frontend Endpoint Alignment**: `subscriptionService.ts` đồng bộ đầy đủ kiểu dữ liệu TypeScript, chuẩn hóa xử lý lỗi qua `AppErrorNotice`, truyền đúng `planCode` theo chu kỳ (`SILVER_3M`, `PLATINUM_12M`).
- [x] **Gate 4: Visual & Interactive Polish**: Giao diện `HoloCardPaymentSheet` hiển thị nút CTA 3D tactile bevel `h-11`, kích hoạt thanh toán mượt mà, không giật lag, tổng chiều cao modal chuẩn `767x413px` với `0%` thanh cuộn ngoài ý muốn.
- [x] **Gate 5: Clean Build & Type Check**: `npx tsc --noEmit` đạt exit code `0`, không có lỗi console rò rỉ URL kỹ thuật hay unhandled rejections.

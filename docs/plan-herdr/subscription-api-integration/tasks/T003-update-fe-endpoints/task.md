# Task T003: Cập Nhật & Chuẩn Hóa Endpoint Layer ở Frontend (subscriptionService.ts)

## 1. Kết Quả Nghiệp Vụ Mong Đợi (Observable Business Outcome)
Tầng dịch vụ API `src/services/subscriptionService.ts` được cập nhật đầy đủ để kết nối chính xác với các endpoints thật của Spring Boot ERP, chuẩn hóa interface TypeScript theo đúng DTO backend, và xử lý lỗi chuyên nghiệp qua `getAppErrorMessage`.

## 2. Vì Sao Cần Task Này?
Đảm bảo các hàm gọi API gửi đúng định dạng payload, đúng HTTP method, đúng token Bearer, và không làm crash ứng dụng khi backend trả về lỗi nghiệp vụ.

## 3. Tiền Đề & Handoff Artifacts
- Tiền đề: T002 đã dọn dẹp các token giả và mã rác.
- Handoff bàn giao: Tệp `subscriptionService.ts` và `subscription.ts` chuẩn hóa sẵn sàng cho UI gọi.

## 4. Quy Tắc Áp Dụng
- [BR-SUB-01](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-01-quy-tắc-đồng-bộ-mã-gói-cước-theo-chu-kỳ-plancode-alignment)
- [BR-SUB-03](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-03-bảo-mật-phiên-làm-việc--token-xác-thực-session--token-integrity)
- [BR-SUB-05](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-05-chuẩn-hóa-thông-báo-lỗi-người-dùng-deterministic-error-normalization)

## 5. Ranh Giới Tệp Tin
- **Read**:
  - `src/lib/api.ts`
  - `src/components/ui/AppErrorNotice.tsx`
- **Creates**:
  - `docs/plan-herdr/subscription-api-integration/tasks/T003-update-fe-endpoints/session-log.md`
- **Modifies**:
  - `src/services/subscriptionService.ts`
  - `src/types/subscription.ts`

## 6. Trình Tự Thực Hiện
1. Cập nhật `src/types/subscription.ts` với đầy đủ các DTO:
   - `SubscriptionPlan` với `targetRank`, `billingPeriodMonths`, `priceAmount`.
   - `UserSubscription` với `subscriptionState`, `isTrial`, `expiryTime`.
   - `OneTimePurchaseRequest` với `planCode`, `paymentMethod`, `transactionReference`, `note`.
   - `GooglePayWebRegisterRequest` với `planCode`, `paymentToken`, `cardNetwork`, `lastFour`.
2. Chuẩn hóa `src/services/subscriptionService.ts`:
   - `getSubscriptionPlans()`: Gọi `GET /api/v1/subscriptions/plans`.
   - `getMySubscription()`: Gọi `GET /api/v1/subscriptions/my` với token đăng nhập.
   - `registerGooglePaySubscription(payload)`: Gọi `POST /api/v1/subscriptions/google-pay/register`.
   - `purchaseOneTimeSubscription(payload)`: Gọi `POST /api/v1/subscriptions/purchase-onetime`.
   - `cancelSubscription(id, reason)`: Gọi `POST /api/v1/subscriptions/{id}/cancel`.
3. Bọc toàn bộ các khối `catch` hoặc `!response.ok` qua `getAppErrorMessage()`.
4. Ghi nhận kết quả vào `session-log.md`.

## 7. Tiêu Chí Nghiệm Thu
- [ ] Mọi endpoint gọi đúng URL `/api/v1/subscriptions/...`
- [ ] Không có `any` unhandled, kiểu dữ liệu strict TypeScript.

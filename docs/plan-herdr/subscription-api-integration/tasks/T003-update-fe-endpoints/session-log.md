# Session Log: Task T003 - Cập Nhật & Chuẩn Hóa Endpoint Layer ở Frontend

- **Task ID**: T003
- **Trạng thái**: DONE
- **Bắt đầu lúc**: 2026-10-15T12:27:45+07:00
- **Hoàn thành lúc**: 2026-10-15T12:28:50+07:00

---

## 1. Ngữ Cảnh & Ranh Giới Đã Kiểm Tra
- **Initiative Branch**: `feat/subscription-real-api-integration`
- **Tài liệu quy chuẩn đã đối soát**:
  - `business-rules.md` (BR-SUB-01, BR-SUB-03, BR-SUB-05)
  - `tasks/T003-update-fe-endpoints/task.md`
- **Tệp nguồn đã tác động**:
  - `src/types/subscription.ts`
  - `src/services/subscriptionService.ts`

---

## 2. Công Việc Đã Thực Hiện
1. Cập nhật `src/types/subscription.ts`:
   - Bổ sung `GOOGLE_PAY` vào union type `PaymentMethod`.
   - Chuẩn hóa `planCode: 'SILVER_3M' | 'GOLD_6M' | 'PLATINUM_12M' | string` trong `SubscriptionPlan`.
   - Chuẩn hóa `OneTimePurchaseRequest` với trường `transactionReference` bắt buộc (khớp `@NotBlank` backend DTO).
   - Đảm bảo `UserSubscription` khớp với `UserSubscriptionResponse` của backend Spring Boot.
2. Cập nhật `src/services/subscriptionService.ts`:
   - Bọc toàn bộ các hàm gọi API với `getEffectiveAccessToken()` kiểm tra token đăng nhập trước khi gửi request.
   - Hàm `getMySubscription()` trả về `null` an toàn nếu chưa đăng nhập hoặc gặp mã 401/403 thay vì ném lỗi vỡ màn hình.
   - Bổ sung endpoint `renewSubscription(id: number)` gọi `POST /api/v1/subscriptions/{id}/renew` để hỗ trợ luồng gia hạn định kỳ MIT và hạch toán Fineract.
   - Toàn bộ các khối xử lý lỗi HTTP đều được bọc qua bộ chuẩn hóa `getAppErrorMessage()`, tuyệt đối không để lộ URL kỹ thuật, mã stack trace ra tầng client.

---

## 3. Bằng Chứng Thực Nghiệm (Verification Evidence)
1. **Kiểm tra hợp đồng endpoint layer**:
   - `GET /api/v1/subscriptions/plans`
   - `GET /api/v1/subscriptions/my`
   - `POST /api/v1/subscriptions/google-pay/register`
   - `POST /api/v1/subscriptions/purchase-onetime`
   - `POST /api/v1/subscriptions/{id}/renew`
   - `POST /api/v1/subscriptions/{id}/cancel`
2. **Biên dịch TypeScript**:
   - Lệnh: `npx tsc --noEmit`
   - Kết quả: Exit code `0` (Clean build, không có lỗi kiểu dữ liệu).

---

## 4. Bàn Giao & Node Kế Tiếp
- Tầng dịch vụ API đã đồng bộ hoàn hảo với backend và chuẩn hóa type-safety.
- Sẵn sàng bàn giao cho **T004: Tích Hợp Nút CTA, Tối Ưu Khung 767x413px & Đồng Bộ Mã Gói (UI Polish)**.

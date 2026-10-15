# Task T001: Kiểm thử & Khảo sát Hợp đồng Endpoint Thật (Live Backend API Verification)

## 1. Kết Quả Nghiệp Vụ Mong Đợi (Observable Business Outcome)
Báo cáo toàn diện hiện trạng kết nối của cổng backend `8080` và cổng Fineract `8443`, xác minh chính xác đường dẫn URL, HTTP methods, headers, tham số bắt buộc và cấu trúc phản hồi của 5 endpoints quản lý gói thuê bao.

## 2. Vì Sao Cần Task Này?
Tránh việc phỏng đoán API (Anti-Speculation) trước khi sửa đổi frontend; đảm bảo hợp đồng dữ liệu giữa frontend và Spring Boot ERP khớp 100% với backend thực tế.

## 3. Tiền Đề & Handoff Artifacts
- Tiền đề: Không có (Node gốc của đồ thị).
- Handoff bàn giao: Báo cáo xác thực hợp đồng API và trạng thái sẵn sàng của backend.

## 4. Quy Tắc Áp Dụng
- [BR-SUB-01](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-01-quy-tắc-đồng-bộ-mã-gói-cước-theo-chu-kỳ-plancode-alignment)
- [BR-SUB-02](file:///C:/Users/ddicg/orca/noname/docs/plan-herdr/subscription-api-integration/business-rules.md#br-sub-02-phân-định-bản-chất-dòng-tiền--sổ-cái-fineract-payment-flow-separation)

## 5. Ranh Giới Tệp Tin
- **Read**:
  - `C:/Users/ddicg/orca/erp_springboot-experiment/src/main/java/com/ddicg/erp/modules/subscription/controller/SubscriptionController.java`
  - `C:/Users/ddicg/orca/erp_springboot-experiment/src/main/java/com/ddicg/erp/modules/subscription/service/SubscriptionService.java`
  - `C:/Users/ddicg/orca/erp_springboot-experiment/src/main/resources/db/migration/V22__seed_default_subscription_plans.sql`
  - `C:/Users/ddicg/orca/erp_springboot-experiment/docs/specs/google-pay-web-and-fineract-subscription.md`
- **Creates**:
  - `docs/plan-herdr/subscription-api-integration/tasks/T001-real-endpoint-verification/session-log.md`
- **Modifies**: Không

## 6. Trình Tự Thực Hiện
1. Kiểm tra trạng thái cổng `8080` (Spring Boot ERP) và `8443` (Apache Fineract).
2. Đối soát 5 endpoints công khai:
   - `GET /api/v1/subscriptions/plans`
   - `GET /api/v1/subscriptions/my`
   - `POST /api/v1/subscriptions/purchase-onetime`
   - `POST /api/v1/subscriptions/google-pay/register`
   - `POST /api/v1/subscriptions/{id}/renew`
3. Trích xuất danh mục gói cước thực tế từ file migration `V22__seed_default_subscription_plans.sql`.
4. Ghi nhận kết quả vào `session-log.md`.

## 7. Tiêu Chí Nghiệm Thu
- [ ] Xác định rõ cổng 8080 đang online hay offline.
- [ ] Hợp đồng 5 API được chuẩn hóa chi tiết và sẵn sàng cho tầng client.

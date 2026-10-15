# Kế Hoạch Kiểm Định & Tích Hợp (Validation & Integration Plan)

Tài liệu này xác định ma trận kiểm định nghiêm ngặt cho toàn bộ sáng kiến `subscription-api-integration`, liên kết trực tiếp với các quy tắc nghiệp vụ trong `business-rules.md`.

---

## 1. Ma Trận Kiểm Định Từng Task (Task Verification Matrix)

| Task ID | Nội dung kiểm định | Lệnh kiểm tra / Thao tác | Kết quả kỳ vọng | Vị trí bằng chứng |
| :--- | :--- | :--- | :--- | :--- |
| **T001** | Kiểm tra trạng thái cổng kết nối và đối soát OpenAPI backend | `Test-NetConnection -Port 8080 -ComputerName localhost` | Xác định rõ port 8080 và 8443; 5 endpoint được đối soát 100% | `tasks/T001/session-log.md` |
| **T002** | Quét sạch token rác và mã giả lập client | `git grep "TEST_USER_ACCESS_TOKEN"`<br>`git grep "tok_gpay_wallet_"` | Exit code 1 (Không tìm thấy chuỗi rác nào tồn tại trong codebase) | `tasks/T002/session-log.md` |
| **T003** | Kiểm tra cú pháp và tính toàn vẹn kiểu dữ liệu API | `npx tsc --noEmit` | Exit code 0, không có lỗi kiểu dữ liệu ở `subscriptionService.ts` | `tasks/T003/session-log.md` |
| **T004** | Kiểm định giao diện, nút CTA và layout budget | Mở trình duyệt `http://localhost:3000`, click mở bảng giá | Nút CTA hiển thị rõ, 4 thẻ phương thức gọn gàng, 0% thanh cuộn dọc | `tasks/T004/session-log.md` |
| **T005** | Kiểm định toàn trình E2E và trạng thái giao dịch | Thử nghiệm click nút CTA thanh toán, quan sát mạng và console | Spinner xoay, phản hồi lỗi/thành công chuẩn xác, không rò rỉ URL | `tasks/T005/session-log.md` |

---

## 2. Tiêu Chuẩn Bằng Chứng Thực Nghiệm Bắt Buộc (Mandatory Empirical Evidence)

Theo điều khoản chống kiểm định bề mặt trong `AGENTS.md`:
1. **Physical Render Metrics**:
   - Khung modal phải đạt kích thước hiển thị `rect.width == 767` và `rect.height == 413` (dung sai ±4px do viền bo tròn).
   - Nút CTA phải có computed style: `display !== 'none'`, `visibility !== 'hidden'`, `opacity !== '0'`.
2. **Zero Uncaught Error Boundary**:
   - Không có React Error Boundary fallback nào được kích hoạt.
   - Không có Unhandled Promise Rejection hoặc Uncaught TypeErrors trong DevTools Console.
3. **Zero Scrollbar Policy**:
   - `scrollHeight <= clientHeight` trên phần tử container cột phải `md:col-span-7`.

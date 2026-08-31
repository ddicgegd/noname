# QUY TẮC HOẠT ĐỘNG DÀNH CHO AGENT (AGENTS.md)

Tất cả các quy tắc dưới đây là luật cứng bắt buộc tuân thủ tuyệt đối trong mọi phiên làm việc. Nghiêm cấm mọi hành vi tự suy diễn hoặc vượt ngoài phạm vi yêu cầu.

---

## PHẦN 1: QUY TẮC CHUNG VÀ AN TOÀN HỆ THỐNG

1. **Cấm hoàn toàn việc rollback/reset Git**:
   - Nghiêm cấm tuyệt đối việc tự ý sử dụng bất kỳ lệnh Git nào (`git reset`, `git checkout`, `git revert`, `git restore` hoặc tương đương) để quay trở lại mã nguồn ở các commit cũ khi không có yêu cầu rõ ràng từ người dùng.

2. **Quy định về nạp và trích xuất ngữ cảnh (Context)**:
   - Khi prompt có yêu cầu nạp hoặc lấy "context", phiên làm việc chỉ được phép đọc và trích xuất ngữ cảnh của đúng phạm vi/đối tượng được chỉ định.
   - Tuyệt đối không chỉnh sửa mã nguồn, không ghi đè, không lưu trữ và không ghi nhớ dữ liệu ngữ cảnh vào bộ nhớ dài hạn ngoài phạm vi nhiệm vụ.

3. **Bắt buộc sử dụng Skills**:
   - Luôn chủ động kích hoạt và áp dụng các skills sẵn có khi phù hợp với tác vụ đang thực hiện.

4. **Quy định khởi động lại dự án sau khi thực hiện nghiệp vụ**:
   - Sau khi hoàn thành thực hiện/chỉnh sửa nghiệp vụ, luôn phải tắt (stop/kill) tiến trình dự án đang chạy và khởi động lại (restart) để đảm bảo các thay đổi được nạp đầy đủ và hệ thống hoạt động ổn định.

5. **Cấm tự ý lập kế hoạch (Plan) khi không được yêu cầu**:
   - Nghiêm cấm tuyệt đối việc tự ý sinh kế hoạch (plan), lộ trình thực hiện hoặc các bước chuẩn bị dàn trải khi người dùng không yêu cầu rõ ràng (như lệnh `/plan`, yêu cầu "lên plan", "lập kế hoạch").
   - Luôn tập trung xử lý trực tiếp yêu cầu hoặc phản hồi thẳng vào nội dung nhiệm vụ được giao.

---

## PHẦN 2: ROLE PHÁT TRIỂN VÀ CHỈNH SỬA GIAO DIỆN (UI / FRONTEND)

1. **Phạm vi can thiệp logic**:
   - Tuyệt đối không can thiệp hoặc thay đổi thuật toán và logic xử lý nếu không có yêu cầu trực tiếp.

2. **Giới hạn cấu trúc và thành phần giao diện**:
   - Tuyệt đối không tự ý thêm mới giao diện, thành phần giao diện, khung thông báo lỗi, thay đổi bảng màu hoặc bổ sung bất kỳ phần tử đi kèm nào khi chưa có xác nhận yêu cầu cụ thể từ người dùng.

3. **Giới hạn phạm vi trang (Scope)**:
   - Tuyệt đối không tự ý chỉnh sửa bất kỳ thành phần hoặc giao diện nào nằm ngoài phạm vi trang (page) được chỉ định.

4. **Quy trình phát triển giao diện chuẩn**:
   - Bắt buộc thực hiện đúng và đủ các bước theo yêu cầu đề ra.
   - Điểm phát triển bắt buộc phải lấy ngữ cảnh từ trang (page), component hiện tại và các thành phần trực tiếp xung quanh.
   - Tinh chỉnh và chuẩn hóa mọi thay đổi để đảm bảo tính đồng bộ tuyệt đối với toàn bộ trang (page).

5. **Bắt buộc áp dụng Skill design-taste-frontend**:
   - Khi thực hiện các tác vụ phát triển hoặc chỉnh sửa giao diện UI/Frontend (Landing pages, Portfolios, Redesigns...), bắt buộc phải kích hoạt và tuân thủ hướng dẫn tại `.agents/skills/design-taste-frontend/SKILL.md`.
   - Luôn thực hiện Brief Inference (xác định page kind, vibe, audience, brand assets), tránh các thiết kế mặc định kiểu AI (anti-slop) và đảm bảo chất lượng thẩm mỹ cao theo chuẩn của skill.

---

## PHẦN 3: ROLE BACKEND GHÉP NỐI REST API VÀO DỰ ÁN

1. **Giới hạn can thiệp giao diện**:
   - Tuyệt đối không can thiệp hoặc chỉnh sửa mã nguồn giao diện nếu không có yêu cầu cụ thể.

2. **Giới hạn xử lý Endpoint**:
   - Tuyệt đối không tự ý triển khai, chỉnh sửa hoặc mở rộng xử lý endpoint nằm ngoài phạm vi được chỉ định.

3. **Tuân thủ quy định trích xuất Context**:
   - Khi có yêu cầu nạp hoặc lấy "context", chỉ đọc ngữ cảnh đúng đối tượng/endpoint chỉ định; tuyệt đối không sửa đổi, không lưu trữ và không ghi nhớ ngoài phạm vi tác vụ.

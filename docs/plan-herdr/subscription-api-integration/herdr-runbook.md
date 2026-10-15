# Sổ Tay Vận Hành Điều Phối (Herdr Runbook)

Tài liệu hướng dẫn điều phối thực thi các task trong sáng kiến `subscription-api-integration` sử dụng môi trường Herdr runtime kết hợp Antigravity (`agy`).

---

## 1. Trạng Thái Môi Trường Thực Thi (Runtime Discovery)
- **Herdr Server Status**: `running` (version `0.9.3`, socket: `C:\Users\ddicg\AppData\Roaming\herdr\herdr.sock`).
- **Active Workspace**: `w3`.
- **Active Coordinating Pane**: `w3:pF` (tab: `w3:t4`, agent: `agy`, cwd: `C:\Users\ddicg\orca\noname`, session: `d199dda9-be95-485b-a2c3-4abe8908379b`).
- **Initiative Branch**: `feat/subscription-real-api-integration` (base commit: `129c5f9`).
- **Cơ chế điều phối**: Điều phối trực tiếp qua coordinating session `w3:pF`, tản task tuần tự theo đồ thị `work-map.yaml`, ghi nhận kết quả và session-log cho từng node.

---

## 2. Quy Trình Điều Phối Từng Node (Dispatch Procedures)

### Bước 1: Khởi tạo Nhánh Sáng Kiến (Initiative Branch)
Trước khi thực hiện bất kỳ sửa đổi mã nguồn nào:
```powershell
git checkout -b feat/subscription-real-api-integration
```

### Bước 2: Kiểm tra Trạng Thái & Topology Pane trong Herdr
```powershell
herdr status
herdr pane list
herdr pane layout --pane "w3:pF"
```

### Bước 3: Thực Thi Từng Task Node Theo Ranh Giới File
Với mỗi node ở trạng thái `READY`:
1. Tải toàn bộ ngữ cảnh (`task.md`, `business-rules.md`, các file `read`).
2. Sửa đổi các file trong giới hạn `modifies`.
3. Chạy lệnh kiểm định tương ứng theo `validation-and-integration.md`.
4. Ghi nhận log đầy đủ vào `session-log.md` theo cấu trúc chuẩn.
5. Cập nhật trạng thái node trong `work-map.yaml` sang `DONE` và chuyển node tiếp theo sang `READY`.

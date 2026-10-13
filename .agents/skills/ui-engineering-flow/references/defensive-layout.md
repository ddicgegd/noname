# Kỹ Thuật Defensive CSS & Layout (Chống Vỡ Bố Cục)

Tài liệu cung cấp các công thức CSS phòng vệ giúp UI không bao giờ bị vỡ khi gặp dữ liệu thực tế (text quá dài, màn hình nhỏ, giật layout).

---

## 1. Flexbox Truncate Shield (`min-w-0`)

Mặc định mọi flex item đều có thuộc tính CSS ngầm là `min-width: auto`. Khi text bên trong quá dài, dù bạn có đặt class `truncate`, flex item đó vẫn sẽ phình to ra và đẩy vỡ layout cha.

### ✅ Công thức chuẩn:
```tsx
<div className="flex items-center gap-3">
  <Avatar />
  {/* BẮT BUỘC: min-w-0 và flex-1 đi kèm nhau */}
  <div className="min-w-0 flex-1">
    <p className="truncate font-semibold">{user.name}</p>
    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
  </div>
  <Button variant="ghost" size="sm">Xem</Button>
</div>
```

---

## 2. Hệ Thống Z-Index Tokens (Cấm Số Ma Thuật)

Tuyệt đối cấm đặt `z-[999]` hoặc `z-[9999]`. Cần tuân thủ phân lớp z-index:

| Token | Z-Index | Phạm vi sử dụng |
| :--- | :--- | :--- |
| `z-base` | `0` | Nội dung nền, card, bảng |
| `z-sticky` | `10` | Header cố định, Navbar, Sticky Table Header |
| `z-dropdown` | `20` | Popover, Select, Autocomplete suggestions |
| `z-overlay` | `30` | Backdrop đen mờ của Modal / Drawer |
| `z-modal` | `40` | Nội dung hộp thoại Dialog / Modal |
| `z-toast` | `50` | Thông báo nổi (Toaster, Alert popups) |
| `z-tooltip` | `60` | Tooltip giải thích (luôn nổi cao nhất) |

---

## 3. Khớp Kích Thước Skeleton Để Chống Layout Shift (CLS)

Khi tải dữ liệu, việc giao diện co giật (Cumulative Layout Shift) làm tụt điểm UX và Lighthouse.

### ✅ Công thức chuẩn:
- Chiều cao của Skeleton item phải khớp chính xác 100% với chiều cao của Data item thật:
```tsx
// Table row thật cao h-12 -> Skeleton row cũng bắt buộc cao h-12
export function TableRowSkeleton() {
  return (
    <div className="flex h-12 items-center gap-4 border-b px-4">
      <div className="h-4 w-8 animate-pulse rounded bg-muted" />
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}
```

---

## 4. Scroll Containment (Chống Double Scrollbars)

Để tránh hiện tượng xuất hiện 2 thanh cuộn lồng nhau (vừa cuộn trang vừa cuộn bảng):
- Luôn chỉ định rõ ràng vùng cuộn bằng: `overflow-y-auto` kèm chiều cao ràng buộc (`max-h-[calc(100vh-theme(spacing.32))]`).
- Sử dụng `overscroll-behavior: contain` trên các panel drawer/modal để không bị cuộn trang cha khi cuộn đến đáy modal.

---

## 5. Kỹ Thuật Sub-Pixel Border & Bevel (Chống Vỡ Nét Khi Zoom Trình Duyệt)

### ❌ Bẫy CSS: Dùng Physical Border (`border-t`, `border-b`)
Khi người dùng zoom trình duyệt (125%, 150%, 200%), rasterizer của trình duyệt buộc phải làm tròn số pixel vật lý (1px biến thành 2px, 3px). Viền sáng và viền tối sẽ bị lộ thô, răng cưa cực gắt.

### ✅ Công thức chuẩn công nghiệp: Layered Inset Box-Shadow
Thay vì dùng `border` vật lý, hãy ủy quyền toàn bộ hiệu ứng viền nổi khối (Bevel 3D) cho `box-shadow` dạng `inset`. GPU trình duyệt sẽ khử răng cưa (antialiasing) sub-pixel, giữ viền luôn mảnh và mịn như vector ở mọi tỷ lệ zoom:

```tsx
// Thay thế: border-t border-t-white/xx border-b border-b-black/yy
// Bằng Inset Box-Shadow khử răng cưa:
className={cn(
  "border-0", // Bỏ hoàn toàn border vật lý
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(0,0,0,0.25),0_2px_8px_-2px_rgba(0,0,0,0.1)]",
  "backdrop-blur-md"
)}
```

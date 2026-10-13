# Kỹ Thuật Phân Tầng Dữ Liệu & State (The 4-Tier State Taxonomy)

Tài liệu hướng dẫn phân loại state chuẩn xác, loại bỏ triệt để thói quen nhét tất cả vào `useState` hoặc `useEffect`.

---

## 4 Tầng State Trong Ứng Dụng Web Hiện Đại

```
┌─────────────────────────────────────────────────────────────┐
│ 1. URL STATE (Next.js nuqs / useSearchParams)               │
│    Search terms, Active filters, Tab index, Modal open IDs  │
├─────────────────────────────────────────────────────────────┤
│ 2. SERVER CACHE STATE (TanStack Query / SWR / RSC)          │
│    Data từ REST/GraphQL API, Caching, Revalidation          │
├─────────────────────────────────────────────────────────────┤
│ 3. FORM STATE (React Hook Form + Zod)                       │
│    Input values, Dirty check, Validation errors             │
├─────────────────────────────────────────────────────────────┤
│ 4. EPHEMERAL UI STATE (React useState thuần)                │
│    Tooltip hover, Animation toggle, Dropdown menu đóng/mở   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. URL State: Giữ Trạng Thái Khi Reload / Chia Sẻ Link

Mọi filter hoặc trạng thái màn hình mà người dùng mong muốn giữ lại khi **F5** hoặc **copy link gửi đồng nghiệp** bắt buộc phải sync lên URL:

```tsx
// Chuẩn dùng nuqs (Next.js):
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

export function useOrderFilterParams() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('ALL'));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [activeId, setActiveId] = useQueryState('orderId', parseAsString);

  return { search, setSearch, status, setStatus, page, setPage, activeId, setActiveId };
}
```

---

## 2. Server Cache State: Cấm Dùng `useState` Để Chứa Dữ Liệu API

### ❌ Anti-pattern:
```tsx
// SAI: Dễ race condition, không cache, không revalidate tự động
const [orders, setOrders] = useState([]);
useEffect(() => {
  fetch('/api/orders').then(res => res.json()).then(setOrders);
}, []);
```

### ✅ Kỹ thuật chuẩn:
```tsx
// ĐÚNG: Tự động deduplicate, cache, refetch khi focus
export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}
```

---

## 3. Form State: Độc Lập Với Global State

- Form bắt buộc dùng thư viện quản lý field không re-render (như `react-hook-form`).
- Luôn kiểm tra schema bằng Zod trước khi submit.
- Xử lý trạng thái: `isSubmitting`, `isValid`, inline error mapping.

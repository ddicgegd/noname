# Kỹ Thuật Kiến Trúc Component (Compound & Slot Pattern)

Tài liệu này hướng dẫn kỹ thuật bóc tách và phân rã component giao diện trong React/Next.js để tránh viết mã nguyên khối (monolith) và bùng nổ props (prop explosion).

---

## 1. Quy Chuẩn Sizing & Tổ Chức File (Feature-Based)

- **Quy tắc 150 dòng**: Nếu 1 file component vượt quá 150 dòng, bắt buộc phải phân rã thành các sub-components hoặc custom hooks.
- **Tổ chức thư mục theo Feature**:
  ```text
  features/orders/
  ├── components/              # Các UI con (Presentational components)
  │   ├── order-table.tsx      # Chỉ hiển thị table
  │   ├── order-toolbar.tsx    # Chỉ hiển thị thanh tìm kiếm, filter
  │   ├── order-skeleton.tsx   # Khung xương loading
  │   └── order-dialog.tsx     # Modal chi tiết
  ├── hooks/                   # Business logic, query, state
  │   └── use-order-filters.ts
  ├── types/                   # Interface và Zod Schema
  │   └── order.schema.ts
  └── index.tsx                # Composition Root (ghép các mảnh lại)
  ```

---

## 2. Kỹ Thuật Compound Components & Slot Pattern

### ❌ Anti-pattern: Monolithic Props Explosion
```tsx
// SAI: Khó bảo trì, re-render thừa thãi, khó mở rộng
<OrderTable 
  data={data} 
  showSearch={true} 
  searchPlaceholder="Tìm kiếm..." 
  filterStatus="ALL" 
  onFilterChange={setFilter} 
  modalOpen={isOpen} 
  onModalClose={closeModal} 
/>
```

### ✅ Kỹ thuật chuẩn: Compound & Slots
```tsx
// ĐÚNG: Phân quyền rõ ràng, linh hoạt thay đổi bố cục
export function OrderFeature() {
  return (
    <div className="flex flex-col gap-4">
      {/* Slot 1: Toolbar */}
      <OrderToolbar>
        <OrderSearchInput />
        <OrderStatusFilter />
        <OrderExportButton />
      </OrderToolbar>

      {/* Slot 2: Table */}
      <OrderTable>
        <OrderTable.Header />
        <OrderTable.Body />
        <OrderTable.Pagination />
      </OrderTable>

      {/* Slot 3: Dialog */}
      <OrderDetailDialog />
    </div>
  );
}
```

---

## 3. Quy Tắc Tách Presentational vs Container

- **Presentational Component**:
  - Không trực tiếp gọi API (`useQuery`) hay can thiệp router.
  - Nhận props thuần túy và phát event qua callbacks (`onSelect`, `onChange`).
  - Dễ dàng viết Storybook / Unit Test.
- **Container Component (hoặc Feature Root)**:
  - Nơi duy nhất gọi `useQuery`, lấy URL params, bọc Context Provider.
  - Ghép các Presentational components lại với nhau.

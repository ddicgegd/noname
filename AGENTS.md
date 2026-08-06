# Hướng dẫn Phát triển & Kiến trúc Dự án (Horizon Accounts Center)

## 1. Định hướng Thiết kế & Trải nghiệm Người dùng (UX/UI)
- **Tên thương hiệu:** Horizon Mobile / Horizon Web.
- **Trọng tâm giao diện chính (User Page):** Thiết kế theo mô hình **Trung tâm Tài khoản tập trung (Accounts Center)** lấy cảm hứng từ cấu trúc của Meta Accounts Center.
- **Cấu trúc màn hình:**
  - Tổng hợp toàn bộ các hoạt động quản lý, thiết lập cá nhân, cấu hình mật khẩu & bảo mật và cổng chẩn đoán BFF Gateway vào một giao diện thống nhất.
  - Sử dụng bố cục thẻ (cards) kết hợp với các phân mục Accordion thu gọn/mở rộng mượt mà (ví dụ: "Đổi tên đăng nhập (Username)", "Mật khẩu và bảo mật") để tối ưu diện tích hiển thị và tăng tính tập trung.

## 2. Thiết kế Kỹ thuật & Quản lý Phiên làm việc (Token & Authorization)
- **Nguyên lý xác thực hợp nhất:** 
  - Token đăng nhập hiện tại (`Bearer Access Token` lưu trữ trong `horizon_redis_profile`) là chứng chỉ tối cao để xác thực cho mọi tác vụ quản trị nội bộ.
  - Sau khi backend nâng cấp xong luồng xử lý token, tất cả các tác vụ thay đổi cấu hình tài khoản (như cập nhật tên đăng nhập `Username`, cập nhật mật khẩu mới, cập nhật email/số điện thoại) sẽ sử dụng trực tiếp Token này gửi kèm trong Header `Authorization: Bearer <Token>` tới BFF Gateway API để thực thi mà không cần cơ chế xác thực riêng lẻ phức tạp.
- **Tương tác API & BFF Console:**
  - Tích hợp cổng gác chẩn đoán BFF Diagnostic Console để cho phép quản trị viên hoặc người dùng nâng cao trực tiếp kiểm tra phản hồi JSON thực tế của cổng trung gian thông qua truy vấn REST API hoặc GraphQL Query.

## 3. Product Page - Search Field Contract (để triển khai sau)
- **Chưa triển khai lại UI search ở bước hiện tại.** Khi làm phần tìm kiếm Product sau này, chỉ bám theo contract này để tránh search thiếu field hoặc map sai API.
- **Endpoint GraphQL chính cho danh sách Product:** `searchProducts(filter: ProductSearchInput!)`.
- **Keyword search mặc định của thanh tìm kiếm Product:**
  - UI nhập tự do sẽ gửi vào `filter.keyword`.
  - `name` và `names[0]` chỉ là alias; gateway sẽ convert sang `keyword` nếu chưa có `keyword`.
  - Các field người dùng kỳ vọng keyword có thể match: `Product.name`, `Product.skuInfo.sku`, `Product.categoryName`, và keyword/index phía backend nếu backend đã hỗ trợ.
- **Field search/filter Product cần giữ đúng tên GraphQL:**
  - Text/SKU: `keyword`, `name`, `names`, `productSkus`, `skus`.
  - Product identity: `ids`, `productIds`.
  - Category: `categorySku`, `categorySkus`, `categoryId`, `categoryIds`.
  - Status: `statuses`.
  - Metrics: `minSoldQuantity`, `maxSoldQuantity`, `minRevenue`, `maxRevenue`, `minOrderCount`, `maxOrderCount`, `minViewCount`, `minRating`, `minReviewCount`.
  - Audit time/user: `createdFrom`, `createdTo`, `updatedFrom`, `updatedTo`, `createdBy`.
  - Paging/sort: `page`, `size`, `sortBy`, `sortDirection`, hoặc nested `paging`.
- **Gateway alias Product cần nhớ:**
  - `productSkus` -> backend `skus`.
  - `ids` -> backend `productIds`.
  - `categorySku` -> gom vào `categorySkus`.
  - `name` -> `keyword` khi chưa có `keyword`.
  - `names[0]` -> `keyword` khi chưa có `keyword` và `name`.
  - `minOrderCount`/`maxOrderCount` -> `minOrders`/`maxOrders`.
  - `minViewCount` -> `minView`.
  - `minReviewCount` -> `minReviews`.
- **Luồng category search của Product:**
  - UI được phép gửi `categorySku` hoặc `categorySkus`.
  - Gateway không forward trực tiếp `categorySkus` xuống `/search-Product`.
  - Gateway phải resolve category SKU sang Product SKU trước, sau đó gọi Product search chính bằng `skus`.
- **Endpoint GraphQL chính cho Attributes search:** `searchAttributes(filter: AttributesSearchInput!)`.
- **Field search/filter Attributes cần giữ đúng tên GraphQL:**
  - Text/SKU: `keyword`, `name`, `names`, `skus`.
  - Product link: `productSku`, `productSkus`, `productId`, `productIds`.
  - Attribute identity: `ids`.
  - Status: `statuses`.
  - Price: `minPrice`, `maxPrice`, `minSalePrice`, `maxSalePrice`, `minCostPrice`, `maxCostPrice`.
  - Metrics: `minSoldQuantity`, `maxSoldQuantity`.
  - Audit time/user: `createdFrom`, `createdTo`, `updatedFrom`, `updatedTo`, `createdBy`.
  - Paging/sort: `page`, `size`, `sortBy`, `sortDirection`, hoặc nested `paging`.
- **Gateway alias Attributes cần nhớ:**
  - `name` -> `keyword` khi chưa có `keyword`.
  - `names[0]` -> `keyword` khi chưa có `keyword` và `name`.
  - `productSku`/`productSkus` được forward vào `/api/merchandise/search-Attributes`; backend tự resolve sang Product ID.
- **Endpoint GraphQL chính cho Category search:** `searchCategories(filter: CategorySearchInput!)`.
- **Field search/filter Category cần giữ đúng tên GraphQL:**
  - Text/SKU: `keyword`, `names`, `skus`.
  - Category identity: `ids`.
  - Audit time/user: `createdFrom`, `createdTo`, `updatedFrom`, `updatedTo`, `createdBy`.
  - Paging/sort: `page`, `size`, `sortBy`, `sortDirection`, hoặc nested `paging`.

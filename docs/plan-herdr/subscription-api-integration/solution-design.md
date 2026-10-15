# Thiết Kế Giải Pháp Kỹ Thuật (Solution Design)

## 1. Kiến Trúc Tổng Thể & Luồng Dữ Liệu

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (:3000)                      │
│                                                             │
│   PricingSection.tsx ──(chọn gói & chu kỳ)──► HoloCard      │
│            │                                    │           │
│      (FLIP Morphing)                      (3D Tilt & Foil)  │
│            ▼                                    ▼           │
│   HoloCardPaymentSheet.tsx ◄────────────────────┘           │
│     ├── Segmented Control (3 tháng vs 1 năm)                │
│     ├── 4 Thẻ phương thức (Google Pay, MoMo, Card, VNPay)   │
│     └── Nút Checkout CTA Button (h-11, 3D Bevel)            │
│            │                                                │
│            ▼                                                │
│   subscriptionService.ts (getUnifiedAccessToken)            │
└────────────┬─────────────────────────────┬──────────────────┘
             │                             │
             │ (POST /google-pay/register) │ (POST /purchase-onetime)
             ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Spring Boot ERP Gateway (:8080)             │
│                                                             │
│   SubscriptionController ────► SubscriptionService          │
│     ├── GooglePayWebService      ├── Oracle DB (Seq & Plans)│
│     └── CustomerPaymentProfiles  └── FineractJournalService │
└──────────────────────────────────────────┬──────────────────┘
                                           │ (Bút toán kế toán kép)
                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Apache Fineract Core Banking (:8443)        │
│       POST /journalentries (Nợ TK 1121 Bank / Có TK 5111 Rev)│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Đặc Tả Chi Tiết Hợp Đồng Dữ Liệu (API Contracts & DTOs)

### 2.1. Lấy danh sách gói cước hoạt động
- **Endpoint**: `GET /api/v1/subscriptions/plans`
- **Headers**: `Content-Type: application/json`
- **Response `200 OK`**:
  ```json
  {
    "code": 200,
    "message": "Lấy danh sách gói thành công",
    "data": [
      {
        "id": 1,
        "planCode": "SILVER_3M",
        "name": "Gói Bạc 3 Tháng",
        "targetRank": "SILVER",
        "billingPeriodMonths": 3,
        "freeTrialDays": 30,
        "priceAmount": 320000.00,
        "currency": "VND",
        "isActive": true,
        "description": "Ưu đãi 30 ngày dùng thử miễn phí, thời hạn sử dụng 3 tháng, hạng Bạc"
      },
      {
        "id": 2,
        "planCode": "GOLD_6M",
        "name": "Gói Vàng 6 Tháng",
        "targetRank": "GOLD",
        "billingPeriodMonths": 6,
        "freeTrialDays": 30,
        "priceAmount": 590000.00,
        "currency": "VND",
        "isActive": true,
        "description": "Ưu đãi 30 ngày dùng thử miễn phí, thời hạn sử dụng 6 tháng, hạng Vàng"
      },
      {
        "id": 3,
        "planCode": "PLATINUM_12M",
        "name": "Gói Bạch Kim 12 Tháng",
        "targetRank": "PLATINUM",
        "billingPeriodMonths": 12,
        "freeTrialDays": 30,
        "priceAmount": 990000.00,
        "currency": "VND",
        "isActive": true,
        "description": "Ưu đãi 30 ngày dùng thử miễn phí, thời hạn sử dụng 12 tháng, hạng Bạch Kim"
      }
    ]
  }
  ```

### 2.2. Đăng ký gói qua Google Pay Web (Recurring MIT)
- **Endpoint**: `POST /api/v1/subscriptions/google-pay/register`
- **Headers**: `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "planCode": "PLATINUM_12M",
    "paymentToken": "encrypted_payment_token_string",
    "cardNetwork": "VISA",
    "lastFour": "4242"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "code": 200,
    "message": "Đăng ký gói dùng thử Google Pay Web thành công",
    "data": {
      "id": 101,
      "userId": 1,
      "planCode": "PLATINUM_12M",
      "planName": "Gói Bạch Kim 12 Tháng",
      "targetRank": "PLATINUM",
      "billingPeriodMonths": 12,
      "subscriptionState": "TRIALING",
      "isTrial": true,
      "startTime": "2026-10-15T12:00:00",
      "expiryTime": "2026-11-14T12:00:00",
      "autoRenewing": true,
      "paymentProfileId": "vault_profile_123"
    }
  }
  ```

### 2.3. Mua gói trả tiền một lần (One-Time Purchase)
- **Endpoint**: `POST /api/v1/subscriptions/purchase-onetime`
- **Headers**: `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "planCode": "SILVER_3M",
    "paymentMethod": "VNPAY",
    "transactionReference": "VNPAY_TXN_1791928374",
    "note": "Thanh toán gói Bạc 3 tháng"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "code": 200,
    "message": "Mua gói dịch vụ thành công",
    "data": {
      "id": 102,
      "userId": 1,
      "planCode": "SILVER_3M",
      "planName": "Gói Bạc 3 Tháng",
      "targetRank": "SILVER",
      "billingPeriodMonths": 3,
      "subscriptionState": "ACTIVE",
      "isTrial": false,
      "startTime": "2026-10-15T12:00:00",
      "expiryTime": "2027-01-15T12:00:00",
      "autoRenewing": false
    }
  }
  ```

---

## 3. Kiến Trúc Giao Diện & Tính Toán Kích Thước (Layout Budget & Styling)

### 3.1. Phân Bổ Kích Thước Khung Cột Phải (Height Budget: 369px)
| Thành phần giao diện | Chiều cao / Kích thước | Margin / Padding | Tổng tích lũy |
| :--- | :--- | :--- | :--- |
| **Segmented Control** (Kỳ thanh toán) | `36px` | `mb-2.5` (`10px`) | `46px` |
| **Khoảng đệm boong thẻ** (Deck padding) | - | `p-1 sm:p-1.5` (`8px`) | `54px` |
| **4 Thẻ Phương thức Thanh toán** | 4 thẻ x `48px` = `192px` | 3 khoảng cách x `gap-2` = `16px` | `262px` |
| **Khoảng cách giữa Deck và Nút CTA** | - | `mt-2.5` (`10px`) | `272px` |
| **Nút Checkout CTA Button** | `h-11` (`44px`) | - | **`316px`** |
| **Dung sai an toàn (Safety Margin)** | - | - | **`53px`** còn lại (< 369px) |

=> **Kết luận**: Tổng chiều cao thực tế `316px` nằm hoàn toàn trong giới hạn hữu dụng `369px`, không gây bất kỳ thanh cuộn nào trên màn hình máy tính (`overflow-y-auto` không bao giờ bị kích hoạt).

### 3.2. Thiết Kế Nút Bấm Checkout CTA 3D Bevel
- Nút CTA sử dụng phong cách tactile bevel cao cấp:
  ```tsx
  <button
    type="button"
    disabled={isProcessing}
    onClick={handlePay}
    className={cn(
      "w-full h-11 sm:h-12 rounded-2xl font-bold font-sans text-sm tracking-tight",
      "flex items-center justify-center gap-2 select-none cursor-pointer transition-all duration-200",
      "shadow-[0_4px_14px_rgba(56,189,248,0.35),0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.45)]",
      "active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none",
      selectedMethod === "gpay"
        ? "bg-gradient-to-b from-[#1a73e8] via-[#1557b0] to-[#0d47a1] text-white border-t border-t-white/40"
        : "bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 text-white border-t border-t-white/50"
    )}
  >
    {isProcessing ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>Đang xử lý giao dịch...</span>
      </>
    ) : (
      <span>{ctaButtonLabel}</span>
    )}
  </button>
  ```

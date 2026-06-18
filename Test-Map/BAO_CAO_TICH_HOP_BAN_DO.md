# BÁO CÁO TÍCH HỢP BẢN ĐỒ THEO DÕI ĐƠN HÀNG

> **Phiên bản:** 1.0.0  
> **Công nghệ:** Leaflet.js + OpenStreetMap (OSRM) + CartoDB  
> **Chi phí:** 100% Miễn phí (Không cần API Key)  
> **File nguồn:** `index.html` (768 dòng, self-contained)

---

## MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Các thư viện & CDN](#2-các-thư-viện--cdn)
3. [Cấu trúc dữ liệu đầu vào (API JSON)](#3-cấu-trúc-dữ-liệu-đầu-vào-api-json)
4. [Xử lý tọa độ động - Vấn đề cốt lõi](#4-xử-lý-tọa-độ-động---vấn-đề-cốt-lõi)
5. [Các thành phần giao diện](#5-các-thành-phần-giao-diện)
6. [Hướng dẫn tích hợp vào dự án thực tế](#6-hướng-dẫn-tích-hợp-vào-dự-án-thực-tế)
7. [Các vướng mắc thường gặp & cách xử lý](#7-các-vướng-mắc-thường-gặp--cách-xử-lý)
8. [Tùy chỉnh nâng cao](#8-tùy-chỉnh-nâng-cao)
9. [Danh sách Public API](#9-danh-sách-public-api)
10. [Tham khảo](#10-tham-khảo)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1. Sơ đồ luồng dữ liệu

```
┌──────────────────┐         ┌──────────────────────────────┐         ┌─────────────────┐
│   Backend API    │  JSON   │   Frontend Engine            │         │   Leaflet Map   │
│  (PHP/Node/...)  │ ──────► │                              │ ──────► │                 │
│                  │         │  processOrderData()          │         │  - TileLayer    │
│  {               │         │  initMapFromAPI()            │         │  - Routing      │
│    order_id      │         │  initializeOrderRouting()    │         │  - Markers      │
│    status        │         │                              │         │  - Popups       │
│    coordinates   │         │  window.OrderTrackingMap     │         │                 │
│  }               │         │    .updateFromAPI()           │         │                 │
└──────────────────┘         └──────────────────────────────┘         └─────────────────┘
```

### 1.2. Các giai đoạn đã triển khai

| Giai đoạn | Mô tả | Trạng thái |
|-----------|-------|-----------|
| **1** | Khởi tạo bản đồ nền + Leaflet Core + CartoDB Voyager | ✅ Hoàn thành |
| **2** | Tích hợp Routing Engine (OSRM) + Leaflet Routing Machine | ✅ Hoàn thành |
| **3** | Tùy biến UI: Polyline Shadow, FontAwesome Marker, Ping Animation | ✅ Hoàn thành |
| **4** | Chuẩn hóa cấu trúc dữ liệu JSON đầu vào + Public API | ✅ Hoàn thành |

---

## 2. CÁC THƯ VIỆN & CDN

### 2.1. Danh sách CDN

```html
<!-- 1. Leaflet Core CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- 2. Leaflet Routing Machine CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />

<!-- 3. FontAwesome 6 (cho Icon Marker) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

<!-- 4. Leaflet Core JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- 5. Leaflet Routing Machine JS -->
<script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
```

> **⚠️ LƯU Ý:** Thứ tự nạp rất quan trọng: CSS → FontAwesome → Leaflet JS → Routing Machine JS. Nạp sai thứ tự sẽ gây lỗi.

### 2.2. Bản đồ nền (TileLayer)

```js
// CartoDB Voyager - phong cách pastel/muted như Apple Maps
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(orderMap);
```

**Các lựa chọn thay thế miễn phí khác:**

| Style | URL | Ghi chú |
|-------|-----|---------|
| **CartoDB Voyager** (đang dùng) | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` | Pastel, màu sắc, giống Apple Maps |
| **CartoDB Positron** | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png` | Tối giản, xám trắng |
| **CartoDB Dark** | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` | Tối, phù hợp dark mode |
| **OpenStreetMap** | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Mặc định, nhiều chi tiết |
| **Stadia Alidade Smooth** | `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png` | Cần API key (bản free có giới hạn) |

---

## 3. CẤU TRÚC DỮ LIỆU ĐẦU VÀO (API JSON)

### 3.1. Định dạng chuẩn

```json
{
  "order_id": "521459",
  "status": "In Sorting Center",
  "coordinates": {
    "pickup": {
      "latitude": 21.028511,
      "longitude": 105.854444
    },
    "dropoff": {
      "latitude": 21.036122,
      "longitude": 105.786133
    }
  }
}
```

### 3.2. Danh sách status hỗ trợ

| Status API | Hiển thị (Tiếng Việt) |
|-----------|----------------------|
| `In Sorting Center` | Tại trung tâm phân loại |
| `Picked Up` | Đã lấy hàng |
| `In Transit` | Đang vận chuyển |
| `Out for Delivery` | Đang giao hàng |
| `Delivered` | Đã giao hàng |

### 3.3. Mở rộng dữ liệu (thêm field tùy chọn)

Bạn có thể thêm các field phụ vào JSON mà không ảnh hưởng đến hệ thống:

```json
{
  "order_id": "521459",
  "status": "In Transit",
  "coordinates": {
    "pickup": {
      "latitude": 21.028511,
      "longitude": 105.854444,
      "address": "123 Phố Huế, Hai Bà Trưng, Hà Nội"    // <-- field mở rộng
    },
    "dropoff": {
      "latitude": 21.036122,
      "longitude": 105.786133,
      "address": "456 Cầu Giấy, Hà Nội"                  // <-- field mở rộng
    }
  },
  "driver_name": "Nguyễn Văn A",                         // <-- field mở rộng
  "estimated_time": "15 phút",                            // <-- field mở rộng
  "vehicle": "Xe tải 1.5 tấn"                            // <-- field mở rộng
}
```

> Hệ thống tự động hiển thị `address` trong UI nếu có. Các field mở rộng có thể được dùng trong Popup hoặc giao diện tùy chỉnh thêm.

---

## 4. XỬ LÝ TỌA ĐỘ ĐỘNG - VẤN ĐỀ CỐT LÕI

### 4.1. ⚠️ QUY TẮC VÀNG: Thứ tự tọa độ trong Leaflet

```
Leaflet (lat, lng)  → [Vĩ độ, Kinh độ]   → [21.0285, 105.8544]
API JSON            → latitude, longitude  → {"latitude": 21.0285, "longitude": 105.8544}
```

**KHÔNG BAO GIỜ** đảo ngược thứ tự. Nếu nhầm lẫn, điểm sẽ bị hiển thị ở vị trí sai lệch hàng trăm kilomet!

### 4.2. Hàm chuyển đổi tọa độ (cốt lõi cho dữ liệu động)

```js
/**
 * Chuyển đổi từ JSON API (latitude/longitude) sang Leaflet (lat/lng)
 * @param {Object} apiData - Dữ liệu từ API
 * @returns {Object|null} { orderData, pickup: {lat,lng}, dropoff: {lat,lng} }
 */
function processOrderData(apiData) {
    if (!apiData || !apiData.coordinates) {
        console.error('❌ Dữ liệu đơn hàng không hợp lệ:', apiData);
        return null;
    }

    const pickup = apiData.coordinates.pickup;
    const dropoff = apiData.coordinates.dropoff;

    // Validate dữ liệu đầu vào
    if (!pickup || !dropoff ||
        typeof pickup.latitude !== 'number' ||
        typeof pickup.longitude !== 'number' ||
        typeof dropoff.latitude !== 'number' ||
        typeof dropoff.longitude !== 'number') {
        console.error('❌ Tọa độ không hợp lệ:', { pickup, dropoff });
        return null;
    }

    return {
        orderData: apiData,
        pickup: {
            lat: pickup.latitude,    // Chuyển latitude → lat
            lng: pickup.longitude    // Chuyển longitude → lng
        },
        dropoff: {
            lat: dropoff.latitude,
            lng: dropoff.longitude
        }
    };
}
```

### 4.3. Xử lý tọa độ động khi Backend trả về (3 kịch bản)

#### Kịch bản A: Backend trả về đúng chuẩn (khuyến nghị)

```json
{
  "order_id": "123",
  "coordinates": {
    "pickup": { "latitude": 10.762, "longitude": 106.682 },
    "dropoff": { "latitude": 10.801, "longitude": 106.634 }
  }
}
→ Gọi: window.OrderTrackingMap.updateFromAPI(data);
```

#### Kịch bản B: Backend trả về định dạng khác (cần map)

```js
// Nếu Backend trả về dạng: [lat, lng] thay vì {latitude, longitude}
function adaptLegacyData(oldData) {
    return {
        order_id: oldData.id,
        status: oldData.status,
        coordinates: {
            pickup: {
                latitude: oldData.from[0],    // [21.0285, 105.8544] → latitude
                longitude: oldData.from[1]    // → longitude
            },
            dropoff: {
                latitude: oldData.to[0],
                longitude: oldData.to[1]
            }
        }
    };
}
```

#### Kịch bản C: Backend trả về lỗi / null / thiếu dữ liệu

```js
// Hệ thống tự động fallback về vị trí mặc định
function initMapFromAPI(apiData) {
    const processed = processOrderData(apiData);
    if (!processed) {
        // Fallback: hiển thị bản đồ nền, không có route
        orderMap.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        return;
    }
    // ... vẽ route bình thường
}
```

### 4.4. Cập nhật vị trí động theo thời gian thực (Realtime)

Để theo dõi vị trí xe thay đổi theo thời gian (ví dụ mỗi 10 giây):

```js
// Gọi API mỗi 10 giây
setInterval(function() {
    fetch('/api/order/521459')
        .then(response => response.json())
        .then(data => {
            window.OrderTrackingMap.updateFromAPI(data);
        })
        .catch(err => console.error('Lỗi cập nhật:', err));
}, 10000);

// Hoặc dùng WebSocket
const socket = new WebSocket('wss://api.example.com/orders/521459');
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    window.OrderTrackingMap.updateFromAPI(data);
};
```

> **⚠️ LƯU Ý:** Mỗi lần gọi `updateFromAPI()` sẽ xóa route cũ và vẽ lại từ đầu. Với tần suất cao (>1 lần/giây), cân nhắc dùng kỹ thuật **moveMarker** thay vì vẽ lại toàn bộ.

### 4.5. Hàm di chuyển marker xe (tối ưu cho Real-time, không cần vẽ lại route)

```js
// Thêm marker xe tải sau khi có route
var vehicleMarker = null;

function updateVehiclePosition(lat, lng) {
    if (!vehicleMarker) {
        vehicleMarker = L.marker([lat, lng], { icon: vehicleIcon }).addTo(orderMap);
    } else {
        vehicleMarker.setLatLng([lat, lng]);
    }
}
```

---

## 5. CÁC THÀNH PHẦN GIAO DIỆN

### 5.1. Map Container

```html
<!-- id BẮT BUỘC phải là "order-tracking-map" (tham chiếu trong JS) -->
<div id="order-tracking-map"></div>
```

```css
#order-tracking-map {
    width: 100%;        /* Co giãn theo layout */
    height: 500px;      /* Chiều cao cố định */
}
```

### 5.2. Đường vẽ Routing (Polyline 3 lớp)

| Thứ tự | Vai trò | Màu | Opacity | Độ dày | 
|--------|---------|-----|---------|--------|
| 1 (dưới) | Đổ bóng shadow | `#003d7a` | 0.15 | 11px |
| 2 (giữa) | Viền đậm | `#007aff` | 0.35 | 7px |
| 3 (trên) | Đường chính | `#007aff` | 0.90 | 4px |

Hiệu ứng 3 lớp này tạo cảm giác đường nổi 3D, chuyên nghiệp.

### 5.3. Hệ thống Marker

#### Marker điểm lấy hàng (Pickup)

```
Hình dạng: Vòng tròn + đuôi nhọn (giống ghim Google Maps)
Kích thước: 44x54px
Màu: Gradient #2563eb → #1d4ed8 (xanh dương)
Icon: FontAwesome fa-warehouse 🏪
Hiệu ứng: Hover scale(1.1)
```

#### Marker điểm giao hàng (Dropoff)

```
Hình dạng: Ghim xoay -45° (giống Apple Maps)
Kích thước: 32x32px (pin) + 52x52px (vòng ping)
Màu: Gradient #f97316 → #ea580c (đỏ cam)
Icon: FontAwesome fa-location-dot 📌
Hiệu ứng: 
  - Hover scale(1.1)
  - 3 vòng tròn ping-wave lan tỏa liên tục (tạo cảm giác realtime)
```

#### Marker xe tải (Vehicle - cho Realtime tracking)

```
Hình dạng: Vòng tròn
Kích thước: 36x36px
Màu: Gradient #f59e0b → #d97706 (vàng)
Icon: FontAwesome fa-truck 🚚
Hiệu ứng: Bounce lên xuống liên tục
```

### 5.4. Popup thông tin

Popup hiển thị khi click vào marker, có thiết kế:
- Border-left: 4px màu xanh #2563eb
- Border-radius: 10px
- Box-shadow: nổi bật
- Nội dung: Icon + tên điểm + mã đơn + trạng thái

### 5.5. Ẩn bảng chỉ dẫn Routing

```css
.leaflet-routing-container {
    display: none !important;
}
```

Bảng chỉ dẫn text của Leaflet Routing Machine bị ẩn hoàn toàn để giữ giao diện sạch sẽ.

### 5.6. Auto-fit Bounds

Sau khi route được tải, bản đồ tự động phóng to/thu nhỏ để vừa khung hình chứa cả 2 điểm:

```js
routingControl.on('routesfound', function(e) {
    const routes = e.routes;
    if (routes && routes.length > 0) {
        const coordinates = routes[0].coordinates;
        if (coordinates && coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            orderMap.fitBounds(bounds, {
                padding: [50, 50],    // Khoảng cách lề 50px
                maxZoom: 16           // Không zoom quá mức 16
            });
        }
    }
});
```

---

## 6. HƯỚNG DẪN TÍCH HỢP VÀO DỰ ÁN THỰC TẾ

### 6.1. Cách dùng nhanh (Copy-Paste)

**Bước 1:** Copy toàn bộ file `index.html` vào dự án.

**Bước 2:** Đổi `mockOrderData` thành dữ liệu thật từ Backend.

**Bước 3:** Khi nhận dữ liệu từ API, gọi:

```js
fetch('/api/tracking/order/521459')
    .then(res => res.json())
    .then(data => {
        window.OrderTrackingMap.updateFromAPI(data);
    });
```

### 6.2. Tích hợp vào React

```jsx
import { useEffect, useRef } from 'react';

function OrderTrackingMap({ orderData }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        // Load script Leaflet + Routing Machine vào <head>
        // Sau đó khởi tạo:
        if (!mapInstance.current) {
            // Copy toàn bộ code JS từ index.html vào đây
            // Khởi tạo map
        }
    }, []);

    useEffect(() => {
        if (mapInstance.current && orderData) {
            window.OrderTrackingMap.updateFromAPI(orderData);
        }
    }, [orderData]);

    return <div id="order-tracking-map" ref={mapRef}></div>;
}
```

### 6.3. Tích hợp vào Vue

```vue
<template>
    <div id="order-tracking-map"></div>
</template>

<script>
export default {
    props: ['orderData'],
    watch: {
        orderData: {
            immediate: true,
            handler(data) {
                if (data && window.OrderTrackingMap) {
                    window.OrderTrackingMap.updateFromAPI(data);
                }
            }
        }
    },
    mounted() {
        // Đợi DOM sẵn sàng
        this.$nextTick(() => {
            // Copy code khởi tạo từ index.html
        });
    }
};
</script>
```

### 6.4. Tích hợp vào PHP

```php
<!-- Trong file PHP -->
<!DOCTYPE html>
<html>
<head>
    <!-- CDN Links -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
</head>
<body>
    <div id="order-tracking-map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
    <script>
        // Dùng PHP để đổ dữ liệu vào JS
        const orderData = <?php echo json_encode($orderFromDatabase); ?>;
        
        // Copy code khởi tạo từ index.html
        // ...
        
        window.OrderTrackingMap.updateFromAPI(orderData);
    </script>
</body>
</html>
```

---

## 7. CÁC VƯỚNG MẮC THƯỜNG GẶP & CÁCH XỬ LÝ

### 7.1. Tọa độ bị đảo ngược (Lat/Lng vs Lng/Lat)

**Vấn đề:** Map hiển thị sai vị trí (bay ra biển hoặc sang nước khác).  
**Nguyên nhân:** Nhầm thứ tự `[latitude, longitude]` với `[longitude, latitude]`.

**Cách xử lý:**
- Leaflet: luôn là `[lat, lng]` = `[vĩ_độ, kinh_độ]`
- Google Maps: luôn là `{lat, lng}` = `{vĩ_độ, kinh_độ}`
- Lưu ý: Hà Nội có `lat ≈ 21`, `lng ≈ 105`. Nếu thấy tọa độ `[105, 21]` là đã bị ngược.

### 7.2. Route không hiển thị

**Vấn đề:** Map hiển thị nhưng không vẽ đường route.  
**Nguyên nhân:** OSRM không có dữ liệu đường tại khu vực đó (vùng sâu, hải đảo,...).

**Cách xử lý:**
```js
// Kiểm tra console log
routingControl.on('routesfound', function(e) {
    console.log('✅ Route tìm thấy:', e.routes.length, 'tuyến');
});
routingControl.on('routingerror', function(e) {
    console.error('❌ Không tìm thấy route:', e.error);
    // Fallback: vẽ đường thẳng giữa 2 điểm
    const latlngs = [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
    ];
    L.polyline(latlngs, { color: '#007aff', weight: 3, dashArray: '10, 10' }).addTo(orderMap);
});
```

### 7.3. Tọa độ null/undefined

**Vấn đề:** Map không hoạt động, console báo lỗi.  
**Nguyên nhân:** Backend trả về `null` hoặc thiếu field.

**Cách xử lý:** Hàm `processOrderData()` đã có validate sẵn. Kiểm tra console log:
```
❌ Dữ liệu đơn hàng không hợp lệ: null
❌ Tọa độ không hợp lệ: { pickup: null, dropoff: null }
```

### 7.4. Map không load (Leaflet is not defined)

**Vấn đề:** Trang trắng, lỗi JavaScript.  
**Nguyên nhân:** Thứ tự nạp script sai hoặc CDN bị chặn.

**Cách xử lý:**
1. Kiểm tra Network tab trong DevTools → CDN có trả về 200 không?
2. Nếu CDN bị chặn (tường lửa công ty), download về local:
   ```html
   <script src="/assets/libs/leaflet.js"></script>
   ```
3. Kiểm tra thứ tự nạp: Leaflet JS → Routing Machine JS

### 7.5. Map không responsive (không co giãn theo màn hình)

**Nguyên nhân:** Thiếu `width: 100%` hoặc gọi khởi tạo map trước khi DOM sẵn sàng.

**Cách xử lý:**
```js
// Luôn đặt khởi tạo trong DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initMapFromAPI(mockOrderData);
});
```

### 7.6. Vị trí marker bị lệch so với đường route

**Nguyên nhân:** `iconAnchor` của L.divIcon không khớp với kích thước icon.

**Cách khắc phục:**
```js
// iconAnchor = [width/2, height] cho marker có đuôi nhọn
iconSize: [44, 54],
iconAnchor: [22, 44],   // 22 = 44/2, 44 = gần đáy
popupAnchor: [0, -50]   // popup ở phía trên marker
```

---

## 8. TÙY CHỈNH NÂNG CAO

### 8.1. Thay đổi màu sắc route

```js
lineOptions: {
    styles: [
        { color: '#ff0000', opacity: 0.15, weight: 11 },  // Shadow đỏ
        { color: '#ff0000', opacity: 0.35, weight: 7 },    // Viền đỏ
        { color: '#ff0000', opacity: 0.9, weight: 4 }      // Đường chính đỏ
    ]
}
```

### 8.2. Thay đổi kích thước map

```css
#order-tracking-map {
    width: 100%;
    height: 100vh;      /* Toàn màn hình */
    /* hoặc */
    height: 400px;       /* Chiều cao tùy chỉnh */
}
```

### 8.3. Thêm nhiều waypoint (điểm trung gian)

```js
L.Routing.control({
    waypoints: [
        L.latLng(21.0285, 105.8544),  // Điểm A
        L.latLng(21.0320, 105.8200),  // Điểm B (trung gian)
        L.latLng(21.0361, 105.7861)   // Điểm C
    ]
}).addTo(orderMap);
```

### 8.4. Thay đổi TileLayer khi runtime

```js
// Xóa tile layer cũ
orderMap.eachLayer(function(layer) {
    if (layer instanceof L.TileLayer) {
        orderMap.removeLayer(layer);
    }
});

// Thêm tile layer mới (Dark mode)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OSM contributors &copy; CARTO'
}).addTo(orderMap);
```

---

## 9. DANH SÁCH PUBLIC API

Hệ thống expose object `window.OrderTrackingMap` với các phương thức:

### `updateFromAPI(apiData)`
Cập nhật bản đồ với dữ liệu mới từ Backend.
- **Input:** `Object` - Dữ liệu đơn hàng (xem mục 3.1)
- **Output:** `void`
- **Ví dụ:**
  ```js
  window.OrderTrackingMap.updateFromAPI({
      order_id: "123456",
      status: "In Transit",
      coordinates: {
          pickup: { latitude: 21.0285, longitude: 105.8544 },
          dropoff: { latitude: 21.0361, longitude: 105.7861 }
      }
  });
  ```

### `getMapInfo()`
Lấy thông tin hiện tại của bản đồ.
- **Input:** `void`
- **Output:** `Object` `{ center: LatLng, zoom: Number, bounds: LatLngBounds }`
- **Ví dụ:**
  ```js
  const info = window.OrderTrackingMap.getMapInfo();
  console.log(info.center, info.zoom);
  ```

### `resetMap()`
Đặt lại bản đồ về vị trí trung tâm mặc định.
- **Input:** `void`
- **Output:** `void`
- **Ví dụ:**
  ```js
  window.OrderTrackingMap.resetMap();
  ```

---

## 10. THAM KHẢO

| Tài liệu | Link |
|---------|------|
| Leaflet.js Documentation | https://leafletjs.com/reference.html |
| Leaflet Routing Machine | https://www.liedman.net/leaflet-routing-machine/ |
| CartoDB Tile Styles | https://carto.com/basemaps |
| FontAwesome Icons | https://fontawesome.com/search |
| OpenStreetMap | https://www.openstreetmap.org/ |
| OSRM Demo | https://map.project-osrm.org/ |

---

> **Tài liệu được tạo bởi AiderDesk**  
> **Dự án:** Test-Map  
> **Ngày:** 02/06/2026  
> **Trạng thái:** ✅ Sẵn sàng tích hợp

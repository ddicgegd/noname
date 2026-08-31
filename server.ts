import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  GraphQLSchema, 
  GraphQLObjectType, 
  GraphQLInputObjectType,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLString, 
  GraphQLInt, 
  GraphQLID,
  GraphQLEnumType, 
  GraphQLList,
  GraphQLNonNull
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";

function getBackendUrl(): string {
  return process.env.VITE_API_BASE_URL || "http://localhost:8080";
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Parse incoming JSON and urlencoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy and running" });
  });

  // --- GRAPHQL GATEWAY ROUTE ---
  const GenderType = new GraphQLEnumType({
    name: "Gender",
    values: {
      MALE: { value: "MALE" },
      FEMALE: { value: "FEMALE" },
      OTHER: { value: "OTHER" },
    }
  });

  const UserRankType = new GraphQLEnumType({
    name: "UserRank",
    values: {
      MEMBER: { value: "MEMBER" },
      BRONZE: { value: "BRONZE" },
      SILVER: { value: "SILVER" },
      GOLD: { value: "GOLD" },
      PLATINUM: { value: "PLATINUM" },
    }
  });

  const ActiveStatusType = new GraphQLEnumType({
    name: "ActiveStatus",
    values: {
      ACTIVE: { value: "ACTIVE" },
      INACTIVE: { value: "INACTIVE" },
      LOCKED: { value: "LOCKED" },
    }
  });

  const StatusType = new GraphQLObjectType({
    name: "Status",
    fields: {
      code: { type: GraphQLInt },
      message: { type: GraphQLString },
    }
  });

  const MyProfileResponseType = new GraphQLObjectType({
    name: "MyProfileResponseType",
    fields: {
      id: { type: GraphQLInt },
      username: { type: GraphQLString },
      fullName: { type: GraphQLString },
      email: { type: GraphQLString },
      phoneNumber: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      dateOfBirth: { type: GraphQLString },
      gender: { type: GenderType },
      rank: { type: UserRankType },
      status: { type: ActiveStatusType },
      roles: { type: new GraphQLList(GraphQLString) },
    }
  });

  const MyProfileResponse = new GraphQLObjectType({
    name: "MyProfileResponse",
    fields: {
      status: { type: StatusType },
      data: { type: MyProfileResponseType },
    }
  });

  // --- MERCHANDISE MOCK DATA (High-Fidelity ERP Backend Simulator - DELETED) ---
  const mockCategories: any[] = [];
  const mockProducts: any[] = [];
  const mockAttributes: any[] = [];

  // In-memory Mock REST API handlers
  function mockRestApiCall(apiPath: string, method: string, body: any, queryParams: URLSearchParams) {
    console.log(`[MOCK BACKEND FALLBACK] Intercepted ${method} ${apiPath}`);
    
    if (apiPath === "/api/auth/me") {
      return {
        status: { code: 200, message: "Success" },
        data: {
          id: 1,
          username: "horizon_admin",
          fullName: "Horizon Administrator",
          email: "admin@horizon.net",
          phoneNumber: "0971791373",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          dateOfBirth: "1995-01-01",
          gender: "MALE",
          rank: "GOLD",
          status: "ACTIVE",
          roles: ["ROLE_ADMIN", "ROLE_USER"]
        }
      };
    }

    if (apiPath.startsWith("/api/auth/recover-account/")) {
      const email = apiPath.substring("/api/auth/recover-account/".length);
      return {
        status: { code: 200, message: "Success" },
        message: `Yêu cầu khôi phục tài khoản đã được gửi đến email ${decodeURIComponent(email)}.`
      };
    }

    if (apiPath.startsWith("/api/auth/validate-reset-token")) {
      const token = queryParams.get("token") || "";
      if (!token) {
        return {
          status: { code: 400, message: "Token is required" },
          data: null
        };
      }
      return {
        status: { code: 200, message: "Success" },
        data: {
          username: "horizon_admin",
          fullName: "Horizon Administrator",
          email: "admin@horizon.net",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          active: "ACTIVE",
          status: "ACTIVE"
        }
      };
    }

    if (apiPath.startsWith("/api/auth/reset-password")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Mật khẩu đã được cập nhật thành công."
      };
    }

    if (apiPath.startsWith("/api/auth/change-username")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Tên đăng nhập đã được thay đổi thành công."
      };
    }

    if (apiPath.startsWith("/api/auth/change-password")) {
      return {
        status: { code: 200, message: "Success" },
        message: "Mật khẩu đã được thay đổi thành công."
      };
    }

    if (apiPath.startsWith("/api/orders") || apiPath.startsWith("/api/order")) {
      const items = body?.items || [{ attributesSku: "SKU-IPHONE15-128GB-BLK", quantity: 1 }];
      const subtotal = items.reduce((sum: number, it: any) => sum + ((it.salePrice || it.unitPrice || 21990000) * (it.quantity || 1)), 0);
      const discountAmount = body?.discountCodes?.length || body?.voucherCode ? 500000 : 0;
      const totalAmount = Math.max(0, subtotal + (subtotal > 0 ? 30000 : 0) - discountAmount);
      const resolvedOrderNum = body?.orderNumber || body?.orderSessionId || `018d9ef2-${Math.random().toString(16).substring(2, 6)}-7123-88bb-${Math.random().toString(16).substring(2, 14)}`;

      return {
        status: { code: 201, message: "Thành công" },
        data: {
          orderNumber: resolvedOrderNum,
          orderSessionId: resolvedOrderNum,
          status: ["PENDING", "WAITING_PAYMENT"],
          currentStatus: "WAITING_PAYMENT",
          currentStatusDescription: "Chờ thanh toán",
          shippingMethod: body?.shippingMethod || "DELIVERY",
          paymentMethod: body?.paymentMethod || "VNPAY",
          addressSku: body?.addressSku || "ADDR-DEFAULT-001",
          shippingAddress: body?.shippingAddress || "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          subtotal: subtotal || 21990000.0,
          shippingFee: 30000.0,
          discountAmount: discountAmount,
          productDiscountAmount: discountAmount,
          shippingDiscountAmount: 0.0,
          discountCodes: body?.discountCodes || (body?.voucherCode ? [body.voucherCode] : []),
          bankCode: body?.bankCode || undefined,
          language: body?.language || "vn",
          totalAmount: totalAmount || 22239900.0,
          customerNotes: body?.customerNotes || undefined,
          createdAt: new Date().toISOString(),
          customerInfo: {
            fullName: "Khách hàng Horizon",
            phone: "0901234567",
            shippingAddress: body?.shippingAddress || "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
          },
          orderItems: items.map((it: any) => ({
            attributesSku: it.attributesSku || "SKU-IPHONE15-128GB-BLK",
            productName: it.productName || "iPhone 15 Pro 128GB",
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 22990000.0,
            salePrice: it.salePrice || 21990000.0,
            costPrice: it.costPrice || 20000000.0,
            discountAmount: it.discountAmount || 0.0,
            discountPercentage: it.discountPercentage || 0.0,
            subtotal: (it.salePrice || it.unitPrice || 21990000.0) * (it.quantity || 1),
            taxAmount: 0.0,
            imageUrl: it.imageUrl || "/images/products/iphone15.jpg",
            variantOptions: it.variantOptions || [{ name: "Màu sắc", value: "Titan Tự Nhiên" }]
          }))
        }
      };
    }

    if (apiPath.startsWith("/api/merchandise") || apiPath.includes("search-Product") || apiPath.includes("merchandise")) {
      return {
        status: { code: 200, message: "Success" },
        data: {
          contents: [],
          paging: { pageNumber: 1, pageSize: 20, totalElements: 0, totalPages: 0 }
        }
      };
    }

    throw new Error(`Route mock not found: ${method} ${apiPath}`);
  }

  // API gateway client connector inside the GraphQL server with automatic Failover
  async function callApiGateway(apiPath: string, options: { method?: string; body?: any; token?: string }, context: any) {
    const defaultBackendUrl = getBackendUrl().replace(/\/$/, "");
    const method = options.method || "GET";
    const body = options.body;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (options.token) {
      headers["Authorization"] = options.token;
    }

    const config: any = {
      method,
      headers
    };
    if (body && method !== "GET") {
      config.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const tryFetch = async (baseUrl: string) => {
      const res = await fetch(`${baseUrl}${apiPath}`, config);
      const statusCode = res.status;
      if (statusCode === 401) {
        if (context?.res) {
          context.res.isUnauthorized = true;
          context.res.status(401);
        }
        throw new Error("Unauthorized");
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        if (statusCode === 401) throw new Error("Unauthorized");
        throw new Error(`Failed to parse response (status ${statusCode})`);
      }
    };

    // Thử gọi Default Backend (http://localhost:8080)
    try {
      return await tryFetch(defaultBackendUrl);
    } catch (err: any) {
      if (err.message === "Unauthorized") throw err;
      console.warn(`[API GATEWAY WARNING] Failed to connect to ERP Backend (${defaultBackendUrl}): ${err.message}. Falling back to high-fidelity mock.`);

      // Tier 3: Fallback sang Mock an toàn để không bao giờ làm sập ứng dụng
      try {
        const parsedUrl = new URL(apiPath, "http://localhost");
        const queryParams = parsedUrl.searchParams;
        return mockRestApiCall(parsedUrl.pathname, method, body, queryParams);
      } catch (fallbackErr: any) {
        console.error("[API GATEWAY FALLBACK ERROR] Fallback also failed:", fallbackErr);
        throw err;
      }
    }
  }

  const MessageResponseType = new GraphQLObjectType({
    name: "MessageResponse",
    fields: {
      status: { type: StatusType },
      message: { type: GraphQLString }
    }
  });

  const RecoveryUserType = new GraphQLObjectType({
    name: "RecoveryUser",
    fields: {
      username: { type: GraphQLString },
      fullName: { type: GraphQLString },
      email: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      active: { type: ActiveStatusType },
      status: { type: ActiveStatusType }
    }
  });

  const ValidateResetTokenResponseType = new GraphQLObjectType({
    name: "ValidateResetTokenResponse",
    fields: {
      status: { type: StatusType },
      data: { type: RecoveryUserType }
    }
  });

  const PagingType = new GraphQLObjectType({
    name: "Paging",
    fields: {
      pageNumber: { type: GraphQLInt },
      pageSize: { type: GraphQLInt },
      totalPages: { type: GraphQLInt },
      totalElements: { type: GraphQLInt }
    }
  });

  const SkuInfoType = new GraphQLObjectType({
    name: "SkuInfo",
    fields: {
      sku: { type: GraphQLString }
    }
  });

  const MediaItemType = new GraphQLObjectType({
    name: "MediaItem",
    fields: {
      key: { type: GraphQLString },
      url: { type: GraphQLString }
    }
  });

  const ProductType: GraphQLObjectType = new GraphQLObjectType({
    name: "MerchandiseProduct",
    fields: () => ({
      id: { type: GraphQLString },
      name: { type: GraphQLString },
      skuInfo: { type: SkuInfoType },
      price: { type: GraphQLFloat },
      salePrice: { type: GraphQLFloat },
      mediaItems: { type: new GraphQLList(MediaItemType) },
      status: { type: GraphQLString },
      categoryName: { type: GraphQLString },
      discountPercent: { type: GraphQLFloat },
      discountStartDate: { type: GraphQLString },
      discountEndDate: { type: GraphQLString },
      rating: { type: GraphQLFloat },
      viewCount: { type: GraphQLInt },
      totalSoldQuantity: { type: GraphQLInt }
    })
  });

  const VariantOptionType = new GraphQLObjectType({
    name: "VariantOption",
    fields: {
      name: { type: GraphQLString },
      values: { type: new GraphQLList(GraphQLString) }
    }
  });

  const SpecificationItemType = new GraphQLObjectType({
    name: "SpecificationItem",
    fields: {
      name: { type: GraphQLString },
      value: { type: GraphQLString },
      key: { type: GraphQLString },
      data: { type: GraphQLString }
    }
  });

  const SpecificationGroupType = new GraphQLObjectType({
    name: "SpecificationGroup",
    fields: {
      groupName: { type: GraphQLString },
      specifications: { type: new GraphQLList(SpecificationItemType) }
    }
  });

  const PromotionType = new GraphQLObjectType({
    name: "Promotion",
    fields: {
      name: { type: GraphQLString },
      description: { type: GraphQLString },
      discountPercent: { type: GraphQLFloat },
      startDate: { type: GraphQLString },
      endDate: { type: GraphQLString }
    }
  });

  const AttributeType = new GraphQLObjectType({
    name: "MerchandiseAttribute",
    fields: {
      id: { type: GraphQLString },
      name: { type: GraphQLString },
      sku: { type: SkuInfoType },
      price: { type: GraphQLFloat },
      salePrice: { type: GraphQLFloat },
      statusProduct: { type: GraphQLString },
      variantOptions: { type: new GraphQLList(VariantOptionType) },
      specifications: { type: new GraphQLList(SpecificationGroupType) },
      promotions: { type: new GraphQLList(PromotionType) },
      keywords: { type: new GraphQLList(GraphQLString) },
      product: { type: ProductType }
    }
  });

  const ProductSearchResponseType = new GraphQLObjectType({
    name: "ProductSearchResponse",
    fields: {
      contents: { type: new GraphQLList(ProductType) },
      paging: { type: PagingType }
    }
  });

  const AttributesSearchResponseType = new GraphQLObjectType({
    name: "AttributesSearchResponse",
    fields: {
      contents: { type: new GraphQLList(AttributeType) },
      paging: { type: PagingType }
    }
  });

  const ProductSearchInputType = new GraphQLInputObjectType({
    name: "ProductSearchInput",
    fields: {
      keyword: { type: GraphQLString },
      categorySku: { type: GraphQLString },
      categorySkus: { type: new GraphQLList(GraphQLString) },
      skus: { type: new GraphQLList(GraphQLString) },
      page: { type: GraphQLInt },
      size: { type: GraphQLInt },
      sortBy: { type: GraphQLString },
      sortDirection: { type: GraphQLString }
    }
  });

  const AttributesSearchInputType = new GraphQLInputObjectType({
    name: "AttributesSearchInput",
    fields: {
      productSku: { type: GraphQLString },
      keyword: { type: GraphQLString },
      minPrice: { type: GraphQLFloat },
      maxPrice: { type: GraphQLFloat },
      page: { type: GraphQLInt },
      size: { type: GraphQLInt }
    }
  });

  // --- ORDER GRAPHQL TYPES (No id/orderId in DTOs) ---
  const CreateOrderItemInputType = new GraphQLInputObjectType({
    name: "CreateOrderItemInput",
    fields: {
      attributesSku: { type: new GraphQLNonNull(GraphQLString) },
      quantity: { type: new GraphQLNonNull(GraphQLInt) }
    }
  });

  const CreateOrderInputType = new GraphQLInputObjectType({
    name: "CreateOrderInput",
    fields: {
      items: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CreateOrderItemInputType))) },
      orderNumber: { type: GraphQLString },
      orderSessionId: { type: GraphQLString },
      addressSku: { type: GraphQLString },
      shippingAddress: { type: GraphQLString },
      paymentMethod: { type: GraphQLString },
      shippingMethod: { type: GraphQLString },
      isFromCart: { type: GraphQLBoolean },
      voucherCode: { type: GraphQLString },
      discountCode: { type: GraphQLString },
      discountCodes: { type: new GraphQLList(GraphQLString) },
      customerNotes: { type: GraphQLString },
      language: { type: GraphQLString },
      bankCode: { type: GraphQLString }
    }
  });

  const OrderVariantOptionType = new GraphQLObjectType({
    name: "OrderVariantOption",
    fields: {
      name: { type: GraphQLString },
      value: { type: GraphQLString }
    }
  });

  const OrderItemType = new GraphQLObjectType({
    name: "OrderItemDto",
    fields: {
      attributesSku: { type: GraphQLString },
      productName: { type: GraphQLString },
      quantity: { type: GraphQLInt },
      unitPrice: { type: GraphQLFloat },
      salePrice: { type: GraphQLFloat },
      costPrice: { type: GraphQLFloat },
      discountAmount: { type: GraphQLFloat },
      discountPercentage: { type: GraphQLFloat },
      subtotal: { type: GraphQLFloat },
      taxAmount: { type: GraphQLFloat },
      notes: { type: GraphQLString },
      imageUrl: { type: GraphQLString },
      variantOptions: { type: new GraphQLList(OrderVariantOptionType) }
    }
  });

  const OrderCustomerInfoType = new GraphQLObjectType({
    name: "OrderCustomerInfo",
    fields: {
      customerId: { type: GraphQLString },
      fullName: { type: GraphQLString },
      phone: { type: GraphQLString },
      shippingAddress: { type: GraphQLString }
    }
  });

  const OrderStatusHistoryItemType = new GraphQLObjectType({
    name: "OrderStatusHistoryItem",
    fields: {
      status: { type: GraphQLString },
      timestamp: { type: GraphQLString }
    }
  });

  const OrderType = new GraphQLObjectType({
    name: "OrderDto",
    fields: {
      orderNumber: { type: GraphQLString },
      orderSessionId: { type: GraphQLString },
      status: { type: new GraphQLList(GraphQLString) },
      currentStatus: { type: GraphQLString },
      currentStatusDescription: { type: GraphQLString },
      shippingMethod: { type: GraphQLString },
      paymentMethod: { type: GraphQLString },
      addressSku: { type: GraphQLString },
      shippingAddress: { type: GraphQLString },
      receiverName: { type: GraphQLString },
      receiverPhone: { type: GraphQLString },
      subtotal: { type: GraphQLFloat },
      shippingFee: { type: GraphQLFloat },
      productDiscountAmount: { type: GraphQLFloat },
      shippingDiscountAmount: { type: GraphQLFloat },
      discountAmount: { type: GraphQLFloat },
      discountCode: { type: GraphQLString },
      discountCodes: { type: new GraphQLList(GraphQLString) },
      bankCode: { type: GraphQLString },
      language: { type: GraphQLString },
      totalAmount: { type: GraphQLFloat },
      customerNotes: { type: GraphQLString },
      customerInfo: { type: OrderCustomerInfoType },
      orderItems: { type: new GraphQLList(OrderItemType) },
      statusHistory: { type: new GraphQLList(OrderStatusHistoryItemType) },
      createdAt: { type: GraphQLString }
    }
  });

  const CreateOrderResponseType = new GraphQLObjectType({
    name: "CreateOrderResponse",
    fields: {
      status: { type: StatusType },
      data: { type: OrderType }
    }
  });

  const OrderStatusEnum = new GraphQLEnumType({
    name: "OrderStatus",
    values: {
      PENDING: { value: "PENDING" },
      CONFIRMED: { value: "CONFIRMED" },
      PROCESSING: { value: "PROCESSING" },
      SHIPPED: { value: "SHIPPED" },
      DELIVERED: { value: "DELIVERED" },
      COMPLETED: { value: "COMPLETED" },
      CANCELLED: { value: "CANCELLED" }
    }
  });

  const FirstItemPreviewType = new GraphQLObjectType({
    name: "FirstItemPreview",
    fields: {
      attributesSku: { type: GraphQLString },
      productName: { type: GraphQLString },
      thumbnailUrl: { type: GraphQLString },
      quantity: { type: GraphQLInt },
      price: { type: GraphQLFloat }
    }
  });

  const OrderSummaryItemType = new GraphQLObjectType({
    name: "OrderSummaryItem",
    fields: {
      orderNumber: { type: GraphQLString },
      currentStatus: { type: GraphQLString },
      totalAmount: { type: GraphQLFloat },
      itemCount: { type: GraphQLInt },
      createdAt: { type: GraphQLString },
      firstItemPreview: { type: FirstItemPreviewType }
    }
  });

  const MyOrderListDataDtoType = new GraphQLObjectType({
    name: "MyOrderListDataDto",
    fields: {
      contents: { type: new GraphQLList(OrderSummaryItemType) },
      paging: { type: PagingType }
    }
  });

  const MyOrderListResponseType = new GraphQLObjectType({
    name: "MyOrderListResponse",
    fields: {
      status: { type: StatusType },
      data: { type: MyOrderListDataDtoType }
    }
  });

  const MyOrderDetailResponseType = new GraphQLObjectType({
    name: "MyOrderDetailResponse",
    fields: {
      status: { type: StatusType },
      data: { type: OrderType }
    }
  });

  const enrichItemFromSku = (item: any) => {
    const sku = String(item.attributesSku || item.sku || "");
    let fallbackName = item.productName;
    let fallbackImg = item.imageUrl;
    let fallbackPrice = typeof item.unitPrice === "number" ? item.unitPrice : (typeof item.salePrice === "number" ? item.salePrice : 0);

    if (!fallbackName || fallbackName.trim() === "" || fallbackName === "null") {
      if (sku.toUpperCase().includes("SGS25U")) {
        fallbackName = "PROD-SGS25U Cloud Server (5G) Viền Titan Dây Cao Su Size S/M";
        fallbackImg = fallbackImg || "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=400&auto=format&fit=crop";
        fallbackPrice = fallbackPrice || 25200000;
      } else if (sku.toUpperCase().includes("IPHONE")) {
        fallbackName = "iPhone 15 Pro Max Cloud Compute";
        fallbackImg = fallbackImg || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400";
        fallbackPrice = fallbackPrice || 29990000;
      } else {
        fallbackName = `Sản phẩm (${sku || "Tiêu chuẩn"})`;
      }
    }

    const quantity = Number(item.quantity) || 1;
    const unitPrice = fallbackPrice || 25200000;
    const subtotal = Number(item.subtotal) || (unitPrice * quantity);

    return {
      attributesSku: sku,
      productName: fallbackName,
      quantity,
      unitPrice,
      salePrice: unitPrice,
      subtotal,
      imageUrl: fallbackImg || "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=400",
      ...(item.variantOptions && item.variantOptions.length > 0 ? { variantOptions: item.variantOptions } : {})
    };
  };

  const mapOrderData = (data: any) => {
    if (!data || typeof data !== "object") return null;
    const { id: _orderId, orderSessionId: _sId, ...orderWithoutId } = data;
    const rawItems = orderWithoutId.orderItems || orderWithoutId.items || [];
    const orderItems = Array.isArray(rawItems) ? rawItems.map((item: any) => {
      const { id: _iId, orderId: _oId, ...itemWithoutIds } = item;
      return enrichItemFromSku(itemWithoutIds);
    }) : [];

    const currentStatus = String(orderWithoutId.currentStatus || (Array.isArray(orderWithoutId.status) ? orderWithoutId.status[0] : orderWithoutId.status) || "WAITING_PAYMENT");
    const currentStatusDescription = String(orderWithoutId.currentStatusDescription || (currentStatus === "WAITING_PAYMENT" ? "Chờ thanh toán" : currentStatus === "COMPLETED" ? "Hoàn tất" : "Đang xử lý"));

    const subtotal = Number(orderWithoutId.subtotal) || (orderItems.reduce((acc: number, it: any) => acc + (it.subtotal || 0), 0)) || 0;
    const shippingFee = Number(orderWithoutId.shippingFee) || 0;
    const discountAmount = Number(orderWithoutId.discountAmount) || 0;
    const totalAmount = Number(orderWithoutId.totalAmount) || Math.max(0, subtotal + shippingFee - discountAmount);

    const cleanResult = {
      orderNumber: String(orderWithoutId.orderNumber || orderWithoutId.orderSessionId || ""),
      status: [currentStatus],
      currentStatus,
      currentStatusDescription,
      shippingMethod: orderWithoutId.shippingMethod || "DELIVERY",
      paymentMethod: orderWithoutId.paymentMethod || "VNPAY",
      shippingAddress: orderWithoutId.shippingAddress || "",
      receiverName: orderWithoutId.receiverName || orderWithoutId.customerInfo?.fullName || undefined,
      receiverPhone: orderWithoutId.receiverPhone || orderWithoutId.customerInfo?.phone || undefined,
      subtotal,
      shippingFee,
      discountAmount,
      productDiscountAmount: Number(orderWithoutId.productDiscountAmount) || 0,
      shippingDiscountAmount: Number(orderWithoutId.shippingDiscountAmount) || 0,
      discountCodes: Array.isArray(orderWithoutId.discountCodes) ? orderWithoutId.discountCodes : [],
      totalAmount,
      createdAt: orderWithoutId.createdAt || new Date().toISOString(),
      orderItems
    };

    return cleanResult;
  };

  const normalizeGatewayListResponse = (response: any) => {
    if (response?.status?.code && response.status.code !== 200) {
      throw new Error(response.status.message || `Gateway returned ${response.status.code}`);
    }

    if (Array.isArray(response)) {
      return {
        contents: response,
        paging: {
          pageNumber: 1,
          pageSize: response.length,
          totalPages: 1,
          totalElements: response.length
        }
      };
    }

    const data = response?.data || response;
    return {
      contents: data?.contents || data?.content || data?.items || [],
      paging: data?.paging || data?.page || {
        pageNumber: data?.pageNumber || 1,
        pageSize: data?.pageSize || data?.size || 0,
        totalPages: data?.totalPages || 0,
        totalElements: data?.totalElements || data?.total || 0
      }
    };
  };

  const extractProductSku = (product: any) => {
    const sku = product?.skuInfo?.sku || product?.sku?.sku || product?.sku || product?.productSku;
    return sku ? String(sku) : "";
  };

  const buildEmptyPage = (page = 1, size = 0) => ({
    contents: [],
    paging: {
      pageNumber: page,
      pageSize: size,
      totalPages: 0,
      totalElements: 0
    }
  });

  const resolveProductSkusByCategories = async (categorySkus: string[], context: any) => {
    const uniqueCategorySkus = Array.from(new Set(categorySkus.map(String).map((sku) => sku.trim()).filter(Boolean)));
    if (uniqueCategorySkus.length === 0) return [];

    const path = `/api/merchandise/products/by-category-skus?categorySkus=${encodeURIComponent(uniqueCategorySkus.join(","))}`;
    const response = await callApiGateway(path, {
      method: "GET",
      token: context?.token
    }, context);
    const normalized = normalizeGatewayListResponse(response);
    return Array.from(new Set((normalized.contents || []).map(extractProductSku).filter(Boolean)));
  };

  // --- CART GRAPHQL TYPES & IN-MEMORY REDIS-COMPLIANT GATEWAY STORE ---
  const CartItemType = new GraphQLObjectType({
    name: "CartItem",
    fields: {
      sku: { type: new GraphQLNonNull(GraphQLString) },
      quantity: { type: new GraphQLNonNull(GraphQLInt) },
      productName: { type: GraphQLString },
      imageUrl: { type: GraphQLString },
      attributesTitle: { type: GraphQLString },
      unitPrice: { type: GraphQLFloat },
      salePrice: { type: GraphQLFloat },
      subTotal: { type: GraphQLFloat },
      isAvailable: { type: GraphQLBoolean },
      stock: { type: GraphQLInt },
      specifications: { type: new GraphQLList(SpecificationGroupType) },
    }
  });

  const CartType = new GraphQLObjectType({
    name: "Cart",
    fields: {
      username: { type: GraphQLString },
      totalItems: { type: new GraphQLNonNull(GraphQLInt) },
      totalPrice: { type: new GraphQLNonNull(GraphQLFloat) },
      totalSalePrice: { type: new GraphQLNonNull(GraphQLFloat) },
      totalDiscount: { type: new GraphQLNonNull(GraphQLFloat) },
      finalAmount: { type: new GraphQLNonNull(GraphQLFloat) },
      items: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CartItemType))) },
    }
  });

  const CartSummaryBadgeType = new GraphQLObjectType({
    name: "CartSummaryBadge",
    fields: {
      totalItems: { type: new GraphQLNonNull(GraphQLInt) },
    }
  });

  const CartItemInputType = new GraphQLInputObjectType({
    name: "CartItemInput",
    fields: {
      sku: { type: new GraphQLNonNull(GraphQLString) },
      quantity: { type: new GraphQLNonNull(GraphQLInt) },
    }
  });

  const serverCartStore = new Map<string, {
    username?: string;
    items: Array<{
      sku: string;
      quantity: number;
      productName?: string;
      imageUrl?: string;
      attributesTitle?: string;
      unitPrice?: number;
      salePrice?: number;
      isAvailable?: boolean;
      stock?: number;
      specifications?: Array<{
        groupName: string;
        specifications: Array<{ key: string; data: string }>;
      }>;
    }>;
  }>();

  const CART_FILE_PATH = path.resolve(process.cwd(), ".cart-store.json");

  const loadPersistedCartStore = () => {
    try {
      if (fs.existsSync(CART_FILE_PATH)) {
        const raw = fs.readFileSync(CART_FILE_PATH, "utf-8");
        const data = JSON.parse(raw);
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, val]) => {
            serverCartStore.set(key, val as any);
          });
        }
      }
    } catch (_) {}
  };

  const persistCartStore = () => {
    try {
      const obj: Record<string, any> = {};
      serverCartStore.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(CART_FILE_PATH, JSON.stringify(obj, null, 2), "utf-8");
    } catch (_) {}
  };

  loadPersistedCartStore();

  const KNOWN_SKU_METADATA: Record<string, any> = {
    "attr-ip15pm-256gb-titan": {
      productName: "iPhone 15 Pro Max 256GB",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
      attributesTitle: "Titan Tự Nhiên / 256GB",
      unitPrice: 34990000,
      salePrice: 29490000,
      isAvailable: true,
      stock: 15,
      specifications: [
        { groupName: "Màn hình", specifications: [{ key: "Kích thước", data: "6.7 inch" }] },
        { groupName: "Hiệu năng", specifications: [{ key: "Chipset", data: "Apple A17 Pro" }] }
      ]
    },
    "attr-airpods-pro2-usbc": {
      productName: "AirPods Pro Gen 2 (MagSafe USB-C)",
      imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80",
      attributesTitle: "Trắng / USB-C",
      unitPrice: 6190000,
      salePrice: 5490000,
      isAvailable: true,
      stock: 30,
      specifications: [
        { groupName: "Âm thanh", specifications: [{ key: "Chống ồn", data: "Active Noise Cancellation" }] }
      ]
    },
    "ATTR-IP16PM-DESERT-256G": {
      productName: "iPhone 16 Pro Max 256GB - Titanium Sa Mạc",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
      attributesTitle: "Titan Sa Mạc / 256GB",
      unitPrice: 37990000,
      salePrice: 34990000,
      isAvailable: true,
      stock: 20
    },
    "ATTR-S24U-TITANGRAY-512G": {
      productName: "Samsung Galaxy S24 Ultra 512GB - Xám Titan",
      imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=80",
      attributesTitle: "Xám Titan / 512GB",
      unitPrice: 35990000,
      salePrice: 31490000,
      isAvailable: true,
      stock: 12
    },
    "ATTR-MI14U-WHITE-512G": {
      productName: "Xiaomi 14 Ultra 512GB - Trắng Gốm",
      imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80",
      attributesTitle: "Trắng Gốm / 512GB",
      unitPrice: 31990000,
      salePrice: 27990000,
      isAvailable: true,
      stock: 8
    }
  };

  const resolveCartIdentity = (guestIdArg?: string | null, context?: any): { id: string; isUser: boolean; username?: string } => {
    const authHeader = context?.token || "";
    if (authHeader && authHeader.includes("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          const username = payload.sub || payload.username || payload.preferred_username || "user";
          return { id: `user:${username}`, isUser: true, username };
        }
      } catch (_) {}
      return { id: "user:authenticated", isUser: true, username: "user" };
    }
    const guestId = guestIdArg || context?.guestId || "default-guest";
    return { id: `guest:${guestId}`, isUser: false };
  };

  const getOrCreateCart = (identity: { id: string; isUser: boolean; username?: string }) => {
    let cart = serverCartStore.get(identity.id);
    if (!cart) {
      cart = {
        username: identity.username,
        items: []
      };
      serverCartStore.set(identity.id, cart);
    }
    return cart;
  };

  const computeCart = (cartData: any) => {
    let totalItems = 0;
    let totalPrice = 0;
    let totalSalePrice = 0;

    const items = (cartData.items || []).map((item: any) => {
      const quantity = Math.max(1, Math.min(99, item.quantity || 1));
      totalItems += quantity;
      
      const meta = KNOWN_SKU_METADATA[item.sku] || {};
      const productName = item.productName || meta.productName || item.sku;
      const imageUrl = item.imageUrl || meta.imageUrl || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80";
      const attributesTitle = item.attributesTitle || meta.attributesTitle || "";
      const unitPrice = item.unitPrice || meta.unitPrice || meta.salePrice || 1000000;
      const salePrice = item.salePrice || meta.salePrice || unitPrice;
      const subTotal = salePrice * quantity;
      const isAvailable = item.isAvailable !== undefined ? item.isAvailable : (meta.isAvailable !== undefined ? meta.isAvailable : true);
      const stock = typeof item.stock === "number" ? item.stock : (typeof meta.stock === "number" ? meta.stock : 99);
      const specifications = item.specifications || meta.specifications || [];

      totalPrice += unitPrice * quantity;
      totalSalePrice += subTotal;

      return {
        sku: item.sku,
        quantity,
        productName,
        imageUrl,
        attributesTitle,
        unitPrice,
        salePrice,
        subTotal,
        isAvailable,
        stock,
        specifications
      };
    });

    const totalDiscount = Math.max(0, totalPrice - totalSalePrice);
    const finalAmount = totalSalePrice;

    return {
      username: cartData.username,
      totalItems,
      totalPrice,
      totalSalePrice,
      totalDiscount,
      finalAmount,
      items
    };
  };

  const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      me: {
        type: MyProfileResponse,
        resolve: async (_, __, context: any) => {
          let timeoutId;
          try {
            const path = "/api/auth/me";

            // Race with 1500ms timeout
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Request Timeout")), 1500);
            });

            const responsePromise = callApiGateway(path, { token: context?.token }, context);
            const response = await Promise.race([responsePromise, timeoutPromise]) as any;
            clearTimeout(timeoutId);

            if (!response) {
              return { status: { code: 500, message: "Empty response" }, data: null };
            }

            if (response.status && response.status.code && response.status.code !== 200) {
              return { status: { code: response.status.code, message: response.status.message }, data: null };
            }

            const profileData = response.data || response;
            return {
              status: { code: 200, message: "Success" },
              data: profileData
            };
          } catch (error: any) {
            if (error.message === "Unauthorized") {
              throw error;
            }
            return { status: { code: 500, message: error.message }, data: null };
          }
        }
      },
      validateResetToken: {
        type: ValidateResetTokenResponseType,
        args: {
          token: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/validate-reset-token?token=${encodeURIComponent(args.token)}`;
            const response = await callApiGateway(path, { method: "GET" }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              data: response?.data || response
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              data: null
            };
          }
        }
      },
      searchProducts: {
        type: ProductSearchResponseType,
        args: {
          filter: { type: new GraphQLNonNull(ProductSearchInputType) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const filter = { ...(args.filter || {}) };
            const categorySkus = [
              ...(filter.categorySku ? [filter.categorySku] : []),
              ...(Array.isArray(filter.categorySkus) ? filter.categorySkus : [])
            ];

            if (categorySkus.length > 0) {
              const skus = await resolveProductSkusByCategories(categorySkus, context);
              delete filter.categorySku;
              delete filter.categorySkus;

              if (skus.length === 0) {
                return buildEmptyPage(filter.page || 1, filter.size || 0);
              }

              filter.skus = Array.from(new Set([...(Array.isArray(filter.skus) ? filter.skus : []), ...skus]));
            }

            const response = await callApiGateway("/api/merchandise/search-Product", {
              method: "POST",
              body: filter,
              token: context?.token
            }, context);
            return normalizeGatewayListResponse(response);
          } catch (error: any) {
            throw new Error(error?.message || "Unable to search products");
          }
        }
      },
      searchAttributes: {
        type: AttributesSearchResponseType,
        args: {
          filter: { type: new GraphQLNonNull(AttributesSearchInputType) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const response = await callApiGateway("/api/merchandise/search-Attributes", {
              method: "POST",
              body: args.filter,
              token: context?.token
            }, context);
            return normalizeGatewayListResponse(response);
          } catch (error: any) {
            throw new Error(error?.message || "Unable to search attributes");
          }
        }
      },
      myOrdersList: {
        type: MyOrderListResponseType,
        args: {
          status: { type: new GraphQLNonNull(OrderStatusEnum) },
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
          sortBy: { type: GraphQLString },
          sortDirection: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const params = new URLSearchParams();
            if (args.status) params.append("status", args.status);
            if (args.page) params.append("page", String(args.page));
            if (args.size) params.append("size", String(args.size));
            if (args.sortBy) params.append("sortBy", args.sortBy);
            if (args.sortDirection) params.append("sortDirection", args.sortDirection);

            const path = `/api/orders/my-orders/list${params.toString() ? `?${params.toString()}` : ""}`;
            const response = await callApiGateway(path, { method: "GET", token: context?.token }, context);
            const status = response?.status || { code: 200, message: "Lấy danh sách đơn hàng thành công" };
            const data = response?.data || response;
            return {
              status: { code: status.code || 200, message: status.message || "Lấy danh sách đơn hàng thành công" },
              data
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              data: null
            };
          }
        }
      },
      myOrderDetail: {
        type: MyOrderDetailResponseType,
        args: {
          orderNumber: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/orders/my-orders/${encodeURIComponent(args.orderNumber)}`;
            const response = await callApiGateway(path, { method: "GET", token: context?.token }, context);
            const status = response?.status || { code: 200, message: "Lấy chi tiết đơn hàng thành công" };
            const rawData = response?.data || response;
            const cleanData = mapOrderData(rawData);
            return {
              status: { code: status.code || 200, message: status.message || "Lấy chi tiết đơn hàng thành công" },
              data: cleanData
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              data: null
            };
          }
        }
      },
      cartBadge: {
        type: CartSummaryBadgeType,
        args: {
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const identity = resolveCartIdentity(args.guestId, context);
            const cart = getOrCreateCart(identity);
            const computed = computeCart(cart);
            return { totalItems: computed.totalItems };
          } catch (error: any) {
            return { totalItems: 0 };
          }
        }
      },
      cart: {
        type: CartType,
        args: {
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const identity = resolveCartIdentity(args.guestId, context);
            const cart = getOrCreateCart(identity);
            return computeCart(cart);
          } catch (error: any) {
            return computeCart({ username: undefined, items: [] });
          }
        }
      }
    }
  });

  const RootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      recoverAccount: {
        type: MessageResponseType,
        args: {
          email: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/recover-account/${encodeURIComponent(args.email)}`;
            const response = await callApiGateway(path, { method: "GET" }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Yêu cầu khôi phục tài khoản đã được tiếp nhận."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      resetPassword: {
        type: MessageResponseType,
        args: {
          code: { type: new GraphQLNonNull(GraphQLString) },
          newPassword: { type: new GraphQLNonNull(GraphQLString) },
          confirmPassword: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/reset-password?code=${encodeURIComponent(args.code)}`;
            const payload = {
              newPassword: args.newPassword,
              confirmPassword: args.confirmPassword
            };
            const response = await callApiGateway(path, { method: "POST", body: payload }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đặt lại mật khẩu thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      changeUsername: {
        type: MessageResponseType,
        args: {
          newUsername: { type: new GraphQLNonNull(GraphQLString) },
          token: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/change-username`;
            const payload: any = {
              newUsername: args.newUsername
            };
            if (args.token) {
              payload.token = args.token;
            }
            const response = await callApiGateway(path, { 
              method: "PUT", 
              body: payload, 
              token: args.token ? undefined : context?.token 
            }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đổi tên đăng nhập thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      changePassword: {
        type: MessageResponseType,
        args: {
          newPassword: { type: new GraphQLNonNull(GraphQLString) },
          confirmPassword: { type: new GraphQLNonNull(GraphQLString) },
          token: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          try {
            const path = `/api/auth/change-password`;
            const payload: any = {
              newPassword: args.newPassword,
              confirmPassword: args.confirmPassword
            };
            if (args.token) {
              payload.token = args.token;
            }
            const response = await callApiGateway(path, { 
              method: "PUT", 
              body: payload, 
              token: args.token ? undefined : context?.token 
            }, context);
            return {
              status: response?.status ? { code: response.status.code, message: response.status.message } : { code: 200, message: "Success" },
              message: response?.message || response?.status?.message || "Đổi mật khẩu thành công."
            };
          } catch (error: any) {
            return {
              status: { code: 500, message: error.message },
              message: error.message
            };
          }
        }
      },
      createOrder: {
        type: CreateOrderResponseType,
        args: {
          input: { type: new GraphQLNonNull(CreateOrderInputType) }
        },
        resolve: async (_, args, context: any) => {
          try {
            const { voucherCode, discountCode, discountCodes, orderNumber, orderSessionId, ...rest } = args.input;
            const resolvedOrderNumber = orderNumber || orderSessionId || undefined;
            const resolvedOrderSessionId = orderSessionId || orderNumber || undefined;

            const mergedDiscountCodes = Array.from(new Set([
              voucherCode,
              discountCode,
              ...(discountCodes || [])
            ].filter(Boolean)));

            const forwardPayload: any = {
              ...rest,
              orderNumber: resolvedOrderNumber,
              orderSessionId: resolvedOrderSessionId,
              voucherCode: voucherCode || undefined,
              discountCode: discountCode || undefined,
              discountCodes: mergedDiscountCodes.length > 0 ? mergedDiscountCodes : undefined,
            };

            const response = await callApiGateway("/api/orders", {
              method: "POST",
              body: forwardPayload,
              token: context?.token
            }, context);

            const statusCode = typeof response?.status === "object" ? response.status.code : (typeof response?.status === "number" ? response.status : (response?.statusCode || 201));
            const statusMessage = typeof response?.status === "object" ? response.status.message : (response?.message || response?.error || "Order created successfully");

            if (statusCode >= 400) {
              return {
                status: {
                  code: statusCode,
                  message: statusMessage
                },
                data: null
              };
            }

            const rawData = response?.data || response;
            const cleanData = mapOrderData(rawData);

            return {
              status: {
                code: statusCode || 201,
                message: statusMessage || "Order created successfully"
              },
              data: cleanData
            };
          } catch (error: any) {
            return {
              status: {
                code: error.message === "Unauthorized" ? 401 : 500,
                message: error?.message || "Unable to create order"
              },
              data: null
            };
          }
        }
      },
      addToCart: {
        type: CartType,
        args: {
          items: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CartItemInputType))) },
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          const identity = resolveCartIdentity(args.guestId, context);
          const cart = getOrCreateCart(identity);
          for (const input of args.items) {
            if (input.quantity > 99) {
              throw new Error("Số lượng không được vượt quá 99 cái/SKU");
            }
            if (cart.items.length >= 50 && !cart.items.some((it: any) => it.sku === input.sku)) {
              throw new Error("Giỏ hàng không được vượt quá 50 SKU");
            }
            const existing = cart.items.find((it: any) => it.sku === input.sku);
            if (existing) {
              existing.quantity = Math.min(99, existing.quantity + input.quantity);
            } else {
              cart.items.push({
                sku: input.sku,
                quantity: input.quantity
              });
            }
          }
          persistCartStore();
          return computeCart(cart);
        }
      },
      updateCartItemQuantity: {
        type: CartType,
        args: {
          sku: { type: new GraphQLNonNull(GraphQLID) },
          quantity: { type: new GraphQLNonNull(GraphQLInt) },
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          const identity = resolveCartIdentity(args.guestId, context);
          const cart = getOrCreateCart(identity);
          if (args.quantity <= 0) {
            cart.items = cart.items.filter((it: any) => it.sku !== String(args.sku));
          } else {
            const item = cart.items.find((it: any) => it.sku === String(args.sku));
            if (item) {
              item.quantity = Math.min(99, args.quantity);
            }
          }
          persistCartStore();
          return computeCart(cart);
        }
      },
      removeCartItem: {
        type: CartType,
        args: {
          sku: { type: new GraphQLNonNull(GraphQLID) },
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          const identity = resolveCartIdentity(args.guestId, context);
          const cart = getOrCreateCart(identity);
          cart.items = cart.items.filter((it: any) => it.sku !== String(args.sku));
          persistCartStore();
          return computeCart(cart);
        }
      },
      removeCartItems: {
        type: CartType,
        args: {
          skus: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          const identity = resolveCartIdentity(args.guestId, context);
          const cart = getOrCreateCart(identity);
          const skuSet = new Set(args.skus.map((s: any) => String(s)));
          cart.items = cart.items.filter((it: any) => !skuSet.has(it.sku));
          persistCartStore();
          return computeCart(cart);
        }
      },
      clearCart: {
        type: CartType,
        args: {
          guestId: { type: GraphQLString }
        },
        resolve: async (_, args, context: any) => {
          const identity = resolveCartIdentity(args.guestId, context);
          const cart = getOrCreateCart(identity);
          cart.items = [];
          persistCartStore();
          return computeCart(cart);
        }
      },
      mergeCart: {
        type: CartType,
        args: {
          guestId: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve: async (_, args, context: any) => {
          const token = context?.token;
          if (!token || !token.includes("Bearer ")) {
            const err: any = new Error("ACCESS_DENIED");
            err.extensions = {
              errorCode: "ACCESS_DENIED",
              status: 403,
              title: "Access Denied",
              detail: "Gọi mergeCart khi chưa login"
            };
            throw err;
          }
          const userIdentity = resolveCartIdentity(null, context);
          const userCart = getOrCreateCart(userIdentity);
          const guestIdentity = { id: `guest:${args.guestId}`, isUser: false };
          const guestCart = serverCartStore.get(guestIdentity.id);
          if (guestCart && guestCart.items.length > 0) {
            for (const gItem of guestCart.items) {
              const existing = userCart.items.find((u: any) => u.sku === gItem.sku);
              if (existing) {
                existing.quantity = Math.min(99, existing.quantity + gItem.quantity);
              } else {
                userCart.items.push({ ...gItem });
              }
            }
            guestCart.items = [];
          }
          persistCartStore();
          return computeCart(userCart);
        }
      }
    }
  });

  const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
  });

  // Mount GraphQL gateway at /graphql
  app.all("/graphql", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Guest-Id, x-guest-id, *");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    const originalWriteHead = res.writeHead;
    res.writeHead = function(statusCode: number, ...args: any[]) {
      if ((this as any).isUnauthorized || res.statusCode === 401) {
        statusCode = 401;
        res.statusCode = 401;
      }
      return originalWriteHead.call(this, statusCode, ...args);
    };

    const handler = createHandler({
      schema,
      context: () => {
        const authHeader = (req.headers.authorization as string) || "";
        const guestId = (req.headers["x-guest-id"] as string) || "";
        return { token: authHeader, guestId, res };
      }
    });
    handler(req, res, next);
  });

  // CORS & Mixed-Content Bypass Proxy Endpoint
  app.all("/api/proxy", async (req, res) => {
    // Resolve target URL from either header or query parameter
    let targetUrl = (req.headers["x-target-url"] as string) || (req.query.url as string);
    
    if (!targetUrl) {
      return res.status(400).json({ 
        error: "Missing Target URL", 
        message: "Vui lòng cung cấp header 'x-target-url' hoặc tham số query '?url='" 
      });
    }

    try {
      // Validate URL format
      new URL(targetUrl);

      // Clone incoming headers but remove conflicting host-related ones
      const headers: Record<string, string> = {};
      Object.keys(req.headers).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (!["host", "connection", "content-length", "accept-encoding", "origin", "referer"].includes(lowerKey)) {
          if (req.headers[key]) {
            headers[key] = String(req.headers[key]);
          }
        }
      });



      // Forward request body if applicable
      let body: any = undefined;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        if (typeof req.body === "object" && Object.keys(req.body).length > 0) {
          body = JSON.stringify(req.body);
          headers["content-type"] = headers["content-type"] || "application/json";
        } else if (req.body) {
          body = req.body;
        }
      }

      console.log(`[API PROXY] Routing ${req.method} request to target: ${targetUrl}`);

      // Perform fetch server-side (bypasses browser CORS completely)
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      // Set target response status
      res.status(response.status);

      // Copy headers from response, filtering out chunked/zipped encoding issues
      response.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (!["content-encoding", "transfer-encoding", "connection", "access-control-allow-origin"].includes(lowerName)) {
          res.setHeader(name, value);
        }
      });

      // Explicitly append CORS headers on proxy responses for local/iframe flexibility
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");

      // Resolve and return response content type safely
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (err: any) {
      console.error(`[API PROXY ERROR] Failed to connect to ${targetUrl}:`, err);
      res.status(502).json({
        error: "Bad Gateway",
        message: `Máy chủ Node.js không thể kết nối tới URL: ${targetUrl}. Đảm bảo URL này là công khai, chính xác và đang hoạt động.`,
        details: err.message,
      });
    }
  });

  // Handle preflight OPTIONS requests for CORS
  app.options("/api/proxy", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.sendStatus(204);
  });

  // Serve static assets in production, or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static production distribution.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running and listening on http://localhost:${PORT}`);
  });
}

startServer();

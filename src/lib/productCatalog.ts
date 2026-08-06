export interface Product {
  id: string;
  name: string;
  category: "ai" | "compute" | "storage" | "network";
  tag?: string;
  tagType?: "new" | "popular" | "updated";
  icon: string;
  iconColor: string;
  desc: string;
  price: string;
  bgColor: string;
  longDesc: string;
  specs: { label: string; value: string }[];
  mediaUrls?: string[];
}

export interface PriceInfo {
  presentVal: number;
  present: string;
  old: string;
  discount: string;
  smember: string;
}

export interface ErpCategory {
  id: string;
  name: string;
  skuInfo?: { sku?: string };
  productCount?: number;
}

export interface ErpProduct {
  id: string;
  name: string;
  skuInfo?: { sku?: string };
  mediaItems?: { key?: string; url: string }[];
  status?: string;
  discountPercent?: number;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  categoryName?: string;
}

export interface ErpAttribute {
  id: string;
  name: string;
  sku?: { sku?: string };
  price?: number;
  salePrice?: number;
  variantOptions?: { name: string; values: string[] }[];
  statusProduct?: string;
  specifications?: {
    groupName?: string;
    specifications?: { name?: string; value?: string; key?: string; data?: string }[];
  }[];
  promotions?: any[];
  keywords?: string[];
  productId?: string;
  product?: { id?: string; skuInfo?: { sku?: string } };
}

export interface ErpProductCardViewModel extends ErpProduct {
  priceInfo: PriceInfo;
  specs: { label: string; value: string }[];
}

export interface ProductCatalogFilters {
  activeCategory: string;
  searchQuery: string;
  erpPriceFilter: "all" | "under1m" | "1to5m" | "over5m";
  erpStockFilter: "all" | "available" | "outofstock";
  sortBy: "banchay" | "giathap" | "giacao" | "khuyenmai" | "xemnhieu";
}

export interface ErpCatalogData {
  categories: ErpCategory[];
  products: ErpProduct[];
  attributes: ErpAttribute[];
}

export interface ErpCatalogQuery {
  keyword?: string;
  categorySku?: string;
}

const VND_RATE = 24000;
const DEFAULT_GRAPHQL_URL = "http://localhost:4000/graphql";

function getProductGraphqlUrl(): string {
  const stored = localStorage.getItem("horizon_product_graphql_url");
  if (stored) return stored;
  return (import.meta as any).env.VITE_PRODUCT_GRAPHQL_URL || DEFAULT_GRAPHQL_URL;
}

function getUnifiedAccessToken(): string {
  const storedProfile = localStorage.getItem("horizon_redis_profile");
  if (storedProfile) {
    try {
      const profile = JSON.parse(storedProfile);
      if (profile?.accessToken) return profile.accessToken;
    } catch (_) {
      // Ignore malformed profile and fall back to the legacy token key.
    }
  }

  return localStorage.getItem("horizon_access_token") || "";
}

async function productGraphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getUnifiedAccessToken();
  const response = await fetch(getProductGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Product GraphQL request failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: any) => error.message).join("; "));
  }

  return payload.data;
}

function normalizeGraphqlCategory(category: any, index: number): ErpCategory {
  const sku = category?.skuInfo?.sku;
  return {
    id: sku || category?.id || `category-${index}`,
    name: category?.name || "Unnamed Category",
    skuInfo: category?.skuInfo,
    productCount: category?.productCount
  };
}

function normalizeGraphqlProduct(product: any, index: number): ErpProduct {
  const sku = product?.skuInfo?.sku;
  return {
    id: sku || product?.id || `product-${index}`,
    name: product?.name || "Unnamed Product",
    skuInfo: product?.skuInfo,
    mediaItems: product?.mediaItems || [],
    status: product?.status,
    discountPercent: product?.discountPercent,
    discountStartDate: product?.discountStartDate,
    discountEndDate: product?.discountEndDate,
    categoryName: product?.categoryName
  };
}

function normalizeGraphqlAttribute(attribute: any, fallbackProductSku?: string): ErpAttribute {
  return {
    id: attribute?.sku?.sku || attribute?.id || attribute?.name || crypto.randomUUID(),
    name: attribute?.name || "Unnamed Variant",
    sku: attribute?.sku,
    price: attribute?.price,
    salePrice: attribute?.salePrice,
    variantOptions: attribute?.variantOptions || [],
    statusProduct: attribute?.statusProduct,
    specifications: attribute?.specifications || [],
    promotions: attribute?.promotions || [],
    keywords: attribute?.keywords || [],
    productId: attribute?.product?.skuInfo?.sku || attribute?.product?.id || fallbackProductSku,
    product: attribute?.product
  };
}

export async function loadGraphqlProductAttributes(productSku: string): Promise<ErpAttribute[]> {
  const query = `
    query GetAttributesByProductSku($productSku: String!, $page: Int, $size: Int) {
      getAttributesByProductSku(productSku: $productSku, page: $page, size: $size) {
        contents {
          name
          price
          salePrice
          statusProduct
          variantOptions {
            name
            values
          }
          specifications {
            groupName
            specifications {
              name
              value
              key
              data
            }
          }
          promotions {
            name
            description
            discountPercent
            startDate
            endDate
          }
          keywords
          sku {
            sku
          }
          product {
            name
            skuInfo {
              sku
            }
            mediaItems {
              key
              url
            }
            status
            discountPercent
            discountStartDate
            discountEndDate
            categoryName
          }
        }
      }
    }
  `;

  const data = await productGraphqlRequest<any>(query, {
    productSku,
    page: 1,
    size: 50
  });

  return (data?.getAttributesByProductSku?.contents || []).map((attribute: any) =>
    normalizeGraphqlAttribute(attribute, productSku)
  );
}

export async function loadGraphqlErpCatalog(queryOptions: ErpCatalogQuery = {}): Promise<ErpCatalogData> {
  const query = `
    query LoadProductCatalog($categoryPage: Int, $categorySize: Int, $productFilter: ProductSearchInput!) {
      getAllCategories(page: $categoryPage, size: $categorySize) {
        contents {
          name
          productCount
          skuInfo {
            sku
          }
        }
      }
      searchProducts(filter: $productFilter) {
        contents {
          name
          skuInfo {
            sku
          }
          mediaItems {
            key
            url
          }
          status
          discountPercent
          discountStartDate
          discountEndDate
          categoryName
        }
      }
    }
  `;

  const productFilter: Record<string, any> = {
    page: 1,
    size: 50,
    sortBy: "name",
    sortDirection: "ASC"
  };

  const keyword = queryOptions.keyword?.trim();
  if (keyword) {
    productFilter.keyword = keyword;
  }

  if (queryOptions.categorySku) {
    productFilter.categorySkus = [queryOptions.categorySku];
  }

  const data = await productGraphqlRequest<any>(query, {
    categoryPage: 1,
    categorySize: 50,
    productFilter
  });

  const categories = (data?.getAllCategories?.contents || []).map(normalizeGraphqlCategory);
  const products = (data?.searchProducts?.contents || []).map(normalizeGraphqlProduct);
  const attributeResults = await Promise.all(
    products
      .map((product: ErpProduct) => product.skuInfo?.sku)
      .filter((sku): sku is string => Boolean(sku))
      .map((sku) => loadGraphqlProductAttributes(sku))
  );

  const attributes = attributeResults.flat();

  return { categories, products, attributes };
}

export async function loadErpCatalog(queryOptions: ErpCatalogQuery = {}): Promise<ErpCatalogData> {
  return loadGraphqlErpCatalog(queryOptions);
}

export async function loadLocalErpCatalog(): Promise<ErpCatalogData> {
  const categories: ErpCategory[] = [
    { id: "1", name: "Electronics", skuInfo: { sku: "CAT-ELECT" }, productCount: 2 },
    { id: "2", name: "Clothing", skuInfo: { sku: "CAT-CLOTH" }, productCount: 2 },
    { id: "3", name: "Home & Kitchen", skuInfo: { sku: "CAT-HOME" }, productCount: 1 }
  ];

  const products: ErpProduct[] = [
    {
      id: "101",
      name: "Smartphone X",
      skuInfo: { sku: "PROD-SMART-X" },
      mediaItems: [{ key: "img1", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500" }],
      status: "ACTIVE",
      discountPercent: 10,
      discountStartDate: "2026-07-01",
      discountEndDate: "2026-07-31",
      categoryName: "Electronics"
    },
    {
      id: "102",
      name: "Laptop Pro 15",
      skuInfo: { sku: "PROD-LAP-PRO" },
      mediaItems: [{ key: "img2", url: "https://images.unsplash.com/photo-1496181130204-755241544e35?w=500" }],
      status: "ACTIVE",
      discountPercent: 5,
      discountStartDate: "2026-07-01",
      discountEndDate: "2026-07-31",
      categoryName: "Electronics"
    },
    {
      id: "103",
      name: "T-Shirt Summer",
      skuInfo: { sku: "PROD-TSHIRT" },
      mediaItems: [{ key: "img3", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" }],
      status: "ACTIVE",
      discountPercent: 0,
      discountStartDate: null,
      discountEndDate: null,
      categoryName: "Clothing"
    },
    {
      id: "104",
      name: "Leather Jacket",
      skuInfo: { sku: "PROD-JACKET" },
      mediaItems: [{ key: "img4", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500" }],
      status: "INACTIVE",
      discountPercent: 15,
      discountStartDate: "2026-07-10",
      discountEndDate: "2026-07-20",
      categoryName: "Clothing"
    },
    {
      id: "105",
      name: "Blender Master",
      skuInfo: { sku: "PROD-BLENDER" },
      mediaItems: [{ key: "img5", url: "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=500" }],
      status: "ACTIVE",
      discountPercent: 0,
      discountStartDate: null,
      discountEndDate: null,
      categoryName: "Home & Kitchen"
    }
  ];

  const attributes: ErpAttribute[] = [
    {
      id: "201",
      name: "Smartphone X - 128GB Black",
      sku: { sku: "ATTR-SMART-X-BLK" },
      price: 1000,
      salePrice: 900,
      variantOptions: [
        { name: "Storage", values: ["128GB"] },
        { name: "Color", values: ["Black"] }
      ],
      statusProduct: "AVAILABLE",
      specifications: [
        { groupName: "Màn hình", specifications: [{ name: "Kích thước", value: "6.1 inch" }, { name: "Công nghệ", value: "OLED" }] }
      ],
      promotions: [{ name: "Khuyến mãi hè", description: "Giảm 10%", discountPercent: 10, startDate: "2026-07-01", endDate: "2026-07-31" }],
      keywords: ["smartphone", "apple", "iphone", "dien thoai"],
      productId: "101"
    },
    {
      id: "202",
      name: "Smartphone X - 256GB Silver",
      sku: { sku: "ATTR-SMART-X-SLV" },
      price: 1200,
      salePrice: 1100,
      variantOptions: [
        { name: "Storage", values: ["256GB"] },
        { name: "Color", values: ["Silver"] }
      ],
      statusProduct: "AVAILABLE",
      specifications: [
        { groupName: "Màn hình", specifications: [{ name: "Kích thước", value: "6.1 inch" }, { name: "Công nghệ", value: "OLED" }] }
      ],
      promotions: [],
      keywords: ["smartphone", "apple", "iphone", "dien thoai"],
      productId: "101"
    },
    {
      id: "203",
      name: "Laptop Pro 15 - Core i7",
      sku: { sku: "ATTR-LAP-PRO-I7" },
      price: 1500,
      salePrice: 1425,
      variantOptions: [
        { name: "CPU", values: ["Core i7"] },
        { name: "RAM", values: ["16GB"] }
      ],
      statusProduct: "AVAILABLE",
      specifications: [
        { groupName: "Cấu hình", specifications: [{ name: "CPU", value: "Intel Core i7" }, { name: "RAM", value: "16GB" }] }
      ],
      promotions: [],
      keywords: ["laptop", "computer", "intel", "may tinh xach tay"],
      productId: "102"
    },
    {
      id: "204",
      name: "T-Shirt Summer - M White",
      sku: { sku: "ATTR-TSHIRT-M-WHT" },
      price: 20,
      salePrice: 20,
      variantOptions: [
        { name: "Size", values: ["M"] },
        { name: "Color", values: ["White"] }
      ],
      statusProduct: "AVAILABLE",
      specifications: [],
      promotions: [],
      keywords: ["clothing", "tshirt", "summer", "ao thun"],
      productId: "103"
    },
    {
      id: "205",
      name: "Leather Jacket - L Black",
      sku: { sku: "ATTR-JACKET-L-BLK" },
      price: 150,
      salePrice: 127.5,
      variantOptions: [
        { name: "Size", values: ["L"] },
        { name: "Color", values: ["Black"] }
      ],
      statusProduct: "COMING_SOON",
      specifications: [],
      promotions: [],
      keywords: ["clothing", "jacket", "leather", "ao khoac"],
      productId: "104"
    }
  ];

  await new Promise((resolve) => setTimeout(resolve, 300));
  return { categories, products, attributes };
}

export function getAttributeProductId(attribute: ErpAttribute): string | undefined {
  return attribute.product?.id || attribute.product?.skuInfo?.sku || attribute.productId;
}

export function getErpProductAttributes(productId: string, attributes: ErpAttribute[]): ErpAttribute[] {
  return attributes.filter((attribute) => getAttributeProductId(attribute) === productId);
}

export function getErpProductPriceInfo(productId: string, attributes: ErpAttribute[]): PriceInfo {
  const matchingAttrs = getErpProductAttributes(productId, attributes);
  if (matchingAttrs.length === 0) {
    return {
      presentVal: 0,
      present: "",
      old: "",
      discount: "",
      smember: ""
    };
  }

  const baseAttr = [...matchingAttrs].sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0))[0];
  const salePrice = baseAttr.salePrice || 0;
  const listPrice = baseAttr.price || salePrice;
  const vndPrice = salePrice * VND_RATE;
  const vndOldPrice = listPrice * VND_RATE;
  const discountPct = listPrice > salePrice ? Math.round(((listPrice - salePrice) / listPrice) * 100) : 0;

  return {
    presentVal: vndPrice,
    present: vndPrice > 0 ? vndPrice.toLocaleString("vi-VN") + "đ" : "",
    old: discountPct > 0 ? vndOldPrice.toLocaleString("vi-VN") + "đ" : "",
    discount: discountPct > 0 ? `Giảm ${discountPct}%` : "",
    smember: ""
  };
}

export function createErpProductCardViewModel(
  product: ErpProduct,
  attributes: ErpAttribute[]
): ErpProductCardViewModel {
  const priceInfo = getErpProductPriceInfo(product.id, attributes);
  const baseAttr = getErpProductAttributes(product.id, attributes)[0];
  const rawStatus = baseAttr?.statusProduct;
  const statusVal = rawStatus === "AVAILABLE" ? "Còn hàng" : rawStatus === "OUT_OF_STOCK" ? "Hết hàng" : rawStatus === "COMING_SOON" ? "Sắp có hàng" : rawStatus;

  return {
    ...product,
    priceInfo,
    specs: [
      product.skuInfo?.sku ? { label: "SKU", value: product.skuInfo.sku } : null,
      rawStatus && statusVal ? { label: "Trạng thái", value: statusVal } : null
    ].filter((spec): spec is { label: string; value: string } => Boolean(spec))
  };
}

export function getSortedErpProducts(
  products: ErpProduct[],
  attributes: ErpAttribute[],
  filters: ProductCatalogFilters
): ErpProductCardViewModel[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchingAttrs = getErpProductAttributes(product.id, attributes);
    const baseAttr = [...matchingAttrs].sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0))[0];
    const basePrice = baseAttr ? (baseAttr.salePrice || 0) * VND_RATE : 0;
    const status = baseAttr?.statusProduct || "";

    const matchesCategory = filters.activeCategory === "all" || product.categoryName === filters.activeCategory;
    const matchesSearch = !query ||
      product.name.toLowerCase().includes(query) ||
      (product.skuInfo?.sku || "").toLowerCase().includes(query) ||
      (product.categoryName || "").toLowerCase().includes(query);

    const matchesPrice = filters.erpPriceFilter === "all" ||
      (filters.erpPriceFilter === "under1m" && basePrice < 1000000) ||
      (filters.erpPriceFilter === "1to5m" && basePrice >= 1000000 && basePrice <= 5000000) ||
      (filters.erpPriceFilter === "over5m" && basePrice > 5000000);

    const matchesStock = filters.erpStockFilter === "all" ||
      (filters.erpStockFilter === "available" && status === "AVAILABLE") ||
      (filters.erpStockFilter === "outofstock" && (status === "OUT_OF_STOCK" || status === "COMING_SOON"));

    return matchesCategory && matchesSearch && matchesPrice && matchesStock;
  });

  return filtered
    .map((product) => createErpProductCardViewModel(product, attributes))
    .sort((a, b) => {
      if (filters.sortBy === "giathap") return a.priceInfo.presentVal - b.priceInfo.presentVal;
      if (filters.sortBy === "giacao") return b.priceInfo.presentVal - a.priceInfo.presentVal;
      if (filters.sortBy === "khuyenmai") return (b.discountPercent || 0) - (a.discountPercent || 0);
      const numericA = parseInt(a.id, 10);
      const numericB = parseInt(b.id, 10);
      if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
        return numericA - numericB;
      }
      return a.name.localeCompare(b.name);
    });
}

export function getErpCategoryCount(category: string, products: ErpProduct[]): number {
  if (category === "all") return products.length;
  return products.filter((product) => product.categoryName === category).length;
}

export function createErpProductDetail(product: ErpProduct, attributes: ErpAttribute[]): Product {
  const matchingAttrs = getErpProductAttributes(product.id, attributes);
  const baseAttr = [...matchingAttrs].sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0))[0];
  const vndPrice = baseAttr?.salePrice ? baseAttr.salePrice * VND_RATE : 0;
  const priceStr = vndPrice > 0 ? vndPrice.toLocaleString("vi-VN") + "đ" : "";

  const specs = [
    product.skuInfo?.sku ? { label: "Mã SKU Sản phẩm", value: product.skuInfo.sku } : null,
    product.categoryName ? { label: "Nhóm Danh mục", value: product.categoryName } : null,
    baseAttr?.statusProduct ? { label: "Trạng thái Kho", value: baseAttr.statusProduct === "AVAILABLE" ? "Còn hàng" : baseAttr.statusProduct } : null
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec));

  if (baseAttr?.specifications?.length) {
    baseAttr.specifications.forEach((group) => {
      group.specifications?.forEach((spec) => {
        const label = spec.name || spec.key;
        const value = spec.value || spec.data;
        if (label && value) {
          specs.push({ label, value });
        }
      });
    });
  }

  const variantDesc = matchingAttrs.map((attribute) => {
    const opts = attribute.variantOptions
      ? attribute.variantOptions.map((option) => `${option.name}: ${option.values.join(", ")}`).join(", ")
      : "";
    return `• Phiên bản ${attribute.name} (${opts}) - Giá bán: ${((attribute.salePrice || 0) * VND_RATE).toLocaleString("vi-VN")}đ`;
  }).join("\n");

  const mediaUrls = product.mediaItems?.length
    ? product.mediaItems.map((media) => media.url).filter(Boolean)
    : [];

  const longDescParts = [
    product.categoryName ? `Nhóm danh mục: ${product.categoryName}` : "",
    variantDesc ? `Các biến thể hiện có:\n${variantDesc}` : ""
  ].filter(Boolean);

  return {
    id: product.id,
    name: product.name,
    category: "ai",
    icon: product.categoryName === "Electronics" ? "devices" : product.categoryName === "Clothing" ? "checkroom" : "home",
    iconColor: product.categoryName === "Electronics" ? "text-sky-500" : product.categoryName === "Clothing" ? "text-rose-500" : "text-amber-500",
    desc: product.categoryName ? `${product.name} - ${product.categoryName}` : product.name,
    price: priceStr,
    bgColor: "bg-indigo-500/10",
    longDesc: longDescParts.join("\n\n"),
    specs,
    mediaUrls
  };
}

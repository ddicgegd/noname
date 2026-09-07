import type { Product, ProductAttributeOption } from "../lib/productCatalog";
import { getUnifiedAccessToken, unifiedFetch } from "../lib/api";

export interface ProductSearchFilter {
  keyword?: string;
  categorySku?: string;
  categorySkus?: string[];
  skus?: string[];
  statuses?: string[];
  createdBy?: string;
  minSoldQuantity?: number;
  maxSoldQuantity?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minOrders?: number;
  maxOrders?: number;
  minView?: number;
  minRating?: number;
  minReviews?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface CategorySearchFilter {
  keyword?: string;
  skus?: string[];
  names?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface CategoryItem {
  name: string;
  sku: string;
  productCount?: number;
}

export interface AttributesSearchFilter {
  productSku?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

interface ProductSearchResult {
  products: Product[];
  totalElements: number;
}

const VND_RATE = 24000;

async function localGraphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getUnifiedAccessToken();
  const response = await unifiedFetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Merchandise GraphQL request failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: any) => error.message).join("; "));
  }

  return payload.data;
}

function formatVndFromApiPrice(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "";
  }

  const normalized = value < 100000 ? value * VND_RATE : value;
  return Math.round(normalized).toLocaleString("vi-VN") + "đ";
}

function calculateDiscountPercent(price?: number | null, salePrice?: number | null): number | undefined {
  if (
    typeof price !== "number" ||
    typeof salePrice !== "number" ||
    !Number.isFinite(price) ||
    !Number.isFinite(salePrice) ||
    price <= 0 ||
    salePrice >= price
  ) {
    return undefined;
  }

  return Math.round(((price - salePrice) / price) * 100);
}

function deriveCategory(categoryName?: string | null, index = 0): Product["category"] {
  const raw = (categoryName || "").toLowerCase();
  if (raw.includes("storage") || raw.includes("s3") || raw.includes("database") || raw.includes("home")) return "storage";
  if (raw.includes("network") || raw.includes("cdn") || raw.includes("edge")) return "network";
  if (raw.includes("compute") || raw.includes("gpu") || raw.includes("server") || raw.includes("electronics")) return "compute";
  if (raw.includes("ai") || raw.includes("model")) return "ai";
  return (["ai", "compute", "storage", "network"] as const)[index % 4];
}

function getCategoryVisual(category: Product["category"]) {
  if (category === "compute") return { icon: "developer_board", iconColor: "text-sky-500", bgColor: "bg-sky-500/10" };
  if (category === "storage") return { icon: "database", iconColor: "text-purple-500", bgColor: "bg-purple-500/10" };
  if (category === "network") return { icon: "router", iconColor: "text-emerald-500", bgColor: "bg-emerald-500/10" };
  return { icon: "psychology", iconColor: "text-primary", bgColor: "bg-primary/10" };
}

function normalizeAttribute(attribute: any, index: number): ProductAttributeOption {
  const sku = attribute?.sku?.sku || attribute?.skuInfo?.sku;
  return {
    id: String(sku || attribute?.id || attribute?.name || `attribute-${index}`),
    name: attribute?.name || sku || `Phiên bản ${index + 1}`,
    sku,
    price: attribute?.price,
    salePrice: attribute?.salePrice,
    statusProduct: attribute?.statusProduct,
    variantOptions: Array.isArray(attribute?.variantOptions) ? attribute.variantOptions : [],
    specifications: Array.isArray(attribute?.specifications) ? attribute.specifications : [],
    promotions: Array.isArray(attribute?.promotions) ? attribute.promotions : [],
    keywords: Array.isArray(attribute?.keywords) ? attribute.keywords : []
  };
}

function normalizeProduct(product: any, index: number): Product {
  const sku = product?.skuInfo?.sku || product?.sku?.sku || product?.sku;
  const category = deriveCategory(product?.categoryName, index);
  const visual = getCategoryVisual(category);
  const mediaUrls = Array.isArray(product?.mediaItems)
    ? product.mediaItems.map((media: any) => media?.url).filter(Boolean)
    : Array.isArray(product?.mediaUrls)
      ? product.mediaUrls.filter(Boolean)
      : [];

  const rawPrice = product?.salePrice ?? product?.price;
  const oldPrice = product?.price && product?.salePrice && product.price > product.salePrice
    ? formatVndFromApiPrice(product.price)
    : undefined;
  const price = formatVndFromApiPrice(rawPrice) || "5.000.000đ";
  const discountPercent = calculateDiscountPercent(product?.price, product?.salePrice)
    ?? (typeof product?.discountPercent === "number" ? product.discountPercent : undefined);

  const specs = [
    sku ? { label: "Mã SKU Sản phẩm", value: String(sku) } : null,
    product?.categoryName ? { label: "Nhóm Danh mục", value: String(product.categoryName) } : null,
    product?.status ? { label: "Trạng thái", value: String(product.status) } : null,
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec));

  return {
    id: String(sku || product?.id || `api-product-${index}`),
    sku: sku ? String(sku) : undefined,
    status: product?.status,
    categoryName: product?.categoryName,
    rating: typeof product?.rating === "number" ? product.rating : undefined,
    viewCount: typeof product?.viewCount === "number" ? product.viewCount : undefined,
    totalSoldQuantity: typeof product?.totalSoldQuantity === "number" ? product.totalSoldQuantity : undefined,
    name: product?.name || sku || `Sản phẩm ${index + 1}`,
    category,
    tag: discountPercent && discountPercent > 0 ? "Popular" : undefined,
    tagType: discountPercent && discountPercent > 0 ? "popular" : undefined,
    ...visual,
    desc: product?.categoryName ? `${product.name || sku} - ${product.categoryName}` : product?.name || "Sản phẩm từ API",
    price,
    oldPrice,
    discount: discountPercent && discountPercent > 0 ? `Giảm ${Math.round(discountPercent)}%` : undefined,
    bgColor: visual.bgColor,
    longDesc: product?.description || product?.categoryName || product?.name || "Sản phẩm từ hệ thống merchandise.",
    specs,
    mediaUrls,
  };
}

export async function searchProductsForCatalog(filter: ProductSearchFilter): Promise<ProductSearchResult> {
  const query = `
    query SearchProductsForCatalog($filter: ProductSearchInput!) {
      searchProducts(filter: $filter) {
        contents {
          id
          name
          skuInfo {
            sku
          }
          price
          salePrice
          mediaItems {
            key
            url
          }
          status
          categoryName
          discountPercent
          discountStartDate
          discountEndDate
          rating
          viewCount
          totalSoldQuantity
        }
        paging {
          pageNumber
          pageSize
          totalPages
          totalElements
        }
      }
    }
  `;

  const data = await localGraphqlRequest<any>(query, {
    filter: {
      ...filter,
      size: filter.size || 15
    }
  });
  const contents = data?.searchProducts?.contents;
  return {
    products: Array.isArray(contents) ? contents.map(normalizeProduct) : [],
    totalElements: data?.searchProducts?.paging?.totalElements || 0
  };
}

export async function searchAttributesForProductSku(productSku: string): Promise<ProductAttributeOption[]> {
  const query = `
    query SearchAttributesForProductSku($filter: AttributesSearchInput!) {
      searchAttributes(filter: $filter) {
        contents {
          id
          name
          sku {
            sku
          }
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
        }
      }
    }
  `;

  const data = await localGraphqlRequest<any>(query, {
    filter: {
      productSku,
      page: 1,
      size: 50
    }
  });

  const contents = data?.searchAttributes?.contents;
  return Array.isArray(contents) ? contents.map(normalizeAttribute) : [];
}

export async function searchCategoriesForCatalog(filter: CategorySearchFilter = {}): Promise<{ categories: CategoryItem[]; totalElements: number }> {
  const query = `
    query SearchCategoriesForCatalog($filter: CategorySearchInput!) {
      searchCategories(filter: $filter) {
        contents {
          name
          skuInfo {
            sku
          }
          productCount
        }
        paging {
          pageNumber
          pageSize
          totalElements
          totalPages
        }
      }
    }
  `;

  try {
    const data = await localGraphqlRequest<any>(query, {
      filter: {
        page: filter.page || 1,
        size: filter.size || 20,
        ...filter,
      }
    });
    const contents = data?.searchCategories?.contents;
    const categories: CategoryItem[] = Array.isArray(contents)
      ? contents.map((c: any) => ({
          name: c.name || "Danh mục",
          sku: c.skuInfo?.sku || c.sku || "",
          productCount: typeof c.productCount === "number" ? c.productCount : undefined
        }))
      : [];
    return {
      categories,
      totalElements: data?.searchCategories?.paging?.totalElements || categories.length
    };
  } catch (error) {
    console.warn("Không thể tải danh mục từ GraphQL Gateway:", error);
    return { categories: [], totalElements: 0 };
  }
}


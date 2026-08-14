export interface Product {
  id: string;
  name: string;
  sku?: string;
  status?: string;
  categoryName?: string;
  rating?: number;
  viewCount?: number;
  totalSoldQuantity?: number;
  category: "ai" | "compute" | "storage" | "network";
  tag?: string;
  tagType?: "new" | "popular" | "updated";
  icon: string;
  iconColor: string;
  desc: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  smember?: string;
  bgColor: string;
  longDesc: string;
  specs: { label: string; value: string }[];
  mediaUrls?: string[];
  attributeOptions?: ProductAttributeOption[];
}

export interface ProductAttributeOption {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  salePrice?: number;
  statusProduct?: string;
  variantOptions?: { name: string; values: string[] }[];
  specifications?: {
    groupName?: string;
    specifications?: { key?: string; value?: string }[];
  }[];
  promotions?: any[];
  keywords?: string[];
}

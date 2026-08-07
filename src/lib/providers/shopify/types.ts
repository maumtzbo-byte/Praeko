export interface ShopInfo {
  id: string;
  name: string;
  myshopifyDomain: string;
  primaryDomainUrl: string;
  currencyCode: string;
  email: string;
}

export type ShopifyProductStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: ShopifyProductStatus;
  totalInventory: number;
  minPrice: string;
  maxPrice: string;
  currencyCode: string;
}

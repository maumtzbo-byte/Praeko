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

export interface DraftProductInput {
  title: string;
  descriptionHtml: string;
  /** USD — converted to the shop's currency by Shopify's price list, same as manual entry in the admin. */
  priceUsd: number;
  tags?: string[];
}

export interface CreatedProduct {
  id: string;
  handle: string;
  adminUrl: string;
}

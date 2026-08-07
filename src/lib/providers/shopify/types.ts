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
  /** USD — ShopifyAdminClient.createDraftProduct converts this to the shop's own currency before sending it (Shopify's productSet mutation takes a plain decimal, no conversion). */
  priceUsd: number;
  tags?: string[];
}

export interface CreatedProduct {
  id: string;
  handle: string;
  adminUrl: string;
}

export type ShopPolicyType =
  | "REFUND_POLICY"
  | "SHIPPING_POLICY"
  | "PRIVACY_POLICY"
  | "TERMS_OF_SERVICE"
  | "TERMS_OF_SALE"
  | "LEGAL_NOTICE"
  | "SUBSCRIPTION_POLICY"
  | "CONTACT_INFORMATION";

import type { ShopInfo, ShopifyProduct, ShopifyProductStatus } from "./types";

/**
 * Bumped roughly with Shopify's quarterly releases (YYYY-MM/YYYY-04/07/10).
 * A pinned version keeps the queries below from breaking under us when
 * Shopify ships a new default — bump deliberately, not automatically.
 */
const API_VERSION = "2025-10";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Talks to one Shopify store's Admin API (GraphQL) via a custom app access
 * token — the right auth model for "connect my own store", as opposed to
 * the OAuth dance in src/lib/social/* built for a marketplace app that
 * connects *other people's* accounts. Server-side only: the token is a
 * full Admin API credential and must never reach the browser bundle.
 */
export class ShopifyAdminClient {
  private readonly endpoint: string;
  private readonly accessToken: string;

  constructor() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    if (!domain || !accessToken) {
      throw new Error(
        "SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_ACCESS_TOKEN is not set — see .env.example. ShopifyAdminClient must only run server-side.",
      );
    }
    this.endpoint = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
    this.accessToken = accessToken;
  }

  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      throw new Error(`Shopify Admin API request failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as GraphQLResponse<T>;
    if (body.errors?.length) {
      throw new Error(`Shopify Admin API returned errors: ${body.errors.map((e) => e.message).join("; ")}`);
    }
    if (!body.data) {
      throw new Error("Shopify Admin API response had no data.");
    }
    return body.data;
  }

  /** Confirms the credentials are valid and identifies which store they point at. */
  async getShopInfo(): Promise<ShopInfo> {
    interface ShopQueryResult {
      shop: {
        id: string;
        name: string;
        myshopifyDomain: string;
        primaryDomain: { url: string };
        currencyCode: string;
        email: string;
      };
    }
    const data = await this.graphql<ShopQueryResult>(`
      query {
        shop {
          id
          name
          myshopifyDomain
          primaryDomain { url }
          currencyCode
          email
        }
      }
    `);
    return {
      id: data.shop.id,
      name: data.shop.name,
      myshopifyDomain: data.shop.myshopifyDomain,
      primaryDomainUrl: data.shop.primaryDomain.url,
      currencyCode: data.shop.currencyCode,
      email: data.shop.email,
    };
  }

  /** Most recently updated products first — enough to eyeball the catalog synced correctly. */
  async listProducts(limit = 20): Promise<ShopifyProduct[]> {
    interface ProductsQueryResult {
      products: {
        edges: {
          node: {
            id: string;
            title: string;
            handle: string;
            status: ShopifyProductStatus;
            totalInventory: number;
            priceRangeV2: {
              minVariantPrice: { amount: string; currencyCode: string };
              maxVariantPrice: { amount: string };
            };
          };
        }[];
      };
    }
    const data = await this.graphql<ProductsQueryResult>(
      `
        query Products($first: Int!) {
          products(first: $first, sortKey: UPDATED_AT, reverse: true) {
            edges {
              node {
                id
                title
                handle
                status
                totalInventory
                priceRangeV2 {
                  minVariantPrice { amount currencyCode }
                  maxVariantPrice { amount }
                }
              }
            }
          }
        }
      `,
      { first: limit },
    );
    return data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      status: node.status,
      totalInventory: node.totalInventory,
      minPrice: node.priceRangeV2.minVariantPrice.amount,
      maxPrice: node.priceRangeV2.maxVariantPrice.amount,
      currencyCode: node.priceRangeV2.minVariantPrice.currencyCode,
    }));
  }
}

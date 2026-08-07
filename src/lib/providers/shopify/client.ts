import type { CreatedProduct, DraftProductInput, ShopInfo, ShopifyProduct, ShopifyProductStatus } from "./types";

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

interface CachedToken {
  accessToken: string;
  /** Epoch ms after which the token is treated as expired and re-fetched. */
  expiresAt: number;
}

/** One cache per store domain — a client_id/client_secret pair gets one token per shop, and a warm serverless instance can serve more than one request. */
const tokenCache = new Map<string, CachedToken>();

interface CachedRates {
  usdToOther: Record<string, number>;
  expiresAt: number;
}

let ratesCache: CachedRates | null = null;

/**
 * USD -> other currency rates from a free, no-key endpoint (rates refresh
 * once/day upstream; cached here for 12h). Needed because Shopify's
 * `productSet` mutation takes the variant price as a plain decimal in
 * whatever currency the shop is set to — it does NOT convert for you, so a
 * USD-denominated price estimate has to be converted before it's sent.
 */
async function getUsdExchangeRates(): Promise<Record<string, number>> {
  if (ratesCache && ratesCache.expiresAt > Date.now()) {
    return ratesCache.usdToOther;
  }
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) {
    throw new Error(`Currency exchange rate lookup failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { result: string; rates: Record<string, number> };
  if (data.result !== "success") {
    throw new Error("Currency exchange rate lookup returned a non-success result.");
  }
  ratesCache = { usdToOther: data.rates, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return ratesCache.usdToOther;
}

/**
 * Talks to one Shopify store's Admin API (GraphQL) via the OAuth client
 * credentials grant — the auth model for custom apps created after
 * Shopify's January 2026 deprecation of the old "reveal a static token in
 * the admin" flow (legacy apps created before then still use a static
 * shpat_ token; this doesn't need to support that case). Client ID/secret
 * are exchanged for a short-lived (~24h) access token, cached per store
 * domain and refreshed automatically. This is still "connect my own
 * store", not the OAuth dance in src/lib/social/* built for a marketplace
 * app connecting *other people's* accounts — no redirect, no end user.
 * Server-side only: the client secret and the resulting token must never
 * reach the browser bundle.
 */
export class ShopifyAdminClient {
  private readonly domain: string;
  private readonly endpoint: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private shopCurrencyCode: string | null = null;

  constructor() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!domain || !clientId || !clientSecret) {
      throw new Error(
        "SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET is not set — see .env.example. ShopifyAdminClient must only run server-side.",
      );
    }
    this.domain = domain;
    this.endpoint = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * POST https://{shop}/admin/oauth/access_token, grant_type=client_credentials
   * — the client credentials grant Shopify recommends for trusted,
   * server-to-server integrations owned by the same org that owns the
   * store (see shopify.dev/docs/apps/build/authentication-authorization/
   * access-tokens/client-credentials-grant). Reuses the cached token until
   * ~1 minute before its documented expiry instead of re-fetching on every
   * call.
   */
  private async getAccessToken(): Promise<string> {
    const cached = tokenCache.get(this.domain);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.accessToken;
    }

    const res = await fetch(`https://${this.domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) {
      throw new Error(`Shopify client_credentials token exchange failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    tokenCache.set(this.domain, {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    });
    return data.access_token;
  }

  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const accessToken = await this.getAccessToken();
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
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

  /** Cached for the lifetime of this client instance — a shop's currency doesn't change mid-request. */
  private async getShopCurrencyCode(): Promise<string> {
    if (!this.shopCurrencyCode) {
      this.shopCurrencyCode = (await this.getShopInfo()).currencyCode;
    }
    return this.shopCurrencyCode;
  }

  /** Converts a USD estimate (what the product-research agent produces) into the shop's own currency, since Shopify does not do this for us. */
  private async convertUsdToShopCurrency(amountUsd: number): Promise<string> {
    const currencyCode = await this.getShopCurrencyCode();
    if (currencyCode === "USD") {
      return amountUsd.toFixed(2);
    }
    const rates = await getUsdExchangeRates();
    const rate = rates[currencyCode];
    if (!rate) {
      throw new Error(`No hay tasa de cambio disponible para la moneda de la tienda (${currencyCode}).`);
    }
    return (amountUsd * rate).toFixed(2);
  }

  /**
   * Creates a product as a DRAFT — never ACTIVE — so an agent proposing a
   * product never makes it visible in the storefront on its own; a human
   * has to review it in the admin and publish it themselves. Single
   * variant only (no size/color options), which covers the research
   * agent's use case (one product idea, one price) without needing a
   * variant-matrix UI on top of this yet.
   *
   * productSet is the current Shopify-recommended mutation for setting a
   * product + its variants/price in one call (replaces the old
   * productCreate + separate productVariantsBulkCreate two-step). The
   * shape below — OptionSetInput { name, values: [{ name }] } and
   * ProductVariantSetInput { optionValues: [{ optionName, name }], price }
   * — was checked field-by-field against the live ProductSetInput /
   * OptionSetInput / OptionValueSetInput / ProductVariantSetInput /
   * VariantOptionValueInput docs on shopify.dev (API 2025-10) and matches.
   * Still worth a real smoke test (create one throwaway draft) once real
   * store credentials are set — this confirms the request shape, not a
   * live round-trip.
   */
  async createDraftProduct(input: DraftProductInput): Promise<CreatedProduct> {
    interface ProductSetResult {
      productSet: {
        product: { id: string; handle: string } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }
    const price = await this.convertUsdToShopCurrency(input.priceUsd);
    const data = await this.graphql<ProductSetResult>(
      `
        mutation CreateDraftProduct($input: ProductSetInput!) {
          productSet(synchronous: true, input: $input) {
            product { id handle }
            userErrors { field message }
          }
        }
      `,
      {
        input: {
          title: input.title,
          descriptionHtml: input.descriptionHtml,
          status: "DRAFT",
          tags: input.tags ?? [],
          productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
          variants: [
            {
              optionValues: [{ optionName: "Title", name: "Default Title" }],
              price,
            },
          ],
        },
      },
    );

    const { product, userErrors } = data.productSet;
    if (userErrors.length) {
      throw new Error(`Shopify rechazó la creación del producto: ${userErrors.map((e) => e.message).join("; ")}`);
    }
    if (!product) {
      throw new Error("Shopify no devolvió el producto creado.");
    }

    const numericId = product.id.split("/").pop();
    return {
      id: product.id,
      handle: product.handle,
      adminUrl: `https://${this.domain}/admin/products/${numericId}`,
    };
  }
}

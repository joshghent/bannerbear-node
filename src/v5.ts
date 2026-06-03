import fetch, { Headers } from "node-fetch";
import crypto from "crypto";
import base64url from "base64url";

const API_ENDPOINT = "https://api.bannerbear.com/v5";
const API_ENDPOINT_SYNCHRONOUS = "https://sync.api.bannerbear.com/v5";

// =================================
//        V5 MODIFICATIONS
// =================================

export interface V5Modifications {
  template?: Record<string, any>;
  objects?: Array<{ name: string; [key: string]: any }>;
}

// =================================
//        REQUEST PARAMS
// =================================

export interface CreateImageV5Params {
  modifications: V5Modifications;
  formats?: string[];
  scale?: number;
  dpi?: number;
  quality?: number;
  proxy?: string;
  metadata?: string;
  version?: number;
}

export interface UpdateImageTemplateV5Params {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface CreateBatchV5Params {
  type: string;
  items: any[];
}

export interface WebhookV5Params {
  name: string;
  url: string;
  resource?: string;
  event?: string;
  status?: "active" | "disabled";
  scope?: string;
  templates?: string[];
}

export interface InstantUrlV5Params {
  name: string;
  template: string;
  mode?: "encoded" | "named_params";
  security?: "signed" | "open";
  status?: "active" | "disabled";
  scale?: 1 | 2 | 3 | 4;
  rate_limit?: boolean;
  template_version?: number | null;
  max_renders?: number | null;
  expires_at?: string | null;
}

export interface BuildInstantUrlV5Params {
  mode?: "encoded" | "named_params";
  signingKey?: string;
  modifications: V5Modifications;
}

// =================================
//        RESPONSE SHAPES
// =================================

export interface AccountV5 {
  uid: string;
}

export interface ImageTemplateV5 {
  uid: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface ImageV5 {
  uid: string;
  status: string;
  template: string;
  modifications?: V5Modifications;
  files?: string[];
  metadata?: string | null;
  created_at?: string;
}

export interface BatchV5 {
  uid: string;
  type: string;
  status: string;
  items?: any[];
  created_at?: string;
}

export interface WebhookV5 {
  uid: string;
  name: string;
  url: string;
  resource?: string;
  event?: string;
  status?: string;
  scope?: string;
  templates?: string[];
  // Only returned at creation — store it now.
  signing_key?: string;
  created_at?: string;
}

export interface InstantUrlV5 {
  uid: string;
  name: string;
  template: string;
  template_version?: number | null;
  mode: "encoded" | "named_params";
  security: "signed" | "open";
  status: "active" | "disabled";
  scale: number;
  rate_limit?: boolean;
  max_renders?: number | null;
  render_count?: number;
  expires_at?: string | null;
  base_url: string;
  sample_url: string;
  created_at?: string;
  // Only returned at creation — store it now.
  signing_key?: string;
}

// =================================
//        CLIENT
// =================================

export class BannerbearV5 {
  private token: string;
  private headers: Headers;

  constructor(apiToken?: string) {
    this.token = apiToken || String(process.env["BANNERBEAR_API_KEY"]);
    this.headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.token}`,
    });
  }

  private async request(method: string, path: string, body?: unknown, sync = false): Promise<unknown> {
    const base = sync ? API_ENDPOINT_SYNCHRONOUS : API_ENDPOINT;
    const init: any = { method, headers: this.headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    const response = await fetch(`${base}${path}`, init);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // ---------- Account ----------

  public async account(): Promise<AccountV5> {
    return this.request("GET", "/account") as Promise<AccountV5>;
  }

  // ---------- Image Templates ----------

  public async list_image_templates(page?: number): Promise<ImageTemplateV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/image_templates${qs}`) as Promise<ImageTemplateV5[]>;
  }

  public async get_image_template(uid: string): Promise<ImageTemplateV5> {
    return this.request("GET", `/image_templates/${uid}`) as Promise<ImageTemplateV5>;
  }

  public async update_image_template(uid: string, params: UpdateImageTemplateV5Params): Promise<ImageTemplateV5> {
    return this.request("PATCH", `/image_templates/${uid}`, params) as Promise<ImageTemplateV5>;
  }

  // ---------- Images ----------

  public async create_image(template: string, params: CreateImageV5Params, synchronous = false): Promise<ImageV5> {
    return this.request("POST", "/images", { ...params, template }, synchronous) as Promise<ImageV5>;
  }

  public async get_image(uid: string): Promise<ImageV5> {
    return this.request("GET", `/images/${uid}`) as Promise<ImageV5>;
  }

  public async list_images(page?: number): Promise<ImageV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/images${qs}`) as Promise<ImageV5[]>;
  }

  // ---------- Batches ----------

  public async create_batch(params: CreateBatchV5Params): Promise<BatchV5> {
    return this.request("POST", "/batches", params) as Promise<BatchV5>;
  }

  public async get_batch(uid: string): Promise<BatchV5> {
    return this.request("GET", `/batches/${uid}`) as Promise<BatchV5>;
  }

  public async list_batches(page?: number): Promise<BatchV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/batches${qs}`) as Promise<BatchV5[]>;
  }

  // ---------- Webhooks ----------

  public async create_webhook(params: WebhookV5Params): Promise<WebhookV5> {
    return this.request("POST", "/webhooks", params) as Promise<WebhookV5>;
  }

  public async get_webhook(uid: string): Promise<WebhookV5> {
    return this.request("GET", `/webhooks/${uid}`) as Promise<WebhookV5>;
  }

  public async update_webhook(uid: string, params: WebhookV5Params): Promise<WebhookV5> {
    return this.request("PATCH", `/webhooks/${uid}`, params) as Promise<WebhookV5>;
  }

  public async delete_webhook(uid: string): Promise<null> {
    return this.request("DELETE", `/webhooks/${uid}`) as Promise<null>;
  }

  public async list_webhooks(page?: number): Promise<WebhookV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/webhooks${qs}`) as Promise<WebhookV5[]>;
  }

  // ---------- Instant URLs ----------

  public async create_instant_url(params: InstantUrlV5Params): Promise<InstantUrlV5> {
    return this.request("POST", "/instant_urls", params) as Promise<InstantUrlV5>;
  }

  public async get_instant_url(uid: string): Promise<InstantUrlV5> {
    return this.request("GET", `/instant_urls/${uid}`) as Promise<InstantUrlV5>;
  }

  public async update_instant_url(uid: string, params: InstantUrlV5Params): Promise<InstantUrlV5> {
    return this.request("PATCH", `/instant_urls/${uid}`, params) as Promise<InstantUrlV5>;
  }

  public async delete_instant_url(uid: string): Promise<null> {
    return this.request("DELETE", `/instant_urls/${uid}`) as Promise<null>;
  }

  public async list_instant_urls(page?: number): Promise<InstantUrlV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/instant_urls${qs}`) as Promise<InstantUrlV5[]>;
  }

  // Pure local helper — no API call.
  public build_instant_url(baseUrl: string, params: BuildInstantUrlV5Params): string {
    const { mode = "encoded", signingKey, modifications } = params;
    let url: string;

    if (mode === "encoded") {
      // If only `objects` is present, encode just the array (matches server canonical form).
      // Otherwise encode the full object with `template` key before `objects`.
      let data: any;
      if (modifications.template === undefined) {
        data = modifications.objects || [];
      } else {
        data = { template: modifications.template };
        if (modifications.objects !== undefined) data.objects = modifications.objects;
      }
      url = `${baseUrl}?modifications=${base64url(JSON.stringify(data))}`;
    } else if (mode === "named_params") {
      const parts: string[] = [];
      if (modifications.template) {
        for (const [k, v] of Object.entries(modifications.template)) {
          parts.push(`template:${k}=${formEncode(v)}`);
        }
      }
      for (const obj of modifications.objects || []) {
        const name = obj.name;
        for (const [k, v] of Object.entries(obj)) {
          if (k === "name") continue;
          parts.push(`${name}:${k}=${formEncode(v)}`);
        }
      }
      url = `${baseUrl}?${parts.join("&")}`;
    } else {
      throw new Error(`unknown instant URL mode: ${mode}`);
    }

    if (!signingKey) return url;
    const sig = crypto.createHmac("sha256", signingKey).update(url).digest("hex");
    return `${url}&s=${sig}`;
  }
}

// Encodes a value using application/x-www-form-urlencoded rules so it matches
// what Ruby's URI.encode_www_form_component and Bannerbear's signed URLs expect.
function formEncode(v: unknown): string {
  return encodeURIComponent(String(v))
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

export default BannerbearV5;

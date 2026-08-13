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
  formats?: Array<"jpg" | "png" | "pdf" | "webp" | "avif">;
  scale?: 1 | 2 | 3 | 4;
  dpi?: number;
  quality?: number;
  proxy?: boolean;
  metadata?: string;
  version?: number;
}

// A template layer. Layers are keyed by `type` and carry a large, type-specific
// set of style attributes — see the API docs for the full per-type list.
export interface V5Layer {
  id: string;
  type: string;
  name?: string;
  [key: string]: any;
}

export interface V5TemplateConfig {
  objects: V5Layer[];
}

export interface CreateImageTemplateV5Params {
  name: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  config?: V5TemplateConfig;
}

export interface UpdateImageTemplateV5Params {
  name?: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  // Replaces the template's canvas configuration in place.
  config?: V5TemplateConfig;
}

export interface CreateBatchV5Params {
  type: string;
  items: any[];
}

export interface WebhookV5Params {
  name: string;
  url: string;
  resource?: "image" | "batch" | "tool_job";
  event?: "all_events" | "completed" | "failed";
  status?: "active" | "disabled";
  scope?: "all_templates" | "specific_templates";
  templates?: string[];
}

// =================================
//        TOOL PARAMS
// =================================

export interface ToolV5BaseParams {
  // Arbitrary metadata string stored with the tool run.
  metadata?: string;
}

export interface RemoveBgV5Params extends ToolV5BaseParams {
  image_url: string;
}

export interface CreatePdfV5Params extends ToolV5BaseParams {
  // JPG, PNG, or PDF. Order is preserved.
  urls: string[];
}

export interface TrimVideoV5Params extends ToolV5BaseParams {
  video_url: string;
  start: number;
  end: number;
}

export interface ConcatVideosV5Params extends ToolV5BaseParams {
  // Two or more URLs, in play order.
  video_urls: string[];
  width?: number;
  height?: number;
}

export interface ResizeVideoV5Params extends ToolV5BaseParams {
  video_url: string;
  width: number;
  height: number;
  // cover crops, contain letterboxes.
  fit?: "cover" | "contain";
}

export interface CropVideoV5Params extends ToolV5BaseParams {
  video_url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlayVideoV5Params extends ToolV5BaseParams {
  base_video_url: string;
  overlay_video_url: string;
  x: number;
  y: number;
  // 1.0 = original size.
  scale?: number;
  // When the overlay begins, in seconds.
  start?: number;
}

export interface OverlayImageV5Params extends ToolV5BaseParams {
  video_url: string;
  image_url: string;
  x: number;
  y: number;
  // 0.0 to 1.0.
  opacity?: number;
}

export interface SubtitleVideoV5Params extends ToolV5BaseParams {
  video_url: string;
  // Omit to auto-detect.
  language?: string;
  font?: string;
  font_size?: number;
  color?: string;
  bold?: "on" | "off";
  italic?: "on" | "off";
  outline_color?: string;
  outline_width?: number;
  shadow_size?: number;
  shadow_color?: string;
  background_style?: "outline" | "box" | "none";
  // Only used when background_style is "box".
  background_color?: string;
  // Numpad-style position, e.g. "2" for bottom center.
  alignment?: string;
}

export interface GenerateVoiceoverV5Params extends ToolV5BaseParams {
  // Up to 2000 characters.
  text: string;
  voice: string;
}

export interface AddAudioV5Params extends ToolV5BaseParams {
  video_url: string;
  audio_url: string;
  mode: "mix" | "replace";
  // 1.0 = original level.
  volume?: number;
  loop?: "on" | "off";
  // Dips the new audio under the original. Mix mode only.
  ducking?: "off" | "subtle" | "medium" | "heavy";
}

export interface AddCoverArtV5Params extends ToolV5BaseParams {
  video_url: string;
  image_url: string;
}

export interface CreateVideoSlideshowV5Params extends ToolV5BaseParams {
  // Two or more URLs, in slide order.
  image_urls: string[];
  slide_duration?: number;
  transition?: "none" | "fade" | "dissolve" | "wipeleft" | "slideleft";
  transition_duration?: number;
  width?: number;
  height?: number;
}

export interface ApplyColorFilterV5Params extends ToolV5BaseParams {
  video_url: string;
  filter: string;
}

export interface SoftenVideoV5Params extends ToolV5BaseParams {
  video_url: string;
  strength: "subtle" | "medium" | "strong";
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
  width?: number;
  height?: number;
  adaptive?: boolean;
  preview?: string;
  ui_write_access?: "owner_only" | "team";
  api_write_access?: "team" | "owner_only" | "nobody";
  config?: V5TemplateConfig;
  created_at?: string;
}

export interface ToolJobV5 {
  uid: string;
  tool: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  inputs?: Record<string, any>;
  // Shape depends on the tool — e.g. { video_url } or { image_url }.
  outputs?: Record<string, any>;
  metadata?: string | null;
  self?: string;
  created_at?: string;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface AssetV5 {
  uid: string;
  url: string;
  mime_type: string;
  size: number;
  created_at?: string;
}

export interface PublicationV5 {
  uid: string;
  name: string;
  description?: string;
  tags?: string[];
  visibility: "draft" | "unlisted" | "public_library";
  preview?: string;
  install_count?: number;
  template_kind?: string;
  published_at?: string;
  created_at?: string;
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

  // POSTs a raw body verbatim — used for asset uploads, where the payload is
  // file bytes rather than JSON.
  private async upload(path: string, data: Buffer | Uint8Array, contentType: string): Promise<unknown> {
    const headers = new Headers({
      "Content-Type": contentType,
      "Authorization": `Bearer ${this.token}`,
    });
    const response = await fetch(`${API_ENDPOINT}${path}`, { method: "POST", headers, body: data });
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

  public async create_image_template(params: CreateImageTemplateV5Params): Promise<ImageTemplateV5> {
    return this.request("POST", "/image_templates", params) as Promise<ImageTemplateV5>;
  }

  public async update_image_template(uid: string, params: UpdateImageTemplateV5Params): Promise<ImageTemplateV5> {
    return this.request("PATCH", `/image_templates/${uid}`, params) as Promise<ImageTemplateV5>;
  }

  public async delete_image_template(uid: string): Promise<null> {
    return this.request("DELETE", `/image_templates/${uid}`) as Promise<null>;
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

  // ---------- Tools ----------
  //
  // Every tool is asynchronous: the POST returns a pending tool job. Poll
  // get_tool_job until the status is "completed" or "failed", or subscribe to a
  // webhook with the resource "tool_job".

  // Calls any tool by name — the escape hatch for tools added after this release.
  public async create_tool_job(tool: string, params: Record<string, any>): Promise<ToolJobV5> {
    return this.request("POST", `/tools/${tool}`, params) as Promise<ToolJobV5>;
  }

  public async remove_bg(params: RemoveBgV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/remove_bg", params) as Promise<ToolJobV5>;
  }

  public async create_pdf(params: CreatePdfV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/create_pdf", params) as Promise<ToolJobV5>;
  }

  public async trim_video(params: TrimVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/trim_video", params) as Promise<ToolJobV5>;
  }

  public async concat_videos(params: ConcatVideosV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/concat_videos", params) as Promise<ToolJobV5>;
  }

  public async resize_video(params: ResizeVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/resize_video", params) as Promise<ToolJobV5>;
  }

  public async crop_video(params: CropVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/crop_video", params) as Promise<ToolJobV5>;
  }

  public async overlay_video(params: OverlayVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/overlay_video", params) as Promise<ToolJobV5>;
  }

  public async overlay_image(params: OverlayImageV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/overlay_image", params) as Promise<ToolJobV5>;
  }

  public async subtitle_video(params: SubtitleVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/subtitle_video", params) as Promise<ToolJobV5>;
  }

  public async generate_voiceover(params: GenerateVoiceoverV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/generate_voiceover", params) as Promise<ToolJobV5>;
  }

  public async add_audio(params: AddAudioV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/add_audio", params) as Promise<ToolJobV5>;
  }

  public async add_cover_art(params: AddCoverArtV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/add_cover_art", params) as Promise<ToolJobV5>;
  }

  public async create_video_slideshow(params: CreateVideoSlideshowV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/create_video_slideshow", params) as Promise<ToolJobV5>;
  }

  public async apply_color_filter(params: ApplyColorFilterV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/apply_color_filter", params) as Promise<ToolJobV5>;
  }

  public async soften_video(params: SoftenVideoV5Params): Promise<ToolJobV5> {
    return this.request("POST", "/tools/soften_video", params) as Promise<ToolJobV5>;
  }

  // ---------- Tool Jobs ----------

  public async get_tool_job(uid: string): Promise<ToolJobV5> {
    return this.request("GET", `/tool_jobs/${uid}`) as Promise<ToolJobV5>;
  }

  public async list_tool_jobs(page?: number): Promise<ToolJobV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/tool_jobs${qs}`) as Promise<ToolJobV5[]>;
  }

  // ---------- Assets ----------

  // Uploads raw file bytes (max 5MB) and returns a durable CDN URL. contentType
  // must be the mime type of the data, e.g. "image/png" or "video/mp4". Uploads
  // are deduplicated per workspace by SHA-256, so re-uploading the same bytes
  // returns the existing asset.
  public async upload_asset(data: Buffer | Uint8Array, contentType: string): Promise<AssetV5> {
    return this.upload("/assets", data, contentType) as Promise<AssetV5>;
  }

  public async get_asset(uid: string): Promise<AssetV5> {
    return this.request("GET", `/assets/${uid}`) as Promise<AssetV5>;
  }

  public async list_assets(page?: number): Promise<AssetV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/assets${qs}`) as Promise<AssetV5[]>;
  }

  // Maps each SHA-256 content hash to its existing asset, or null. Lets a
  // syncing client skip the upload round-trip for content that is already
  // stored. Max 100 hashes per call.
  public async check_assets(contentHashes: string[]): Promise<Record<string, AssetV5 | null>> {
    return this.request("POST", "/assets/check", { content_hashes: contentHashes }) as Promise<
      Record<string, AssetV5 | null>
    >;
  }

  // ---------- Publications ----------

  public async list_publications(page?: number): Promise<PublicationV5[]> {
    const qs = page ? `?page=${page}` : "";
    return this.request("GET", `/publications${qs}`) as Promise<PublicationV5[]>;
  }

  public async get_publication(uid: string): Promise<PublicationV5> {
    return this.request("GET", `/publications/${uid}`) as Promise<PublicationV5>;
  }

  // Clones a publication into the workspace as a new image template.
  public async install_publication(uid: string): Promise<ImageTemplateV5> {
    return this.request("POST", `/publications/${uid}/install`) as Promise<ImageTemplateV5>;
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

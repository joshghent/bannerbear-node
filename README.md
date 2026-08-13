# Bannerbear Node.js Library

A Node.js wrapper for the Bannerbear API - an image and video generation service.

## Documentation

Find the full API documentation [here](https://developers.bannerbear.com/)

## Requirements

Node 14 or higher.

## Installation

Install the package with:

```sh
npm install --save bannerbear
# or
yarn add bannerbear
```

## V5 API

The [V5 API](https://developers.bannerbear.com/v5/) is a new generation of the Bannerbear API. **V5 API keys do not work with V2 endpoints, and V2 API keys do not work with V5 endpoints** — you must use the right client class for your key.

For the **V5 API**, use `BannerbearV5` (this section).
For the **legacy V2 API**, see [Usage](#usage) below — that section is unchanged.

### Table of Contents

- [Authentication (V5)](#authentication-v5)
- [Account (V5)](#account-v5)
- [Image Templates (V5)](#image-templates-v5)
- [Images (V5)](#images-v5)
- [Tools (V5)](#tools-v5)
- [Assets (V5)](#assets-v5)
- [Publications (V5)](#publications-v5)
- [Batches (V5)](#batches-v5)
- [Webhooks (V5)](#webhooks-v5)
- [Instant URLs (V5)](#instant-urls-v5)

### Authentication (V5)

```ts
import { BannerbearV5 } from "bannerbear";

const bb = new BannerbearV5("your V5 API key");
```

Or set `BANNERBEAR_API_KEY` and instantiate without arguments:

```ts
const bb = new BannerbearV5();
```

### Account (V5)

```ts
await bb.account();
```

### Image Templates (V5)

V5 renames V2's `templates` resource to `image_templates`. Templates can be created, updated, and deleted through the API — `config` holds the full canvas.

```ts
await bb.list_image_templates(1);
await bb.get_image_template("template uid");

await bb.create_image_template({
  name: "My Template",
  description: "Created from the API",
  tags: ["portrait"],
  width: 1080,
  height: 1080,
  config: {
    objects: [
      { id: "bg", type: "rectangle", left: 0, top: 0, width: 1080, height: 1080, "background-color": "#0f172a" },
      { id: "headline", type: "text", left: 80, top: 400, width: 920, text: "Hello World!", "font-size": 72, color: "#ffffff" },
    ],
  },
});

await bb.update_image_template("template uid", {
  name: "New Name",
  description: "...",
  tags: ["portrait"],
});

await bb.delete_image_template("template uid");
```

##### Options for `create_image_template` / `update_image_template`

- `name` *required for create* (`string`)
- `description` (`string`)
- `tags` (`string[]`)
- `width` / `height`: canvas size in pixels (`number`)
- `config`: full canvas configuration, `{ objects: [...] }`. Passing it **replaces** the existing config in place (`V5TemplateConfig`)

Deleting is a soft delete: images already rendered from the template stay intact, but the template no longer appears in list/get calls and cannot be used for new renders.

### Images (V5)

V5's `modifications` is an **object** with two sub-keys:

- `template` — template-level changes (width, height, etc.)
- `objects` — array of per-layer changes (equivalent to V2's flat modifications array)

```ts
await bb.create_image("template uid", {
  modifications: {
    template: { width: 1080, height: 1080 },
    objects: [
      { name: "headline", text: "Hello World!" },
      {
        name: "photo",
        image_url:
          "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1000&q=80",
      },
    ],
  },
});
```

Synchronous generation routes to `sync.api.bannerbear.com/v5` (10s timeout). The 3rd positional `synchronous` argument is a transport switch — it is **not** sent in the request body:

```ts
await bb.create_image("template uid", { modifications: { objects: [...] } }, true);
```

##### Options for `create_image`

- `modifications`: V5 modifications object (`V5Modifications`)
- `formats`: output formats, e.g. `["jpg", "pdf"]` (`string[]`)
- `scale`: scale multiplier, 1–4 (`number`)
- `dpi`: DPI metadata (`number`)
- `quality`: quality control (`number`)
- `proxy`: proxy and resize external images before rendering (`boolean`)
- `metadata`: include any metadata to reference at a later point (`string`)
- `version`: pin template version (`number`)
- 3rd positional `synchronous`: route to the sync host (`boolean`; SDK-only, not sent to the API)

```ts
await bb.get_image("image uid");
await bb.list_images(1);
```

### Tools (V5)

Tools are standalone media operations that do not use a template. Every tool is **asynchronous**: the call returns a pending *tool job*. Poll `get_tool_job` until the status is `"completed"` or `"failed"`, or subscribe to a webhook with the resource `"tool_job"`.

```ts
let job = await bb.trim_video({
  video_url: "https://example.com/clip.mp4",
  start: 2.5,
  end: 10.0,
});

job = await bb.get_tool_job(job.uid);
job.status; // "pending" | "running" | "completed" | "failed"
if (job.status === "completed") console.log(job.outputs?.video_url);

await bb.list_tool_jobs(1);
```

Every tool also accepts an optional `metadata` string.

| Method | Required | Optional | Output key |
| --- | --- | --- | --- |
| `remove_bg` | `image_url` | — | `image_url` |
| `create_pdf` | `urls` | — | `pdf_url` |
| `trim_video` | `video_url`, `start`, `end` | — | `video_url` |
| `concat_videos` | `video_urls` | `width`, `height` | `video_url` |
| `resize_video` | `video_url`, `width`, `height` | `fit` | `video_url` |
| `crop_video` | `video_url`, `x`, `y`, `width`, `height` | — | `video_url` |
| `overlay_video` | `base_video_url`, `overlay_video_url`, `x`, `y` | `scale`, `start` | `video_url` |
| `overlay_image` | `video_url`, `image_url`, `x`, `y` | `opacity` | `video_url` |
| `subtitle_video` | `video_url` | `language`, `font`, `font_size`, `color`, `bold`, `italic`, `outline_color`, `outline_width`, `shadow_size`, `shadow_color`, `background_style`, `background_color`, `alignment` | `video_url` |
| `generate_voiceover` | `text`, `voice` | — | `audio_url` |
| `add_audio` | `video_url`, `audio_url`, `mode` | `volume`, `loop`, `ducking` | `video_url` |
| `add_cover_art` | `video_url`, `image_url` | — | `video_url` |
| `create_video_slideshow` | `image_urls` | `slide_duration`, `transition`, `transition_duration`, `width`, `height` | `video_url` |
| `apply_color_filter` | `video_url`, `filter` | — | `video_url` |
| `soften_video` | `video_url`, `strength` | — | `video_url` |

A few examples:

```ts
await bb.remove_bg({ image_url: "https://example.com/product.png" });

await bb.subtitle_video({
  video_url: "https://example.com/talk.mp4",
  font: "montserrat",
  font_size: 32,
  color: "#ffffff",
  background_style: "outline",
  alignment: "2",
});

await bb.generate_voiceover({ text: "Welcome to Bannerbear.", voice: "rachel" });

await bb.create_video_slideshow({
  image_urls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  slide_duration: 3,
  transition: "fade",
  width: 1280,
  height: 720,
});
```

`create_tool_job` calls any tool by name — the escape hatch for tools added after this release:

```ts
await bb.create_tool_job("remove_bg", { image_url: "https://example.com/product.png" });
```

### Assets (V5)

Upload a file (max 5MB) and get back a durable CDN URL you can feed to image modifications or tools. Uploads are deduplicated per workspace by SHA-256, so re-uploading the same bytes returns the existing record instead of creating a duplicate.

```ts
import fs from "fs";

const asset = await bb.upload_asset(fs.readFileSync("logo.png"), "image/png");
console.log(asset.url);

await bb.get_asset("asset uid");
await bb.list_assets(1);
```

Accepted mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `video/quicktime`, `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/webm`, `audio/ogg`, `application/pdf`.

`check_assets` maps each SHA-256 content hash to its existing asset (or `null`), so a syncing client can skip the upload round-trip for content it already pushed. Max 100 hashes per call.

```ts
import crypto from "crypto";

const data = fs.readFileSync("logo.png");
const digest = crypto.createHash("sha256").update(data).digest("hex");
const found = await bb.check_assets([digest]);
if (!found[digest]) await bb.upload_asset(data, "image/png");
```

### Publications (V5)

Publications are templates published to the public library. Installing one clones it into your workspace as a new image template.

```ts
await bb.list_publications(1);
await bb.get_publication("publication uid");

const template = await bb.install_publication("publication uid");
console.log(template.uid);
```

### Batches (V5)

Generate multiple images in one request (up to 100).

```ts
await bb.create_batch({
  type: "images",
  items: [
    { template: "template uid 1", modifications: { objects: [...] } },
    { template: "template uid 2", modifications: { objects: [...] } },
  ],
});
await bb.get_batch("batch uid");
await bb.list_batches(1);
```

### Webhooks (V5)

Webhooks are managed as a first-class resource in V5 (instead of being a per-request `webhook_url` parameter).

```ts
const hook = await bb.create_webhook({
  name: "my-webhook",
  url: "https://example.com/hook",
  resource: "image",
  event: "completed",
  status: "active",
  scope: "all_templates",
  templates: [],
});

// IMPORTANT: signing_key is ONLY returned in the create response. Store it now —
// subsequent get_webhook calls will not include it.
console.log(hook.signing_key);
```

##### Options for `create_webhook` / `update_webhook`

- `name` *required* (`string`)
- `url` *required* — the URL that receives the events (`string`)
- `resource`: `"image"`, `"batch"`, or `"tool_job"`
- `event`: `"all_events"`, `"completed"`, or `"failed"`
- `status`: `"active"` or `"disabled"`
- `scope`: `"all_templates"` or `"specific_templates"`
- `templates`: template UIDs, used when `scope` is `"specific_templates"` (`string[]`)

CRUD:

```ts
await bb.get_webhook("webhook uid");
await bb.update_webhook("webhook uid", {
  name: "renamed",
  url: "https://example.com/hook",
  resource: "image",
  event: "completed",
  status: "active",
  scope: "all_templates",
});
await bb.delete_webhook("webhook uid");
await bb.list_webhooks(1);
```

### Instant URLs (V5)

Instant URLs are URLs bound to a template that can be manipulated with query strings — the V5 equivalent of V2's "Signed URLs" feature.

#### Create an Instant URL base

```ts
const iurl = await bb.create_instant_url({
  name: "my-instant-url",
  template: "template uid",
  mode: "encoded",       // or "named_params"
  security: "signed",    // or "open"
  status: "active",
  scale: 1,              // 1, 2, 3, or 4
});

// IMPORTANT: signing_key is ONLY returned in the create response. Store it now.
console.log(iurl.signing_key);
console.log(iurl.base_url);
```

##### Options for `create_instant_url` / `update_instant_url`

- `name` *required* (`string`)
- `template` *required* — image template UID (`string`)
- `mode`: `"encoded"` or `"named_params"` (`string`)
- `security`: `"signed"` or `"open"` (`string`)
- `status`: `"active"` or `"disabled"` (`string`)
- `scale`: 1, 2, 3, or 4 (`number`)
- `rate_limit`: enable per-IP rate limiting (`boolean`)
- `template_version`: pin template version (`number | null`)
- `max_renders`: cap total renders (`number | null`)
- `expires_at`: ISO 8601 expiry (`string | null`)

CRUD:

```ts
await bb.get_instant_url("uid");
await bb.update_instant_url("uid", { name: "...", template: "...", /* ... */ });
await bb.delete_instant_url("uid");
await bb.list_instant_urls(1);
```

#### Build an Instant URL with modifications

`build_instant_url` is a pure local helper — no API call. It composes the URL from a base + modifications and, if a signing key is provided, appends the HMAC signature.

```ts
// Encoded mode, signed
bb.build_instant_url(iurl.base_url, {
  mode: "encoded",
  signingKey: iurl.signing_key,
  modifications: {
    template: { width: 1030, height: 890 },
    objects: [{ name: "title", text: "Hello!", color: "#ffffff" }],
  },
});

// Named params mode, signed
bb.build_instant_url(iurl.base_url, {
  mode: "named_params",
  signingKey: iurl.signing_key,
  modifications: {
    template: { width: 1030, height: 890 },
    objects: [{ name: "title", text: "Hello!" }],
  },
});

// Open (unsigned): omit signingKey
bb.build_instant_url(iurl.base_url, {
  mode: "encoded",
  modifications: { objects: [{ name: "title", text: "Hello!" }] },
});
```

##### Options for `build_instant_url`

- `mode`: `"encoded"` (default) or `"named_params"` (`string`)
- `signingKey`: only needed when the instant URL was created with `security: "signed"` (`string`; SDK-only camelCase since this is not an API field)
- `modifications`: same shape as `create_image`'s modifications (`V5Modifications`)

---

## Usage

### Table of Contents

- [Import](#import)
- [Authentication](#authentication)
- [Account Info](#account-info)
- [Images](#images)
- [Videos](#videos)
- [Collections](#collections)
- [Animated Gifs](#animated-gifs)
- [Movies](#movies)
- [Screenshots](#screenshots)
- [Templates](#templates)
- [Template Sets](#template-sets)
- [Video Templates](#video-templates)
- [Signed URLs](#signed-urls)

### Import
In Javascript
```js
const { Bannerbear } = require('bannerbear')
```

And in typescript
```ts
import Bannerbear from 'bannerbear';
```

### Authentication

instantiate
Get the API key for your project in Bannerbear and then instantiate a new client.

```ts
const bb = new Bannerbear("your api key");
```

Alternatively, set the API key in an environment variable named `BANNERBEAR_API_KEY`.

```ts
const bb = new Bannerbear();
```

### Usage with TypeScript

```ts
import Bannerbear from "bannerbear";
const bb = new Bannerbear("your api key");

const createImage = async () => {
  const params: Bannerbear.CreateImageParams = {
    metadata: [],
  };

  const image = await bb.create_image("image uid", params);
};
createImage();
```

### Account Info

Return info about the account or project associated with the API key.

```ts
const account = await bb.account();
```

### Images

#### Create an Image

To create an image you reference a template uid and a list of modifications. The default is async generation meaning the API will respond with a `pending` status and you can use `get_image` to retrieve the final image.

```ts
const images = await bb.create_image("template uid", {
  modifications: [
    {
      name: "headline",
      text: "Hello world!",
    },
    {
      name: "photo",
      image_url:
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1000&q=80",
    },
  ],
});
```

You can also create images synchronously - this will take longer to respond but the image will be delivered in the response:

```ts
const images = await bb.create_image(
  "template uid",
  {
    modifications: [
      {
        name: "headline",
        text: "Hello world!",
      },
      {
        name: "photo",
        image_url:
          "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1000&q=80",
      },
    ],
  },
  true
);
```

##### Options

- `modifications`: an array of [modifications](https://developers.bannerbear.com/#post-v2-images) you would like to make (`array`)
- `webhook_url`: a webhook url to post the final image object to (`string`)
- `transparent`: render image with a transparent background (`boolean`)
- `synchronous`: generate the image synchronously (`boolean`)
- `render_pdf`: render a PDF in addition to an image (`boolean`)
- `metadata`: include any metadata to reference at a later point (`string`)

#### Get an Image

```ts
await bb.get_image("image uid");
```

#### List all images

```ts
await bb.list_images();
```

Optionally you can provide a page and limit

```ts
await bb.list_images(10, 25);
```

### Videos

#### Create a Video

```ts
await bb.create_video("video template uid", {
  input_media_url: "https://www.yourserver.com/videos/awesome_video.mp4",
  modifications: [
    {
      name: "headline",
      text: "Hello world",
    },
  ],
});
```

##### Options

- `input_media_url`: a url to a publicly available video file you want to import (string)
- `modifications`: an array of modifications you would like to make to the video overlay (array)
- `webhook_url`: a webhook url to post the final video object to (string)
- `blur`: blur the imported video from 1-10 (integer)
- `trim_to_length_in_seconds`: trim the video to a specific length (integer)
- `create_gif_preview`: create a short preview gif (boolean)
- `metadata`: include any metadata to reference at a later point (string)

If your video is using the "Multi Overlay" build pack then you can pass in a set of frames to render via:

- `frames`: an array of sets of modifications (array)
- `frame_durations`: specify the duration of each frame (array)

#### Get a video

```ts
await bb.get_video("video uid");
```

#### Update a Video

```ts
await bb.update_video("video uid", {
  approved: true,
  transcription: [
    "This is a new transcription",
    "It must contain the same number of lines",
    "As the previous transcription",
  ],
});
```

##### Options

- `approved`: approve the video for rendering (boolean)
- `transcription`: an array of strings to represent the new transcription (will overwrite the existing one) (array)

#### List all Videos

```ts
await bb.list_videos();
```

##### Options

- `page`: pagination (`integer`)

### Collections

Create multiple images in one API request.

```ts
await bb.get_collection("collection uid");
await bb.list_collections(3);
await bb.create_collection(
  "template set uid",
  {
    modifications: [
      {
        name: "headline",
        text: "Hello World!",
      },
    ],
  },
  true
);
```

##### Options for `create_collection`

- `modifications`: an array of [modifications](https://developers.bannerbear.com/#post-v2-images) you would like to make (`array`)
- `webhook_url`: a webhook url to post the final collection object to (`string`)
- `transparent`: render image with a transparent background (`boolean`)
- `synchronous`: generate the images synchronously (`boolean`)
- `metadata`: include any metadata to reference at a later point (`string`)

### Animated Gifs

Create a slideshow style gif

```ts
await bb.get_animated_gif("gif uid")
await bb.list_animated_gifs(3)
await bb.create_animated_gif("template uid",
  frames: [
    [ // frame 1 starts here
      {
        name: "layer1",
        text: "This is my text"
      },
      {
        name: "photo",
        image_url: "https//www.pathtomyphoto.com/1.jpg"
      }
    ],
    [ // frame 2 starts here
      {
        name: "layer1",
        text: "This is my follow up text"
      },
      {
        name: "photo",
        image_url: "https://www.pathtomyphoto.com/2.jpg"
      }
    ]
  ]
)
```

##### Options for `create_animated_gif`

- `frames`: an array of arrays of [modifications](https://developers.bannerbear.com/#post-v2-images) you would like to make (`array`)
- `frame_durations`: an array of times (in seconds) to show each frame (`array`)
- `input_media_url`: optionally import an external video file to use as part of the gif
- `fps`: frames per second e.g. 1 (`integer`)
- `loop`: whether to loop or not (`boolean`)
- `webhook_url`: a webhook url to post the final gif object to (`string`)
- `metadata`: include any metadata to reference at a later point (`string`)

### Movies

Assemble video clips or still images into a single movie with transitions.

```ts
await bb.get_movie("movie uid");
await bb.list_movies(3);
await bb.create_movie({
  width: 800,
  height: 800,
  transition: "pixelize",
  inputs: [
    {
      asset_url:
        "https://images.unsplash.com/photo-1635910160061-4b688344bd20?w=500&q=60",
    },
    {
      asset_url: "https://i.imgur.com/fH7a5dO.png",
    },
  ],
});
```

##### Options for `create_movie`

- `width`: the movie width in pixels (`integer`)
- `height`: the movie height in pixels (`integer`)
- `transition`: the transition style: fade, pixelize, slidedown, slideright, slideup, slideleft (`string`)
- `inputs`: a list of [inputs](https://developers.bannerbear.com/#post-v2-movies) (`array`)
- `webhook_url`: a webhook url to post the final movie object to (`string`)
- `metadata`: include any metadata to reference at a later point (`string`)

### Screenshots

Take screenshots of websites.

```ts
await bb.get_screenshot("screenshot uid");
await bb.list_screenshots(3);
await bb.create_screenshot(
  "https://www.bannerbear.com/",
  {
    width: 1000,
  },
  true
);
```

##### Options for `create_screenshot`

- `width`: the desired screenshot width in pixels (`integer`)
- `height`: the desired screenshot height in pixels (`integer`)
- `synchronous`: generate the screenshot synchronously (`boolean`)
- `mobile`: use a mobile user agent
- `webhook_url`: a webhook url to post the final screenshot object to (`string`)

### Templates

```ts
await bb.get_template("template uid");
await bb.update_template("template uid", {
  name: "New Template Name",
  tags: ["portrait", "instagram"],
});
await bb.list_templates({ page: 2, tag: "portrait" });
```

### Template Sets

```ts
await bb.get_template_set("template set uid");
await bb.list_template_sets(2);
```

### Video Templates

```ts
await bb.get_video_template("video template uid");
await bb.list_video_templates(2);
```

### Signed URLs

This gem also includes a convenient utility for generating signed urls. Authenticate as above, then:

```ts
await bb.generate_signed_url("base uid", { modifications: [] });

// example
await bb.generate_signed_url("A89wavQyY3Bebk3djP", {
  modifications: [
    {
      name: "country",
      text: "testing!",
    },
    {
      name: "photo",
      image_url:
        "https://images.unsplash.com/photo-1638356435991-4c79b00ebef3?w=764&q=80",
    },
  ],
});
// => https://ondemand.bannerbear.com/signedurl/A89wavQyY3Bebk3djP/image.jpg?modifications=W3sibmFtZSI6ImNvdW50cnkiLCJ0ZXh0IjoidGVzdGluZyEifSx7Im5hbWUiOiJwaG90byIsImltYWdlX3VybCI6Imh0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNjM4MzU2NDM1OTkxLTRjNzliMDBlYmVmMz93PTc2NCZxPTgwIn1d&s=40e7c9d4902b86ea83e0c400e57d7cc580534fd527e234d40a0c7ace589a16eb
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/yongfook/bannerbear-node. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](https://github.com/yongfook/bannerbear-ruby/blob/master/CODE_OF_CONDUCT.md).

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the Bannerbear project's codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/yongfook/bannerbear-ruby/blob/master/CODE_OF_CONDUCT.md).

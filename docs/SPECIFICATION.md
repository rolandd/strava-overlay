# Product & Technical Specification: Ride Stat Overlay PWA

## 1. Executive Summary & Product Vision

**Ride Stat Overlay** is an installable, offline-first Progressive Web App (PWA) designed for cyclists, runners, and outdoor athletes. It allows users to seamlessly composite transparent activity telemetry overlays (such as Strava ride stats, route elevation profiles, or fitness badge PNGs with alpha channels) on top of background photographs (e.g. scenic ride photos).

### Key Product Tenets

1. **100% Client-Side & Private**: All image processing and compositing occurs strictly inside the user's browser using Web APIs (Canvas 2D, File API, Service Workers). No images are ever uploaded to any external server.
2. **Offline-First Resilience**: Full functionality is available without internet connectivity (e.g., at remote trailheads or during airplane mode).
3. **Frictionless Native Integration**: Registers as an Android Web Share Target to accept direct shares from Strava, Google Photos, or gallery apps, and supports the Web Share API to share the final composite directly to social apps.
4. **WYSIWYG High-Resolution Export**: Live multi-touch viewport preview matches the final exported full-resolution image pixel-for-pixel, preserving the native resolution of the original photo.
5. **Fast, Tactile & Accessible UX**: Intuitive gesture controls (drag, pinch-zoom, rotate) paired with precision slider/nudge controls and snap presets for quick positioning.

---

## 2. User Experience & Core Workflows

### 2.1 Primary User Journeys

```mermaid
flowchart TD
    A[Start / Open PWA] --> B{Input Source}
    B -->|File Pickers| C[Select Base Photo & Overlay PNG]
    B -->|System Share Sheet| D[Receive Shared Image(s) via Android Share Target]
    B -->|Drag & Drop / Paste| E[Drop or Paste Images from Clipboard]

    C --> F[Preview & Transform Workspace]
    D --> F
    E --> F

    F --> G[Adjust Overlay: Drag / Pinch / Rotate / Snap Presets / Sliders]
    F --> H[Base Image Enhancements: Brightness / Saturation / Contrast / Crop]

    G --> I[Preview WYSIWYG Composite]
    H --> I

    I --> J{Export Action}
    J -->|Web Share API| K[Share directly to Instagram / Strava / Messaging]
    J -->|Direct Download| L[Save High-Res JPEG to Device Storage]
```

### 2.2 Ingestion & Loading

- **Dual Ingestion Slots**:
  - **Slot 1 (Base Photo)**: Accepts standard photo formats (`image/jpeg`, `image/png`, `image/webp`, `image/heic` where supported).
  - **Slot 2 (Overlay Graphic)**: Accepts transparent graphics (`image/png`, `image/webp`, `image/svg+xml`).
- **Multi-Input Channels**:
  - **File Picker**: Distinct buttons with visual status indicators (e.g., loaded dimensions, thumbnail preview, swap/replace).
  - **Android Share Target**:
    - Single-file share: Automatically assigned to Base Photo (or Overlay if Base is already loaded).
    - Multi-file share: Ingests both files in a single intent, intelligently assigning the transparent PNG to the overlay slot and the photo to the base slot.
  - **Desktop Drag & Drop**: Drop target zone on the canvas workspace.
  - **Clipboard Paste**: `Ctrl+V` / `Cmd+V` or mobile paste event handler to load copied screenshots or graphics.

### 2.3 Interactive Manipulation Workspace

- **Touch & Pointer Gestures**:
  - Single-pointer drag: Pan/translate overlay.
  - Two-finger pinch: Scale overlay up/down.
  - Two-finger twist: Rotate overlay.
  - Pointer gesture isolation: `touch-action: none` on the manipulation target to prevent accidental page scroll/rubber-banding.
- **Quick Alignment & Snap Presets**:
  - **Snap Corners**: Bottom-Left, Bottom-Right, Top-Left, Top-Right (with configurable margin/padding).
  - **Snap Centers**: Center, Top-Center, Bottom-Center.
  - **Fit Presets**: Fit Width, Fit Height, Reset Scale & Rotation (0° snap).
- **Precision Fine-Tuning Controls (Collapsible Sheet/Drawer)**:
  - Sliders & nudge buttons for **Scale** (0.1x to 3.0x), **Rotation** (-180° to +180° with 90° snap buttons), and **Position** (X / Y offset).

### 2.4 Base Image Enhancements

- **Basic Color & Light Adjustments**:
  - Brightness (e.g., 0.7x to 1.3x)
  - Contrast (e.g., 0.7x to 1.3x)
  - Saturation (e.g., 0.0x [B&W] to 1.5x)
  - Fast real-time preview via CSS `filter` and canvas rendering via `ctx.filter`.
- **Aspect Ratio Framing / Crop**:
  - Presets: Original, 1:1 (Square for Instagram), 4:5 (Portrait Social), 16:9 (Landscape).

### 2.5 Export & Sharing Pipeline

- **High-Res Compositor**:
  - Computes relative normalized transformation matrices between the viewport workspace and full-resolution base image dimensions.
  - Safeguards mobile memory by applying an adaptive maximum canvas resolution ceiling (e.g., 4096px on longest edge or hardware-safe max dimension).
- **Export Actions**:
  - **Native Web Share**: Invokes `navigator.share({ files: [compositeFile], title: 'Ride Photo' })` to pipe directly to social media and messaging apps.
  - **Direct Download**: Triggers a standard file download (`ride-overlay-[timestamp].jpg`) at 95% JPEG quality.

---

## 3. System Architecture & Technical Stack

### 3.1 Technology Matrix

| Layer                 | Technology                               | Rationale                                                                                                                   |
| :-------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Framework**         | SvelteKit 5 (Svelte 5 Runes)             | Fine-grained reactivity (`$state`, `$derived`, `$effect`), zero virtual DOM overhead, optimal mobile performance            |
| **Adapter**           | `@sveltejs/adapter-static`               | Produces a pure static single-page application (SPA) deployable to any static CDN (Cloudflare Pages, GitHub Pages, Netlify) |
| **Styling**           | Tailwind CSS v3 / v4                     | Modern, utility-first styling with custom dark theme tokens and responsive layouts                                          |
| **Touch Interaction** | Pointer Events / Gestures                | Reliable multi-touch drag, pinch-to-zoom, and rotation handling across iOS Safari and Android Chrome                        |
| **PWA / Offline**     | Web App Manifest + Custom Service Worker | Offline asset pre-caching, install prompt support, and Android `share_target` POST interceptor                              |
| **Hosting Target**    | Cloudflare Pages (Static SPA)            | Instant edge delivery, global CDN, automated branch previews                                                                |

### 3.2 Workspace & Directory Structure

```
├── .node-version
├── package.json
├── pnpm-lock.yaml
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── static/
│   ├── _headers
│   ├── manifest.json
│   ├── favicon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── src/
    ├── app.html
    ├── app.d.ts
    ├── app.css
    ├── service-worker.ts
    ├── lib/
    │   ├── components/
    │   │   ├── Header.svelte
    │   │   ├── Viewport.svelte
    │   │   ├── Controls.svelte
    │   │   ├── PresetsBar.svelte
    │   │   ├── AdjustmentsModal.svelte
    │   │   └── ExportBar.svelte
    │   ├── utils/
    │   │   ├── canvas-compositor.ts
    │   │   ├── gestures.ts
    │   │   ├── image-loader.ts
    │   │   └── share-target.ts
    │   └── types/
    │       └── index.ts
    └── routes/
        ├── +layout.ts
        ├── +layout.svelte
        └── +page.svelte
```

---

## 4. Mathematical Model for Canvas Compositing

To achieve true WYSIWYG fidelity between the interactive preview element in the DOM and the exported full-resolution canvas, all transformations are mapped using normalized coordinate systems.

### 4.1 Coordinate Systems & Variables

- Let the base image natural pixel dimensions be $(W_{base}, H_{base})$.
- Let the overlay image natural pixel dimensions be $(W_{ovl}, H_{ovl})$.
- Let the viewport container display dimensions be $(w_{view}, h_{view})$, with aspect ratio equal to $W_{base} / H_{base}$.
- Let the initial overlay display dimensions in the viewport be $(w_{ovl\_init}, h_{ovl\_init})$, calculated to maintain aspect ratio (e.g. $w_{ovl\_init} = w_{view} \times 0.8$, $h_{ovl\_init} = w_{ovl\_init} \times \frac{H_{ovl}}{W_{ovl}}$).
- Let the interactive state variables be:
  - Center offset from container center: $(\Delta x, \Delta y)$ in viewport pixels.
  - Relative scale multiplier: $S \in [0.1, 5.0]$.
  - Rotation angle: $\theta$ (in degrees).

### 4.2 High-Resolution Render Scaling

1. **Target Render Dimensions**:
   $$\text{scaleFactor} = \min\left(1.0, \frac{\text{MAX\_DIMENSION}}{\max(W_{base}, H_{base})}\right)$$
   $$W_{render} = \text{round}(W_{base} \times \text{scaleFactor})$$
   $$H_{render} = \text{round}(H_{base} \times \text{scaleFactor})$$
   _(Where $\text{MAX\_DIMENSION} = 4096$ to avoid mobile canvas memory crashes)._

2. **Viewport-to-Render Ratio**:
   $$R = \frac{W_{render}}{w_{view}} = \frac{H_{render}}{h_{view}}$$

3. **Canvas Drawing Matrix**:
   - Apply Base Image Filters (brightness, contrast, saturation):
     $$\text{ctx.filter} = \text{"brightness(...) contrast(...) saturate(...)"}$$
   - Draw base image:
     $$\text{ctx.drawImage}(\text{baseImage}, 0, 0, W_{render}, H_{render})$$
   - Reset filter for overlay:
     $$\text{ctx.filter} = \text{"none"}$$
   - Transform for overlay:
     $$\text{ctx.save}()$$
     $$\text{canvasCenterX} = \frac{W_{render}}{2} + \Delta x \times R$$
     $$\text{canvasCenterY} = \frac{H_{render}}{2} + \Delta y \times R$$
     $$\text{ctx.translate}(\text{canvasCenterX}, \text{canvasCenterY})$$
     $$\text{ctx.rotate}\left(\frac{\theta \times \pi}{180}\right)$$
     $$\text{renderOvlWidth} = w_{ovl\_init} \times S \times R$$
     $$\text{renderOvlHeight} = h_{ovl\_init} \times S \times R$$
     $$\text{ctx.drawImage}(\text{ovlImage}, -\frac{\text{renderOvlWidth}}{2}, -\frac{\text{renderOvlHeight}}{2}, \text{renderOvlWidth}, \text{renderOvlHeight})$$
     $$\text{ctx.restore}()$$

---

## 5. Web App Manifest & Android Share Target

### 5.1 Manifest Specification (`static/manifest.json`)

```json
{
  "name": "Ride Stat Photo Overlay",
  "short_name": "RideOverlay",
  "description": "Composite Strava ride telemetry and graphics onto photos offline",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#09090b",
  "theme_color": "#fc4c02",
  "icons": [
    {
      "src": "icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    },
    {
      "src": "icon-maskable-512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "maskable"
    }
  ],
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "files": [
        {
          "name": "shared_files",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

### 5.2 Service Worker Share Target Interceptor Flow

1. Android OS dispatches a `POST /share-target` multipart payload containing shared files.
2. The Service Worker intercepts the `fetch` event:
   - Parses `event.request.formData()`.
   - Retrieves all entries under `shared_files` (or `shared_image`).
   - Caches the `Blob` instances into Cache Storage under a designated incoming share store.
   - Responds with an `HTTP 303 See Other` redirecting to `/?incoming_share=true`.
3. When the SvelteKit app loads `/`, its initialization hook checks for pending shared items in Cache Storage, hydrates the slots intelligently (assigning transparent PNG to overlay and JPEG/photo to base), cleans up temporary cache entries, and strips the query parameter using `history.replaceState`.

---

## 6. Non-Functional Requirements & Performance Budgets

- **Lighthouse PWA Compliance**: 100% score on PWA criteria (valid service worker, manifest, standalone capability, maskable icon, HTTPS headers).
- **Bundle Size Budget**: Initial JS payload `< 80 KB` compressed (Gzip/Brotli).
- **Memory Safety**: No browser tab crashes when compositing 48MP+ mobile photos; graceful downscaling to max dimension safety limits.
- **Frame Rate Budget**: 60 FPS transform rendering during continuous touch gestures (hardware-accelerated CSS `translate3d`, `scale`, `rotate`).
- **Browser Compatibility**: Modern Evergreen Mobile & Desktop Browsers (Chrome for Android >= 100, iOS Safari >= 16.4, Desktop Chrome / Edge / Firefox / Safari).

---

## 7. Implementation Plan & Milestones

### Phase 1: Foundation & Tooling Setup

- Setup SvelteKit 5 project with `@sveltejs/adapter-static`, TypeScript, and Tailwind CSS.
- Configure Web App Manifest, PWA icons, and caching Service Worker.
- Implement static deployment headers (`_headers` for Cloudflare Pages).

### Phase 2: Core Workspace & Interaction Engine

- Build dual image ingestion components (file pickers, drag & drop zone, paste handler).
- Implement interactive viewport using multi-touch gesture handling (with pointer events & gesture math).
- Implement quick snap presets and precision sliders/nudge controls.

### Phase 3: Canvas Compositing & Export Pipeline

- Build high-resolution canvas compositor with accurate transform mathematics.
- Integrate Web Share API with fallback to high-quality JPEG download.
- Add base image adjustments (brightness, contrast, saturation) with real-time preview.

### Phase 4: Share Target & Polish

- Implement Android Share Target interceptor in Service Worker with multi-file support.
- Add UI state feedback (loading indicators, error toasts, reset confirmation).
- Validate offline installation and performance across mobile viewports.

# Ride Stat Overlay (PWA)

An installable, offline-first Progressive Web App (PWA) to composite Strava activity telemetry overlays (PNGs with transparent backgrounds) directly onto scenic background photographs.

## Features

- **100% Client-Side & Private**: All image processing and high-resolution compositing happens directly inside the browser using HTML5 Canvas 2D. No photos ever leave your device.
- **Offline-First Resilience**: Full offline capability via custom Service Worker caching. Works at remote trailheads with zero mobile connectivity.
- **Android Web Share Target**: Directly receive shared photos from Strava, Google Photos, or gallery apps into the app.
- **Touch & Pointer Gesture Engine**: Multi-touch drag, pinch-to-zoom, and two-finger rotation with hardware-accelerated CSS transforms.
- **Quick Snap Presets**: One-tap alignment presets (Bottom-Left, Bottom-Right, Top-Left, Center, Fit-Width, Reset).
- **Fine-Tuning Controls**: Nudge D-pad, scale and rotation sliders with 90° quick-snap buttons.
- **Base Photo Adjustments**: Real-time brightness, contrast, and saturation sliders + aspect ratio crop framing (Original, 1:1, 4:5, 16:9).
- **Native Resolution Export**: Exports at full native camera resolution (with adaptive mobile memory protection) with direct Web Share API integration (`navigator.share`) or JPEG/PNG download.

## Technology Stack

- **Framework**: SvelteKit 5 (Svelte 5 Runes: `$state`, `$derived`, `$effect`)
- **Adapter**: `@sveltejs/adapter-static` (Pure static SPA)
- **Styling**: Tailwind CSS v4 with custom Strava dark theme tokens
- **Icons**: `@lucide/svelte`
- **PWA**: Web App Manifest (`manifest.json`), custom Service Worker (`service-worker.ts`)

## Getting Started

### Prerequisites

- Node.js `>= 20` (Node 24 LTS recommended)
- `pnpm` `>= 9`

### Development

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev
```

### Type Checking & Building

```bash
# Run type check
pnpm check

# Build production static SPA
pnpm build

# Preview build locally
pnpm preview
```

## Deployment

The build output is located in the `build/` directory and can be deployed to Cloudflare Pages, Netlify, GitHub Pages, or any static hosting service.
Static headers (`static/_headers`) are pre-configured for optimal Service Worker lifecycle and caching.

## Specification

Detailed product requirements, math models, and architectural specifications are documented in [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md).

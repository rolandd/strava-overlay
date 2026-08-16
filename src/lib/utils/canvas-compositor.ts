import type { BaseImageAdjustments, ExportOptions, ImageItem, OverlayTransform } from '../types';
import type { ViewportDimensions } from './presets';

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

export interface RenderCompositeParams {
  baseItem: ImageItem;
  overlayItem: ImageItem;
  transform: OverlayTransform;
  adjustments: BaseImageAdjustments;
  viewportDims: ViewportDimensions;
  exportOptions?: Partial<ExportOptions>;
}

export async function renderHighResComposite(
  params: RenderCompositeParams
): Promise<{ blob: Blob; width: number; height: number }> {
  const { baseItem, overlayItem, transform, adjustments, viewportDims, exportOptions } = params;

  const format = exportOptions?.format || 'image/jpeg';
  const quality = exportOptions?.quality ?? 0.95;
  const maxDim = exportOptions?.maxDimension ?? 4096;

  // 1. Load both images
  const [baseImg, overlayImg] = await Promise.all([
    loadImageElement(baseItem.url),
    loadImageElement(overlayItem.url)
  ]);

  const rawBaseW = baseImg.naturalWidth || baseItem.width;
  const rawBaseH = baseImg.naturalHeight || baseItem.height;

  // 2. Compute Crop source rectangle if aspect ratio constraint is applied
  let srcX = 0;
  let srcY = 0;
  let srcW = rawBaseW;
  let srcH = rawBaseH;

  if (adjustments.cropAspectRatio !== 'original') {
    let targetRatio = 1.0;
    if (adjustments.cropAspectRatio === '1:1') targetRatio = 1.0;
    else if (adjustments.cropAspectRatio === '4:5') targetRatio = 4 / 5;
    else if (adjustments.cropAspectRatio === '16:9') targetRatio = 16 / 9;

    const currentRatio = rawBaseW / rawBaseH;
    if (currentRatio > targetRatio) {
      // Base image is wider than target crop -> crop sides
      srcW = Math.round(rawBaseH * targetRatio);
      srcH = rawBaseH;
      srcX = Math.round((rawBaseW - srcW) / 2);
      srcY = 0;
    } else {
      // Base image is taller than target crop -> crop top/bottom
      srcW = rawBaseW;
      srcH = Math.round(rawBaseW / targetRatio);
      srcX = 0;
      srcY = Math.round((rawBaseH - srcH) / 2);
    }
  }

  // 3. Compute final output canvas dimensions with memory safety ceiling
  let renderW = srcW;
  let renderH = srcH;
  if (renderW > maxDim || renderH > maxDim) {
    const scaleDown = Math.min(maxDim / renderW, maxDim / renderH);
    renderW = Math.round(renderW * scaleDown);
    renderH = Math.round(renderH * scaleDown);
  }

  // 4. Setup Offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = renderW;
  canvas.height = renderH;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('Failed to acquire 2D canvas rendering context.');

  // Better image scaling quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 5. Draw Base Image with adjustments filter
  const { brightness, contrast, saturation } = adjustments;
  ctx.save();
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  ctx.drawImage(baseImg, srcX, srcY, srcW, srcH, 0, 0, renderW, renderH);
  ctx.restore();

  // 6. Calculate relative transformation ratio between viewport container and canvas
  const vContainerW = viewportDims.containerWidth || 1;
  const ratio = renderW / vContainerW;

  // Viewport base overlay dimensions scaled to canvas
  const targetOverlayW = viewportDims.overlayBaseWidth * transform.scale * ratio;
  const targetOverlayH = viewportDims.overlayBaseHeight * transform.scale * ratio;

  // Center point on canvas
  const canvasCenterX = renderW / 2 + transform.x * ratio;
  const canvasCenterY = renderH / 2 + transform.y * ratio;

  // 7. Draw Overlay Image
  ctx.save();
  ctx.translate(canvasCenterX, canvasCenterY);
  ctx.rotate((transform.angle * Math.PI) / 180);
  ctx.drawImage(
    overlayImg,
    -targetOverlayW / 2,
    -targetOverlayH / 2,
    targetOverlayW,
    targetOverlayH
  );
  ctx.restore();

  // 8. Convert to output Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (res) => {
        if (res) resolve(res);
        else reject(new Error('Canvas toBlob conversion failed.'));
      },
      format,
      quality
    );
  });

  return {
    blob,
    width: renderW,
    height: renderH
  };
}

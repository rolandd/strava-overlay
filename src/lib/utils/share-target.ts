import { getMimeTypeFromName, isTransparentImage } from './image-loader';
import { logger } from './logger';
import type { ImageItem } from '../types';

export interface PendingSharesResult {
  baseItem?: ImageItem;
  overlayItem?: ImageItem;
}

export interface SlotAssignment {
  baseFile?: File;
  overlayFile?: File;
}

/**
 * Smartly determines which layer slot(s) incoming files should populate based on
 * current workspace occupancy and image transparency.
 */
export function determineSlotAssignment(
  incomingFiles: File[],
  hasBase: boolean,
  hasOverlay: boolean
): SlotAssignment {
  if (incomingFiles.length === 0) return {};

  if (incomingFiles.length === 1) {
    const file = incomingFiles[0];
    const isTrans = isTransparentImage(file);

    // If Base photo is present and Overlay slot is empty -> populate Overlay!
    if (hasBase && !hasOverlay) {
      return { overlayFile: file };
    }

    // If Overlay is present and Base photo slot is empty -> populate Base!
    if (!hasBase && hasOverlay) {
      return { baseFile: file };
    }

    // If both slots already have images
    if (hasBase && hasOverlay) {
      if (isTrans) {
        return { overlayFile: file };
      } else {
        return { baseFile: file };
      }
    }

    // If neither slot has an image
    if (isTrans) {
      return { overlayFile: file };
    } else {
      return { baseFile: file };
    }
  }

  // 2 or more files shared simultaneously
  const transIndex = incomingFiles.findIndex((f) => isTransparentImage(f));
  if (transIndex !== -1) {
    const overlayFile = incomingFiles[transIndex];
    const baseFile = incomingFiles.find((_, i) => i !== transIndex) || incomingFiles[0];
    return { baseFile, overlayFile };
  } else {
    // Neither is transparent: first file becomes base photo, second becomes overlay
    return {
      baseFile: incomingFiles[0],
      overlayFile: incomingFiles[1]
    };
  }
}

/**
 * Checks Service Worker Cache for incoming shared files from Android Web Share Target
 */
export async function retrievePendingSharedFiles(): Promise<File[] | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    logger.debug('SHARE-CACHE', 'caches API not available.');
    return null;
  }

  try {
    const cache = await caches.open('incoming-shares');
    const metaResponse = await cache.match('/shared-meta');
    if (!metaResponse) {
      return null;
    }

    const meta = await metaResponse.json();
    const count: number = meta.count || 0;
    if (count === 0) {
      return null;
    }

    const files: File[] = [];

    for (let i = 0; i < count; i++) {
      const res = await cache.match(`/shared-file-${i}`);
      if (res) {
        const blob = await res.blob();
        const fileNameHeader = res.headers.get('x-file-name');
        const name = fileNameHeader ? decodeURIComponent(fileNameHeader) : `shared-${i}.png`;
        const contentType =
          res.headers.get('content-type') || blob.type || getMimeTypeFromName(name);
        const file = new File([blob], name, { type: contentType });
        files.push(file);
      }
    }

    // Clean up cache once ingested
    const keys = await cache.keys();
    await Promise.all(keys.map((k) => cache.delete(k)));

    logger.info(
      'SHARE-CACHE',
      `Retrieved ${files.length} shared file(s): ${files.map((f) => `"${f.name}" (${f.type})`).join(', ')}`
    );

    return files.length > 0 ? files : null;
  } catch (err) {
    logger.error('SHARE-CACHE', `Failed to retrieve shared files: ${err}`);
    console.warn('Failed to retrieve shared files from cache:', err);
    return null;
  }
}

/**
 * Desktop development simulation helper:
 * Simulates an Android OS Share Target POST by depositing files into the CacheStorage
 * and dispatching a custom event / query flag.
 */
export async function simulateIncomingShare(files: File[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    throw new Error('CacheStorage not available in this browser');
  }

  const cache = await caches.open('incoming-shares');
  const existingKeys = await cache.keys();
  await Promise.all(existingKeys.map((k) => cache.delete(k)));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const headers = new Headers();
    headers.set('content-type', file.type || getMimeTypeFromName(file.name));
    headers.set('x-file-name', encodeURIComponent(file.name));
    await cache.put(`/shared-file-${i}`, new Response(file, { headers }));
  }

  await cache.put(
    '/shared-meta',
    new Response(JSON.stringify({ count: files.length, timestamp: Date.now() }), {
      headers: { 'content-type': 'application/json' }
    })
  );

  logger.info(
    'SIMULATION',
    `Simulated incoming share with ${files.length} file(s): ${files.map((f) => f.name).join(', ')}`
  );

  // Notify window
  window.dispatchEvent(new CustomEvent('incoming-share-simulated'));
}

/**
 * Creates a synthetic mock scenic JPEG photo
 */
export function createMockPhotoFile(name = 'mock_scenic_ride.jpg'): File {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Background sunset gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 800);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#f97316');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Mountains
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, 800);
  ctx.lineTo(300, 450);
  ctx.lineTo(600, 600);
  ctx.lineTo(950, 380);
  ctx.lineTo(1200, 800);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('SIMULATED BASE PHOTO', 40, 80);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const bin = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

  return new File([arr], name, { type: 'image/jpeg' });
}

/**
 * Creates a synthetic mock Strava transparent overlay PNG
 */
export function createMockOverlayFile(name = 'mock_strava_overlay.png'): File {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Transparent canvas with badge
  ctx.clearRect(0, 0, 800, 600);

  // Strava Orange Stats Badge
  ctx.fillStyle = '#fc4c02';
  ctx.beginPath();
  ctx.roundRect(40, 400, 720, 150, 24);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('42.8 km  •  1:32:15  •  680 m', 80, 490);

  // Elevation route polyline
  ctx.strokeStyle = '#fc4c02';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(80, 320);
  ctx.bezierCurveTo(240, 150, 480, 380, 720, 180);
  ctx.stroke();

  const dataUrl = canvas.toDataURL('image/png');
  const bin = atob(dataUrl.split(',')[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

  return new File([arr], name, { type: 'image/png' });
}

export async function shareOrDownloadBlob(
  blob: Blob,
  filename: string,
  title: string = 'Ride Photo Overlay'
): Promise<{ method: 'shared' | 'downloaded' }> {
  const file = new File([blob], filename, { type: blob.type });

  // Check if Web Share API with files is supported
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title,
        text: 'Created with Ride Stat Overlay'
      });
      return { method: 'shared' };
    } catch (err: unknown) {
      // If user cancelled the share sheet (AbortError), don't trigger download
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'shared' };
      }
      console.warn('navigator.share failed, falling back to download:', err);
    }
  }

  // Fallback to standard browser download
  downloadBlob(blob, filename);
  return { method: 'downloaded' };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

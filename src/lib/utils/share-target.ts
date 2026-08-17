import { getMimeTypeFromName, isTransparentImage } from './image-loader';
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
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await caches.open('incoming-shares');
    const metaResponse = await cache.match('/shared-meta');
    if (!metaResponse) return null;

    const meta = await metaResponse.json();
    const count: number = meta.count || 0;
    if (count === 0) return null;

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

    return files.length > 0 ? files : null;
  } catch (err) {
    console.warn('Failed to retrieve shared files from cache:', err);
    return null;
  }
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

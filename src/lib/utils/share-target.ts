import { blobToImageItem } from './image-loader';
import type { ImageItem } from '../types';

export interface PendingSharesResult {
  baseItem?: ImageItem;
  overlayItem?: ImageItem;
}

export async function checkAndRetrieveSharedFiles(): Promise<PendingSharesResult | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await caches.open('incoming-shares');
    const metaResponse = await cache.match('/shared-meta');
    if (!metaResponse) return null;

    const meta = await metaResponse.json();
    const count: number = meta.count || 0;
    if (count === 0) return null;

    const retrievedItems: ImageItem[] = [];

    for (let i = 0; i < count; i++) {
      const res = await cache.match(`/shared-file-${i}`);
      if (res) {
        const blob = await res.blob();
        const fileNameHeader = res.headers.get('x-file-name');
        const name = fileNameHeader ? decodeURIComponent(fileNameHeader) : `shared-${i}.png`;
        const item = await blobToImageItem(blob, name);
        retrievedItems.push(item);
      }
    }

    // Clean up cache once ingested
    const keys = await cache.keys();
    await Promise.all(keys.map((k) => cache.delete(k)));

    if (retrievedItems.length === 0) return null;

    if (retrievedItems.length === 1) {
      const single = retrievedItems[0];
      // If transparent PNG, suggest as overlay; otherwise base photo
      if (single.isTransparent) {
        return { overlayItem: single };
      } else {
        return { baseItem: single };
      }
    }

    // If 2 or more files shared at once:
    // Place transparent image in overlay, non-transparent in base photo
    const transparentItem = retrievedItems.find((i) => i.isTransparent);
    const nonTransparentItem = retrievedItems.find((i) => !i.isTransparent);

    if (transparentItem && nonTransparentItem) {
      return {
        baseItem: nonTransparentItem,
        overlayItem: transparentItem
      };
    } else {
      return {
        baseItem: retrievedItems[0],
        overlayItem: retrievedItems[1]
      };
    }
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

import type { BaseImageAdjustments, ImageItem, OverlayTransform } from '../types';
import { blobToImageItem } from './image-loader';

const DB_NAME = 'ride_overlay_session_db';
const DB_VERSION = 1;
const STORE_NAME = 'active_session';

interface PersistedImageRecord {
  blob: Blob;
  name: string;
  isTransparent: boolean;
}

interface PersistedSessionRecord {
  key: string;
  baseImage?: PersistedImageRecord | null;
  overlayImage?: PersistedImageRecord | null;
  transform?: OverlayTransform;
  adjustments?: BaseImageAdjustments;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function extractBlobFromItem(item: ImageItem): Promise<Blob | null> {
  if (item.file) return item.file;
  if (item.url) {
    try {
      const res = await fetch(item.url);
      return await res.blob();
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveSessionState(params: {
  baseItem?: ImageItem | null;
  overlayItem?: ImageItem | null;
  transform?: OverlayTransform;
  adjustments?: BaseImageAdjustments;
}): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Read current stored session so we don't overwrite untouched fields with undefined
    const existing = await new Promise<PersistedSessionRecord | undefined>((resolve) => {
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    let baseRecord: PersistedImageRecord | null | undefined = existing?.baseImage;
    if (params.baseItem !== undefined) {
      if (params.baseItem) {
        const blob = await extractBlobFromItem(params.baseItem);
        if (blob) {
          baseRecord = {
            blob,
            name: params.baseItem.name,
            isTransparent: !!params.baseItem.isTransparent
          };
        }
      } else {
        baseRecord = null;
      }
    }

    let overlayRecord: PersistedImageRecord | null | undefined = existing?.overlayImage;
    if (params.overlayItem !== undefined) {
      if (params.overlayItem) {
        const blob = await extractBlobFromItem(params.overlayItem);
        if (blob) {
          overlayRecord = {
            blob,
            name: params.overlayItem.name,
            isTransparent: !!params.overlayItem.isTransparent
          };
        }
      } else {
        overlayRecord = null;
      }
    }

    const record: PersistedSessionRecord = {
      key: 'current',
      baseImage: baseRecord,
      overlayImage: overlayRecord,
      transform: params.transform ?? existing?.transform,
      adjustments: params.adjustments ?? existing?.adjustments,
      updatedAt: Date.now()
    };

    store.put(record);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to persist session to IndexedDB:', err);
  }
}

export async function loadSessionState(): Promise<{
  baseItem: ImageItem | null;
  overlayItem: ImageItem | null;
  transform?: OverlayTransform;
  adjustments?: BaseImageAdjustments;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const record = await new Promise<PersistedSessionRecord | undefined>((resolve, reject) => {
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!record) return null;

    let restoredBase: ImageItem | null = null;
    let restoredOverlay: ImageItem | null = null;

    if (record.baseImage?.blob) {
      try {
        restoredBase = await blobToImageItem(record.baseImage.blob, record.baseImage.name);
      } catch (e) {
        console.warn('Failed to restore base photo from persisted session:', e);
      }
    }

    if (record.overlayImage?.blob) {
      try {
        restoredOverlay = await blobToImageItem(record.overlayImage.blob, record.overlayImage.name);
      } catch (e) {
        console.warn('Failed to restore overlay graphic from persisted session:', e);
      }
    }

    return {
      baseItem: restoredBase,
      overlayItem: restoredOverlay,
      transform: record.transform,
      adjustments: record.adjustments
    };
  } catch (err) {
    console.warn('Failed to load session from IndexedDB:', err);
    return null;
  }
}

export async function clearSessionState(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current');

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear session state in IndexedDB:', err);
  }
}

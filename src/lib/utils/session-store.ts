import type { BaseImageAdjustments, ImageItem, OverlayTransform } from '../types';
import { blobToImageItem, getMimeTypeFromName } from './image-loader';
import { logger } from './logger';

const DB_NAME = 'ride_overlay_session_db';
const DB_VERSION = 1;
const STORE_NAME = 'active_session';

export interface PersistedImageRecord {
  blob: Blob;
  name: string;
  type?: string;
  isTransparent: boolean;
}

export interface PersistedSessionRecord {
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
  try {
    if (item.file) {
      // Unproxy and extract pure native Blob
      return item.file.slice(0, item.file.size, item.file.type || getMimeTypeFromName(item.name));
    }
    if (item.url) {
      const res = await fetch(item.url);
      return await res.blob();
    }
  } catch (err) {
    logger.error('IDB-EXTRACT', `Failed to extract blob from item: ${err}`);
  }
  return null;
}

function sanitizeTransform(t?: OverlayTransform): OverlayTransform | undefined {
  if (!t) return undefined;
  return {
    x: Number(t.x) || 0,
    y: Number(t.y) || 0,
    scale: Number(t.scale) || 1,
    angle: Number(t.angle) || 0
  };
}

function sanitizeAdjustments(a?: BaseImageAdjustments): BaseImageAdjustments | undefined {
  if (!a) return undefined;
  return {
    brightness: Number(a.brightness) || 1,
    contrast: Number(a.contrast) || 1,
    saturation: Number(a.saturation) || 1,
    cropAspectRatio: a.cropAspectRatio || 'original'
  };
}

let pendingSavePromise: Promise<void> = Promise.resolve();

export function saveSessionState(params: {
  baseItem?: ImageItem | null;
  overlayItem?: ImageItem | null;
  transform?: OverlayTransform;
  adjustments?: BaseImageAdjustments;
}): Promise<void> {
  // Chain saves to avoid concurrent transaction collisions
  pendingSavePromise = pendingSavePromise
    .then(() => executeSaveSessionState(params))
    .catch((err) => {
      logger.error('IDB-SAVE', `Session save queue failed: ${err}`);
      console.warn('Session save queue encountered an error:', err);
    });

  return pendingSavePromise;
}

async function executeSaveSessionState(params: {
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
            name: String(params.baseItem.name || 'base_photo.jpg'),
            type: String(
              params.baseItem.file?.type || blob.type || getMimeTypeFromName(params.baseItem.name)
            ),
            isTransparent: Boolean(params.baseItem.isTransparent)
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
            name: String(params.overlayItem.name || 'overlay.png'),
            type: String(
              params.overlayItem.file?.type ||
                blob.type ||
                getMimeTypeFromName(params.overlayItem.name)
            ),
            isTransparent: Boolean(params.overlayItem.isTransparent)
          };
        }
      } else {
        overlayRecord = null;
      }
    }

    const cleanTransform =
      sanitizeTransform(params.transform) ?? sanitizeTransform(existing?.transform);
    const cleanAdjustments =
      sanitizeAdjustments(params.adjustments) ?? sanitizeAdjustments(existing?.adjustments);

    const record: PersistedSessionRecord = {
      key: 'current',
      baseImage: baseRecord,
      overlayImage: overlayRecord,
      transform: cleanTransform,
      adjustments: cleanAdjustments,
      updatedAt: Date.now()
    };

    store.put(record);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    logger.info(
      'IDB-SAVE',
      `Saved: base="${baseRecord ? baseRecord.name : 'none'}", overlay="${overlayRecord ? overlayRecord.name : 'none'}"`
    );
  } catch (err) {
    logger.error('IDB-SAVE', `Failed to persist session: ${err}`);
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

    if (!record) {
      logger.info('IDB-LOAD', 'No existing session in IndexedDB.');
      return null;
    }

    let restoredBase: ImageItem | null = null;
    let restoredOverlay: ImageItem | null = null;

    if (record.baseImage?.blob) {
      try {
        restoredBase = await blobToImageItem(
          record.baseImage.blob,
          record.baseImage.name,
          record.baseImage.type
        );
        logger.info(
          'IDB-LOAD',
          `Restored base photo: "${record.baseImage.name}" (${record.baseImage.type})`
        );
      } catch (e) {
        logger.error('IDB-LOAD', `Failed to restore base photo: ${e}`);
        console.warn('Failed to restore base photo from persisted session:', e);
      }
    }

    if (record.overlayImage?.blob) {
      try {
        restoredOverlay = await blobToImageItem(
          record.overlayImage.blob,
          record.overlayImage.name,
          record.overlayImage.type
        );
        logger.info(
          'IDB-LOAD',
          `Restored overlay graphic: "${record.overlayImage.name}" (${record.overlayImage.type})`
        );
      } catch (e) {
        logger.error('IDB-LOAD', `Failed to restore overlay graphic: ${e}`);
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
    logger.error('IDB-LOAD', `Failed to load session: ${err}`);
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
    logger.info('IDB-CLEAR', 'Cleared active session from IndexedDB.');
  } catch (err) {
    logger.error('IDB-CLEAR', `Failed to clear session: ${err}`);
    console.warn('Failed to clear session state in IndexedDB:', err);
  }
}

export async function inspectStoredSession(): Promise<PersistedSessionRecord | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const record = await new Promise<PersistedSessionRecord | undefined>((resolve, reject) => {
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return record || null;
  } catch {
    return null;
  }
}

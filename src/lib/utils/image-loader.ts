import type { ImageItem } from '../types';

export function isTransparentImage(file: File | Blob, filename?: string): boolean {
  const name = filename || (file instanceof File ? file.name : '');
  const type = file.type || '';

  return (
    type === 'image/png' ||
    type === 'image/webp' ||
    type === 'image/svg+xml' ||
    name.toLowerCase().endsWith('.png') ||
    name.toLowerCase().endsWith('.webp') ||
    name.toLowerCase().endsWith('.svg')
  );
}

/**
 * Inspects initial byte stream for HEIC/HEIF/ISOBMFF magic signatures
 */
export async function isHeicBlob(blob: Blob, name = ''): Promise<boolean> {
  if (blob.type.includes('heic') || blob.type.includes('heif')) return true;
  if (name.match(/\.hei[cf]$/i)) return true;

  try {
    const buffer = await blob.slice(0, 32).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 12) return false;

    // Look for 'ftyp' box signature at offset 4
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp === 'ftyp') {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
      const knownHeicBrands = [
        'heic',
        'heix',
        'hevc',
        'hevx',
        'heim',
        'heis',
        'hevm',
        'hevs',
        'mif1',
        'msf1'
      ];
      if (knownHeicBrands.includes(brand)) return true;
    }
  } catch {
    // Ignore buffer inspection errors
  }
  return false;
}

/**
 * Converts HEIC/HEIF blobs to JPEG using dynamic import of heic2any
 */
export async function convertHeicToJpeg(blob: Blob, originalName = 'photo.heic'): Promise<File> {
  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = heic2anyModule.default || heic2anyModule;

    const conversionResult = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 0.94
    });

    const resultBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    const newName = originalName.replace(/\.hei[cf]$/i, '.jpg');
    return new File([resultBlob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('HEIC conversion failed:', err);
    throw new Error('Failed to convert HEIC/HEIF photo from Google Photos.', { cause: err });
  }
}

/**
 * Loads dimensions using native Image object
 */
export function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Converts an ImageBitmap into a standard JPEG File object via OffscreenCanvas / Canvas
 */
async function imageBitmapToFile(bitmap: ImageBitmap, filename: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context');

  ctx.drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.95)
  );

  if (!blob) throw new Error('Failed to encode ImageBitmap to JPEG');
  return new File([blob], filename.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

/**
 * Robustly converts any File or Blob (including Google Photos HEIC, WebP, AVIF, cloud photos)
 * into a fully-usable ImageItem.
 */
export async function fileToImageItem(
  inputFile: File | Blob,
  customName?: string
): Promise<ImageItem> {
  let file: File =
    inputFile instanceof File
      ? inputFile
      : new File([inputFile], customName || 'image.png', {
          type: inputFile.type || 'image/png'
        });

  if (file.size === 0) {
    throw new Error(
      'Selected file is empty (0 bytes). If this is a cloud-synced Google Photos file, please download it to your device first.'
    );
  }

  // 1. Check if the image is HEIC/HEIF and convert if needed
  const isHeic = await isHeicBlob(file, file.name);
  if (isHeic) {
    try {
      file = await convertHeicToJpeg(file, file.name);
    } catch (conversionErr) {
      console.warn(
        'HEIC conversion attempt failed, falling back to standard loader:',
        conversionErr
      );
    }
  }

  // 2. Try standard HTMLImageElement loading
  const objectUrl = URL.createObjectURL(file);
  try {
    const dims = await loadImageDimensions(objectUrl);
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      url: objectUrl,
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.width / (dims.height || 1),
      isTransparent: isTransparentImage(file)
    };
  } catch (primaryErr) {
    URL.revokeObjectURL(objectUrl);

    // 3. Fallback: Try createImageBitmap (handles EXIF orientations & modern formats)
    if (typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const convertedFile = await imageBitmapToFile(bitmap, file.name);
        bitmap.close();

        const fallbackUrl = URL.createObjectURL(convertedFile);
        const dims = await loadImageDimensions(fallbackUrl);

        return {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file: convertedFile,
          name: convertedFile.name,
          url: fallbackUrl,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / (dims.height || 1),
          isTransparent: isTransparentImage(convertedFile)
        };
      } catch (bitmapErr) {
        console.warn('createImageBitmap fallback failed:', bitmapErr);
      }
    }

    // 4. Secondary Fallback: If not tried yet, check HEIC again
    if (!isHeic) {
      try {
        const convertedFile = await convertHeicToJpeg(file, file.name);
        const fallbackUrl = URL.createObjectURL(convertedFile);
        const dims = await loadImageDimensions(fallbackUrl);
        return {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file: convertedFile,
          name: convertedFile.name,
          url: fallbackUrl,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / (dims.height || 1),
          isTransparent: isTransparentImage(convertedFile)
        };
      } catch {
        // Ignore and throw original error
      }
    }

    throw new Error(
      `Failed to decode photo "${file.name}". The format may not be supported by this browser.`,
      { cause: primaryErr }
    );
  }
}

export async function blobToImageItem(blob: Blob, name: string): Promise<ImageItem> {
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  return fileToImageItem(file, name);
}

export function revokeImageItem(item: ImageItem | null | undefined): void {
  if (item?.url && item.url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(item.url);
    } catch {
      // Ignore URL revocation errors
    }
  }
}

export function extractImagesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  if (dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file' && (item.type.startsWith('image/') || item.type === '')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  } else if (dataTransfer.files) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file.type.startsWith('image/') || file.type === '') {
        files.push(file);
      }
    }
  }
  return files;
}

export function extractImagesFromClipboard(clipboardData: DataTransfer): File[] {
  return extractImagesFromDataTransfer(clipboardData);
}

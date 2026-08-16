import type { ImageItem } from '../types';

export function isTransparentImage(file: File): boolean {
  return (
    file.type === 'image/png' ||
    file.type === 'image/webp' ||
    file.name.toLowerCase().endsWith('.png')
  );
}

export function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
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

export async function fileToImageItem(file: File): Promise<ImageItem> {
  const url = URL.createObjectURL(file);
  try {
    const dims = await loadImageDimensions(url);
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      url,
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.width / (dims.height || 1),
      isTransparent: isTransparentImage(file)
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function blobToImageItem(blob: Blob, name: string): Promise<ImageItem> {
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  return fileToImageItem(file);
}

export function revokeImageItem(item: ImageItem | null | undefined): void {
  if (item?.url && item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url);
  }
}

export function extractImagesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  if (dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  } else if (dataTransfer.files) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
  }
  return files;
}

export function extractImagesFromClipboard(clipboardData: DataTransfer): File[] {
  return extractImagesFromDataTransfer(clipboardData);
}

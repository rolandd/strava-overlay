export interface ImageItem {
  id: string;
  file?: File;
  name: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number;
  isTransparent?: boolean;
}

export interface OverlayTransform {
  x: number; // Viewport pixel offset from container center
  y: number; // Viewport pixel offset from container center
  scale: number; // Scale multiplier (1.0 = standard fit)
  angle: number; // Rotation in degrees (-180 to 180)
}

export type AspectRatioType = 'original' | '1:1' | '4:5' | '16:9';

export interface BaseImageAdjustments {
  brightness: number; // 0.5 to 1.5, default 1.0
  contrast: number; // 0.5 to 1.5, default 1.0
  saturation: number; // 0.0 to 2.0, default 1.0
  cropAspectRatio: AspectRatioType;
}

export type SnapPresetId =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-center'
  | 'top-center'
  | 'fit-width'
  | 'fit-height'
  | 'reset';

export interface ExportOptions {
  format: 'image/jpeg' | 'image/png';
  quality: number; // 0.8 to 1.0
  maxDimension: number; // Maximum dimension ceiling (e.g. 4096px)
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

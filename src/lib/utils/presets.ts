import type { OverlayTransform, SnapPresetId } from '../types';

export interface ViewportDimensions {
	containerWidth: number;
	containerHeight: number;
	overlayBaseWidth: number;
	overlayBaseHeight: number;
}

export function computePresetTransform(
	preset: SnapPresetId,
	currentTransform: OverlayTransform,
	dims: ViewportDimensions,
	paddingPercent: number = 0.04
): OverlayTransform {
	const { containerWidth, containerHeight, overlayBaseWidth, overlayBaseHeight } = dims;

	if (!containerWidth || !containerHeight || !overlayBaseWidth || !overlayBaseHeight) {
		return { x: 0, y: 0, scale: 1.0, angle: 0 };
	}

	const marginX = Math.max(12, containerWidth * paddingPercent);
	const marginY = Math.max(12, containerHeight * paddingPercent);

	let currentScale = currentTransform.scale || 1.0;

	if (preset === 'fit-width') {
		const newScale = containerWidth / overlayBaseWidth;
		return {
			x: 0,
			y: 0,
			scale: Math.round(newScale * 1000) / 1000,
			angle: 0
		};
	}

	if (preset === 'fit-height') {
		const newScale = containerHeight / overlayBaseHeight;
		return {
			x: 0,
			y: 0,
			scale: Math.round(newScale * 1000) / 1000,
			angle: 0
		};
	}

	if (preset === 'reset') {
		return {
			x: 0,
			y: 0,
			scale: 1.0,
			angle: 0
		};
	}

	const effW = overlayBaseWidth * currentScale;
	const effH = overlayBaseHeight * currentScale;

	let x = 0;
	let y = 0;

	switch (preset) {
		case 'bottom-left':
			x = -containerWidth / 2 + marginX + effW / 2;
			y = containerHeight / 2 - marginY - effH / 2;
			break;
		case 'bottom-right':
			x = containerWidth / 2 - marginX - effW / 2;
			y = containerHeight / 2 - marginY - effH / 2;
			break;
		case 'top-left':
			x = -containerWidth / 2 + marginX + effW / 2;
			y = -containerHeight / 2 + marginY + effH / 2;
			break;
		case 'top-right':
			x = containerWidth / 2 - marginX - effW / 2;
			y = -containerHeight / 2 + marginY + effH / 2;
			break;
		case 'bottom-center':
			x = 0;
			y = containerHeight / 2 - marginY - effH / 2;
			break;
		case 'top-center':
			x = 0;
			y = -containerHeight / 2 + marginY + effH / 2;
			break;
		case 'center':
			x = 0;
			y = 0;
			break;
	}

	return {
		x: Math.round(x * 10) / 10,
		y: Math.round(y * 10) / 10,
		scale: currentScale,
		angle: 0
	};
}

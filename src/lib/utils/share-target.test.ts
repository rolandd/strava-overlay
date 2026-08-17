import { describe, expect, it } from 'vitest';
import { determineSlotAssignment } from './share-target';
import { getMimeTypeFromName, isTransparentImage } from './image-loader';

describe('determineSlotAssignment', () => {
  it('should assign a single opaque JPEG to base when both slots are empty', () => {
    const photo = new File(['fake-jpg'], 'scenic.jpg', { type: 'image/jpeg' });
    const result = determineSlotAssignment([photo], false, false);
    expect(result.baseFile).toBe(photo);
    expect(result.overlayFile).toBeUndefined();
  });

  it('should assign a single transparent PNG to overlay when both slots are empty', () => {
    const overlay = new File(['fake-png'], 'stats.png', { type: 'image/png' });
    const result = determineSlotAssignment([overlay], false, false);
    expect(result.overlayFile).toBe(overlay);
    expect(result.baseFile).toBeUndefined();
  });

  it('CRITICAL: should assign incoming file to overlay when base photo is already present', () => {
    // User already loaded a scenic base photo
    const newShare = new File(['fake-strava'], 'strava_activity.png', { type: 'image/png' });
    const result = determineSlotAssignment([newShare], true, false);
    expect(result.overlayFile).toBe(newShare);
    expect(result.baseFile).toBeUndefined();
  });

  it('CRITICAL: should assign incoming non-transparent photo to overlay when base photo is already present', () => {
    // User already loaded base photo, shares a second JPEG
    const secondPhoto = new File(['fake-jpg-2'], 'strava_export.jpg', { type: 'image/jpeg' });
    const result = determineSlotAssignment([secondPhoto], true, false);
    expect(result.overlayFile).toBe(secondPhoto);
    expect(result.baseFile).toBeUndefined();
  });

  it('CRITICAL: should assign incoming file to base when overlay is already present', () => {
    // User already loaded an overlay graphic
    const basePhoto = new File(['fake-jpg'], 'ride_photo.jpg', { type: 'image/jpeg' });
    const result = determineSlotAssignment([basePhoto], false, true);
    expect(result.baseFile).toBe(basePhoto);
    expect(result.overlayFile).toBeUndefined();
  });

  it('should appropriately replace slots when both slots are already populated', () => {
    const newOverlay = new File(['fake-png'], 'new_stats.png', { type: 'image/png' });
    const resOverlay = determineSlotAssignment([newOverlay], true, true);
    expect(resOverlay.overlayFile).toBe(newOverlay);
    expect(resOverlay.baseFile).toBeUndefined();

    const newBase = new File(['fake-jpg'], 'new_photo.jpg', { type: 'image/jpeg' });
    const resBase = determineSlotAssignment([newBase], true, true);
    expect(resBase.baseFile).toBe(newBase);
    expect(resBase.overlayFile).toBeUndefined();
  });

  it('should assign multiple shared files (photo + graphic) simultaneously', () => {
    const photo = new File(['photo'], 'sunset.jpg', { type: 'image/jpeg' });
    const graphic = new File(['graphic'], 'strava.png', { type: 'image/png' });
    const result = determineSlotAssignment([photo, graphic], false, false);
    expect(result.baseFile).toBe(photo);
    expect(result.overlayFile).toBe(graphic);
  });
});

describe('isTransparentImage & getMimeTypeFromName', () => {
  it('should correctly classify opaque vs transparent formats', () => {
    expect(isTransparentImage(new File([], 'test.jpg', { type: 'image/jpeg' }))).toBe(false);
    expect(isTransparentImage(new File([], 'test.heic', { type: 'image/heic' }))).toBe(false);
    expect(isTransparentImage(new File([], 'test.png', { type: 'image/png' }))).toBe(true);
    expect(isTransparentImage(new File([], 'test.webp', { type: 'image/webp' }))).toBe(true);
    expect(isTransparentImage(new File([], 'test.svg', { type: 'image/svg+xml' }))).toBe(true);
  });

  it('should resolve MIME types from filenames accurately', () => {
    expect(getMimeTypeFromName('PHOTO.JPG')).toBe('image/jpeg');
    expect(getMimeTypeFromName('telemetry.png')).toBe('image/png');
    expect(getMimeTypeFromName('vector.svg')).toBe('image/svg+xml');
    expect(getMimeTypeFromName('apple.heic')).toBe('image/heic');
  });
});

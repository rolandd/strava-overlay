import { describe, expect, it } from 'vitest';
import {
  getNearestCardinalAngle,
  getShortestAngleDelta,
  isAngleNearCardinal,
  normalizeAngle,
  RotationHysteresisTracker
} from './gestures';

describe('normalizeAngle', () => {
  it('should normalize angles into [-180, 180] range', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(-90)).toBe(-90);
    expect(normalizeAngle(180)).toBe(180);
    expect(normalizeAngle(-180)).toBe(180); // canonical 180
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-270)).toBe(90);
    expect(normalizeAngle(-360)).toBe(0);
    expect(normalizeAngle(185)).toBe(-175);
  });
});

describe('getShortestAngleDelta', () => {
  it('should compute shortest angular delta correctly', () => {
    expect(getShortestAngleDelta(0, 5)).toBe(5);
    expect(getShortestAngleDelta(0, -5)).toBe(-5);
    expect(getShortestAngleDelta(90, 88)).toBe(-2);
    expect(getShortestAngleDelta(90, 92)).toBe(2);
    expect(getShortestAngleDelta(-90, -88)).toBe(2);
    expect(getShortestAngleDelta(180, 178)).toBe(-2);
    expect(getShortestAngleDelta(180, -178)).toBe(2);
    expect(getShortestAngleDelta(-180, 178)).toBe(-2);
  });
});

describe('getNearestCardinalAngle', () => {
  it('should identify nearest right angle (multiples of 90 degrees)', () => {
    expect(getNearestCardinalAngle(0)).toBe(0);
    expect(getNearestCardinalAngle(2)).toBe(0);
    expect(getNearestCardinalAngle(-2)).toBe(0);
    expect(getNearestCardinalAngle(44)).toBe(0);
    expect(getNearestCardinalAngle(46)).toBe(90);
    expect(getNearestCardinalAngle(88)).toBe(90);
    expect(getNearestCardinalAngle(92)).toBe(90);
    expect(getNearestCardinalAngle(-88)).toBe(-90);
    expect(getNearestCardinalAngle(-92)).toBe(-90);
    expect(getNearestCardinalAngle(178)).toBe(180);
    expect(getNearestCardinalAngle(-178)).toBe(180);
  });
});

describe('isAngleNearCardinal', () => {
  it('should correctly detect if angle is close to right angle', () => {
    expect(isAngleNearCardinal(0, 2)).toBe(true);
    expect(isAngleNearCardinal(1.5, 2)).toBe(true);
    expect(isAngleNearCardinal(-1.8, 2)).toBe(true);
    expect(isAngleNearCardinal(5, 2)).toBe(false);
    expect(isAngleNearCardinal(90, 2)).toBe(true);
    expect(isAngleNearCardinal(89, 2)).toBe(true);
    expect(isAngleNearCardinal(91.5, 2)).toBe(true);
    expect(isAngleNearCardinal(85, 2)).toBe(false);
    expect(isAngleNearCardinal(180, 2)).toBe(true);
    expect(isAngleNearCardinal(-180, 2)).toBe(true);
    expect(isAngleNearCardinal(179, 2)).toBe(true);
    expect(isAngleNearCardinal(-179, 2)).toBe(true);
  });
});

describe('RotationHysteresisTracker', () => {
  it('should start snapped when starting at exact 0° level', () => {
    const tracker = new RotationHysteresisTracker({ snapThreshold: 3, releaseThreshold: 6 });
    tracker.reset(0);

    expect(tracker.snapped).toBe(true);
    expect(tracker.snapTarget).toBe(0);

    // Minor finger twist within release threshold (<= 6°) should stay locked at 0°
    expect(tracker.update(1).angle).toBe(0);
    expect(tracker.update(2.5).angle).toBe(0);
    expect(tracker.update(4).angle).toBe(0);
    expect(tracker.update(5.9).angle).toBe(0);
    expect(tracker.snapped).toBe(true);

    // Exceeding 6° twist breaks out of snap into free rotation
    const breakOutResult = tracker.update(6.5);
    expect(breakOutResult.isSnapped).toBe(false);
    expect(breakOutResult.angle).toBe(6.5);
    expect(tracker.snapped).toBe(false);
  });

  it('should snap into place when entering within 3° of 90°', () => {
    const tracker = new RotationHysteresisTracker({ snapThreshold: 3, releaseThreshold: 6 });
    tracker.reset(45); // start far from any right angle

    expect(tracker.snapped).toBe(false);
    expect(tracker.update(60).angle).toBe(60);
    expect(tracker.update(85).angle).toBe(85);
    expect(tracker.update(86).angle).toBe(86);

    // 87.5° is within 3° of 90° -> snaps to 90° with justSnapped = true
    const snapResult = tracker.update(87.5);
    expect(snapResult.isSnapped).toBe(true);
    expect(snapResult.justSnapped).toBe(true);
    expect(snapResult.angle).toBe(90);

    // Next update while still in snap zone stays locked at 90° without re-triggering justSnapped
    const holdResult = tracker.update(89);
    expect(holdResult.isSnapped).toBe(true);
    expect(holdResult.justSnapped).toBe(false);
    expect(holdResult.angle).toBe(90);

    // Twisting past 90° up to 95.5° stays snapped
    expect(tracker.update(95.5).angle).toBe(90);

    // Twisting past 96° (6° from 90°) breaks out
    const releaseResult = tracker.update(96.5);
    expect(releaseResult.isSnapped).toBe(false);
    expect(releaseResult.angle).toBe(96.5);
  });

  it('should handle negative angles (-90°) and wrapping around 180°/-180°', () => {
    const tracker = new RotationHysteresisTracker({ snapThreshold: 3, releaseThreshold: 6 });
    tracker.reset(-80);

    expect(tracker.snapped).toBe(false);
    // Move towards -90°
    const snapResult = tracker.update(-88);
    expect(snapResult.isSnapped).toBe(true);
    expect(snapResult.angle).toBe(-90);

    // Test 180° boundary
    tracker.reset(170);
    expect(tracker.update(175).angle).toBe(175);
    const snap180 = tracker.update(178);
    expect(snap180.isSnapped).toBe(true);
    expect(snap180.angle).toBe(180);

    // Crossing across +180 to -178 stays snapped within 6°
    expect(tracker.update(-178).angle).toBe(180);

    // Exceeding 6° delta (e.g. -172° is 8° away from 180°) breaks out
    expect(tracker.update(-172).isSnapped).toBe(false);
  });
});

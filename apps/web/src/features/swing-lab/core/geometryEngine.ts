import type { Point } from '../types';

/**
 * Pure geometry functions. No UI, no state, no side effects.
 * All coordinates are normalized 0-1.
 */

/**
 * Calculate the angle (in degrees) between three points,
 * where `vertex` is the middle point.
 */
export function calculateAngleBetweenPoints(
  a: Point,
  vertex: Point,
  b: Point
): number {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;
  const angle = Math.atan2(Math.abs(cross), dot);
  return radToDeg(angle);
}

/**
 * Calculate spine angle: angle of the line from hip to shoulder vs vertical.
 */
export function calculateSpineAngle(
  hip: Point,
  shoulder: Point,
  _vertical?: Point
): number {
  // vertical direction is straight up: dx=0, dy=-1
  const dx = shoulder.x - hip.x;
  const dy = shoulder.y - hip.y;
  // angle from vertical (y-axis pointing up, but canvas y points down)
  const angleFromVertical = Math.atan2(Math.abs(dx), Math.abs(dy));
  return radToDeg(angleFromVertical);
}

/**
 * Calculate linear distance between two points (normalized units).
 */
export function calculateLinearDistance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two points.
 */
export function calculateMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Project a line from an origin at a given angle (degrees) and length.
 */
export function projectLineToAngle(
  origin: Point,
  angleDeg: number,
  length: number
): { start: Point; end: Point } {
  const rad = degToRad(angleDeg);
  return {
    start: origin,
    end: {
      x: origin.x + length * Math.cos(rad),
      y: origin.y + length * Math.sin(rad),
    },
  };
}

/**
 * Calculate how far hips are open relative to the target line.
 * Returns degrees: positive = open, negative = closed.
 */
export function calculateHipOpenAngle(
  leadHip: Point,
  trailHip: Point,
  targetLineRef: Point
): number {
  // Hip line angle
  const hipAngle = Math.atan2(
    leadHip.y - trailHip.y,
    leadHip.x - trailHip.x
  );
  // Target line is assumed horizontal (left-to-right)
  // or from trailHip midpoint toward targetLineRef
  const mid = calculateMidpoint(leadHip, trailHip);
  const targetAngle = Math.atan2(
    targetLineRef.y - mid.y,
    targetLineRef.x - mid.x
  );
  const diff = radToDeg(hipAngle - targetAngle);
  // Normalize to -180..180
  return ((diff + 540) % 360) - 180;
}

/**
 * Calculate shoulder turn relative to target line.
 */
export function calculateShoulderTurn(
  leadShoulder: Point,
  trailShoulder: Point,
  targetLineRef: Point
): number {
  return Math.abs(
    calculateHipOpenAngle(leadShoulder, trailShoulder, targetLineRef)
  );
}

/**
 * Calculate X-Factor: difference between shoulder turn and hip turn.
 */
export function calculateXFactor(
  shoulderTurn: number,
  hipTurn: number
): number {
  return Math.abs(shoulderTurn - hipTurn);
}

/**
 * Calculate shaft lean at impact.
 * Positive = forward lean (handle ahead of clubhead).
 */
export function calculateShaftLean(
  wrist: Point,
  clubHead: Point
): number {
  const dx = wrist.x - clubHead.x;
  const dy = wrist.y - clubHead.y;
  const angleFromVertical = Math.atan2(dx, -dy); // negative dy because y increases downward
  return radToDeg(angleFromVertical);
}

/**
 * Calculate head displacement between two positions (stability measure).
 */
export function calculateHeadStability(
  addressHead: Point,
  currentHead: Point
): number {
  return calculateLinearDistance(addressHead, currentHead) * 100; // as percentage
}

// ===== Utility =====

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

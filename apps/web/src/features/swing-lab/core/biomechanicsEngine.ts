import type {
  SwingPhase,
  PhaseKeypoints,
  ProductMode,
  PhaseAnalysis,
  MeasurementResult,
  ComparisonResult,
  OverlayShape,
  NormativeRange,
  Point,
} from '../types';
import * as geo from './geometryEngine';
import { getMeasurementsForPhaseAndMode } from './measurementDefinitions';
import { normativeRanges } from './normativeRanges';

/**
 * Analyze a phase given keypoints and mode. Returns measurements + overlays + feedback.
 */
export function analyzePhase(
  phase: SwingPhase,
  keypoints: PhaseKeypoints,
  mode: ProductMode,
  addressKeypoints?: PhaseKeypoints
): PhaseAnalysis {
  const defs = getMeasurementsForPhaseAndMode(phase, mode);
  const results: MeasurementResult[] = [];

  for (const def of defs) {
    // Check if all required keypoints are present
    const hasAllKeypoints = def.requiredKeypoints.every(
      (kp) => keypoints[kp] != null
    );
    if (!hasAllKeypoints) continue;

    const value = calculateMeasurement(
      def.id,
      phase,
      keypoints,
      addressKeypoints
    );
    if (value == null) continue;

    const range = normativeRanges[phase]?.[def.id];
    const comparison = range
      ? compareToNormative(value, range)
      : {
          status: 'inRange' as const,
          amateurRange: [0, 0] as [number, number],
          tourRange: [0, 0] as [number, number],
          delta: 0,
        };

    const overlayGeometry = buildOverlayGeometry(
      def.id,
      keypoints,
      def.overlayColor,
      comparison.status
    );

    results.push({
      measurementId: def.id,
      value: Math.round(value * 10) / 10,
      unit: range?.unit || 'deg',
      comparison,
      overlayGeometry,
    });
  }

  return {
    phase,
    measurements: results,
    timestamp: Date.now(),
  };
}

/**
 * Compare a measurement value to normative range.
 */
export function compareToNormative(
  value: number,
  range: NormativeRange
): ComparisonResult {
  const [tourLow, tourHigh] = range.tour;
  const absValue = Math.abs(value);

  let status: ComparisonResult['status'];
  let delta: number;

  if (absValue >= tourLow && absValue <= tourHigh) {
    status = 'inRange';
    delta = 0;
  } else if (absValue < tourLow) {
    status = 'below';
    delta = tourLow - absValue;
  } else {
    status = 'above';
    delta = absValue - tourHigh;
  }

  // Simple percentile estimate based on position within amateur range
  const [amLow, amHigh] = range.amateur;
  const amRange = amHigh - amLow;
  const percentile = amRange > 0
    ? Math.min(100, Math.max(0, ((absValue - amLow) / amRange) * 100))
    : 50;

  return {
    status,
    amateurRange: range.amateur,
    tourRange: range.tour,
    delta: Math.round(delta * 10) / 10,
    percentile: Math.round(percentile),
  };
}

// ===== Internal Measurement Calculations =====

function calculateMeasurement(
  id: string,
  _phase: SwingPhase,
  kp: PhaseKeypoints,
  addressKp?: PhaseKeypoints
): number | null {
  switch (id) {
    case 'spineAngle':
      if (kp.trailHip && kp.trailShoulder) {
        return geo.calculateSpineAngle(kp.trailHip, kp.trailShoulder);
      }
      return null;

    case 'hipRotation':
      if (kp.leadHip && kp.trailHip && kp.targetLineRef) {
        return geo.calculateHipOpenAngle(
          kp.leadHip,
          kp.trailHip,
          kp.targetLineRef
        );
      }
      return null;

    case 'shoulderTilt': {
      if (kp.leadShoulder && kp.trailShoulder) {
        // Tilt = vertical difference normalized
        const dy = kp.trailShoulder.y - kp.leadShoulder.y;
        const dx = kp.trailShoulder.x - kp.leadShoulder.x;
        return Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
      }
      return null;
    }

    case 'shaftLean':
      if (kp.leadWrist && kp.clubHead) {
        return geo.calculateShaftLean(kp.leadWrist, kp.clubHead);
      }
      return null;

    case 'headStability':
      if (kp.head && addressKp?.head) {
        return geo.calculateHeadStability(addressKp.head, kp.head);
      }
      return null;

    case 'xFactor':
      if (
        kp.leadShoulder &&
        kp.trailShoulder &&
        kp.leadHip &&
        kp.trailHip &&
        kp.targetLineRef
      ) {
        const shoulderTurn = geo.calculateShoulderTurn(
          kp.leadShoulder,
          kp.trailShoulder,
          kp.targetLineRef
        );
        const hipTurn = Math.abs(
          geo.calculateHipOpenAngle(
            kp.leadHip,
            kp.trailHip,
            kp.targetLineRef
          )
        );
        return geo.calculateXFactor(shoulderTurn, hipTurn);
      }
      return null;

    case 'shoulderTurn':
      if (kp.leadShoulder && kp.trailShoulder && kp.targetLineRef) {
        return geo.calculateShoulderTurn(
          kp.leadShoulder,
          kp.trailShoulder,
          kp.targetLineRef
        );
      }
      return null;

    case 'pelvisThoraxSeparation':
      if (
        kp.leadShoulder &&
        kp.trailShoulder &&
        kp.leadHip &&
        kp.trailHip &&
        kp.targetLineRef
      ) {
        const sTurn = geo.calculateShoulderTurn(
          kp.leadShoulder,
          kp.trailShoulder,
          kp.targetLineRef
        );
        const hTurn = Math.abs(
          geo.calculateHipOpenAngle(
            kp.leadHip,
            kp.trailHip,
            kp.targetLineRef
          )
        );
        return Math.abs(hTurn - sTurn);
      }
      return null;

    case 'leadWristAngle':
      if (kp.leadElbow && kp.leadWrist && kp.clubGrip) {
        return geo.calculateAngleBetweenPoints(
          kp.leadElbow,
          kp.leadWrist,
          kp.clubGrip
        );
      }
      return null;

    case 'swingPlane':
      if (kp.clubHead && kp.clubGrip && kp.trailShoulder) {
        return geo.calculateAngleBetweenPoints(
          kp.clubHead,
          kp.clubGrip,
          kp.trailShoulder
        );
      }
      return null;

    default:
      return null;
  }
}

// ===== Overlay Geometry Building =====

function buildOverlayGeometry(
  id: string,
  kp: PhaseKeypoints,
  color: string,
  status: ComparisonResult['status']
): OverlayShape[] {
  const statusColor =
    status === 'inRange'
      ? '#4ADE80'
      : status === 'above'
        ? '#F87171'
        : '#FBBF24';
  const shapes: OverlayShape[] = [];

  const addLine = (from: Point, to: Point, c?: string, dashed?: boolean) => {
    shapes.push({
      type: 'line',
      points: [from, to],
      color: c || color,
      width: 2,
      dashed,
    });
  };

  const addCircle = (center: Point, c?: string) => {
    shapes.push({
      type: 'circle',
      points: [center],
      color: c || statusColor,
      width: 2,
    });
  };

  switch (id) {
    case 'spineAngle':
      if (kp.trailHip && kp.trailShoulder) {
        addLine(kp.trailHip, kp.trailShoulder, statusColor);
        // Vertical reference
        addLine(
          kp.trailHip,
          { x: kp.trailHip.x, y: kp.trailHip.y - 0.2 },
          color,
          true
        );
      }
      break;

    case 'hipRotation':
      if (kp.leadHip && kp.trailHip) {
        addLine(kp.leadHip, kp.trailHip, statusColor);
        addCircle(kp.leadHip);
        addCircle(kp.trailHip);
      }
      break;

    case 'shoulderTilt':
      if (kp.leadShoulder && kp.trailShoulder) {
        addLine(kp.leadShoulder, kp.trailShoulder, statusColor);
        addCircle(kp.leadShoulder);
        addCircle(kp.trailShoulder);
      }
      break;

    case 'shaftLean':
      if (kp.leadWrist && kp.clubHead) {
        addLine(kp.leadWrist, kp.clubHead, statusColor);
        // Vertical reference from clubhead
        addLine(
          kp.clubHead,
          { x: kp.clubHead.x, y: kp.clubHead.y - 0.15 },
          color,
          true
        );
      }
      break;

    case 'headStability':
      if (kp.head) {
        addCircle(kp.head, statusColor);
      }
      break;

    case 'xFactor':
      if (kp.leadShoulder && kp.trailShoulder && kp.leadHip && kp.trailHip) {
        addLine(kp.leadShoulder, kp.trailShoulder, '#DDA0DD');
        addLine(kp.leadHip, kp.trailHip, '#4ECDC4');
      }
      break;

    case 'shoulderTurn':
      if (kp.leadShoulder && kp.trailShoulder) {
        addLine(kp.leadShoulder, kp.trailShoulder, statusColor);
      }
      break;

    case 'swingPlane':
      if (kp.clubHead && kp.clubGrip) {
        addLine(kp.clubHead, kp.clubGrip, statusColor);
        if (kp.trailShoulder) {
          addLine(kp.clubGrip, kp.trailShoulder, color, true);
        }
      }
      break;
  }

  return shapes;
}

import type { MeasurementDefinition } from '../types';

export const measurements: MeasurementDefinition[] = [
  // ===== Quick Check + Deep Analysis =====
  {
    id: 'spineAngle',
    label: 'Spine Angle',
    category: 'posture',
    requiredKeypoints: ['trailHip', 'trailShoulder'],
    applicablePhases: ['address', 'top', 'impact'],
    modes: ['quickCheck', 'deepAnalysis'],
    overlayColor: '#FF6B6B',
    explanation: {
      simple: 'How much you bend forward from your hips.',
      detailed:
        'The angle between your spine line (hip to shoulder) and vertical. Maintaining this angle through the swing is critical for consistent ball striking.',
    },
  },
  {
    id: 'hipRotation',
    label: 'Hip Rotation',
    category: 'rotation',
    requiredKeypoints: ['leadHip', 'trailHip', 'targetLineRef'],
    applicablePhases: ['address', 'top', 'impact', 'followThrough'],
    modes: ['quickCheck', 'deepAnalysis'],
    overlayColor: '#4ECDC4',
    explanation: {
      simple: 'How much your hips have turned toward the target.',
      detailed:
        'Measured as the angle between the hip line and the target line. Tour players typically have 35-50 degrees of hip opening at impact.',
    },
  },
  {
    id: 'shoulderTilt',
    label: 'Shoulder Tilt',
    category: 'posture',
    requiredKeypoints: ['leadShoulder', 'trailShoulder'],
    applicablePhases: ['address', 'top', 'impact'],
    modes: ['quickCheck', 'deepAnalysis'],
    overlayColor: '#45B7D1',
    explanation: {
      simple: 'The tilt difference between your lead and trail shoulders.',
      detailed:
        'At impact, the trail shoulder should be lower than the lead, indicating proper body tilt and rotation through the ball.',
    },
  },
  {
    id: 'shaftLean',
    label: 'Shaft Lean',
    category: 'clubDelivery',
    requiredKeypoints: ['leadWrist', 'clubHead'],
    applicablePhases: ['impact'],
    modes: ['quickCheck', 'deepAnalysis'],
    overlayColor: '#F7DC6F',
    explanation: {
      simple: 'How much the shaft leans forward at impact.',
      detailed:
        'Forward shaft lean delofts the club, creating ball compression and a penetrating ball flight. Tour average is 8-15 degrees of forward lean.',
    },
  },
  {
    id: 'headStability',
    label: 'Head Stability',
    category: 'stability',
    requiredKeypoints: ['head'],
    applicablePhases: ['address', 'top', 'impact'],
    modes: ['quickCheck', 'deepAnalysis'],
    overlayColor: '#FF6B6B',
    explanation: {
      simple: 'How steady your head stays during the swing.',
      detailed:
        'Head movement is tracked from address through impact. A stable head helps maintain the swing center and promotes consistent ball striking.',
    },
  },

  // ===== Deep Analysis Only =====
  {
    id: 'xFactor',
    label: 'X-Factor',
    category: 'rotation',
    requiredKeypoints: [
      'leadShoulder',
      'trailShoulder',
      'leadHip',
      'trailHip',
    ],
    applicablePhases: ['top', 'transition'],
    modes: ['deepAnalysis'],
    overlayColor: '#DDA0DD',
    explanation: {
      simple: 'The gap between your shoulder and hip rotation.',
      detailed:
        'X-Factor measures the difference between shoulder turn and hip turn at the top of the backswing. Higher X-Factor stores more rotational energy for the downswing.',
    },
  },
  {
    id: 'shoulderTurn',
    label: 'Shoulder Turn',
    category: 'rotation',
    requiredKeypoints: [
      'leadShoulder',
      'trailShoulder',
      'targetLineRef',
    ],
    applicablePhases: ['takeaway', 'top'],
    modes: ['deepAnalysis'],
    overlayColor: '#96CEB4',
    explanation: {
      simple: 'How far your shoulders rotate in the backswing.',
      detailed:
        'Shoulder turn is measured relative to the target line. Tour players achieve 85-100 degrees of shoulder rotation at the top.',
    },
  },
  {
    id: 'pelvisThoraxSeparation',
    label: 'Pelvis-Thorax Separation',
    category: 'sequencing',
    requiredKeypoints: [
      'leadShoulder',
      'trailShoulder',
      'leadHip',
      'trailHip',
    ],
    applicablePhases: ['transition', 'impact'],
    modes: ['deepAnalysis'],
    overlayColor: '#BB8FCE',
    explanation: {
      simple: 'The timing gap between hip and shoulder movement.',
      detailed:
        'In an efficient downswing, the hips lead the shoulders. This separation creates a kinetic chain effect that generates power.',
    },
  },
  {
    id: 'leadWristAngle',
    label: 'Lead Wrist Angle',
    category: 'clubDelivery',
    requiredKeypoints: ['leadElbow', 'leadWrist', 'clubGrip'],
    applicablePhases: ['top', 'impact'],
    modes: ['deepAnalysis'],
    overlayColor: '#F0B27A',
    explanation: {
      simple: 'The angle of your lead wrist at key positions.',
      detailed:
        'A flat or slightly bowed lead wrist at the top promotes a square or slightly closed face. Cupping leads to an open face at impact.',
    },
  },
  {
    id: 'swingPlane',
    label: 'Swing Plane',
    category: 'path',
    requiredKeypoints: ['clubHead', 'clubGrip', 'trailShoulder'],
    applicablePhases: ['takeaway', 'top', 'transition'],
    modes: ['deepAnalysis'],
    overlayColor: '#58D68D',
    explanation: {
      simple: 'The angle of your club path during the swing.',
      detailed:
        'Swing plane tracks the arc of the club. On-plane swings tend to produce straighter ball flights and more consistent contact.',
    },
  },
];

/**
 * Get measurements applicable to a given phase and mode.
 */
export function getMeasurementsForPhaseAndMode(
  phase: string,
  mode: string
): MeasurementDefinition[] {
  return measurements.filter(
    (m) =>
      m.applicablePhases.includes(phase as never) &&
      m.modes.includes(mode as never)
  );
}

/**
 * Get a measurement definition by ID.
 */
export function getMeasurementById(
  id: string
): MeasurementDefinition | undefined {
  return measurements.find((m) => m.id === id);
}

import type { NormativeRangeDatabase } from '../types';

export const normativeRanges: NormativeRangeDatabase = {
  address: {
    spineAngle: {
      label: 'Spine Tilt at Address',
      amateur: [25, 35],
      tour: [30, 40],
      unit: 'deg',
      description: 'Forward bend from hips',
      source: 'TPI / Titleist Performance Institute',
    },
    kneeFlex: {
      label: 'Knee Flex',
      amateur: [15, 30],
      tour: [20, 25],
      unit: 'deg',
      description: 'Bend in the knees at setup',
      source: 'AMM 3D Motion Analysis',
    },
    shoulderTilt: {
      label: 'Shoulder Tilt at Address',
      amateur: [0, 8],
      tour: [3, 7],
      unit: 'deg',
      description: 'Trail shoulder slightly lower than lead at address',
      source: 'TPI',
    },
    hipRotation: {
      label: 'Hip Alignment at Address',
      amateur: [-5, 5],
      tour: [-2, 2],
      unit: 'deg',
      description: 'Hips square to target line',
      source: 'TPI',
    },
  },
  takeaway: {
    shoulderTurn: {
      label: 'Shoulder Turn in Takeaway',
      amateur: [20, 40],
      tour: [30, 45],
      unit: 'deg',
      description: 'Initial shoulder rotation in takeaway',
      source: 'TPI',
    },
  },
  top: {
    shoulderTurn: {
      label: 'Shoulder Turn',
      amateur: [70, 85],
      tour: [85, 100],
      unit: 'deg',
      description: 'Rotation of shoulders relative to target line',
      ballFlightEffect:
        'Greater shoulder turn creates a wider arc and more potential energy for the downswing.',
      source: 'TPI',
    },
    xFactor: {
      label: 'X-Factor',
      amateur: [30, 40],
      tour: [45, 60],
      unit: 'deg',
      description:
        'Difference between shoulder and hip rotation at the top',
      ballFlightEffect:
        'Higher X-Factor stores rotational energy. Key driver of clubhead speed.',
      source: 'Jim McLean / Titleist Performance Institute',
    },
    spineAngle: {
      label: 'Spine Angle Maintained',
      amateur: [25, 40],
      tour: [28, 38],
      unit: 'deg',
      description: 'Forward bend maintained from address',
      ballFlightEffect:
        'Maintaining spine angle ensures consistent contact and ball flight.',
      source: 'TPI',
    },
    hipRotation: {
      label: 'Hip Turn at Top',
      amateur: [30, 50],
      tour: [40, 55],
      unit: 'deg',
      description: 'How far hips rotate in backswing',
      source: 'TPI',
    },
  },
  transition: {
    xFactor: {
      label: 'X-Factor Stretch',
      amateur: [30, 45],
      tour: [50, 65],
      unit: 'deg',
      description:
        'X-Factor increases momentarily as hips lead the downswing',
      ballFlightEffect:
        'X-Factor stretch in transition is a hallmark of elite power generation.',
      source: 'TPI / Jim McLean',
    },
  },
  impact: {
    hipRotation: {
      label: 'Hip Rotation at Impact',
      amateur: [20, 35],
      tour: [35, 50],
      unit: 'deg',
      description: 'How far hips have rotated toward target',
      ballFlightEffect:
        'Insufficient hip rotation reduces clubhead speed and limits ball compression, often resulting in a push or weak fade.',
      source: 'Titleist Performance Institute',
    },
    spineAngle: {
      label: 'Spine Tilt at Impact',
      amateur: [5, 15],
      tour: [8, 12],
      unit: 'deg',
      description: 'Side bend away from target',
      ballFlightEffect:
        'Proper spine tilt promotes an ascending strike with driver and solid compression with irons.',
      source: 'Dr. Sasho MacKenzie Biomechanics Research',
    },
    shaftLean: {
      label: 'Shaft Lean at Impact',
      amateur: [-2, 4],
      tour: [8, 15],
      unit: 'deg',
      description: 'Forward lean of shaft relative to vertical',
      ballFlightEffect:
        'Forward shaft lean delofts the club, compresses the ball, and produces a lower, more penetrating flight.',
      source: 'TrackMan University',
    },
    shoulderTilt: {
      label: 'Shoulder Tilt at Impact',
      amateur: [15, 30],
      tour: [25, 40],
      unit: 'deg',
      description: 'Trail shoulder below lead at impact',
      ballFlightEffect:
        'Proper shoulder tilt through impact promotes a descending strike and consistent ball-first contact.',
      source: 'TPI',
    },
    headStability: {
      label: 'Head Stability',
      amateur: [3, 8],
      tour: [0, 3],
      unit: '%',
      description:
        'Percentage of head movement from address to impact',
      ballFlightEffect:
        'A stable head helps maintain the swing center, promoting consistent contact.',
      source: 'TPI / K-Vest Research',
    },
  },
  followThrough: {
    hipRotation: {
      label: 'Hip Rotation Follow-Through',
      amateur: [50, 70],
      tour: [70, 90],
      unit: 'deg',
      description: 'Full hip rotation toward target',
      source: 'TPI',
    },
  },
};

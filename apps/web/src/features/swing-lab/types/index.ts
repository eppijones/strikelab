// ===== Core Types =====

export interface Point {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
}

// ===== Swing Phases =====

export const SWING_PHASES = [
  'address',
  'takeaway',
  'top',
  'transition',
  'impact',
  'followThrough',
] as const;

export type SwingPhase = (typeof SWING_PHASES)[number];

export const SWING_PHASE_LABELS: Record<SwingPhase, string> = {
  address: 'Address',
  takeaway: 'Takeaway',
  top: 'Top',
  transition: 'Transition',
  impact: 'Impact',
  followThrough: 'Follow Through',
};

// ===== Product Modes =====

export type ProductMode = 'quickCheck' | 'deepAnalysis' | 'freeDraw';

export const PRODUCT_MODE_LABELS: Record<ProductMode, string> = {
  quickCheck: 'Quick Check',
  deepAnalysis: 'Deep Analysis',
  freeDraw: 'Free Draw',
};

// ===== Keypoints =====

export interface Keypoints {
  head: Point;
  leadShoulder: Point;
  trailShoulder: Point;
  leadElbow: Point;
  trailElbow: Point;
  leadWrist: Point;
  trailWrist: Point;
  leadHip: Point;
  trailHip: Point;
  leadKnee: Point;
  trailKnee: Point;
  leadAnkle: Point;
  trailAnkle: Point;
  clubHead: Point;
  clubGrip: Point;
  ballPosition: Point;
  targetLineRef: Point;
}

export type KeypointName = keyof Keypoints;

export type PhaseKeypoints = Partial<Keypoints>;

export const KEYPOINT_LABELS: Record<KeypointName, string> = {
  head: 'Head',
  leadShoulder: 'Lead Shoulder',
  trailShoulder: 'Trail Shoulder',
  leadElbow: 'Lead Elbow',
  trailElbow: 'Trail Elbow',
  leadWrist: 'Lead Wrist',
  trailWrist: 'Trail Wrist',
  leadHip: 'Lead Hip',
  trailHip: 'Trail Hip',
  leadKnee: 'Lead Knee',
  trailKnee: 'Trail Knee',
  leadAnkle: 'Lead Ankle',
  trailAnkle: 'Trail Ankle',
  clubHead: 'Club Head',
  clubGrip: 'Club Grip',
  ballPosition: 'Ball Position',
  targetLineRef: 'Target Line Ref',
};

export const KEYPOINT_COLORS: Record<KeypointName, string> = {
  head: '#FF6B6B',
  leadShoulder: '#4ECDC4',
  trailShoulder: '#4ECDC4',
  leadElbow: '#45B7D1',
  trailElbow: '#45B7D1',
  leadWrist: '#96CEB4',
  trailWrist: '#96CEB4',
  leadHip: '#FFEAA7',
  trailHip: '#FFEAA7',
  leadKnee: '#DDA0DD',
  trailKnee: '#DDA0DD',
  leadAnkle: '#98D8C8',
  trailAnkle: '#98D8C8',
  clubHead: '#F7DC6F',
  clubGrip: '#BB8FCE',
  ballPosition: '#FFFFFF',
  targetLineRef: '#00D4FF',
};

// ===== Measurements =====

export type MeasurementCategory =
  | 'posture'
  | 'rotation'
  | 'clubDelivery'
  | 'stability'
  | 'sequencing'
  | 'path';

export interface MeasurementDefinition {
  id: string;
  label: string;
  category: MeasurementCategory;
  requiredKeypoints: KeypointName[];
  applicablePhases: SwingPhase[];
  modes: ProductMode[];
  overlayColor: string;
  explanation: {
    simple: string;
    detailed: string;
  };
}

export interface MeasurementResult {
  measurementId: string;
  value: number;
  unit: string;
  comparison: ComparisonResult;
  overlayGeometry: OverlayShape[];
}

export interface ComparisonResult {
  status: 'below' | 'inRange' | 'above';
  amateurRange: [number, number];
  tourRange: [number, number];
  delta: number;
  percentile?: number;
}

// ===== Overlays =====

export interface OverlayShape {
  type: 'line' | 'arc' | 'circle' | 'label';
  points: Point[];
  color: string;
  width: number;
  label?: string;
  dashed?: boolean;
}

// ===== Analysis =====

export interface PhaseAnalysis {
  phase: SwingPhase;
  measurements: MeasurementResult[];
  timestamp: number;
}

// ===== Free Draw Annotations =====

export interface FreeAnnotation {
  id: string;
  type: 'line' | 'angle' | 'circle' | 'freehand';
  points: Point[];
  color: string;
  width: number;
  frameTime?: number;
  label?: string;
  angleDegrees?: number;
}

// ===== Swing Session =====

export interface SwingSession {
  id: string;
  name: string;
  date: string;
  videoBlob: Blob;
  thumbnailBlob: Blob;
  tags: string[];
  category: 'personal' | 'pro';
  proGolferId?: string;
  clubType?: 'driver' | 'iron' | 'wedge' | 'putter';
  notes: string;
  handedness: 'right' | 'left';
  phaseMarkers: Record<SwingPhase, number | null>;
  phaseKeypoints: Record<SwingPhase, PhaseKeypoints | null>;
  analysisResults: Record<SwingPhase, PhaseAnalysis | null>;
  freeAnnotations: FreeAnnotation[];
  createdAt: string;
  updatedAt: string;
}

// ===== Normative Ranges =====

export interface NormativeRange {
  label: string;
  amateur: [number, number];
  tour: [number, number];
  unit: string;
  description: string;
  ballFlightEffect?: string;
  source: string;
}

export type NormativeRangeDatabase = Partial<
  Record<SwingPhase, Record<string, NormativeRange>>
>;

// ===== Pro Golfers =====

export interface ProGolfer {
  id: string;
  name: string;
  youtubeLinks: { url: string; label: string }[];
  description: string;
  knownMetrics?: Partial<Record<string, number>>;
}

// ===== Pose Estimator =====

export interface PoseEstimator {
  detect(frame: HTMLVideoElement): Promise<Keypoints>;
  readonly type: 'manual' | 'mediapipe' | 'movenet';
  readonly confidence?: number;
}

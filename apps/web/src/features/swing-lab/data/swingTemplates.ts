import type { Point } from '../types';

export interface SwingTemplateLine {
  id: string;
  label: string;
  color: string;
  /** Start and end as normalized coords (0-1), relative to template center */
  offsetStart: Point;
  offsetEnd: Point;
  width: number;
  dashed?: boolean;
}

export interface SwingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'driver' | 'iron';
  phase: string;
  lines: SwingTemplateLine[];
}

export const swingTemplates: SwingTemplate[] = [
  // === DRIVER ADDRESS ===
  {
    id: 'driver-address',
    name: 'Driver Address',
    description: 'Standard setup lines for driver — spine angle, shaft plane, target line',
    category: 'driver',
    phase: 'address',
    lines: [
      {
        id: 'spine-line',
        label: 'Spine',
        color: '#FF6B6B',
        offsetStart: { x: 0, y: 0.18 },
        offsetEnd: { x: -0.03, y: -0.18 },
        width: 2,
      },
      {
        id: 'shaft-plane',
        label: 'Shaft Plane',
        color: '#FBBF24',
        offsetStart: { x: -0.08, y: 0.12 },
        offsetEnd: { x: 0.12, y: -0.06 },
        width: 2,
      },
      {
        id: 'target-line',
        label: 'Target Line',
        color: '#4ECDC4',
        offsetStart: { x: -0.2, y: 0.2 },
        offsetEnd: { x: 0.2, y: 0.2 },
        width: 1.5,
        dashed: true,
      },
      {
        id: 'vertical-ref',
        label: 'Vertical',
        color: '#FFFFFF',
        offsetStart: { x: 0, y: 0.2 },
        offsetEnd: { x: 0, y: -0.2 },
        width: 1,
        dashed: true,
      },
      {
        id: 'knee-flex',
        label: 'Knee Flex',
        color: '#DDA0DD',
        offsetStart: { x: -0.05, y: 0.14 },
        offsetEnd: { x: -0.08, y: 0.2 },
        width: 1.5,
      },
    ],
  },

  // === DRIVER IMPACT ===
  {
    id: 'driver-impact',
    name: 'Driver Impact',
    description: 'Tour-average impact position for driver — shaft lean, hip line, spine',
    category: 'driver',
    phase: 'impact',
    lines: [
      {
        id: 'spine-impact',
        label: 'Spine Tilt',
        color: '#FF6B6B',
        offsetStart: { x: 0.01, y: 0.18 },
        offsetEnd: { x: -0.04, y: -0.18 },
        width: 2,
      },
      {
        id: 'shaft-lean',
        label: 'Shaft Lean',
        color: '#FBBF24',
        offsetStart: { x: -0.02, y: 0.05 },
        offsetEnd: { x: 0.04, y: 0.2 },
        width: 2.5,
      },
      {
        id: 'hip-line',
        label: 'Hip Line',
        color: '#4ECDC4',
        offsetStart: { x: -0.08, y: 0.1 },
        offsetEnd: { x: 0.08, y: 0.08 },
        width: 2,
      },
      {
        id: 'shoulder-line',
        label: 'Shoulder Line',
        color: '#45B7D1',
        offsetStart: { x: -0.1, y: -0.08 },
        offsetEnd: { x: 0.1, y: -0.12 },
        width: 2,
      },
      {
        id: 'target-line-impact',
        label: 'Target',
        color: '#FFFFFF',
        offsetStart: { x: -0.2, y: 0.2 },
        offsetEnd: { x: 0.2, y: 0.2 },
        width: 1,
        dashed: true,
      },
    ],
  },

  // === IRON ADDRESS ===
  {
    id: 'iron-address',
    name: 'Iron Address',
    description: 'Standard setup for irons — steeper spine, ball position, shaft neutral',
    category: 'iron',
    phase: 'address',
    lines: [
      {
        id: 'spine-line',
        label: 'Spine',
        color: '#FF6B6B',
        offsetStart: { x: 0, y: 0.18 },
        offsetEnd: { x: -0.04, y: -0.18 },
        width: 2,
      },
      {
        id: 'shaft-plane',
        label: 'Shaft Plane',
        color: '#FBBF24',
        offsetStart: { x: -0.06, y: 0.1 },
        offsetEnd: { x: 0.1, y: -0.08 },
        width: 2,
      },
      {
        id: 'target-line',
        label: 'Target Line',
        color: '#4ECDC4',
        offsetStart: { x: -0.2, y: 0.18 },
        offsetEnd: { x: 0.2, y: 0.18 },
        width: 1.5,
        dashed: true,
      },
      {
        id: 'ball-pos',
        label: 'Ball Position',
        color: '#FFFFFF',
        offsetStart: { x: 0.03, y: 0.17 },
        offsetEnd: { x: 0.03, y: 0.21 },
        width: 1.5,
      },
    ],
  },

  // === IRON IMPACT ===
  {
    id: 'iron-impact',
    name: 'Iron Impact',
    description: 'Tour-average impact for irons — more forward shaft lean, descending strike',
    category: 'iron',
    phase: 'impact',
    lines: [
      {
        id: 'spine-impact',
        label: 'Spine Tilt',
        color: '#FF6B6B',
        offsetStart: { x: 0.01, y: 0.18 },
        offsetEnd: { x: -0.03, y: -0.18 },
        width: 2,
      },
      {
        id: 'shaft-lean',
        label: 'Shaft Lean',
        color: '#FBBF24',
        offsetStart: { x: -0.04, y: 0.04 },
        offsetEnd: { x: 0.04, y: 0.2 },
        width: 2.5,
      },
      {
        id: 'hip-line',
        label: 'Hip Line',
        color: '#4ECDC4',
        offsetStart: { x: -0.08, y: 0.1 },
        offsetEnd: { x: 0.08, y: 0.07 },
        width: 2,
      },
      {
        id: 'shoulder-line',
        label: 'Shoulder Line',
        color: '#45B7D1',
        offsetStart: { x: -0.1, y: -0.08 },
        offsetEnd: { x: 0.1, y: -0.13 },
        width: 2,
      },
      {
        id: 'vertical-ref',
        label: 'Vertical',
        color: '#FFFFFF',
        offsetStart: { x: 0, y: 0.2 },
        offsetEnd: { x: 0, y: -0.12 },
        width: 1,
        dashed: true,
      },
    ],
  },

  // === TOP OF BACKSWING ===
  {
    id: 'driver-top',
    name: 'Top of Backswing',
    description: 'Shoulder turn, hip turn, and club position at the top',
    category: 'driver',
    phase: 'top',
    lines: [
      {
        id: 'shoulder-line',
        label: 'Shoulders',
        color: '#45B7D1',
        offsetStart: { x: -0.1, y: -0.1 },
        offsetEnd: { x: 0.08, y: -0.05 },
        width: 2,
      },
      {
        id: 'hip-line',
        label: 'Hip Line',
        color: '#4ECDC4',
        offsetStart: { x: -0.06, y: 0.1 },
        offsetEnd: { x: 0.06, y: 0.09 },
        width: 2,
      },
      {
        id: 'spine-line',
        label: 'Spine',
        color: '#FF6B6B',
        offsetStart: { x: 0.01, y: 0.12 },
        offsetEnd: { x: -0.02, y: -0.15 },
        width: 2,
      },
      {
        id: 'club-plane',
        label: 'Club Plane',
        color: '#FBBF24',
        offsetStart: { x: 0.05, y: -0.2 },
        offsetEnd: { x: -0.03, y: -0.05 },
        width: 1.5,
        dashed: true,
      },
    ],
  },
];

export function getTemplatesForCategory(category: 'driver' | 'iron'): SwingTemplate[] {
  return swingTemplates.filter((t) => t.category === category);
}

export function getTemplateById(id: string): SwingTemplate | undefined {
  return swingTemplates.find((t) => t.id === id);
}

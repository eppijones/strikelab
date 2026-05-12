import tokens from './tokens.json';

export type ThemeMode = 'dark' | 'light';

export type DesignTokens = typeof tokens;

export const designTokens: DesignTokens = tokens;

export const motion = tokens.motion;
export const typography = tokens.typography;
export const shape = tokens.shape;
export const spacing = tokens.spacing;

export function color(mode: ThemeMode = 'dark'): DesignTokens['color']['dark'] {
  return tokens.color[mode];
}

export default tokens;

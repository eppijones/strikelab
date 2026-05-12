import { useState, useCallback } from 'react';
import type {
  SwingPhase,
  PhaseKeypoints,
  KeypointName,
  Point,
} from '../types';
import { SWING_PHASES } from '../types';

type AllPhaseKeypoints = Record<SwingPhase, PhaseKeypoints | null>;

function createEmptyPhaseKeypoints(): AllPhaseKeypoints {
  const kp = {} as AllPhaseKeypoints;
  for (const phase of SWING_PHASES) {
    kp[phase] = null;
  }
  return kp;
}

export function useKeypoints(initial?: AllPhaseKeypoints) {
  const [phaseKeypoints, setPhaseKeypoints] = useState<AllPhaseKeypoints>(
    initial || createEmptyPhaseKeypoints()
  );

  const setKeypoint = useCallback(
    (phase: SwingPhase, name: KeypointName, point: Point) => {
      setPhaseKeypoints((prev) => ({
        ...prev,
        [phase]: {
          ...(prev[phase] || {}),
          [name]: point,
        },
      }));
    },
    []
  );

  const removeKeypoint = useCallback(
    (phase: SwingPhase, name: KeypointName) => {
      setPhaseKeypoints((prev) => {
        const phaseKp = { ...(prev[phase] || {}) };
        delete phaseKp[name];
        return {
          ...prev,
          [phase]: Object.keys(phaseKp).length > 0 ? phaseKp : null,
        };
      });
    },
    []
  );

  const clearPhaseKeypoints = useCallback((phase: SwingPhase) => {
    setPhaseKeypoints((prev) => ({ ...prev, [phase]: null }));
  }, []);

  const clearAll = useCallback(() => {
    setPhaseKeypoints(createEmptyPhaseKeypoints());
  }, []);

  const getKeypointsForPhase = useCallback(
    (phase: SwingPhase): PhaseKeypoints | null => {
      return phaseKeypoints[phase];
    },
    [phaseKeypoints]
  );

  return {
    phaseKeypoints,
    setPhaseKeypoints,
    setKeypoint,
    removeKeypoint,
    clearPhaseKeypoints,
    clearAll,
    getKeypointsForPhase,
  };
}

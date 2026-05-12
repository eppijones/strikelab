import { useState, useCallback } from 'react';
import type { SwingPhase } from '../types';
import { SWING_PHASES } from '../types';

type PhaseMarkers = Record<SwingPhase, number | null>;

function createEmptyMarkers(): PhaseMarkers {
  const markers = {} as PhaseMarkers;
  for (const phase of SWING_PHASES) {
    markers[phase] = null;
  }
  return markers;
}

export function usePhaseMarkers(
  initial?: PhaseMarkers
) {
  const [markers, setMarkers] = useState<PhaseMarkers>(
    initial || createEmptyMarkers()
  );

  const setPhaseMarker = useCallback(
    (phase: SwingPhase, time: number) => {
      setMarkers((prev) => ({ ...prev, [phase]: time }));
    },
    []
  );

  const clearPhaseMarker = useCallback((phase: SwingPhase) => {
    setMarkers((prev) => ({ ...prev, [phase]: null }));
  }, []);

  const clearAllMarkers = useCallback(() => {
    setMarkers(createEmptyMarkers());
  }, []);

  const getMarkedPhases = useCallback((): SwingPhase[] => {
    return SWING_PHASES.filter((p) => markers[p] !== null);
  }, [markers]);

  return {
    markers,
    setMarkers,
    setPhaseMarker,
    clearPhaseMarker,
    clearAllMarkers,
    getMarkedPhases,
  };
}

import { useState, useCallback } from 'react';
import type {
  SwingPhase,
  PhaseKeypoints,
  PhaseAnalysis,
  ProductMode,
} from '../types';
import { analyzePhase } from '../core/biomechanicsEngine';
import { SWING_PHASES } from '../types';

type AnalysisResults = Record<SwingPhase, PhaseAnalysis | null>;

function createEmptyResults(): AnalysisResults {
  const results = {} as AnalysisResults;
  for (const phase of SWING_PHASES) {
    results[phase] = null;
  }
  return results;
}

export function useAnalysis(initial?: AnalysisResults) {
  const [results, setResults] = useState<AnalysisResults>(
    initial || createEmptyResults()
  );

  const analyze = useCallback(
    (
      phase: SwingPhase,
      keypoints: PhaseKeypoints,
      mode: ProductMode,
      addressKeypoints?: PhaseKeypoints
    ): PhaseAnalysis => {
      const analysis = analyzePhase(phase, keypoints, mode, addressKeypoints);
      setResults((prev) => ({ ...prev, [phase]: analysis }));
      return analysis;
    },
    []
  );

  const clearPhaseResults = useCallback((phase: SwingPhase) => {
    setResults((prev) => ({ ...prev, [phase]: null }));
  }, []);

  const clearAll = useCallback(() => {
    setResults(createEmptyResults());
  }, []);

  return {
    results,
    setResults,
    analyze,
    clearPhaseResults,
    clearAll,
  };
}

import { useState, useCallback, useRef } from 'react';
import type { FreeAnnotation, Point } from '../types';
import { generateId } from '../lib/videoUtils';

export type DrawingTool = 'line' | 'angle' | 'circle' | 'freehand' | 'select';

export interface DrawingState {
  annotations: FreeAnnotation[];
  activeTool: DrawingTool;
  activeColor: string;
  activeWidth: number;
  selectedAnnotationId: string | null;
  isDrawing: boolean;
  currentPoints: Point[];
}

export function useDrawing(initialAnnotations: FreeAnnotation[] = []) {
  const [annotations, setAnnotations] =
    useState<FreeAnnotation[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<DrawingTool>('line');
  const [activeColor, setActiveColor] = useState('#FF6B6B');
  const [activeWidth, setActiveWidth] = useState(2);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const undoStack = useRef<FreeAnnotation[][]>([]);
  const redoStack = useRef<FreeAnnotation[][]>([]);

  const pushUndo = useCallback(() => {
    undoStack.current.push([...annotations]);
    redoStack.current = [];
  }, [annotations]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push([...annotations]);
    const prev = undoStack.current.pop()!;
    setAnnotations(prev);
  }, [annotations]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push([...annotations]);
    const next = redoStack.current.pop()!;
    setAnnotations(next);
  }, [annotations]);

  const startDrawing = useCallback(
    (point: Point) => {
      if (activeTool === 'select') return;
      setIsDrawing(true);
      setCurrentPoints([point]);
    },
    [activeTool]
  );

  const continueDrawing = useCallback(
    (point: Point) => {
      if (!isDrawing) return;
      if (activeTool === 'freehand') {
        setCurrentPoints((prev) => [...prev, point]);
      } else {
        setCurrentPoints((prev) => [prev[0], point]);
      }
    },
    [isDrawing, activeTool]
  );

  const finishDrawing = useCallback(
    (point: Point, frameTime?: number) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      const finalPoints =
        activeTool === 'freehand'
          ? [...currentPoints, point]
          : [currentPoints[0], point];

      if (activeTool === 'angle' && finalPoints.length >= 2) {
        // For angle tool, need a third click for the second ray
        // Simplified: use start, middle, end
        // The angle is measured at the first point
      }

      pushUndo();

      const annotation: FreeAnnotation = {
        id: generateId(),
        type: activeTool === 'select' ? 'line' : activeTool,
        points: finalPoints,
        color: activeColor,
        width: activeWidth,
        frameTime,
      };

      setAnnotations((prev) => [...prev, annotation]);
      setCurrentPoints([]);
    },
    [isDrawing, activeTool, currentPoints, activeColor, activeWidth, pushUndo]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      pushUndo();
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
      }
    },
    [pushUndo, selectedAnnotationId]
  );

  const clearAll = useCallback(() => {
    pushUndo();
    setAnnotations([]);
    setSelectedAnnotationId(null);
  }, [pushUndo]);

  return {
    annotations,
    setAnnotations,
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    activeWidth,
    setActiveWidth,
    selectedAnnotationId,
    setSelectedAnnotationId,
    isDrawing,
    currentPoints,
    startDrawing,
    continueDrawing,
    finishDrawing,
    deleteAnnotation,
    clearAll,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

import { useRef } from "react";
export function useCanvasHistory(fabricCanvas, isInitializing, isHistoryAction, adjustHeight, exportObjects, updateStyles, clampObj) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const getCanvasState = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return null;
    return JSON.stringify(canvas.toJSON(["__media", "__shapeType"]));
  };
  const recordHistory = () => {
    const canvas = fabricCanvas.current;
    if (!canvas || isInitializing.current || isHistoryAction.current) return;
    const state = getCanvasState();
    if (!state) return;
    const lastState = undoStack.current[undoStack.current.length - 1];
    if (lastState === state) return;
    undoStack.current.push(state);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  };
  const undo = async () => {
    const canvas = fabricCanvas.current;
    if (!canvas || isHistoryAction.current || undoStack.current.length <= 1) return;
    try {
      isHistoryAction.current = true;
      const currentState = undoStack.current.pop();
      redoStack.current.push(currentState);
      const previousState = undoStack.current[undoStack.current.length - 1];
      await canvas.loadFromJSON(JSON.parse(previousState));
      canvas.getObjects().forEach((obj) => clampObj(obj));
      adjustHeight();
      canvas.renderAll();
      exportObjects();
      updateStyles();
    } catch (error) {
      console.error("Undo error:", error);
    } finally {
      isHistoryAction.current = false;
    }
  };
  const redo = async () => {
    const canvas = fabricCanvas.current;
    if (!canvas || isHistoryAction.current || redoStack.current.length === 0) return;
    try {
      isHistoryAction.current = true;
      const nextState = redoStack.current.pop();
      undoStack.current.push(nextState);
      await canvas.loadFromJSON(JSON.parse(nextState));
      canvas.getObjects().forEach((obj) => clampObj(obj));
      adjustHeight();
      canvas.renderAll();
      exportObjects();
      updateStyles();
    } catch (error) {
      console.error("Redo error:", error);
    } finally {
      isHistoryAction.current = false;
    }
  };
  return { undoStack, redoStack, recordHistory, undo, redo, getCanvasState };
}
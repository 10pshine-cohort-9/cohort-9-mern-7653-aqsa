import { renderHook, act } from "@testing-library/react";
import { useCanvasHistory } from "./useCanvasHistory";
describe("useCanvasHistory Hook", () => {
  let fabricCanvasMock;
  let isInitializing;
  let isHistoryAction;
  let adjustHeight;
  let exportObjects;
  let updateStyles;
  let clampObj;
  beforeEach(() => {
    fabricCanvasMock = {
      current: {
        toJSON: jest.fn(() => ({ objects: ["shape1"] })),
        loadFromJSON: jest.fn().mockResolvedValue(true),
        getObjects: jest.fn(() => [{ type: "rect" }]),
        renderAll: jest.fn(),
      },
    };
    isInitializing = { current: false };
    isHistoryAction = { current: false };
    adjustHeight = jest.fn();
    exportObjects = jest.fn();
    updateStyles = jest.fn();
    clampObj = jest.fn();
  });
  test("records canvas state and clears redoStack", () => {
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    result.current.redoStack.current = ['{"objects":["old"]}'];
    act(() => {
      result.current.recordHistory();
    });
    expect(result.current.undoStack.current).toHaveLength(1);
    expect(result.current.redoStack.current).toHaveLength(0);
  });
  test("does not record duplicate consecutive states", () => {
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    act(() => {
      result.current.recordHistory();
      result.current.recordHistory();
    });
    expect(result.current.undoStack.current).toHaveLength(1);
  });
  test("caps undo stack at 50 entries", () => {
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    act(() => {
      for (let i = 0; i < 60; i++) {
        fabricCanvasMock.current.toJSON.mockReturnValueOnce({ objects: [`item_${i}`] });
        result.current.recordHistory();
      }
    });
    expect(result.current.undoStack.current).toHaveLength(50);
  });
  test("performs undo and restores previous canvas state", async () => {
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    fabricCanvasMock.current.toJSON.mockReturnValueOnce({ objects: ["state_1"] });
    act(() => result.current.recordHistory());
    fabricCanvasMock.current.toJSON.mockReturnValueOnce({ objects: ["state_2"] });
    act(() => result.current.recordHistory());
    await act(async () => {
      await result.current.undo();
    });
    expect(fabricCanvasMock.current.loadFromJSON).toHaveBeenCalledWith({
      objects: ["state_1"],
    });
    expect(clampObj).toHaveBeenCalled();
    expect(adjustHeight).toHaveBeenCalled();
    expect(exportObjects).toHaveBeenCalled();
    expect(updateStyles).toHaveBeenCalled();
    expect(isHistoryAction.current).toBe(false);
  });
  test("performs redo and re-applies next state", async () => {
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    fabricCanvasMock.current.toJSON.mockReturnValueOnce({ objects: ["state_1"] });
    act(() => result.current.recordHistory());
    fabricCanvasMock.current.toJSON.mockReturnValueOnce({ objects: ["state_2"] });
    act(() => result.current.recordHistory());
    await act(async () => {
      await result.current.undo();
    });
    await act(async () => {
      await result.current.redo();
    });
    expect(fabricCanvasMock.current.loadFromJSON).toHaveBeenCalledWith({
      objects: ["state_2"],
    });
    expect(adjustHeight).toHaveBeenCalled();
    expect(isHistoryAction.current).toBe(false);
  });
  test("resets isHistoryAction flag even if loadFromJSON throws an error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fabricCanvasMock.current.loadFromJSON.mockRejectedValueOnce(new Error("JSON Error"));
    const { result } = renderHook(() =>
      useCanvasHistory(
        fabricCanvasMock,
        isInitializing,
        isHistoryAction,
        adjustHeight,
        exportObjects,
        updateStyles,
        clampObj
      )
    );
    result.current.undoStack.current = ['{"state":1}', '{"state":2}'];
    await act(async () => {
      await result.current.undo();
    });
    expect(isHistoryAction.current).toBe(false);
    consoleSpy.mockRestore();
  });
});
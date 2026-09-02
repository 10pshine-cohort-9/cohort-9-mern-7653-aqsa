import React, { createRef } from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FabricCanvas from "./FabricCanvas";
jest.mock("../../api/media.js", () => ({
  uploadFile: jest.fn(),
}));
jest.mock("../editor/canvas/ContextMenu.jsx", () => (props) => (
  props.contextMenu ? (
    <div data-testid="context-menu">
      <span>Context Menu</span>
      <button onClick={() => props.setContextMenu(null)}>Close Context Menu</button>
    </div>
  ) : null
));
const mockCanvasInstance = {
  add: jest.fn(),
  remove: jest.fn(),
  getActiveObject: jest.fn(),
  setActiveObject: jest.fn(),
  discardActiveObject: jest.fn(),
  requestRenderAll: jest.fn(),
  renderAll: jest.fn(),
  toJSON: jest.fn(() => ({ objects: [] })),
  loadFromJSON: jest.fn().mockResolvedValue(true),
  getObjects: jest.fn(() => []),
  dispose: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getScenePoint: jest.fn(() => ({ x: 100, y: 100 })),
  getWidth: jest.fn(() => 794),
  freeDrawingBrush: { color: "#000000", width: 3 },
};
jest.mock("fabric", () => {
  return {
    Canvas: jest.fn(() => mockCanvasInstance),
    Textbox: jest.fn().mockImplementation((text, opts) => ({
      ...opts,
      type: "textbox",
      text,
      set: jest.fn(),
      initDimensions: jest.fn(),
      enterEditing: jest.fn(),
      selectAll: jest.fn(),
      setSelectionStyles: jest.fn(),
    })),
    FabricImage: jest.fn().mockImplementation((el, opts) => ({
      ...opts,
      type: "image",
      set: jest.fn(),
      width: 100,
      height: 100,
    })),
    PencilBrush: jest.fn().mockImplementation(() => ({
      color: "#000000",
      width: 3,
    })),
    Rect: jest.fn().mockImplementation((opts) => ({ ...opts, type: "rect", set: jest.fn(), setCoords: jest.fn() })),
    Circle: jest.fn().mockImplementation((opts) => ({ ...opts, type: "circle", set: jest.fn(), setCoords: jest.fn() })),
    Triangle: jest.fn().mockImplementation((opts) => ({ ...opts, type: "triangle", set: jest.fn(), setCoords: jest.fn() })),
    Line: jest.fn().mockImplementation((coords, opts) => ({ ...opts, type: "line", coords, set: jest.fn(), setCoords: jest.fn() })),
    Path: jest.fn().mockImplementation((path, opts) => ({ ...opts, type: "path", path, set: jest.fn() })),
  };
});
jest.mock("../editor/canvas/canvasUtils.js", () => ({
  configureTextbox: jest.fn(),
  loadImageElement: jest.fn(),
  readActiveStyles: jest.fn(() => ({ bold: false, italic: false })),
  exportCanvasObjectsHelper: jest.fn(() => [{ type: "textbox", text: "Sample" }]),
}));
import { uploadFile } from "../../api/media.js";
import { loadImageElement } from "../editor/canvas/canvasUtils.js";
const defaultPage = {
  _id: "page_1",
  width: 794,
  height: 1123,
  background: { value: "#ffffff" },
  objects: [],
};
describe("FabricCanvas", () => {
  let defaultProps;
  beforeEach(() => {
    jest.clearAllMocks();
    loadImageElement.mockImplementation(() =>
      Promise.resolve(document.createElement("img"))
    );
    defaultProps = {
      page: defaultPage,
      totalPages: [defaultPage],
      activeTool: "select",
      setActiveTool: jest.fn(),
      onObjectsChange: jest.fn(),
      onStylesChange: jest.fn(),
      onMediaAdd: jest.fn(),
      onActivatePage: jest.fn(),
      onMoveObjectToPage: jest.fn(),
      onAutoSave: jest.fn(),
    };
  });
  test("renders canvas element and wrapper with correct dimensions", () => {
    render(<FabricCanvas {...defaultProps} />);
    const container = document.querySelector(".relative.flex.w-full");
    expect(container).toHaveStyle("max-width: 794px");
    expect(container).toHaveStyle("height: 1123px");
  });
  test("initializes Fabric Canvas on mount and disposes on unmount", () => {
    const { unmount } = render(<FabricCanvas {...defaultProps} />);
    expect(mockCanvasInstance.on).toHaveBeenCalledWith("mouse:down", expect.any(Function));
    unmount();
    expect(mockCanvasInstance.dispose).toHaveBeenCalled();
  });
  test("imperative handle methods work correctly (runCommand, addObjectFromData, deleteObject)", async () => {
    const ref = createRef();
    render(<FabricCanvas {...defaultProps} ref={ref} />);
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    act(() => {
      ref.current.runCommand("brushColor", "#ff0000");
    });
    expect(defaultProps.onStylesChange).toHaveBeenCalledWith({
      brushColor: "#ff0000",
      brushWidth: 3,
    });
    act(() => {
      ref.current.runCommand("brushWidth", 5);
    });
    expect(defaultProps.onStylesChange).toHaveBeenCalledWith({
      brushColor: "#ff0000",
      brushWidth: 5,
    });
    await act(async () => {
      await ref.current.addObjectFromData({
        type: "text",
        content: "Hello World",
        x: 100,
        y: 100,
      });
    });
    expect(mockCanvasInstance.add).toHaveBeenCalled();
    mockCanvasInstance.getActiveObject.mockReturnValueOnce({ type: "textbox" });
    act(() => {
      ref.current.deleteObject();
    });
    expect(mockCanvasInstance.remove).toHaveBeenCalled();
  });
  test("handles file upload for media tool selection", async () => {
    uploadFile.mockResolvedValueOnce({
      url: "http://example.com/test.mp4",
      resourceType: "video",
      publicId: "v123",
    });
    const { rerender } = render(<FabricCanvas {...defaultProps} activeTool="select" />);
    rerender(<FabricCanvas {...defaultProps} activeTool="video" />);
    const fileInput = document.querySelector("input[type='file']");
    const file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
    await userEvent.upload(fileInput, file);
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(file);
      expect(defaultProps.onMediaAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "video",
          url: "http://example.com/test.mp4",
        })
      );
    });
  });
  test("opens context menu on right click on object", () => {
    render(<FabricCanvas {...defaultProps} />);
    const mouseDownCall = mockCanvasInstance.on.mock.calls.find(
      (call) => call[0] === "mouse:down"
    );
    const handleMouseDown = mouseDownCall[1];
    const mockTarget = {
      getBoundingRect: () => ({ left: 50, top: 50, width: 100, height: 100 }),
    };
    act(() => {
      handleMouseDown({
        e: { button: 2, preventDefault: jest.fn() },
        target: mockTarget,
      });
    });
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });
  test("handles undo/redo commands via keyboard shortcuts", async () => {
    const ref = createRef();
    render(<FabricCanvas {...defaultProps} ref={ref} />);
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    expect(mockCanvasInstance.requestRenderAll).toHaveBeenCalled();
  });
});
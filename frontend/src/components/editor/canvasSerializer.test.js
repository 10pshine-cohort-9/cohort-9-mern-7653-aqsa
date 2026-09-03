import { loadObjectsToCanvas, exportCanvasObjects } from "./canvasSerializer";
const mockCanvas = {
  add: jest.fn(),
  requestRenderAll: jest.fn(),
  getObjects: jest.fn(() => []),
};
const mockClampObj = jest.fn();
jest.mock("fabric", () => {
  return {
    Textbox: jest.fn().mockImplementation((content, opts) => ({
      ...opts,
      type: "textbox",
      text: content,
      set: jest.fn(),
    })),
    FabricImage: jest.fn().mockImplementation((el, opts) => ({
      ...opts,
      type: "image",
      set: jest.fn(),
    })),
    Rect: jest.fn().mockImplementation((opts) => ({ ...opts, type: "rect", set: jest.fn() })),
    Circle: jest.fn().mockImplementation((opts) => ({ ...opts, type: "circle", set: jest.fn() })),
    Triangle: jest.fn().mockImplementation((opts) => ({ ...opts, type: "triangle", set: jest.fn() })),
    Line: jest.fn().mockImplementation((coords, opts) => ({ ...opts, type: "line", coords, set: jest.fn() })),
    Path: jest.fn().mockImplementation((path, opts) => ({ ...opts, type: "path", path, set: jest.fn() })),
  };
});
describe("canvasSerializer Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.Image = class {
      constructor() {
        setTimeout(() => {
          if (this.src === "http://example.com/invalid.jpg") {
            this.onerror(new Error("Failed to load"));
          } else {
            this.onload();
          }
        }, 0);
      }
    };
  });
  describe("loadObjectsToCanvas", () => {
    test("loads text objects onto canvas with sanitized coordinates", async () => {
      const objects = [
        {
          type: "text",
          content: "Sample Text",
          x: 100,
          y: 200,
          width: 300,
          style: { fill: "#ff0000", fontSize: 18 },
        },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(mockClampObj).toHaveBeenCalled();
      expect(mockCanvas.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "textbox",
          text: "Sample Text",
          left: 100,
          top: 200,
          width: 300,
          fill: "#ff0000",
        })
      );
      expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
    });
    test("handles coordinate fallback and bounding clamps", async () => {
      const objects = [
        {
          type: "text",
          content: "OutOfBounds Text",
          x: 900,
          y: -50, 
        },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(mockCanvas.add).toHaveBeenCalledWith(
        expect.objectContaining({
          left: 650, 
          top: 50, 
        })
      );
    });
    test("loads image object onto canvas when image source is valid", async () => {
      const objects = [
        {
          type: "image",
          url: "http://example.com/valid.jpg",
          x: 50,
          y: 50,
        },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(mockCanvas.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "image",
          left: 50,
          top: 50,
        })
      );
    });
    test("catches and logs error when image URL fails to load", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const objects = [
        {
          type: "image",
          url: "http://example.com/invalid.jpg",
          x: 50,
          y: 50,
        },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to load image:", expect.any(Error));
      consoleSpy.mockRestore();
    });
    test("loads shape objects (rect, circle, triangle, line)", async () => {
      const objects = [
        { type: "shape", style: { shapeType: "rectangle" }, x: 10, y: 10 },
        { type: "shape", style: { shapeType: "circle" }, x: 20, y: 20 },
        { type: "shape", style: { shapeType: "triangle" }, x: 30, y: 30 },
        { type: "shape", style: { shapeType: "line" }, x: 40, y: 40 },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(mockCanvas.add).toHaveBeenCalledTimes(4);
    });
    test("loads drawing path objects onto canvas", async () => {
      const objects = [
        {
          type: "drawing",
          drawing: { path: "M 0 0 L 100 100", stroke: "#00ff00" },
          x: 10,
          y: 10,
        },
      ];
      await loadObjectsToCanvas(mockCanvas, objects, 800, 1000, mockClampObj);
      expect(mockCanvas.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "path",
          path: "M 0 0 L 100 100",
        })
      );
    });
  });
  describe("exportCanvasObjects", () => {
    test("returns empty array if canvas is null or undefined", () => {
      expect(exportCanvasObjects(null)).toEqual([]);
    });
    test("exports textbox objects into serialised JSON object format", () => {
      const mockTextbox = {
        type: "textbox",
        left: 100,
        top: 150,
        width: 320,
        height: 80,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        text: "Serialized Text",
        fill: "#000000",
        fontSize: 24,
        fontFamily: "Arial",
        fontWeight: "bold",
        fontStyle: "normal",
        underline: false,
        linethrough: false,
        textAlign: "left",
        textBackgroundColor: "",
        lineHeight: 1.15,
        charSpacing: 0,
        styles: {},
      };
      mockCanvas.getObjects.mockReturnValueOnce([mockTextbox, { type: "other" }]);
      const exported = exportCanvasObjects(mockCanvas);
      expect(exported).toHaveLength(1);
      expect(exported[0]).toEqual({
        type: "text",
        x: 100,
        y: 150,
        width: 320,
        height: 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        content: "Serialized Text",
        style: {
          fill: "#000000",
          fontSize: 24,
          fontFamily: "Arial",
          fontWeight: "bold",
          fontStyle: "normal",
          underline: false,
          linethrough: false,
          textAlign: "left",
          textBackgroundColor: "",
          lineHeight: 1.15,
          charSpacing: 0,
        },
        charStyles: {},
      });
    });
  });
});
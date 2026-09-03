import React, { createRef } from "react";
import { render, waitFor, act } from "@testing-library/react";
import ReaderCanvas from "./ReaderCanvas";
import { Canvas, Textbox, FabricImage, Path, Rect, Circle, Triangle, Line } from "fabric";
jest.mock("fabric", () => {
  const CanvasMock = jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    requestRenderAll: jest.fn(),
    toDataURL: jest.fn(() => "data:image/png;base64,mock-image"),
    dispose: jest.fn(),
    defaultCursor: "",
    hoverCursor: "",
  }));
  const TextboxMock = jest.fn().mockImplementation((text, options) => ({
    type: "textbox",
    text,
    ...options,
  }));
  const FabricImageMock = jest.fn().mockImplementation((element, options) => ({
    type: "image",
    element,
    ...options,
  }));
  const PathMock = jest.fn().mockImplementation((path, options) => ({
    type: "path",
    path,
    ...options,
  }));
  const RectMock = jest.fn().mockImplementation((options) => ({
    type: "rect",
    ...options,
  }));
  const CircleMock = jest.fn().mockImplementation((options) => ({
    type: "circle",
    ...options,
  }));
  const TriangleMock = jest.fn().mockImplementation((options) => ({
    type: "triangle",
    ...options,
  }));
  const LineMock = jest.fn().mockImplementation((points, options) => ({
    type: "line",
    points,
    ...options,
  }));
  return {
    Canvas: CanvasMock,
    Textbox: TextboxMock,
    FabricImage: FabricImageMock,
    Path: PathMock,
    Rect: RectMock,
    Circle: CircleMock,
    Triangle: TriangleMock,
    Line: LineMock,
  };
});
function createPage(overrides = {}) {
  return {
    _id: "page123",
    width: 800,
    height: 1000,
    background: {
      value: "#f5f5f5",
    },
    objects: [],
    ...overrides,
  };
}
describe("ReaderCanvas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("renders a canvas element", () => {
    const page = createPage();
    const { container } = render(
      <ReaderCanvas page={page} />
    );
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });
  test("creates Fabric canvas with page dimensions and background", () => {
    const page = createPage({
      width: 900,
      height: 1200,
      background: {
        value: "#123456",
      },
    });
    render(<ReaderCanvas page={page} />);
    expect(Canvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        width: 900,
        height: 1200,
        backgroundColor: "#123456",
        selection: false,
        skipTargetFind: true,
      })
    );
  });
  test("uses default canvas dimensions and background", () => {
    const page = createPage({
      width: undefined,
      height: undefined,
      background: undefined,
    });
    render(<ReaderCanvas page={page} />);
    expect(Canvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        width: 794,
        height: 1123,
        backgroundColor: "#ffffff",
      })
    );
  });
  test("adds text objects to the canvas", async () => {
    const page = createPage({
      objects: [
        {
          type: "text",
          x: 100,
          y: 200,
          width: 400,
          content: "Hello World",
          style: {
            fill: "#ff0000",
            fontSize: 32,
            fontFamily: "Arial",
            fontWeight: "bold",
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Textbox).toHaveBeenCalledWith(
        "Hello World",
        expect.objectContaining({
          left: 100,
          top: 200,
          width: 400,
          fill: "#ff0000",
          fontSize: 32,
          fontFamily: "Arial",
          fontWeight: "bold",
          selectable: false,
          evented: false,
        })
      );
    });
  });
  test("adds rectangle shape", async () => {
    const page = createPage({
      objects: [
        {
          type: "shape",
          x: 20,
          y: 30,
          width: 200,
          height: 100,
          style: {
            shapeType: "rectangle",
            fill: "#ff0000",
            stroke: "#000000",
            strokeWidth: 3,
            rx: 10,
            ry: 10,
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Rect).toHaveBeenCalledWith(
        expect.objectContaining({
          left: 20,
          top: 30,
          width: 200,
          height: 100,
          fill: "#ff0000",
          stroke: "#000000",
          strokeWidth: 3,
          rx: 10,
          ry: 10,
          selectable: false,
          evented: false,
        })
      );
    });
  });
  test("adds circle shape", async () => {
    const page = createPage({
      objects: [
        {
          type: "shape",
          width: 100,
          style: {
            shapeType: "circle",
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Circle).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 50,
        })
      );
    });
  });
  test("adds triangle shape", async () => {
    const page = createPage({
      objects: [
        {
          type: "shape",
          width: 150,
          height: 120,
          style: {
            shapeType: "triangle",
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Triangle).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 150,
          height: 120,
        })
      );
    });
  });
  test("adds line shape", async () => {
    const page = createPage({
      objects: [
        {
          type: "shape",
          width: 300,
          style: {
            shapeType: "line",
            stroke: "#333333",
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Line).toHaveBeenCalledWith(
        [0, 0, 300, 0],
        expect.objectContaining({
          stroke: "#333333",
        })
      );
    });
  });
  test("adds drawing/path objects", async () => {
    const page = createPage({
      objects: [
        {
          type: "drawing",
          x: 50,
          y: 60,
          drawing: {
            path: "M 0 0 L 100 100",
            stroke: "#0000ff",
            strokeWidth: 4,
          },
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Path).toHaveBeenCalledWith(
        "M 0 0 L 100 100",
        expect.objectContaining({
          left: 50,
          top: 60,
          stroke: "#0000ff",
          strokeWidth: 4,
          selectable: false,
          evented: false,
        })
      );
    });
  });
  test("supports array path data", async () => {
    const page = createPage({
      objects: [
        {
          type: "path",
          path: [
            ["M", 0, 0],
            ["L", 100, 100],
          ],
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      expect(Path).toHaveBeenCalledWith(
        "M 0 0 L 100 100",
        expect.any(Object)
      );
    });
  });
  test("calls onReady after loading objects", async () => {
    const onReady = jest.fn();
    const page = createPage({
      objects: [
        {
          type: "text",
          content: "Test",
        },
      ],
    });
    render(
      <ReaderCanvas
        page={page}
        onReady={onReady}
      />
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith("page123");
    });
  });
  test("calls requestRenderAll after objects are loaded", async () => {
    const page = createPage({
      objects: [
        {
          type: "text",
          content: "Test",
        },
      ],
    });
    render(<ReaderCanvas page={page} />);
    await waitFor(() => {
      const canvasInstance = Canvas.mock.results[0].value;
      expect(
        canvasInstance.requestRenderAll
      ).toHaveBeenCalled();
    });
  });
  test("exposes getDataURL through ref", async () => {
    const page = createPage();
    const ref = createRef();
    render(
      <ReaderCanvas
        page={page}
        ref={ref}
      />
    );
    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    const result = ref.current.getDataURL(3);
    const canvasInstance = Canvas.mock.results[0].value;
    expect(canvasInstance.toDataURL).toHaveBeenCalledWith({
      format: "png",
      quality: 1,
      multiplier: 3,
    });
    expect(result).toBe("data:image/png;base64,mock-image");
  });
  test("uses multiplier 2 by default in getDataURL", async () => {
    const page = createPage();
    const ref = createRef();
    render(
      <ReaderCanvas
        page={page}
        ref={ref}/>
    );
    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });
    ref.current.getDataURL();
    const canvasInstance = Canvas.mock.results[0].value;
    expect(canvasInstance.toDataURL).toHaveBeenCalledWith({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
  });
  test("does not crash when page has no objects", async () => {
    const onReady = jest.fn();
    const page = createPage({
      objects: undefined,
    });
    render(
      <ReaderCanvas
        page={page}
        onReady={onReady}/>
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith("page123");
    });
  });
  test("skips unknown object types without crashing", async () => {
    const onReady = jest.fn();
    const page = createPage({
      objects: [
        {
          type: "unknown-object",
          x: 100,
          y: 100,
        },
      ],
    });
    render(
      <ReaderCanvas
        page={page}
        onReady={onReady}
      />
    );
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith("page123");
    });
    expect(Textbox).not.toHaveBeenCalled();
    expect(Rect).not.toHaveBeenCalled();
    expect(Circle).not.toHaveBeenCalled();
    expect(Triangle).not.toHaveBeenCalled();
    expect(Line).not.toHaveBeenCalled();
    expect(Path).not.toHaveBeenCalled();
  });
  test("disposes Fabric canvas when component unmounts", () => {
    const page = createPage();
    const { unmount } = render(
      <ReaderCanvas page={page} />
    );
    const canvasInstance = Canvas.mock.results[0].value;
    unmount();
    expect(canvasInstance.dispose).toHaveBeenCalled();
  });
  test("recreates Fabric canvas when page changes", () => {
    const firstPage = createPage({
      _id: "page1",
    });
    const secondPage = createPage({
      _id: "page2",
    });
    const { rerender } = render(
      <ReaderCanvas page={firstPage} />
    );
    const firstCanvas = Canvas.mock.results[0].value;
    rerender(
      <ReaderCanvas page={secondPage} />
    );
    expect(firstCanvas.dispose).toHaveBeenCalled();
    expect(Canvas).toHaveBeenCalledTimes(2);
  });
});
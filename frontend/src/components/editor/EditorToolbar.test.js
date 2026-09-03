import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorToolbar from "./EditorToolbar";
describe("EditorToolbar Component", () => {
  let defaultProps;
  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps = {
      activeTool: "select",
      setActiveTool: jest.fn(),
      activeStyles: {
        fontSize: 16,
        fontFamily: "Arial",
        heading: "normal",
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: "#000000",
        highlight: null,
        textAlign: "left",
      },
      zoomLevel: 100,
      onZoomChange: jest.fn(),
      onCommand: jest.fn(),
      onBeforeCommand: jest.fn(),
    };
  });
  test("renders all main tools in the toolbar", () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByTitle("Select")).toBeInTheDocument();
    expect(screen.getByTitle("Text")).toBeInTheDocument();
    expect(screen.getByTitle("Draw")).toBeInTheDocument();
    expect(screen.getByTitle("Image")).toBeInTheDocument();
    expect(screen.getByTitle("Video")).toBeInTheDocument();
    expect(screen.getByTitle("Audio")).toBeInTheDocument();
    expect(screen.getByTitle("Eraser")).toBeInTheDocument();
  });
  test("calls setActiveTool when a tool button is clicked", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const penToolBtn = screen.getByTitle("Draw");
    await userEvent.click(penToolBtn);
    expect(defaultProps.onBeforeCommand).toHaveBeenCalled();
    expect(defaultProps.setActiveTool).toHaveBeenCalledWith("pen");
  });
  test("handles shape dropdown selection", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const shapeSelect = screen.getByTitle(/pick shape/i);
    await userEvent.selectOptions(shapeSelect, "rectangle");
    expect(defaultProps.setActiveTool).toHaveBeenCalledWith("shape:rectangle");
  });
  test("handles zoom in, zoom out, and reset zoom buttons", async () => {
    render(<EditorToolbar {...defaultProps} zoomLevel={100} />);
    const zoomOutBtn = screen.getByTitle("Zoom Out");
    const zoomInBtn = screen.getByTitle("Zoom In");
    const resetZoomBtn = screen.getByTitle("Reset Zoom");
    await userEvent.click(zoomOutBtn);
    expect(defaultProps.onZoomChange).toHaveBeenCalledWith(85);
    await userEvent.click(zoomInBtn);
    expect(defaultProps.onZoomChange).toHaveBeenCalledWith(115);
    await userEvent.click(resetZoomBtn);
    expect(defaultProps.onZoomChange).toHaveBeenCalledWith(100);
  });
  test("renders pen controls when activeTool is pen", async () => {
    render(<EditorToolbar {...defaultProps} activeTool="pen" />);
    expect(screen.getByTitle("Brush Color")).toBeInTheDocument();
    const brushWidthSelect = screen.getByDisplayValue("3px (Regular)");
    // Change brush width
    fireEvent.change(brushWidthSelect, { target: { value: "6" } });
    expect(defaultProps.onCommand).toHaveBeenCalledWith("brushWidth", 6);
  });
  test("renders eraser controls when activeTool is eraser", async () => {
    render(<EditorToolbar {...defaultProps} activeTool="eraser" />);
    expect(screen.getByText("Drag over any item to erase")).toBeInTheDocument();
    const clearAllBtn = screen.getByRole("button", { name: /clear all drawings/i });
    await userEvent.click(clearAllBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("clearDrawings");
  });
  test("disables text formatting section when activeStyles is null/undefined", () => {
    const { container } = render(
      <EditorToolbar {...defaultProps} activeStyles={null} />
    );
    const textSection = container.querySelector(".pointer-events-none.opacity-40");
    expect(textSection).toBeInTheDocument();
  });
  test("triggers formatting commands (bold, italic, underline, strikethrough)", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const boldBtn = screen.getByTitle("Bold");
    const italicBtn = screen.getByTitle("Italic");
    const underlineBtn = screen.getByTitle("Underline");
    const strikethroughBtn = screen.getByTitle("Strikethrough");
    await userEvent.click(boldBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("bold");
    await userEvent.click(italicBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("italic");
    await userEvent.click(underlineBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("underline");
    await userEvent.click(strikethroughBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("strikethrough");
  });
  test("adjusts font size using increase and decrease buttons", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const decreaseBtn = screen.getByTitle("Decrease Font Size");
    const increaseBtn = screen.getByTitle("Increase Font Size");
    await userEvent.click(decreaseBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("fontSize", 15);
    await userEvent.click(increaseBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("fontSize", 17);
  });
  test("opens and selects color from text color palette", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const colorPaletteBtn = screen.getByTitle("Text Color Palette");
    await userEvent.click(colorPaletteBtn);
    const colorSwatches = document.querySelectorAll(".rounded-full.h-5.w-5");
    expect(colorSwatches.length).toBeGreaterThan(0);
    await userEvent.click(colorSwatches[2]);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("color", "#ef4444");
  });
  test("opens and selects highlight color from highlight palette", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const highlightPaletteBtn = screen.getByTitle("Highlight Color Palette");
    await userEvent.click(highlightPaletteBtn);
    const highlightSwatches = document.querySelectorAll(".rounded.h-5.w-5");
    expect(highlightSwatches.length).toBeGreaterThan(0);
    await userEvent.click(highlightSwatches[0]);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("highlight", "#fef08a");
  });
  test("removes highlight color when remove button is clicked", async () => {
    const activeStylesWithHighlight = {
      ...defaultProps.activeStyles,
      highlight: "#ffff00",
    };
    render(
      <EditorToolbar
        {...defaultProps}
        activeStyles={activeStylesWithHighlight}
      />
    );
    const removeHighlightBtn = screen.getByTitle("Remove Highlight");
    await userEvent.click(removeHighlightBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("highlight", null);
  });
  test("triggers alignment and list commands", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const alignCenterBtn = screen.getByTitle("Align Center");
    const bulletListBtn = screen.getByTitle("Bullet List");
    await userEvent.click(alignCenterBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("align", "center");
    await userEvent.click(bulletListBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("bulletList");
  });
  test("triggers text transformation commands (uppercase, lowercase, titlecase)", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const upperBtn = screen.getByTitle("UPPERCASE");
    const lowerBtn = screen.getByTitle("lowercase");
    const titleBtn = screen.getByTitle("Title Case");
    await userEvent.click(upperBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("uppercase");
    await userEvent.click(lowerBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("lowercase");
    await userEvent.click(titleBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("titlecase");
  });
  test("triggers clear formatting command", async () => {
    render(<EditorToolbar {...defaultProps} />);
    const clearBtn = screen.getByTitle("Clear All Formatting");
    await userEvent.click(clearBtn);
    expect(defaultProps.onCommand).toHaveBeenCalledWith("clearFormatting");
  });
  test("adjusts zoom level automatically on window resize", () => {
    render(<EditorToolbar {...defaultProps} />);
    act(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event("resize"));
    });
    expect(defaultProps.onZoomChange).toHaveBeenCalledWith(30);
  });
});
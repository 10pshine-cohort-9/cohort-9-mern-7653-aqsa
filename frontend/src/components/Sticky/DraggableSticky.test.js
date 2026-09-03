import React from "react";
import {render,screen,fireEvent,act,} from "@testing-library/react";
import DraggableSticky from "./DraggableSticky";
describe("DraggableSticky", () => {
  const sticky = {
    _id: "sticky123",
    title: "My Sticky",
    content: "Important note",
    color: "#ff0000",
    position: {
      x: 100,
      y: 150,
    },
  };
  let onUpdate;
  let onDelete;
  function renderSticky(props = {}) {
    return render(
      <DraggableSticky
        sticky={sticky}
        onUpdate={onUpdate}
        onDelete={onDelete}
        {...props}
      />
    );
  }
  beforeEach(() => {
    jest.clearAllMocks();
    onUpdate = jest.fn();
    onDelete = jest.fn();
  });
  test("renders sticky title and content", () => {
    renderSticky();
    expect(screen.getByDisplayValue("My Sticky")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Important note")).toBeInTheDocument();
  });
  test("uses sticky position", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    expect(stickyElement).toHaveStyle({
      left: "100px",
      top: "150px",
    });
  });
  test("uses sticky color", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    expect(stickyElement).toHaveStyle({
      backgroundColor: "rgb(255, 0, 0)",
    });
  });
  test("uses default position when position is missing", () => {
    const { container } = renderSticky({
      sticky: {
        ...sticky,
        position: undefined,
      },
    });
    const stickyElement = container.firstChild;
    expect(stickyElement).toHaveStyle({
      left: "50px",
      top: "50px",
    });
  });
  test("uses default background color when color is missing", () => {
    const { container } = renderSticky({
      sticky: {
        ...sticky,
        color: undefined,
      },
    });
    const stickyElement = container.firstChild;
    expect(stickyElement).toHaveStyle({
      backgroundColor: "rgb(254, 240, 138)",
    });
  });
  test("calls onDelete with sticky id", () => {
    renderSticky();
    const deleteButton = screen.getByRole("button");
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("sticky123");
  });
  test("updates title when title changes and loses focus", () => {
    renderSticky();
    const titleInput = screen.getByDisplayValue("My Sticky");
    fireEvent.change(titleInput, {
      target: {
        value: "Updated Title",
      },
    });
    fireEvent.blur(titleInput);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith("sticky123", {
      title: "Updated Title",
    });
  });
  test("does not update title when title has not changed", () => {
    renderSticky();
    const titleInput = screen.getByDisplayValue("My Sticky");
    fireEvent.blur(titleInput);
    expect(onUpdate).not.toHaveBeenCalled();
  });
  test("updates content when content changes and loses focus", () => {
    renderSticky();
    const textarea = screen.getByDisplayValue("Important note");
    fireEvent.change(textarea, {
      target: {
        value: "Updated content",
      },
    });
    fireEvent.blur(textarea);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith("sticky123", {
      content: "Updated content",
    });
  });
  test("does not update content when content has not changed", () => {
    renderSticky();
    const textarea = screen.getByDisplayValue("Important note");
    fireEvent.blur(textarea);
    expect(onUpdate).not.toHaveBeenCalled();
  });
  test("starts dragging when mouse is pressed on sticky", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.mouseDown(stickyElement, {
      clientX: 120,
      clientY: 170,
    });
    expect(stickyElement.className).toContain("cursor-grabbing");
    expect(stickyElement.className).toContain("z-50");
  });
  test("moves sticky when mouse moves", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.mouseDown(stickyElement, {
      clientX: 120,
      clientY: 170,
    });
    act(() => {
      fireEvent.mouseMove(window, {
        clientX: 220,
        clientY: 270,
      });
    });
    expect(stickyElement).toHaveStyle({
      left: "200px",
      top: "250px",
    });
  });
  test("updates position when dragging ends", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.mouseDown(stickyElement, {
      clientX: 120,
      clientY: 170,
    });
    act(() => {
      fireEvent.mouseMove(window, {
        clientX: 220,
        clientY: 270,
      });
      fireEvent.mouseUp(window);
    });
    expect(onUpdate).toHaveBeenCalledWith("sticky123", {
      position: {
        x: 200,
        y: 250,
      },
    });
  });
  test("does not allow sticky to move to negative coordinates", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.mouseDown(stickyElement, {
      clientX: 120,
      clientY: 170,
    });
    act(() => {
      fireEvent.mouseMove(window, {
        clientX: -100,
        clientY: -100,
      });
    });
    expect(stickyElement).toHaveStyle({
      left: "0px",
      top: "0px",
    });
  });
  test("does not start dragging when delete button is clicked", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    const deleteButton = screen.getByRole("button");
    fireEvent.mouseDown(deleteButton, {
      clientX: 120,
      clientY: 170,
    });
    expect(stickyElement.className).toContain("cursor-grab");
    expect(stickyElement.className).not.toContain("cursor-grabbing");
  });
  test("does not start dragging when input is clicked", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    const input = screen.getByDisplayValue("My Sticky");
    fireEvent.mouseDown(input, {
      clientX: 120,
      clientY: 170,
    });
    expect(stickyElement.className).toContain("cursor-grab");
    expect(stickyElement.className).not.toContain("cursor-grabbing");
  });
  test("does not start dragging when textarea is clicked", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    const textarea = screen.getByDisplayValue("Important note");
    fireEvent.mouseDown(textarea, {
      clientX: 120,
      clientY: 170,
    });
    expect(stickyElement.className).toContain("cursor-grab");
    expect(stickyElement.className).not.toContain("cursor-grabbing");
  });
  test("supports touch dragging", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.touchStart(stickyElement, {
      touches: [
        {
          clientX: 120,
          clientY: 170,
        },
      ],
    });
    act(() => {
      fireEvent.touchMove(window, {
        touches: [
          {
            clientX: 220,
            clientY: 270,
          },
        ],
      });
    });
    expect(stickyElement).toHaveStyle({
      left: "200px",
      top: "250px",
    });
  });
  test("updates position when touch dragging ends", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.touchStart(stickyElement, {
      touches: [
        {
          clientX: 120,
          clientY: 170,
        },
      ],
    });
    act(() => {
      fireEvent.touchMove(window, {
        touches: [
          {
            clientX: 220,
            clientY: 270,
          },
        ],
      });
      fireEvent.touchEnd(window);
    });
    expect(onUpdate).toHaveBeenCalledWith("sticky123", {
      position: {
        x: 200,
        y: 250,
      },
    });
  });
  test("does not start touch dragging with multiple touches", () => {
    const { container } = renderSticky();
    const stickyElement = container.firstChild;
    fireEvent.touchStart(stickyElement, {
      touches: [
        {
          clientX: 120,
          clientY: 170,
        },
        {
          clientX: 130,
          clientY: 180,
        },
      ],
    });
    expect(stickyElement.className).toContain("cursor-grab");
    expect(stickyElement.className).not.toContain("cursor-grabbing");
  });
  test("resets position when sticky position prop changes", () => {
    const { container, rerender } = renderSticky();
    const stickyElement = container.firstChild;
    expect(stickyElement).toHaveStyle({
      left: "100px",
      top: "150px",
    });
    const updatedSticky = {
      ...sticky,
      position: {
        x: 300,
        y: 400,
      },
    };
    rerender(
      <DraggableSticky
        sticky={updatedSticky}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );
    expect(stickyElement).toHaveStyle({
      left: "300px",
      top: "400px",
    });
  });
});
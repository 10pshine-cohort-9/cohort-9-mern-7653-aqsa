import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyHeader from "./StickyHeader";
describe("StickyHeader", () => {
  const defaultProps = {
    content: "",
    setContent: jest.fn(),
    color: "#fef08a",
    setColor: jest.fn(),
    stickyColors: [
      { bg: "#fef08a" },
      { bg: "#fecaca" },
      { bg: "#bfdbfe" },
    ],
    isCreating: false,
    onCreate: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("renders the Sticky Wall heading and description", () => {
    render(<StickyHeader {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Sticky Wall" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Drag, drop, and edit ideas instantly. Scroll to explore more space."
      )
    ).toBeInTheDocument();
  });
  test("renders content input with current value", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content="My sticky note"/>
    );
    const input = screen.getByPlaceholderText("Jot something down...");
    expect(input).toHaveValue("My sticky note");
  });
  test("calls setContent when typing in the input", () => {
    render(<StickyHeader {...defaultProps} />);
    const input = screen.getByPlaceholderText("Jot something down...");
    fireEvent.change(input, {
      target: { value: "New idea" },
    });
    expect(defaultProps.setContent).toHaveBeenCalledWith("New idea");
  });
  test("renders all sticky color buttons", () => {
    render(<StickyHeader {...defaultProps} />);
    const colorButtons = screen
      .getAllByRole("button")
      .filter((button) => button.type === "button");
    expect(colorButtons).toHaveLength(defaultProps.stickyColors.length);
  });
  test("calls setColor when a color is selected", () => {
    render(<StickyHeader {...defaultProps} />);
    const colorButtons = screen
      .getAllByRole("button")
      .filter((button) => button.type === "button");
    fireEvent.click(colorButtons[1]);
    expect(defaultProps.setColor).toHaveBeenCalledWith("#fecaca");
  });
  test("disables Pin button when content is empty", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content=""/>
    );
    const pinButton = screen.getByRole("button", { name: "Pin" });
    expect(pinButton).toBeDisabled();
  });
  test("disables Pin button when content contains only whitespace", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content="   "/>
    );
    const pinButton = screen.getByRole("button", { name: "Pin" });
    expect(pinButton).toBeDisabled();
  });
  test("disables Pin button while creating", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content="My note"
        isCreating={true}/>
    );
    const pinButton = screen.getByRole("button", { name: "Pin" });
    expect(pinButton).toBeDisabled();
  });
  test("enables Pin button when content is valid and not creating", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content="My note"
        isCreating={false}/>
    );
    const pinButton = screen.getByRole("button", { name: "Pin" });
    expect(pinButton).toBeEnabled();
  });
  test("calls onCreate when the form is submitted", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content="My note"
      />
    );
    const form = screen.getByRole("button", { name: "Pin" }).closest("form");
    fireEvent.submit(form);
    expect(defaultProps.onCreate).toHaveBeenCalled();
  });
  test("does not submit through the button when content is empty", () => {
    render(
      <StickyHeader
        {...defaultProps}
        content=""
      />
    );
    const pinButton = screen.getByRole("button", { name: "Pin" });
    expect(pinButton).toBeDisabled();
  });
  test("applies the selected color to the active color button", () => {
    render(
      <StickyHeader
        {...defaultProps}
        color="#fecaca"/>
    );
    const colorButtons = screen
      .getAllByRole("button")
      .filter((button) => button.type === "button");
    expect(colorButtons[1].className).toContain("scale-125");
  });
});
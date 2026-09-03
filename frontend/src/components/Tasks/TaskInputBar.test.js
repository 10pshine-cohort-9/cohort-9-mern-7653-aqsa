import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskInputBar from "./TaskInputBar";
describe("TaskInputBar", () => {
  const defaultProps = {
    quickTitle: "",
    quickDescription: "",
    quickDueDate: "",
    quickPriority: "Medium",
    quickNote: "",
    showQuickNote: false,
    isQuickSubmitting: false,
    notes: [],
    maxTitleLength: 100,
    maxDescLength: 500,
    todayStr: "2026-08-29",
    tomorrowStr: "2026-08-30",
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    onDueDateChange: jest.fn(),
    onPriorityChange: jest.fn(),
    onNoteChange: jest.fn(),
    onToggleNote: jest.fn(),
    onPresetPill: jest.fn(),
    onSubmit: jest.fn((e) => e.preventDefault()),
  };
  const renderComponent = (props = {}) => {
    return render(<TaskInputBar {...defaultProps} {...props} />);
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("renders task input and Add button", () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText(/add a task/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add" })
    ).toBeInTheDocument();
  });
  test("calls onTitleChange when title is entered", async () => {
    const user = userEvent.setup();
    const onTitleChange = jest.fn();
    renderComponent({ onTitleChange });
    const input = screen.getByPlaceholderText(/add a task/i);
    await user.type(input, "Learn Jest");
    expect(onTitleChange).toHaveBeenCalled();
  });
  test("disables Add button when title is empty", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Add" })
    ).toBeDisabled();
  });
  test("enables Add button when title is provided", () => {
    renderComponent({
      quickTitle: "Learn Jest",
    });
    expect(
      screen.getByRole("button", { name: "Add" })
    ).toBeEnabled();
  });
  test("calls onSubmit when form is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e) => e.preventDefault());
    renderComponent({
      quickTitle: "Learn Jest",
      onSubmit,
    });
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).toHaveBeenCalled();
  });
  test("calls onToggleNote when details button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleNote = jest.fn();
    renderComponent({ onToggleNote });
    await user.click(
      screen.getByTitle("Add extra details")
    );
    expect(onToggleNote).toHaveBeenCalledTimes(1);
  });
  test("shows description and note fields when details are enabled", () => {
    renderComponent({
      showQuickNote: true,
    });
    expect(
      screen.getByPlaceholderText(/add details/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Associated Note:")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox")
    ).toBeInTheDocument();
  });
  test("renders available notes", () => {
    renderComponent({
      showQuickNote: true,
      notes: [
        {
          _id: "note-1",
          title: "My First Note",
        },
        {
          _id: "note-2",
          title: "Project Notes",
        },
      ],
    });
    expect(
      screen.getByRole("option", { name: "My First Note" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Project Notes" })
    ).toBeInTheDocument();
  });
  test("calls onNoteChange when a note is selected", async () => {
    const user = userEvent.setup();
    const onNoteChange = jest.fn();
    renderComponent({
      showQuickNote: true,
      onNoteChange,
      notes: [
        {
          _id: "note-1",
          title: "My First Note",
        },
      ],
    });
    await user.selectOptions(
      screen.getByRole("combobox"),
      "note-1"
    );
    expect(onNoteChange).toHaveBeenCalledWith("note-1");
  });
  test("calls onPresetPill when Today is clicked", async () => {
    const user = userEvent.setup();
    const onPresetPill = jest.fn();
    renderComponent({ onPresetPill });
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(onPresetPill).toHaveBeenCalledWith("today");
  });
  test("calls onPresetPill when Tomorrow is clicked", async () => {
    const user = userEvent.setup();
    const onPresetPill = jest.fn();
    renderComponent({ onPresetPill });
    await user.click(
      screen.getByRole("button", { name: "Tomorrow" })
    );
    expect(onPresetPill).toHaveBeenCalledWith("tomorrow");
  });
  test("calls onPresetPill when Next Week is clicked", async () => {
    const user = userEvent.setup();
    const onPresetPill = jest.fn();
    renderComponent({ onPresetPill });
    await user.click(
      screen.getByRole("button", { name: "Next Week" })
    );
    expect(onPresetPill).toHaveBeenCalledWith("next-week");
  });
  test("calls onPriorityChange when priority is selected", async () => {
    const user = userEvent.setup();
    const onPriorityChange = jest.fn();
    renderComponent({ onPriorityChange });
    await user.click(
      screen.getByRole("button", { name: "High" })
    );
    expect(onPriorityChange).toHaveBeenCalledWith("High");
  });
  test("shows submitting state", () => {
    renderComponent({
      quickTitle: "Learn Jest",
      isQuickSubmitting: true,
    });
    expect(
      screen.getByRole("button", { name: "..." })
    ).toBeDisabled();
  });
  test("shows selected priority", () => {
    renderComponent({
      quickPriority: "High",
    });
    expect(
      screen.getByRole("button", { name: "High" })
    ).toHaveClass("bg-[#1c1c17]");
  });
});
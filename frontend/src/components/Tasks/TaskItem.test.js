import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TaskItem from "./TaskItem";
describe("TaskItem", () => {
  const task = {
    _id: "task-1",
    title: "Complete Jest testing",
    completed: false,
    description: "Write frontend tests",
    dueDate: "2026-08-29",
    priority: "High",
  };
  const renderTask = (props = {}) => {
    return render(
      <MemoryRouter>
        <TaskItem
          task={task}
          onToggle={jest.fn()}
          onDelete={jest.fn()}
          {...props}
        />
      </MemoryRouter>
    );
  };
  test("renders task title", () => {
    renderTask();
    expect(
      screen.getByText("Complete Jest testing")
    ).toBeInTheDocument();
  });
  test("calls onToggle when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    renderTask({ onToggle });
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onToggle).toHaveBeenCalledWith("task-1");
  });
  test("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    renderTask({ onDelete });
    const deleteButton = screen.getByTitle("Delete task");
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });
  test("renders description and priority", () => {
    renderTask();
    expect(
      screen.getByText("Write frontend tests")
    ).toBeInTheDocument();
    expect(
      screen.getByText("High")
    ).toBeInTheDocument();
  });
  test("renders note when task has a note", () => {
    renderTask({
      task: {
        ...task,
        note: {
          _id: "note-1",
          title: "My Note",
        },
      },
    });
    expect(
      screen.getByText("My Note")
    ).toBeInTheDocument();
  });
});
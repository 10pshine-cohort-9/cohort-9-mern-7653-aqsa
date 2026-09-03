import { render, screen, fireEvent } from "@testing-library/react";
import TaskListSection from "./TaskListSection";
jest.mock("./TaskItem", () => ({
  __esModule: true,
  default: ({ task, onToggle, onDelete }) => (
    <div data-testid={`task-item-${task._id}`}>
      <span>{task.title}</span>
      <button onClick={() => onToggle(task)}>Toggle</button>
      <button onClick={() => onDelete(task)}>Delete</button>
    </div>
  ),
}));
describe("TaskListSection", () => {
  const defaultProps = {
    icon: "task_alt",
    title: "Today's Tasks",
    iconClass: "text-blue-500",
    tasks: [],
    emptyText: "No tasks for today.",
    onToggle: jest.fn(),
    onDelete: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("renders section title and icon", () => {
    render(<TaskListSection {...defaultProps} />);
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText("task_alt")).toBeInTheDocument();
  });
  test("renders empty text when there are no tasks", () => {
    render(<TaskListSection {...defaultProps} />);
    expect(screen.getByText("No tasks for today.")).toBeInTheDocument();
  });
  test("does not render task items when tasks array is empty", () => {
    render(<TaskListSection {...defaultProps} />);
    expect(screen.queryByTestId(/task-item-/)).not.toBeInTheDocument();
  });
  test("renders all tasks", () => {
    const tasks = [
      {
        _id: "1",
        title: "Complete internship work",
      },
      {
        _id: "2",
        title: "Review pull request",
      },
      {
        _id: "3",
        title: "Update documentation",
      },
    ];
    render(
      <TaskListSection
        {...defaultProps}
        tasks={tasks}
      />
    );
    expect(screen.getByText("Complete internship work")).toBeInTheDocument();
    expect(screen.getByText("Review pull request")).toBeInTheDocument();
    expect(screen.getByText("Update documentation")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-2")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-3")).toBeInTheDocument();
  });
  test("does not render empty text when tasks exist", () => {
    const tasks = [
      {
        _id: "1",
        title: "Complete internship work",
      },
    ];
    render(
      <TaskListSection
        {...defaultProps}
        tasks={tasks}
      />
    );
    expect(
      screen.queryByText("No tasks for today.")
    ).not.toBeInTheDocument();
  });
  test("passes onToggle to TaskItem", () => {
    const onToggle = jest.fn();
    const tasks = [
      {
        _id: "1",
        title: "Complete internship work",
      },
    ];
    render(
      <TaskListSection
        {...defaultProps}
        tasks={tasks}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(tasks[0]);
  });
  test("passes onDelete to TaskItem", () => {
    const onDelete = jest.fn();
    const tasks = [
      {
        _id: "1",
        title: "Complete internship work",
      },
    ];
    render(
      <TaskListSection
        {...defaultProps}
        tasks={tasks}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(tasks[0]);
  });
  test("renders tasks with their unique keys", () => {
    const tasks = [
      {
        _id: "task-101",
        title: "First task",
      },
      {
        _id: "task-202",
        title: "Second task",
      },
    ];
    render(
      <TaskListSection
        {...defaultProps}
        tasks={tasks}
      />
    );
    expect(screen.getByTestId("task-item-task-101")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-task-202")).toBeInTheDocument();
  });
});
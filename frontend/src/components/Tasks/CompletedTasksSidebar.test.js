import { render, screen, fireEvent } from "@testing-library/react";
import CompletedTasksSidebar from "./CompletedTasksSidebar";
describe("CompletedTasksSidebar", () => {
  const mockTasks = [
    {
      _id: "task-1",
      title: "First completed task",
    },
    {
      _id: "task-2",
      title: "Second completed task",
    },
  ];
  test("renders Completed heading", () => {
    render(
      <CompletedTasksSidebar
        completedTasks={[]}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
  test("shows empty message when there are no completed tasks", () => {
    render(
      <CompletedTasksSidebar
        completedTasks={[]}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(
      screen.getByText("No completed tasks yet.")
    ).toBeInTheDocument();
  });
  test("renders completed task titles", () => {
    render(
      <CompletedTasksSidebar
        completedTasks={mockTasks}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("First completed task")).toBeInTheDocument();
    expect(screen.getByText("Second completed task")).toBeInTheDocument();
  });
  test("renders mark incomplete buttons for completed tasks", () => {
    render(
      <CompletedTasksSidebar
        completedTasks={mockTasks}
        onToggle={jest.fn()}
        onDelete={jest.fn()}/>
    );
    const toggleButtons = screen.getAllByRole("button", {
      name: "Mark incomplete",
    });
    expect(toggleButtons).toHaveLength(2);
  });
  test("renders delete buttons for completed tasks", () => {
    render(
      <CompletedTasksSidebar
        completedTasks={mockTasks}
        onToggle={jest.fn()}
        onDelete={jest.fn()}/>
    );
    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete task",
    });
    expect(deleteButtons).toHaveLength(2);
  });
  test("calls onToggle with task id when mark incomplete button is clicked", () => {
    const onToggle = jest.fn();
    render(
      <CompletedTasksSidebar
        completedTasks={[mockTasks[0]]}
        onToggle={onToggle}
        onDelete={jest.fn()}/>
    );
    const toggleButton = screen.getByRole("button", {
      name: "Mark incomplete",
    });
    fireEvent.click(toggleButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("task-1");
  });
  test("calls onDelete with task id when delete button is clicked", () => {
    const onDelete = jest.fn();
    render(
      <CompletedTasksSidebar
        completedTasks={[mockTasks[0]]}
        onToggle={jest.fn()}
        onDelete={onDelete}/>
    );
    const deleteButton = screen.getByRole("button", {
      name: "Delete task",
    });
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });
  test("calls correct callbacks for multiple tasks", () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();
    render(
      <CompletedTasksSidebar
        completedTasks={mockTasks}
        onToggle={onToggle}
        onDelete={onDelete}/>
    );
    const toggleButtons = screen.getAllByRole("button", {
      name: "Mark incomplete",
    });
    fireEvent.click(toggleButtons[0]);
    fireEvent.click(toggleButtons[1]);
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenNthCalledWith(1, "task-1");
    expect(onToggle).toHaveBeenNthCalledWith(2, "task-2");
    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete task",
    });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onDelete).toHaveBeenNthCalledWith(1, "task-1");
    expect(onDelete).toHaveBeenNthCalledWith(2, "task-2");
  });
});

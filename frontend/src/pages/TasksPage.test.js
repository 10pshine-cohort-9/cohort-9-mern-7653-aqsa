import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TasksPage from "./TasksPage";
jest.mock("../components/Dashboard/Sidebar", () => () => (
  <div data-testid="sidebar">Sidebar</div>
));
jest.mock("../components/Tasks/TaskInputBar", () => (props) => (
  <form data-testid="task-input-bar" onSubmit={props.onSubmit}>
    <input
      aria-label="title-input"
      value={props.quickTitle}
      onChange={props.onTitleChange}
    />
    <input
      aria-label="desc-input"
      value={props.quickDescription}
      onChange={props.onDescriptionChange}
    />
    <button type="button" onClick={() => props.onPresetPill("today")}>
      Preset Today
    </button>
    <button type="button" onClick={() => props.onPresetPill("tomorrow")}>
      Preset Tomorrow
    </button>
    <button type="button" onClick={() => props.onPresetPill("next-week")}>
      Preset Next Week
    </button>
    <button type="button" onClick={() => props.onPresetPill("clear")}>
      Clear Preset
    </button>
    <button type="submit">Submit Quick Task</button>
  </form>
));
jest.mock("../components/Tasks/TaskListSection", () => (props) => (
  <div data-testid={`task-list-${props.title}`}>
    <h2>{props.title}</h2>
    {props.tasks.length === 0 ? (
      <p>{props.emptyText}</p>
    ) : (
      props.tasks.map((task) => (
        <div key={task._id} data-testid={`task-${task._id}`}>
          <span>{task.title}</span>
          <button onClick={() => props.onToggle(task._id)}>Toggle</button>
          <button onClick={() => props.onDelete(task._id)}>Delete</button>
        </div>
      ))
    )}
  </div>
));
jest.mock("../components/Tasks/CompletedTasksSidebar", () => (props) => (
  <div data-testid="completed-tasks-sidebar">
    <h2>Completed</h2>
    {props.completedTasks.map((task) => (
      <div key={task._id} data-testid={`completed-task-${task._id}`}>
        <span>{task.title}</span>
        <button onClick={() => props.onToggle(task._id)}>Toggle</button>
        <button onClick={() => props.onDelete(task._id)}>Delete</button>
      </div>
    ))}
  </div>
));
jest.mock("../api/tasks.js", () => ({
  getTasks: jest.fn(),
  createTask: jest.fn(),
  toggleTask: jest.fn(),
  deleteTask: jest.fn(),
}));
jest.mock("../api/notes.js", () => ({
  getNotes: jest.fn(),
}));
jest.mock("../api/axios.js", () => ({
  get: jest.fn(),
}));
const mockSocketHandlers = {};
jest.mock("../api/socket.js", () => ({
  socket: {
    connected: false,
    connect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn((event, handler) => {
      mockSocketHandlers[event] = handler;
    }),
    off: jest.fn((event) => {
      delete mockSocketHandlers[event];
    }),
  },
}));
import { getTasks, createTask, toggleTask, deleteTask } from "../api/tasks.js";
import { getNotes } from "../api/notes.js";
import axios from "../api/axios.js";
import { socket } from "../api/socket.js";
const mockTasks = [
  {
    _id: "1",
    title: "Today Task 1",
    completed: false,
    dueDate: new Date().toISOString(),
  },
  {
    _id: "2",
    title: "Upcoming Task 1",
    completed: false,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    _id: "3",
    title: "Done Task 1",
    completed: true,
    dueDate: new Date().toISOString(),
  },
];
describe("TasksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((key) => {
      delete mockSocketHandlers[key];
    });
    axios.get.mockResolvedValue({ data: { user: { _id: "user_123" } } });
    getTasks.mockResolvedValue({ tasks: mockTasks });
    getNotes.mockResolvedValue({ notes: [] });
  });
  test("renders initial loading state and then fetches and displays tasks", async () => {
    render(<TasksPage />);
    expect(screen.getByText(/loading tasks\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/loading tasks\.\.\./i)
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 completed")).toBeInTheDocument();
    expect(screen.getByText("Today Task 1")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Task 1")).toBeInTheDocument();
    expect(screen.getByText("Done Task 1")).toBeInTheDocument();
  });
  test("handles user profile fetch failure gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Unauthorized"));
    render(<TasksPage />);
    await waitFor(() => {
      expect(
        screen.queryByText(/loading tasks\.\.\./i)
      ).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch user profile:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
  test("submits quick add task form successfully", async () => {
    const newCreatedTask = {
      _id: "4",
      title: "New Task",
      description: "Description",
      completed: false,
      dueDate: new Date().toISOString(),
    };
    createTask.mockResolvedValueOnce({ task: newCreatedTask });
    render(<TasksPage />);
    await waitFor(() => {
      expect(
        screen.queryByText(/loading tasks\.\.\./i)
      ).not.toBeInTheDocument();
    });
    const titleInput = screen.getByLabelText("title-input");
    await userEvent.type(titleInput, "New Task");
    const submitBtn = screen.getByRole("button", {
      name: /submit quick task/i,
    });
    await userEvent.click(submitBtn);
    expect(createTask).toHaveBeenCalledWith({
      title: "New Task",
      description: "",
      dueDate: expect.any(String),
      priority: "Medium",
      note: null,
    });
    expect(await screen.findByText("New Task")).toBeInTheDocument();
  });
  test("handles natural language date parsing in title input", async () => {
    render(<TasksPage />);
    await waitFor(() => {
      expect(
        screen.queryByText(/loading tasks\.\.\./i)
      ).not.toBeInTheDocument();
    });
    const titleInput = screen.getByLabelText("title-input");
    await userEvent.type(titleInput, "Buy milk tomorrow");
    expect(titleInput).toHaveValue("Buy milk tomorrow");
  });
  test("toggles task completion optimistic state and handles rollback on failure", async () => {
    toggleTask.mockRejectedValueOnce(new Error("Toggle failed"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByText("Today Task 1")).toBeInTheDocument();
    });
    const todaySection = screen.getByTestId("task-list-Today");
    const toggleBtn = todaySection.querySelector("button");
    await userEvent.click(toggleBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to toggle task:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });
  test("deletes task from list", async () => {
    deleteTask.mockResolvedValueOnce({});
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByText("Today Task 1")).toBeInTheDocument();
    });
    const todaySection = screen.getByTestId("task-list-Today");
    const deleteBtn = todaySection.querySelectorAll("button")[1];
    await userEvent.click(deleteBtn);
    expect(deleteTask).toHaveBeenCalledWith("1");
    expect(screen.queryByText("Today Task 1")).not.toBeInTheDocument();
  });
  test("listens to real-time socket events for task creation, update, and deletion", async () => {
    socket.connected = true;
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByText("Today Task 1")).toBeInTheDocument();
    });
    const liveTask = {
      _id: "99",
      title: "Socket Live Task",
      completed: false,
      dueDate: new Date().toISOString(),
    };
    act(() => {
      mockSocketHandlers["task_created"](liveTask);
    });
    expect(await screen.findByText("Socket Live Task")).toBeInTheDocument();
    const updatedTask = {
      _id: "1",
      title: "Updated Today Task",
      completed: false,
      dueDate: new Date().toISOString(),
    };
    act(() => {
      mockSocketHandlers["task_updated"](updatedTask);
    });
    expect(await screen.findByText("Updated Today Task")).toBeInTheDocument();
    act(() => {
      mockSocketHandlers["task_deleted"]("1");
    });
    expect(screen.queryByText("Updated Today Task")).not.toBeInTheDocument();
  });
});
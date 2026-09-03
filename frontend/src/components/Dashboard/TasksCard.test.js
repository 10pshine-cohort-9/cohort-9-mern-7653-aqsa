import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TasksCard from "./TasksCard";
import { getTasks, toggleTask } from "../../api/tasks";
import api from "../../api/axios";
import { socket } from "../../api/socket";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
jest.mock("../../api/tasks", () => ({
  getTasks: jest.fn(),
  toggleTask: jest.fn(),
}));
jest.mock("../../api/axios", () => ({
  get: jest.fn(),
}));
jest.mock("../../api/socket", () => ({
  socket: {
    connected: false,
    connect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));
describe("TasksCard", () => {
  const tasks = [
    {
      _id: "1",
      title: "Finish project",
      description: "Complete the dashboard",
      completed: false,
      priority: "high",
    },
    {
      _id: "2",
      title: "Read documentation",
      description: "Review API docs",
      completed: false,
      priority: "medium",
    },
    {
      _id: "3",
      title: "Buy groceries",
      description: "",
      completed: false,
      priority: "low",
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    getTasks.mockResolvedValue({
      tasks,
    });
    toggleTask.mockResolvedValue({});
    api.get.mockResolvedValue({
      data: {
        user: {
          _id: "user-123",
        },
      },
    });
    socket.connected = false;
  });
  test("shows loading state initially", () => {
    getTasks.mockReturnValue(new Promise(() => {}));
    render(<TasksCard />);
    expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
  });
  test("loads unfinished tasks", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
      expect(screen.getByText("Read documentation")).toBeInTheDocument();
      expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    });
    expect(getTasks).toHaveBeenCalledWith({
      completed: "false",
    });
  });
  test("filters out completed tasks", async () => {
    getTasks.mockResolvedValue({
      tasks: [
        ...tasks,
        {
          _id: "4",
          title: "Completed task",
          description: "Already finished",
          completed: true,
          priority: "high",
        },
      ],
    });
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
    expect(screen.queryByText("Completed task")).not.toBeInTheDocument();
  });
  test("supports API response containing an array directly", async () => {
    getTasks.mockResolvedValue(tasks);
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
  });
  test("shows task descriptions when provided", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(
        screen.getByText("Complete the dashboard")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Review API docs")
      ).toBeInTheDocument();
    });
  });
  test("does not render a description when task has no description", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("description")
    ).not.toBeInTheDocument();
  });
  test("renders priority badges", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
      expect(screen.getByText("low")).toBeInTheDocument();
    });
  });
  test("shows correct task count", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(
        screen.getByText("Unfinished Tasks (3)")
      ).toBeInTheDocument();
    });
  });
  test("shows empty state when there are no unfinished tasks", async () => {
    getTasks.mockResolvedValue({
      tasks: [],
    });
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(screen.getByText("No pending tasks.")).toBeInTheDocument();
    });
    expect(screen.getByText("Unfinished Tasks (0)")).toBeInTheDocument();
  });
  test("navigates to tasks page when View All is clicked", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "View All" }));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks");
  });
  test("removes task from UI when task is toggled", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Finish project"));
    await waitFor(() => {
      expect(
        screen.queryByText("Finish project")
      ).not.toBeInTheDocument();
    });
    expect(toggleTask).toHaveBeenCalledWith("1");
  });
  test("removes the correct task when toggled", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Read documentation")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Read documentation"));
    await waitFor(() => {
      expect(
        screen.queryByText("Read documentation")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Finish project")).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(toggleTask).toHaveBeenCalledWith("2");
  });
  test("restores task when toggleTask fails", async () => {
    toggleTask.mockRejectedValueOnce(new Error("Toggle failed"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Finish project"));
    expect(
      screen.queryByText("Finish project")
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Finish project")).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to toggle task:",
      expect.any(Error)
    );
    consoleError.mockRestore();
  });
  test("handles task loading failure", async () => {
    getTasks.mockRejectedValueOnce(new Error("Network error"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load dashboard tasks:",
      expect.any(Error)
    );
    consoleError.mockRestore();
  });
  test("requests the authenticated user profile", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/profile");
    });
  });
  test("connects socket and joins the user room", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(socket.connect).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith("join", "user-123");
    });
  });
  test("does not connect socket if already connected", async () => {
    socket.connected = true;
    render(<TasksCard />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/profile");
    });
    expect(socket.connect).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("join", "user-123");
  });
  test("registers socket listeners", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith(
        "task_created",
        expect.any(Function)
      );
      expect(socket.on).toHaveBeenCalledWith(
        "task_updated",
        expect.any(Function)
      );
      expect(socket.on).toHaveBeenCalledWith(
        "task_deleted",
        expect.any(Function)
      );
    });
  });
  test("removes socket listeners on unmount", async () => {
    const { unmount } = render(<TasksCard />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalled();
    });
    const createdHandler = socket.on.mock.calls.find(
      ([event]) => event === "task_created"
    )[1];
    const updatedHandler = socket.on.mock.calls.find(
      ([event]) => event === "task_updated"
    )[1];
    const deletedHandler = socket.on.mock.calls.find(
      ([event]) => event === "task_deleted"
    )[1];
    unmount();
    expect(socket.off).toHaveBeenCalledWith(
      "task_created",
      createdHandler
    );
    expect(socket.off).toHaveBeenCalledWith(
      "task_updated",
      updatedHandler
    );
    expect(socket.off).toHaveBeenCalledWith(
      "task_deleted",
      deletedHandler
    );
  });
  test("reloads tasks when task_created socket event fires", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith(
        "task_created",
        expect.any(Function)
      );
    });
    const createdHandler = socket.on.mock.calls.find(
      ([event]) => event === "task_created"
    )[1];
    getTasks.mockResolvedValueOnce({
      tasks: [
        {
          _id: "5",
          title: "New task",
          completed: false,
          priority: "high",
        },
      ],
    });
    await act(async () => {
      await createdHandler();
    });
    await waitFor(() => {
      expect(screen.getByText("New task")).toBeInTheDocument();
    });
  });
  test("uses default priority styling for unknown priority", async () => {
    getTasks.mockResolvedValue({
      tasks: [
        {
          _id: "10",
          title: "No priority task",
          completed: false,
          priority: "unknown",
        },
      ],
    });
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("unknown")).toBeInTheDocument();
    });
    expect(screen.getByText("unknown")).toHaveClass(
      "bg-[#ece8e0]"
    );
  });
  test("uses high priority styling", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("high")).toHaveClass(
        "bg-[#ffdad6]",
        "text-[#93000a]"
      );
    });
  });
  test("uses medium priority styling", async () => {
    render(<TasksCard />);
    await waitFor(() => {
      expect(screen.getByText("medium")).toHaveClass(
        "bg-[#e2e7ff]",
        "text-[#0040df]"
      );
    });
  });
});
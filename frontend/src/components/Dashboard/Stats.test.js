import { render, screen, waitFor } from "@testing-library/react";
import Stats from "./Stats";
import { getTasks } from "../../api/tasks";
import { getNotes } from "../../api/notes";
import { socket } from "../../api/socket";
import api from "../../api/axios";
jest.mock("../../api/tasks", () => ({
  getTasks: jest.fn(),
}));
jest.mock("../../api/notes", () => ({
  getNotes: jest.fn(),
}));
jest.mock("../../api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
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
const getStatValue = (label) => {
  const labelElement = screen.getByText(label);

  return labelElement.previousElementSibling;
};
describe("Stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socket.connected = false;
    api.get.mockResolvedValue({
      data: {
        user: {
          _id: "user-123",
        },
      },
    });
    getTasks.mockResolvedValue({
      tasks: [],
    });
    getNotes.mockResolvedValue({
      notes: [],
    });
  });
  test("renders all three stat labels", () => {
    render(<Stats />);
    expect(screen.getByText("Tasks Today")).toBeInTheDocument();
    expect(screen.getByText("Notes this week")).toBeInTheDocument();
    expect(screen.getByText("Unfinished items")).toBeInTheDocument();
  });
  test("shows zero counts when there are no tasks or notes", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Tasks Today")).toHaveTextContent("0");
      expect(getStatValue("Notes this week")).toHaveTextContent("0");
      expect(getStatValue("Unfinished items")).toHaveTextContent("0");
    });
  });
  test("calculates unfinished tasks correctly", async () => {
    getTasks.mockResolvedValue({
      tasks: [
        {
          _id: "task-1",
          completed: false,
        },
        {
          _id: "task-2",
          completed: true,
        },
        {
          _id: "task-3",
          completed: "false",
        },
        {
          _id: "task-4",
          completed: "true",
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Unfinished items")).toHaveTextContent("2");
    });
  });
  test("counts unfinished tasks due today", async () => {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0
    ).toISOString();
    getTasks.mockResolvedValue({
      tasks: [
        {
          _id: "task-1",
          completed: false,
          dueDate: todayDate,
        },
        {
          _id: "task-2",
          completed: false,
          dueDate: todayDate,
        },
        {
          _id: "task-3",
          completed: true,
          dueDate: todayDate,
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Tasks Today")).toHaveTextContent("2");
      expect(getStatValue("Unfinished items")).toHaveTextContent("2");
    });
  });
  test("does not count completed tasks as tasks today", async () => {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0
    ).toISOString();
    getTasks.mockResolvedValue({
      tasks: [
        {
          _id: "task-1",
          completed: true,
          dueDate: todayDate,
        },
        {
          _id: "task-2",
          completed: "true",
          dueDate: todayDate,
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Tasks Today")).toHaveTextContent("0");
      expect(getStatValue("Unfinished items")).toHaveTextContent("0");
    });
  });
  test("does not count tasks without a due date", async () => {
    getTasks.mockResolvedValue({
      tasks: [
        {
          _id: "task-1",
          completed: false,
        },
        {
          _id: "task-2",
          completed: false,
          dueDate: null,
        },
        {
          _id: "task-3",
          completed: false,
          dueDate: undefined,
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Tasks Today")).toHaveTextContent("0");
      expect(getStatValue("Unfinished items")).toHaveTextContent("3");
    });
  });
  test("counts notes created within the last seven days", async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2);
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    getNotes.mockResolvedValue({
      notes: [
        {
          _id: "note-1",
          createdAt: recentDate.toISOString(),
        },
        {
          _id: "note-2",
          createdAt: recentDate.toISOString(),
        },
        {
          _id: "note-3",
          createdAt: oldDate.toISOString(),
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Notes this week")).toHaveTextContent("2");
    });
  });
  test("does not count notes older than seven days", async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    getNotes.mockResolvedValue({
      notes: [
        {
          _id: "note-1",
          createdAt: oldDate.toISOString(),
        },
      ],
    });
    render(<Stats />);
    await waitFor(() => {
      expect(getStatValue("Notes this week")).toHaveTextContent("0");
    });
  });
  test("calls getTasks when component loads", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(getTasks).toHaveBeenCalledWith({});
    });
  });
  test("calls getNotes when component loads", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(getNotes).toHaveBeenCalled();
    });
  });
  test("calls both APIs when component loads", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(getTasks).toHaveBeenCalledWith({});
      expect(getNotes).toHaveBeenCalled();
    });
  });
  test("fetches the current user profile", async () => {
    render(<Stats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/profile");
    });
  });
  test("connects socket when user profile is loaded", async () => {
    render(<Stats />);

    await waitFor(() => {
      expect(socket.connect).toHaveBeenCalled();
    });
  });
  test("joins the user's socket room", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith("join", "user-123");
    });
  });
  test("registers task_created socket listener", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith(
        "task_created",
        expect.any(Function)
      );
    });
  });
  test("registers task_updated socket listener", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith(
        "task_updated",
        expect.any(Function)
      );
    });
  });
  test("registers task_deleted socket listener", async () => {
    render(<Stats />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalledWith(
        "task_deleted",
        expect.any(Function)
      );
    });
  });
  test("removes socket listeners when component unmounts", async () => {
    const { unmount } = render(<Stats />);
    await waitFor(() => {
      expect(socket.on).toHaveBeenCalled();
    });
    unmount();
    expect(socket.off).toHaveBeenCalledWith(
      "task_created",
      expect.any(Function)
    );
    expect(socket.off).toHaveBeenCalledWith(
      "task_updated",
      expect.any(Function)
    );
    expect(socket.off).toHaveBeenCalledWith(
      "task_deleted",
      expect.any(Function)
    );
  });
  test("does not connect socket when socket is already connected", async () => {
    socket.connected = true;
    render(<Stats />);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/profile");
    });
    expect(socket.connect).not.toHaveBeenCalled();
  });
  test("handles API errors without crashing", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getTasks.mockRejectedValue(
      new Error("Failed to fetch tasks")
    );
    render(<Stats />);
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load dashboard stats:",
        expect.any(Error)
      );
    });
    consoleError.mockRestore();
  });
});

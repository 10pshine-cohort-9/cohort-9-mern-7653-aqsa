import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StickyWallPage from "./StickyWallPage";
jest.mock("../components/Dashboard/Sidebar", () => () => (
  <div data-testid="sidebar">Sidebar</div>
));
jest.mock("../components/Sticky/StickyHeader", () => (props) => (
  <form data-testid="sticky-header" onSubmit={props.onCreate}>
    <input
      aria-label="content-input"
      value={props.content}
      onChange={(e) => props.setContent(e.target.value)}
    />
    <button
      type="button"
      data-testid="color-btn"
      onClick={() => props.setColor("#bbf7d0")}
    >
      Set Green
    </button>
    <button type="submit" disabled={props.isCreating}>
      Pin Note
    </button>
  </form>
));
jest.mock("../components/Sticky/DraggableSticky", () => (props) => (
  <div data-testid={`sticky-${props.sticky._id}`}>
    <span>{props.sticky.content}</span>
    <button
      onClick={() =>
        props.onUpdate(props.sticky._id, { content: "Updated Content" })
      }
    >
      Update
    </button>
    <button onClick={() => props.onDelete(props.sticky._id)}>Delete</button>
  </div>
));
jest.mock("../api/sticky.js", () => ({
  getStickies: jest.fn(),
  createSticky: jest.fn(),
  updateSticky: jest.fn(),
  deleteSticky: jest.fn(),
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
import {
  getStickies,
  createSticky,
  updateSticky,
  deleteSticky,
} from "../api/sticky.js";
import axios from "../api/axios.js";
import { socket } from "../api/socket.js";
const mockStickies = [
  {
    _id: "s1",
    title: "",
    content: "First sticky",
    color: "#fef08a",
    position: { x: 50, y: 50 },
  },
  {
    _id: "s2",
    title: "",
    content: "Second sticky",
    color: "#bbf7d0",
    position: { x: 75, y: 75 },
  },
];
describe("StickyWallPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((key) => {
      delete mockSocketHandlers[key];
    });
    axios.get.mockResolvedValue({ data: { user: { _id: "user_456" } } });
    getStickies.mockResolvedValue({ stickies: mockStickies });
  });
  test("renders initial loading state and then fetches and displays stickies", async () => {
    render(<StickyWallPage />);
    expect(screen.getByText(/loading wall\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/loading wall\.\.\./i)
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("First sticky")).toBeInTheDocument();
    expect(screen.getByText("Second sticky")).toBeInTheDocument();
  });
  test("displays empty state when no stickies are returned", async () => {
    getStickies.mockResolvedValueOnce({ stickies: [] });
    render(<StickyWallPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Your wall is empty. Pin a note above.")
      ).toBeInTheDocument();
    });
  });
  test("handles profile fetch failure gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Unauthorized"));
    render(<StickyWallPage />);
    await waitFor(() => {
      expect(
        screen.queryByText(/loading wall\.\.\./i)
      ).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to fetch profile for socket room:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
  test("creates a new sticky successfully", async () => {
    const newSticky = {
      _id: "s3",
      title: "",
      content: "New test sticky",
      color: "#bbf7d0",
      position: { x: 100, y: 100 },
    };
    createSticky.mockResolvedValueOnce({ sticky: newSticky });
    render(<StickyWallPage />);
    await waitFor(() => {
      expect(
        screen.queryByText(/loading wall\.\.\./i)
      ).not.toBeInTheDocument();
    });
    const contentInput = screen.getByLabelText("content-input");
    await userEvent.type(contentInput, "New test sticky");
    const colorBtn = screen.getByTestId("color-btn");
    await userEvent.click(colorBtn);
    const submitBtn = screen.getByRole("button", { name: /pin note/i });
    await userEvent.click(submitBtn);
    expect(createSticky).toHaveBeenCalledWith({
      title: "",
      content: "New test sticky",
      color: "#bbf7d0",
      position: { x: 100, y: 100 },
    });
    expect(await screen.findByText("New test sticky")).toBeInTheDocument();
  });
  test("updates a sticky optimistically and reloads on API failure", async () => {
    updateSticky.mockRejectedValueOnce(new Error("Update failed"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<StickyWallPage />);
    await waitFor(() => {
      expect(screen.getByText("First sticky")).toBeInTheDocument();
    });
    const stickyItem = screen.getByTestId("sticky-s1");
    const updateBtn = stickyItem.querySelectorAll("button")[0];
    await userEvent.click(updateBtn);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update sticky:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });
  test("deletes a sticky from the wall", async () => {
    deleteSticky.mockResolvedValueOnce({});
    render(<StickyWallPage />);
    await waitFor(() => {
      expect(screen.getByText("First sticky")).toBeInTheDocument();
    });
    const stickyItem = screen.getByTestId("sticky-s1");
    const deleteBtn = stickyItem.querySelectorAll("button")[1];
    await userEvent.click(deleteBtn);
    expect(deleteSticky).toHaveBeenCalledWith("s1");
    expect(screen.queryByText("First sticky")).not.toBeInTheDocument();
  });
  test("handles real-time socket events for creation, update, and deletion", async () => {
    socket.connected = true;
    render(<StickyWallPage />);
    await waitFor(() => {
      expect(screen.getByText("First sticky")).toBeInTheDocument();
    });
    const liveSticky = {
      _id: "s99",
      title: "",
      content: "Live incoming sticky",
      color: "#fbcfe8",
      position: { x: 100, y: 100 },
    };
    act(() => {
      mockSocketHandlers["sticky_created"](liveSticky);
    });
    expect(
      await screen.findByText("Live incoming sticky")
    ).toBeInTheDocument();
    const updatedSticky = {
      _id: "s1",
      title: "",
      content: "Updated via Socket",
      color: "#fef08a",
      position: { x: 50, y: 50 },
    };
    act(() => {
      mockSocketHandlers["sticky_updated"](updatedSticky);
    });
    expect(await screen.findByText("Updated via Socket")).toBeInTheDocument();
    act(() => {
      mockSocketHandlers["sticky_deleted"]("s1");
    });
    expect(screen.queryByText("Updated via Socket")).not.toBeInTheDocument();
  });
  test("stale getStickies response does not overwrite a socket update that arrived first", async () => {
    // Delay the REST response so a socket event can arrive first
    let resolveGetStickies;
    getStickies.mockImplementationOnce(
      () => new Promise((resolve) => { resolveGetStickies = resolve; })
    );
    socket.connected = true;
    render(<StickyWallPage />);
    // Socket delivers a new sticky while getStickies is still pending
    const socketSticky = {
      _id: "s99",
      title: "",
      content: "Socket sticky arrived first",
      color: "#fbcfe8",
      position: { x: 200, y: 200 },
    };
    act(() => {
      mockSocketHandlers["sticky_created"]?.(socketSticky);
    });
    // Now resolve the stale REST snapshot (does NOT include s99)
    act(() => {
      resolveGetStickies({ stickies: mockStickies });
    });
    // The stale snapshot should be discarded; socket sticky must still be present
    await waitFor(() => {
      expect(screen.queryByText(/loading wall/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText("Socket sticky arrived first")).toBeInTheDocument();
  });
});
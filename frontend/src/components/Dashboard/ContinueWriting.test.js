import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContinueWriting from "./ContinueWriting";
import { getNotes, getNote, toggleFavorite } from "../../api/notes.js";
jest.mock("../../api/notes.js", () => ({
  getNotes: jest.fn(),
  getNote: jest.fn(),
  toggleFavorite: jest.fn(),
}));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
describe("ContinueWriting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-31T12:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  function renderComponent() {
    return render(
      <MemoryRouter>
        <ContinueWriting />
      </MemoryRouter>
    );
  }
  test("shows loading state initially", () => {
    getNotes.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText("Loading note...")).toBeInTheDocument();
  });
  test("shows empty state when there are no notes", async () => {
    getNotes.mockResolvedValue({ notes: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("No notes available")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "Start capturing your ideas by creating your first note."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create New Note" })
    ).toBeInTheDocument();
  });
  test("navigates to note editor when Create New Note is clicked", async () => {
    getNotes.mockResolvedValue({ notes: [] });
    renderComponent();
    const button = await screen.findByRole("button", {
      name: "Create New Note",
    });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith("/note-editor");
  });
  test("loads and displays the latest note", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "My Latest Note",
        isFavorite: false,
        updatedAt: "2026-08-31T11:59:30Z",
        pages: [
          {
            objects: [
              {
                type: "text",
                content: "This is my first paragraph.",
              },
              {
                type: "textbox",
                content: "This is another paragraph.",
              },
            ],
          },
        ],
      },
    });
    renderComponent();
    expect(await screen.findByText("My Latest Note")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is my first paragraph. This is another paragraph."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Updated just now")).toBeInTheDocument();
    expect(getNotes).toHaveBeenCalledWith({ limit: 1 });
    expect(getNote).toHaveBeenCalledWith("note-1");
  });
  test("shows Untitled Note when note has no title", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "",
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
        isFavorite: false,
      },
    });
    renderComponent();
    expect(await screen.findByText("Untitled Note")).toBeInTheDocument();
  });
  test("shows General when note has no categories", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Test Note",
        categories: [],
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    renderComponent();
    expect(await screen.findByText("General")).toBeInTheDocument();
  });
  test("renders category names", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Categorized Note",
        categories: [
          { _id: "cat-1", name: "Work" },
          { _id: "cat-2", name: "Ideas" },
        ],
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    renderComponent();
    expect(await screen.findByText("#Work")).toBeInTheDocument();
    expect(screen.getByText("#Ideas")).toBeInTheDocument();
  });
  test("shows fallback text when note has no text content", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Empty Note",
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [
          {
            objects: [
              {
                type: "image",
                url: "image.jpg",
              },
            ],
          },
        ],
      },
    });
    renderComponent();
    expect(
      await screen.findByText("No text content yet...")
    ).toBeInTheDocument();
  });
  test("navigates to the note editor when the note card is clicked", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-123" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-123",
        title: "Important Note",
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    renderComponent();
    const noteTitle = await screen.findByText("Important Note");
    fireEvent.click(noteTitle.closest("article"));
    expect(mockNavigate).toHaveBeenCalledWith("/note-editor/note-123");
  });
  test("navigates to notes page when View All is clicked", () => {
    getNotes.mockReturnValue(new Promise(() => {}));
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "View All" }));
    expect(mockNavigate).toHaveBeenCalledWith("/notes");
  });
  test("toggles favorite on", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Favorite Note",
        isFavorite: false,
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    toggleFavorite.mockResolvedValue({});
    renderComponent();
    const favoriteButton = await screen.findByRole("button", {
      name: "Favorite",
    });
    fireEvent.click(favoriteButton);
    expect(toggleFavorite).toHaveBeenCalledWith("note-1");
    await waitFor(() => {
      expect(favoriteButton).toHaveClass("text-[#0040df]");
    });
  });
  test("toggles favorite off when note is already favorited", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Favorite Note",
        isFavorite: true,
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    toggleFavorite.mockResolvedValue({});
    renderComponent();
    const favoriteButton = await screen.findByRole("button", {
      name: "Favorite",
    });
    expect(favoriteButton).toHaveClass("text-[#0040df]");
    fireEvent.click(favoriteButton);
    expect(toggleFavorite).toHaveBeenCalledWith("note-1");
    await waitFor(() => {
      expect(favoriteButton).not.toHaveClass("text-[#0040df]");
    });
  });
  test("restores previous favorite state when toggleFavorite fails", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Favorite Note",
        isFavorite: false,
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    toggleFavorite.mockRejectedValue(new Error("API error"));
    renderComponent();
    const favoriteButton = await screen.findByRole("button", {
      name: "Favorite",
    });
    fireEvent.click(favoriteButton);
    await waitFor(() => {
      expect(favoriteButton).toHaveClass("text-[#0040df]");
    });
    await waitFor(() => {
      expect(favoriteButton).not.toHaveClass("text-[#0040df]");
    });
  });
  test("does not navigate when favorite button is clicked", async () => {
    getNotes.mockResolvedValue({
      notes: [{ _id: "note-1" }],
    });
    getNote.mockResolvedValue({
      note: {
        _id: "note-1",
        title: "Favorite Note",
        isFavorite: false,
        updatedAt: "2026-08-31T11:59:00Z",
        pages: [],
      },
    });
    toggleFavorite.mockResolvedValue({});
    renderComponent();
    const favoriteButton = await screen.findByRole("button", {
      name: "Favorite",
    });
    fireEvent.click(favoriteButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  test("handles API errors and stops loading", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getNotes.mockRejectedValue(new Error("Failed to fetch notes"));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("No notes available")).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
  test("uses notes array directly when API does not return a notes property", async () => {
    getNotes.mockResolvedValue([{ _id: "note-1" }]);
    getNote.mockResolvedValue({
      _id: "note-1",
      title: "Direct Response Note",
      isFavorite: false,
      updatedAt: "2026-08-31T11:59:00Z",
      pages: [],
    });
    renderComponent();
    expect(
      await screen.findByText("Direct Response Note")
    ).toBeInTheDocument();
    expect(getNote).toHaveBeenCalledWith("note-1");
  });
});
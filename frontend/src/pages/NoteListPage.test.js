import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteListPage from "./NoteListPage";

const mockNavigate = jest.fn();
let mockSearchParamString = "";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockSearchParamString)],
}));

jest.mock("../components/Dashboard/Sidebar.jsx", () => () => (
  <div data-testid="sidebar">Sidebar</div>
));

jest.mock("../api/notes.js", () => ({
  getNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  toggleFavorite: jest.fn(),
}));

jest.mock("../api/category.js", () => ({
  getCategories: jest.fn(),
}));

jest.mock("../api/folder.js", () => ({
  getFolders: jest.fn(),
}));

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleFavorite,
} from "../api/notes.js";
import { getCategories } from "../api/category.js";
import { getFolders } from "../api/folder.js";

const mockCategories = [
  { _id: "cat1", name: "Work" },
  { _id: "cat2", name: "Personal" },
];

const mockFolders = [
  {
    _id: "fold1",
    name: "Project Alpha",
    color: "#ff0000",
    description: "Alpha details",
  },
  {
    _id: "fold2",
    name: "Archive",
    color: "#00ff00",
    description: "Old files",
  },
];

const mockNotes = [
  {
    _id: "note1",
    title: "First Note",
    isFavorite: false,
    folder: "fold1",
    categories: [{ _id: "cat1", name: "Work" }],
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    _id: "note2",
    title: "Second Note",
    isFavorite: true,
    folder: null,
    categories: [],
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

describe("NoteListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamString = "";
    getCategories.mockResolvedValue({ categories: mockCategories });
    getFolders.mockResolvedValue({ folders: mockFolders });
    getNotes.mockResolvedValue({ notes: mockNotes });
    window.confirm = jest.fn(() => true);
  });

  test("renders initial loading state, fetches metadata and notes", async () => {
    render(<NoteListPage />);
    expect(screen.getByText(/loading your notes\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading your notes\.\.\./i)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "All Notes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#Work" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#Personal" })).toBeInTheDocument();
    expect(screen.getByText("First Note")).toBeInTheDocument();
    expect(screen.getByText("Second Note")).toBeInTheDocument();
  });

  test("displays empty state when no notes are returned", async () => {
    getNotes.mockResolvedValueOnce({ notes: [] });
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("No notes found")).toBeInTheDocument();
    });
  });

  test("handles metadata fetch error gracefully", async () => {
    getCategories.mockRejectedValueOnce(new Error("Category error"));
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.queryByText(/loading your notes\.\.\./i)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "All Notes" })).toBeInTheDocument();
  });

  test("filters notes by search term", async () => {
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText("Search by title...");
    await userEvent.type(searchInput, "First");
    await waitFor(() => {
      expect(getNotes).toHaveBeenCalledWith({ search: "First" });
    });
  });

  test("filters notes by tag selection", async () => {
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "#Work" })).toBeInTheDocument();
    });
    const workTagBtn = screen.getByRole("button", { name: "#Work" });
    await userEvent.click(workTagBtn);
    await waitFor(() => {
      expect(getNotes).toHaveBeenCalledWith({ category: "cat1" });
    });
    await userEvent.click(workTagBtn);
    await waitFor(() => {
      expect(getNotes).toHaveBeenCalledWith({});
    });
  });

  test("filters notes by folder and favorites URL params", async () => {
    mockSearchParamString = "folder=fold1";
    render(<NoteListPage />);
    await waitFor(() => {
      expect(getNotes).toHaveBeenCalledWith({ folder: "fold1" });
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Project Alpha" })).toBeInTheDocument();
    });
  });

  test("creates a new note and navigates to editor", async () => {
    createNote.mockResolvedValueOnce({ note: { _id: "new_note_123" } });
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create note/i })).toBeInTheDocument();
    });
    const createBtn = screen.getByRole("button", { name: /create note/i });
    await userEvent.click(createBtn);
    expect(createNote).toHaveBeenCalledWith({
      title: "Untitled Note",
      pages: [{ width: 794, height: 1123, objects: [] }],
      categories: [],
      folder: null,
    });
    expect(mockNavigate).toHaveBeenCalledWith("/note-editor/new_note_123");
  });

  test("toggles favorite status on a note card", async () => {
    toggleFavorite.mockResolvedValueOnce({ isFavorite: true });
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const starBtns = screen.getAllByTitle("Star note");
    await userEvent.click(starBtns[0]);
    expect(toggleFavorite).toHaveBeenCalledWith("note1");
  });

  test("moves note to a different folder via dropdown", async () => {
    updateNote.mockResolvedValueOnce({ note: { _id: "note1", folder: "fold2" } });
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const dropdowns = screen.getAllByRole("combobox");
    fireEvent.change(dropdowns[0], { target: { value: "fold2" } });
    expect(updateNote).toHaveBeenCalledWith("note1", { folder: "fold2" });
  });

  test("deletes a note after confirmation", async () => {
    deleteNote.mockResolvedValueOnce({});
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const deleteBtns = screen.getAllByTitle("Delete note");
    await userEvent.click(deleteBtns[0]);
    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this note?"
    );
    expect(deleteNote).toHaveBeenCalledWith("note1");
    await waitFor(() => {
      expect(screen.queryByText("First Note")).not.toBeInTheDocument();
    });
  });

  test("cancels note deletion when confirmation is rejected", async () => {
    window.confirm.mockReturnValueOnce(false);
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const deleteBtns = screen.getAllByTitle("Delete note");
    await userEvent.click(deleteBtns[0]);
    expect(deleteNote).not.toHaveBeenCalled();
    expect(screen.getByText("First Note")).toBeInTheDocument();
  });

  test("navigates to note editor on edit button click and note card click", async () => {
    render(<NoteListPage />);
    await waitFor(() => {
      expect(screen.getByText("First Note")).toBeInTheDocument();
    });
    const editBtns = screen.getAllByTitle("Edit note");
    await userEvent.click(editBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/note-editor/note1");
    const noteCard = screen.getByText("First Note").closest("article");
    await userEvent.click(noteCard);
    expect(mockNavigate).toHaveBeenCalledWith("/note/note1");
  });
});
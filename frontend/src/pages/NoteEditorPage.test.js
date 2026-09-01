import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteEditorPage from "./NoteEditorPage";
const mockNavigate = jest.fn();
let mockParams = { id: "note_123" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));
jest.mock("../components/editor/FabricCanvas", () => {
  const React = require("react");
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      syncSelection: jest.fn(),
      runCommand: jest.fn(),
      removeObject: jest.fn(),
      addObjectFromData: jest.fn().mockResolvedValue(true),
    }));
    return (
      <div data-testid={`fabric-canvas-${props.page._id}`}>
        <button onClick={() => props.onObjectsChange([{ type: "textbox", text: "Updated Text" }])}>
          Change Objects
        </button>
        <button
          onClick={() =>
            props.onMediaAdd({
              _id: "media_new",
              type: "video",
              url: "http://example.com/video.mp4",
              x: 10,
              y: 10,
            })
          }
        >
          Add Media
        </button>
      </div>
    );
  });
});
jest.mock("../components/editor/EditorToolbar", () => (props) => (
  <div data-testid="editor-toolbar">
    <span>Toolbar ({props.activeTool})</span>
    <button onClick={() => props.onZoomChange(props.zoomLevel + 10)}>Zoom In Toolbar</button>
  </div>
));
jest.mock("../api/notes.js", () => ({
  getNote: jest.fn(),
  updateNote: jest.fn(),
  addPage: jest.fn(),
}));
jest.mock("../api/category.js", () => ({
  getCategories: jest.fn(),
  createCategory: jest.fn(),
}));
jest.mock("../api/folder.js", () => ({
  getFolders: jest.fn(),
}));
import { getNote, updateNote, addPage } from "../api/notes.js";
import { getCategories, createCategory } from "../api/category.js";
import { getFolders } from "../api/folder.js";
const mockNote = {
  _id: "note_123",
  title: "Physics Lecture Note",
  folder: { _id: "f1", name: "Physics Class" },
  categories: [{ _id: "cat1", name: "Science" }],
  pages: [
    {
      _id: "p1",
      width: 794,
      height: 1123,
      objects: [
        {
          _id: "m1",
          type: "audio",
          url: "http://example.com/audio.mp3",
          x: 50,
          y: 50,
        },
      ],
    },
  ],
};
const mockCategories = [
  { _id: "cat1", name: "Science" },
  { _id: "cat2", name: "Math" },
];
const mockFolders = [
  { _id: "f1", name: "Physics Class" },
  { _id: "f2", name: "Personal" },
];
describe("NoteEditorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: "note_123" };
    getNote.mockResolvedValue({ note: mockNote });
    getCategories.mockResolvedValue({ categories: mockCategories });
    getFolders.mockResolvedValue({ folders: mockFolders });
    updateNote.mockResolvedValue({ note: mockNote });
    addPage.mockResolvedValue({
      page: { _id: "p2", width: 794, height: 1123, objects: [] },
    });
  });
  test("redirects to /notes if ID is missing in params", async () => {
    mockParams = {};
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notes", { replace: true });
    });
  });
  test("renders initial loading state and displays note content on load", async () => {
    render(<NoteEditorPage />);
    expect(screen.getByText(/loading editor\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading editor\.\.\./i)).not.toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    expect(screen.getByText("#Science")).toBeInTheDocument();
    expect(screen.getByTestId("fabric-canvas-p1")).toBeInTheDocument();
  });
  test("displays error message when getNote fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    getNote.mockRejectedValueOnce(new Error("Note not found"));
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByText("Note not found.")).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });
  test("updates note title and shows unsaved badge", async () => {
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    });
    const titleInput = screen.getByDisplayValue("Physics Lecture Note");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "New Note Title");
    // The header renders a mobile (sm:hidden) and a desktop (hidden sm:flex) copy of
    // the "Unsaved" badge for responsive layout; jsdom doesn't hide either one, so
    // both exist in the DOM at once. Assert at least one is present instead of exactly one.
    expect(screen.getAllByText("Unsaved").length).toBeGreaterThan(0);
  });
  test("saves note when Save button is clicked", async () => {
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    });
    const titleInput = screen.getByDisplayValue("Physics Lecture Note");
    await userEvent.type(titleInput, " Updated");
    // Same responsive-duplicate situation as above: there's a mobile and a desktop
    // Save button in the DOM. Either one calls the same handler, so just use the first.
    const [saveBtn] = screen.getAllByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith("note_123", {
        title: "Physics Lecture Note Updated",
        pages: expect.any(Array),
        categories: ["cat1"],
        folder: "f1",
      });
    });
  });
  test("prompts category selection modal if saving with no categories assigned", async () => {
    getNote.mockResolvedValueOnce({
      note: { ...mockNote, categories: [] },
    });
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    });
    const titleInput = screen.getByDisplayValue("Physics Lecture Note");
    await userEvent.type(titleInput, " Change");
    const [saveBtn] = screen.getAllByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
    expect(screen.getByText("Organize this note")).toBeInTheDocument();
    const saveNoteModalBtn = screen.getByRole("button", { name: /save note/i });
    await userEvent.click(saveNoteModalBtn);
    await waitFor(() => {
      expect(updateNote).toHaveBeenCalled();
    });
  });
  test("creates a new category inline and toggles it", async () => {
    createCategory.mockResolvedValueOnce({
      category: { _id: "cat_new", name: "Biology" },
    });
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    });
    const tagBtn = screen.getByRole("button", { name: /\+\s*tag/i });
    await userEvent.click(tagBtn);
    const newCatInput = screen.getByPlaceholderText("New category...");
    await userEvent.type(newCatInput, "Biology");
    const addCatBtn = screen.getByRole("button", { name: "Add" });
    await userEvent.click(addCatBtn);
    expect(createCategory).toHaveBeenCalledWith("Biology");
    const biologyTags = await screen.findAllByText(
      (content, element) => element?.textContent.replace(/\s+/g, "") === "#Biology"
    );
    expect(biologyTags.length).toBeGreaterThan(0);
  });
  test("adds a new page to the note", async () => {
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add next page/i })).toBeInTheDocument();
    });
    const addPageBtn = screen.getByRole("button", { name: /add next page/i });
    await userEvent.click(addPageBtn);
    expect(addPage).toHaveBeenCalledWith("note_123");
    expect(await screen.findByTestId("fabric-canvas-p2")).toBeInTheDocument();
  });
  test("handles back button with unsaved changes modal prompt", async () => {
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Physics Lecture Note")).toBeInTheDocument();
    });
    const titleInput = screen.getByDisplayValue("Physics Lecture Note");
    await userEvent.type(titleInput, " Modified");
    const backBtn = screen.getByTitle("Return to Notes");
    await userEvent.click(backBtn);
    expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    const discardBtn = screen.getByRole("button", { name: /discard & leave/i });
    await userEvent.click(discardBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/notes");
  });
  test("deletes draggable media overlay from page", async () => {
    render(<NoteEditorPage />);
    await waitFor(() => {
      expect(screen.getByText("AUDIO")).toBeInTheDocument();
    });
    const closeBtns = screen.getAllByRole("button", { name: "✕" });
    const mediaDeleteBtn = closeBtns[closeBtns.length - 1];
    await userEvent.click(mediaDeleteBtn);
    expect(screen.queryByText("AUDIO")).not.toBeInTheDocument();
  });
});
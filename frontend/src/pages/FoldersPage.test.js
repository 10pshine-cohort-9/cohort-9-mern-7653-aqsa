import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FoldersPage from "./FoldersPage";
jest.mock("../components/Dashboard/Sidebar", () => () => (
  <div data-testid="sidebar">Sidebar</div>
));
jest.mock("../components/Folders/CreateFolderModal", () => (props) => (
  <div data-testid="create-folder-modal">
    <button onClick={() => props.onCreate({ name: "New Folder", color: "#00ff00" })}>
      Submit Folder
    </button>
    <button onClick={props.onClose}>Close Modal</button>
  </div>
));
jest.mock("../components/Folders/AddNotesModal", () => (props) => (
  <div data-testid="add-notes-modal">
    <span>Target: {props.targetFolder.name}</span>
    <button
      onClick={() => {
        props.setSelectedNoteIds(["note1", "note2"]);
      }}
    >
      Select Notes
    </button>
    <button onClick={props.onSave}>
      {props.assigning ? "Saving..." : "Save Notes"}
    </button>
    <button onClick={props.onClose}>Close Add Notes</button>
  </div>
));
jest.mock("../components/Folders/FolderCard", () => (props) => (
  <div data-testid={`folder-card-${props.folder._id}`}>
    <h3>{props.folder.name}</h3>
    <span>Count: {props.noteCount}</span>
    <button onClick={(e) => props.onAddNotes(e, props.folder)}>Add Notes</button>
    <button onClick={(e) => props.onDelete(e, props.folder._id)}>Delete Folder</button>
  </div>
));
jest.mock("../api/folder.js", () => ({
  getFolders: jest.fn(),
  createFolder: jest.fn(),
  deleteFolder: jest.fn(),
}));
jest.mock("../api/notes.js", () => ({
  getNotes: jest.fn(),
  updateNote: jest.fn(),
}));
import { getFolders, createFolder, deleteFolder } from "../api/folder.js";
import { getNotes, updateNote } from "../api/notes.js";
const mockFolders = [
  { _id: "f1", name: "Work Projects", color: "#ff0000" },
  { _id: "f2", name: "Personal Ideas", color: "#0000ff" },
];
const mockNotes = [
  { _id: "note1", title: "Project Alpha", folder: "f1" },
  { _id: "note2", title: "Grocery List", folder: null },
  { _id: "note3", title: "Project Beta", folder: { _id: "f1" } },
];
describe("FoldersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getFolders.mockResolvedValue({ folders: mockFolders });
    getNotes.mockResolvedValue({ notes: mockNotes });
    window.confirm = jest.fn(() => true);
  });
  test("renders initial loading state and fetches folders and notes", async () => {
    render(<FoldersPage />);
    expect(screen.getByText("Loading folders...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading folders...")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Folders" })).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("folder-card-f1")).toBeInTheDocument();
    expect(screen.getByTestId("folder-card-f2")).toBeInTheDocument();
    expect(screen.getByText(/Work Projects/)).toBeInTheDocument();
    expect(screen.getByTestId("folder-card-f1")).toHaveTextContent("Count: 2");
    expect(screen.getByTestId("folder-card-f2")).toHaveTextContent("Count: 0");
  });
  test("renders empty state when no folders are returned", async () => {
    getFolders.mockResolvedValueOnce({ folders: [] });
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.getByText("No folders yet")).toBeInTheDocument();
    });
    expect(screen.getByText("+ Create your first folder")).toBeInTheDocument();
  });
  test("handles error during initial data loading gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    getFolders.mockRejectedValueOnce(new Error("Network Error"));
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.queryByText("Loading folders...")).not.toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load folders or notes:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
  test("opens create folder modal and creates a new folder", async () => {
    const createdFolder = { _id: "f3", name: "New Folder", color: "#00ff00" };
    createFolder.mockResolvedValueOnce({ folder: createdFolder });
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.getByTestId("folder-card-f1")).toBeInTheDocument();
    });
    const newFolderBtn = screen.getByRole("button", { name: /new folder/i });
    await userEvent.click(newFolderBtn);
    expect(screen.getByTestId("create-folder-modal")).toBeInTheDocument();
    const submitBtn = screen.getByRole("button", { name: "Submit Folder" });
    await userEvent.click(submitBtn);
    expect(createFolder).toHaveBeenCalledWith({ name: "New Folder", color: "#00ff00" });
    await waitFor(() => {
      expect(screen.queryByTestId("create-folder-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("folder-card-f3")).toBeInTheDocument();
  });
  test("deletes a folder when confirmed", async () => {
    deleteFolder.mockResolvedValueOnce({});
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.getByTestId("folder-card-f1")).toBeInTheDocument();
    });
    const deleteBtn = screen.getAllByRole("button", { name: "Delete Folder" })[0];
    await userEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this folder? Notes inside will not be deleted."
    );
    expect(deleteFolder).toHaveBeenCalledWith("f1");
    await waitFor(() => {
      expect(screen.queryByTestId("folder-card-f1")).not.toBeInTheDocument();
    });
  });
  test("does not delete folder if confirmation is canceled", async () => {
    window.confirm.mockReturnValueOnce(false);
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.getByTestId("folder-card-f1")).toBeInTheDocument();
    });
    const deleteBtn = screen.getAllByRole("button", { name: "Delete Folder" })[0];
    await userEvent.click(deleteBtn);
    expect(deleteFolder).not.toHaveBeenCalled();
    expect(screen.getByTestId("folder-card-f1")).toBeInTheDocument();
  });
  test("opens Add Notes modal and updates folder assignment for notes", async () => {
    updateNote.mockResolvedValue({});
    render(<FoldersPage />);
    await waitFor(() => {
      expect(screen.getByTestId("folder-card-f2")).toBeInTheDocument();
    });
    const addNotesBtns = screen.getAllByRole("button", { name: "Add Notes" });
    await userEvent.click(addNotesBtns[1]);
    expect(screen.getByTestId("add-notes-modal")).toBeInTheDocument();
    expect(screen.getByText("Target: Personal Ideas")).toBeInTheDocument();
    const selectNotesBtn = screen.getByRole("button", { name: "Select Notes" });
    await userEvent.click(selectNotesBtn);
    const saveNotesBtn = screen.getByRole("button", { name: "Save Notes" });
    await userEvent.click(saveNotesBtn);
    await waitFor(() => {
      expect(updateNote).toHaveBeenCalledWith("note1", { folder: "f2" });
      expect(updateNote).toHaveBeenCalledWith("note2", { folder: "f2" });
    });
    await waitFor(() => {
      expect(screen.queryByTestId("add-notes-modal")).not.toBeInTheDocument();
    });
  });
});
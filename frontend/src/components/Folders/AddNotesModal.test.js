import { render, screen, fireEvent } from "@testing-library/react";
import AddNotesModal from "./AddNotesModal";
describe("AddNotesModal", () => {
  const targetFolder = {
    _id: "folder-1",
    name: "Work",
    color: "#0040df",
  };
  const allNotes = [
    {
      _id: "note-1",
      title: "Meeting Notes",
      folder: null,
      updatedAt: "2026-08-20T10:00:00.000Z",
    },
    {
      _id: "note-2",
      title: "Project Ideas",
      folder: {
        _id: "folder-2",
        name: "Personal",
      },
      updatedAt: "2026-08-21T10:00:00.000Z",
    },
    {
      _id: "note-3",
      title: "",
      folder: null,
      updatedAt: "2026-08-22T10:00:00.000Z",
    },
  ];
  let selectedNoteIds;
  let setSelectedNoteIds;
  let onClose;
  let onSave;
  function renderModal({
    selected = [],
    assigning = false,
    notes = allNotes,
  } = {}) {
    selectedNoteIds = selected;
    setSelectedNoteIds = jest.fn((update) => {
      if (typeof update === "function") {
        selectedNoteIds = update(selectedNoteIds);
      } else {
        selectedNoteIds = update;
      }
    });
    onClose = jest.fn();
    onSave = jest.fn();
    return render(
      <AddNotesModal
        targetFolder={targetFolder}
        allNotes={notes}
        selectedNoteIds={selectedNoteIds}
        setSelectedNoteIds={setSelectedNoteIds}
        onClose={onClose}
        onSave={onSave}
        assigning={assigning}
      />
    );
  }
  test("renders modal title and description", () => {
    renderModal();
    expect(
      screen.getByRole("heading", {
        name: 'Add Notes to "Work"',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select existing notes to move into this folder."
      )
    ).toBeInTheDocument();
  });
  test("renders all notes", () => {
    renderModal();
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.getByText("Project Ideas")).toBeInTheDocument();
    expect(screen.getByText("Untitled Note")).toBeInTheDocument();
  });

  test("shows note selected count", () => {
    renderModal({
      selected: ["note-1", "note-2"],
    });
    expect(
      screen.getByText("2 notes selected")
    ).toBeInTheDocument();
  });
  test("selects a note when checkbox is clicked", () => {
    renderModal();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    fireEvent.click(checkboxes[0]);
    expect(setSelectedNoteIds).toHaveBeenCalled();
    const updateFunction = setSelectedNoteIds.mock.calls[0][0];
    expect(updateFunction([])).toEqual(["note-1"]);
  });
  test("deselects an already selected note", () => {
    renderModal({
      selected: ["note-1"],
    });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(setSelectedNoteIds).toHaveBeenCalled();
    const updateFunction = setSelectedNoteIds.mock.calls[0][0];
    expect(updateFunction(["note-1"])).toEqual([]);
  });
  test("selects multiple notes", () => {
    renderModal();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    expect(setSelectedNoteIds).toHaveBeenCalledTimes(2);
    const firstUpdate = setSelectedNoteIds.mock.calls[0][0];
    const secondUpdate = setSelectedNoteIds.mock.calls[1][0];
    expect(firstUpdate([])).toEqual(["note-1"]);
    expect(secondUpdate(["note-1"])).toEqual([
      "note-1",
      "note-2",
    ]);
  });
  test("searches notes by title", () => {
    renderModal();
    const searchInput = screen.getByPlaceholderText(
      "Search your notes..."
    );
    fireEvent.change(searchInput, {
      target: {
        value: "meeting",
      },
    });
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(
      screen.queryByText("Project Ideas")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Untitled Note")
    ).not.toBeInTheDocument();
  });
  test("search is case insensitive", () => {
    renderModal();
    const searchInput = screen.getByPlaceholderText(
      "Search your notes..."
    );
    fireEvent.change(searchInput, {
      target: {
        value: "MEETING",
      },
    });
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
  });
  test("shows no notes message when search has no results", () => {
    renderModal();
    const searchInput = screen.getByPlaceholderText(
      "Search your notes..."
    );
    fireEvent.change(searchInput, {
      target: {
        value: "does-not-exist",
      },
    });
    expect(
      screen.getByText("No notes match your search.")
    ).toBeInTheDocument();
  });
  test("uses Untitled Note when note has no title", () => {
    renderModal();
    expect(
      screen.getByText("Untitled Note")
    ).toBeInTheDocument();
  });
  test("shows warning when selected note belongs to another folder", () => {
    renderModal({
      selected: ["note-2"],
    });
    expect(
      screen.getByText(/1 note is currently in another folder/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/moved to "Work"/)
    ).toBeInTheDocument();
  });
  test("shows plural warning when multiple selected notes belong to another folder", () => {
    const notes = [
      {
        _id: "note-1",
        title: "Note One",
        folder: {
          _id: "folder-2",
          name: "Personal",
        },
        updatedAt: "2026-08-20T10:00:00.000Z",
      },
      {
        _id: "note-2",
        title: "Note Two",
        folder: {
          _id: "folder-3",
          name: "School",
        },
        updatedAt: "2026-08-21T10:00:00.000Z",
      },
    ];

    renderModal({
      selected: ["note-1", "note-2"],
      notes,
    });

    expect(
      screen.getByText(/2 notes are currently in another folder/)
    ).toBeInTheDocument();
  });
  test("does not show warning when selected note is already in target folder", () => {
    const notes = [
      {
        _id: "note-1",
        title: "Work Note",
        folder: {
          _id: "folder-1",
          name: "Work",
        },
        updatedAt: "2026-08-20T10:00:00.000Z",
      },
    ];
    renderModal({
      selected: ["note-1"],
      notes,
    });
    expect(
      screen.queryByText(/currently in another folder/)
    ).not.toBeInTheDocument();
  });
  test("calls onSave when Apply Changes is clicked", () => {
    renderModal();
    const saveButton = screen.getByRole("button", {
      name: "Apply Changes",
    });
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
  test("shows Saving when assigning is true", () => {
    renderModal({
      assigning: true,
    });
    expect(
      screen.getByRole("button", {
        name: "Saving...",
      })
    ).toBeInTheDocument();
  });
  test("disables Apply Changes when assigning", () => {
    renderModal({
      assigning: true,
    });
    expect(
      screen.getByRole("button", {
        name: "Saving...",
      })
    ).toBeDisabled();
  });
  test("calls onClose when Cancel is clicked", () => {
    renderModal();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancel",
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  test("calls onClose when X button is clicked", () => {
    renderModal();
    fireEvent.click(
      screen.getByRole("button", {
        name: "✕",
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  test("calls onClose when clicking the backdrop", () => {
    renderModal();
    const backdrop = document.querySelector(
      ".fixed.inset-0"
    );
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  test("does not close when clicking inside the modal", () => {
    renderModal();
    const modal = screen.getByRole("heading", {
      name: 'Add Notes to "Work"',
    }).parentElement.parentElement.parentElement;
    fireEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });
  test("handles notes with string folder id", () => {
    const notes = [
      {
        _id: "note-1",
        title: "Another Folder Note",
        folder: "folder-2",
        updatedAt: "2026-08-20T10:00:00.000Z",
      },
    ];
    renderModal({
      selected: ["note-1"],
      notes,
    });
    expect(
      screen.getByText(/1 note is currently in another folder/)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Will be moved from: Another folder")
    ).toBeInTheDocument();
  });
  test("handles empty notes list", () => {
    renderModal({
      notes: [],
    });
    expect(
      screen.getByText("No notes match your search.")
    ).toBeInTheDocument();
  });
  test("selected checkbox is checked", () => {
    renderModal({
      selected: ["note-1"],
    });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });
  test("searching does not change selected notes", () => {
    renderModal({
      selected: ["note-1"],
    });
    const searchInput = screen.getByPlaceholderText(
      "Search your notes..."
    );
    fireEvent.change(searchInput, {
      target: {
        value: "project",
      },
    });
    expect(
      screen.getByText("1 notes selected")
    ).toBeInTheDocument();
  });
});

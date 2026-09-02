import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FolderCard from "./FolderCard";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
describe("FolderCard", () => {
  const folder = {
    _id: "folder123",
    name: "Work",
    description: "Work related notes",
    color: "#8b5cf6",
  };
  let onDelete;
  let onAddNotes;
  function renderCard(props = {}) {
    return render(
      <MemoryRouter>
        <FolderCard
          folder={folder}
          noteCount={5}
          onDelete={onDelete}
          onAddNotes={onAddNotes}
          {...props}
        />
      </MemoryRouter>
    );
  }
  beforeEach(() => {
    jest.clearAllMocks();
    onDelete = jest.fn();
    onAddNotes = jest.fn();
  });
  test("renders folder name and note count", () => {
    renderCard();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("5 notes")).toBeInTheDocument();
  });
  test("renders folder description when provided", () => {
    renderCard();
    expect(
      screen.getByText("Work related notes")
    ).toBeInTheDocument();
  });
  test("does not render description when not provided", () => {
    renderCard({
      folder: {
        ...folder,
        description: "",
      },
    });
    expect(
      screen.queryByText("Work related notes")
    ).not.toBeInTheDocument();
  });
  test("navigates to the folder notes when card is clicked", () => {
    renderCard();
    fireEvent.click(screen.getByRole("article"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/notes?folder=folder123"
    );
  });
  test("calls onDelete with event and folder id", () => {
    renderCard();
    const deleteButton = screen.getByTitle("Delete folder");
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(
      expect.any(Object),
      "folder123"
    );
  });
  test("calls onAddNotes with event and folder", () => {
    renderCard();
    const addNotesButton = screen.getByRole("button", {
      name: /add existing notes/i,
    });
    fireEvent.click(addNotesButton);
    expect(onAddNotes).toHaveBeenCalledTimes(1);
    expect(onAddNotes).toHaveBeenCalledWith(
      expect.any(Object),
      folder
    );
  });
  test("uses folder color when provided", () => {
    renderCard();
    const folderIcon = screen.getByText("folder");
    expect(folderIcon).toHaveStyle({
      color: "rgb(139, 92, 246)",
    });
  });
  test("does not navigate when delete button is clicked", () => {
    renderCard();
    const deleteButton = screen.getByTitle("Delete folder");
    fireEvent.click(deleteButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("does not navigate when add notes button is clicked", () => {
    renderCard();
    const addNotesButton = screen.getByRole("button", {
      name: /add existing notes/i,
    });
    fireEvent.click(addNotesButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  test("uses default color when folder color is missing", () => {
    renderCard({
      folder: {
        ...folder,
        color: undefined,
      },
    });
    const folderIcon = screen.getByText("folder");
    expect(folderIcon).toHaveStyle({
      color: "rgb(0, 64, 223)",
    });
  });
});
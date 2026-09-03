import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteReaderPage from "./NoteReaderPage";
const mockNavigate = jest.fn();
let mockParams = { id: "note_123" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));
jest.mock("../components/Reader/ReaderCanvas", () => {
  const React = require("react");
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getDataURL: jest.fn(() => "data:image/png;base64,fakeDataUrl"),
    }));
    React.useEffect(() => {
      if (props.onReady) {
        props.onReady(props.page._id);
      }
    }, [props]);
    return <div data-testid={`reader-canvas-${props.page._id}`}>Reader Canvas</div>;
  });
});
jest.mock("../api/notes.js", () => ({
  getNote: jest.fn(),
}));
const mockJsPdfSave = jest.fn();
const mockJsPdfAddPage = jest.fn();
const mockJsPdfAddImage = jest.fn();
jest.mock("jspdf", () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      save: mockJsPdfSave,
      addPage: mockJsPdfAddPage,
      addImage: mockJsPdfAddImage,
    })),
  };
});
import { getNote } from "../api/notes.js";
const mockNoteData = {
  _id: "note_123",
  title: "Test Physics Note",
  folder: { _id: "f1", name: "Science" },
  categories: [
    { _id: "c1", name: "Physics" },
    { _id: "c2", name: "ExamPrep" },
  ],
  pages: [
    {
      _id: "p1",
      width: 794,
      height: 1123,
      objects: [
        {
          _id: "m1",
          type: "video",
          url: "http://example.com/video.mp4",
          x: 100,
          y: 150,
          width: 400,
        },
      ],
    },
    {
      _id: "p2",
      width: 1123,
      height: 794,
      objects: [
        {
          _id: "m2",
          type: "audio",
          url: "http://example.com/audio.mp3",
          x: 50,
          y: 50,
        },
      ],
    },
  ],
};
describe("NoteReaderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: "note_123" };
    getNote.mockResolvedValue({ note: mockNoteData });
    Element.prototype.scrollIntoView = jest.fn();
  });
  test("redirects to /notes if no note ID is supplied in params", async () => {
    mockParams = {};
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notes", { replace: true });
    });
  });
  test("displays loading state and then renders note content successfully", async () => {
    render(<NoteReaderPage />);
    expect(screen.getByText(/loading note\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading note\.\.\./i)).not.toBeInTheDocument();
    });
    expect(screen.getByText("Test Physics Note")).toBeInTheDocument();
    expect(screen.getByText("📁 Science")).toBeInTheDocument();
    expect(screen.getByText("#Physics")).toBeInTheDocument();
    expect(screen.getByText("#ExamPrep")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByTestId("reader-canvas-p1")).toBeInTheDocument();
    expect(screen.getByTestId("reader-canvas-p2")).toBeInTheDocument();
  });
  test("displays error screen when getNote API fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    getNote.mockRejectedValueOnce(new Error("Note not found"));
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(screen.getByText("This note could not be found.")).toBeInTheDocument();
    });
    const backBtn = screen.getByRole("button", { name: /back to notes/i });
    await userEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/notes");
    consoleSpy.mockRestore();
  });
  test("handles page navigation via sidebar buttons and keyboard arrows", async () => {
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    const page2SidebarBtn = screen.getByTitle("Go to page 2");
    await userEvent.click(page2SidebarBtn);
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });
  test("selects and deselects media overlay objects", async () => {
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(screen.getByText("VIDEO")).toBeInTheDocument();
    });
    const videoBadge = screen.getByText("VIDEO");
    const videoContainer = videoBadge.parentElement;
    await userEvent.click(videoContainer);
    expect(videoContainer.className).toContain("border-[#0040df]");
    const mainContainer = screen.getByRole("main");
    await userEvent.click(mainContainer);
    expect(videoContainer.className).not.toContain("border-[#0040df]");
  });
  test("exports note as PDF using jsPDF", async () => {
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /export pdf/i })).not.toBeDisabled();
    });
    const exportBtn = screen.getByRole("button", { name: /export pdf/i });
    await userEvent.click(exportBtn);
    await waitFor(() => {
      expect(mockJsPdfSave).toHaveBeenCalledWith("Test Physics Note.pdf");
    });
    expect(mockJsPdfAddImage).toHaveBeenCalledTimes(2);
  });
  test("navigates to note editor on Edit button click", async () => {
    render(<NoteReaderPage />);
    await waitFor(() => {
      expect(screen.getByText("Test Physics Note")).toBeInTheDocument();
    });
    const editBtn = screen.getByRole("button", { name: /edit/i });
    await userEvent.click(editBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/note-editor/note_123");
  });
});
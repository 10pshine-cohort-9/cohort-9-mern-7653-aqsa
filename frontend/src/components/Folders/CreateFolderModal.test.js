import { render, screen, fireEvent } from "@testing-library/react";
import CreateFolderModal from "./CreateFolderModal";
describe("CreateFolderModal", () => {
  let onClose;
  let onCreate;
  beforeEach(() => {
    onClose = jest.fn();
    onCreate = jest.fn();
  });
  function renderModal() {
    return render(
      <CreateFolderModal
        onClose={onClose}
        onCreate={onCreate}
      />
    );
  }
  test("renders the modal correctly", () => {
    renderModal();
    expect(
      screen.getByRole("heading", {
        name: "Create New Folder",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Give your folder a name, description, and accent color."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "e.g. University, Project Alpha"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Short summary...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Cancel",
      })
    ).toBeInTheDocument();
  });
  test("renders all folder color options", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });
  test("folder name input updates correctly", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.change(nameInput, {
      target: {
        value: "University",
      },
    });
    expect(nameInput).toHaveValue("University");
  });
  test("description input updates correctly", () => {
    renderModal();
    const descriptionInput =
      screen.getByPlaceholderText("Short summary...");
    fireEvent.change(descriptionInput, {
      target: {
        value: "University related notes",
      },
    });
    expect(descriptionInput).toHaveValue(
      "University related notes"
    );
  });
  test("uses the first color as the default color", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    const firstColorButton = buttons[0];
    expect(firstColorButton).toHaveStyle({
      backgroundColor: "#0040df",
    });
    expect(firstColorButton.className).toContain(
      "scale-125"
    );
  });
  test("changes folder color when a color button is clicked", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    const purpleButton = buttons[1];
    fireEvent.click(purpleButton);
    expect(purpleButton.className).toContain(
      "scale-125"
    );
  });
  test("removes selected styling from previous color when another color is selected", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    const firstColorButton = buttons[0];
    const secondColorButton = buttons[1];
    expect(firstColorButton.className).toContain(
      "scale-125"
    );
    fireEvent.click(secondColorButton);
    expect(secondColorButton.className).toContain(
      "scale-125"
    );
    expect(firstColorButton.className).not.toContain(
      "scale-125"
    );
  });
  test("calls onCreate with folder data when form is submitted", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    const descriptionInput =
      screen.getByPlaceholderText("Short summary...");
    fireEvent.change(nameInput, {
      target: {
        value: "University",
      },
    });
    fireEvent.change(descriptionInput, {
      target: {
        value: "University notes",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith({
      name: "University",
      description: "University notes",
      color: "#0040df",
    });
  });
  test("trims whitespace from folder name", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.change(nameInput, {
      target: {
        value: "   University   ",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).toHaveBeenCalledWith({
      name: "University",
      description: "",
      color: "#0040df",
    });
  });
  test("allows empty description", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.change(nameInput, {
      target: {
        value: "Work",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).toHaveBeenCalledWith({
      name: "Work",
      description: "",
      color: "#0040df",
    });
  });
  test("uses the selected color when creating a folder", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]);
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.change(nameInput, {
      target: {
        value: "Project Alpha",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).toHaveBeenCalledWith({
      name: "Project Alpha",
      description: "",
      color: "#ec4899",
    });
  });
  test("does not call onCreate when folder name contains only whitespace", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.change(nameInput, {
      target: {
        value: "     ",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).not.toHaveBeenCalled();
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
  test("calls onClose when clicking the backdrop", () => {
    renderModal();
    const backdrop = document.querySelector(
      ".fixed.inset-0"
    );
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  test("does not call onClose when clicking inside the modal", () => {
    renderModal();
    const heading = screen.getByRole("heading", {
      name: "Create New Folder",
    });
    fireEvent.click(heading);
    expect(onClose).not.toHaveBeenCalled();
  });
  test("does not call onClose when clicking the form", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText(
      "e.g. University, Project Alpha"
    );
    fireEvent.click(nameInput);
    expect(onClose).not.toHaveBeenCalled();
  });
  test("does not submit when name is empty", () => {
    renderModal();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).not.toHaveBeenCalled();
  });
  test("creates folder with selected color and description", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[6]);
    fireEvent.change(
      screen.getByPlaceholderText(
        "e.g. University, Project Alpha"
      ),
      {
        target: {
          value: "Personal",
        },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("Short summary..."),
      {
        target: {
          value: "Personal notes and ideas",
        },
      }
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Folder",
      })
    );
    expect(onCreate).toHaveBeenCalledWith({
      name: "Personal",
      description: "Personal notes and ideas",
      color: "#22c55e",
    });
  });
  test("clicking a color button does not submit the form", () => {
    renderModal();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[3]);
    expect(onCreate).not.toHaveBeenCalled();
  });
});

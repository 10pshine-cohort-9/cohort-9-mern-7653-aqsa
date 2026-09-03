import { useState } from "react";
export default function AddNotesModal({
  targetFolder,
  allNotes,
  selectedNoteIds,
  setSelectedNoteIds,
  onClose,
  onSave,
  assigning,
}) {
  const [noteSearch, setNoteSearch] = useState("");
  function toggleNoteSelection(noteId) {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  }
  const filteredNotes = allNotes.filter((n) =>
    (n.title || "Untitled Note")
      .toLowerCase()
      .includes(noteSearch.toLowerCase())
  );
  const reassignedNotesCount = allNotes.filter((n) => {
    const isSelected = selectedNoteIds.includes(n._id);
    const currentFolder = n.folder;
    const currentFolderId =
      typeof currentFolder === "object" ? currentFolder?._id : currentFolder;
    return (
      isSelected &&
      currentFolderId &&
      currentFolderId !== targetFolder._id
    );
  }).length;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#c4c5d9] p-6 shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#c4c5d9]/40">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{
                color: targetFolder.color || "#0040df",
                fontVariationSettings: "'FILL' 1",
              }}
            >
              folder
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-[#1c1c17]">
                Add Notes to "{targetFolder.name}"
              </h3>
              <p className="text-xs text-[#5f5e5d]">
                Select existing notes to move into this folder.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5f5e5d] hover:text-[#1c1c17]"
          >
            ✕
          </button>
        </div>
        <div className="my-3">
          <input
            type="text"
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
            placeholder="Search your notes..."
            className="w-full h-9 rounded-lg border border-[#c4c5d9] px-3 text-xs outline-none focus:border-[#0040df]"
          />
        </div>
        {reassignedNotesCount > 0 && (
          <div className="mb-2 p-2.5 rounded-lg bg-[#fff7ed] border border-[#ffedd5] flex items-start gap-2 text-xs text-[#c2410c]">
            <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
              info
            </span>
            <span>
              <strong>Note:</strong> {reassignedNotesCount}{" "}
              {reassignedNotesCount === 1 ? "note is" : "notes are"} currently
              in another folder and will be moved to "{targetFolder.name}".
            </span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-1.5 my-2 pr-1">
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-center text-[#747688] py-8">
              No notes match your search.
            </p>
          ) : (
            filteredNotes.map((noteItem) => {
              const isChecked = selectedNoteIds.includes(noteItem._id);
              const currentFolder = noteItem.folder;
              const currentFolderId =
                typeof currentFolder === "object"
                  ? currentFolder?._id
                  : currentFolder;
              const isInAnotherFolder =
                currentFolderId && currentFolderId !== targetFolder._id;

              return (
                <label
                  key={noteItem._id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-[#f1ede6] border-[#0040df]"
                      : "bg-white border-[#c4c5d9]/60 hover:bg-[#fdf9f1]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleNoteSelection(noteItem._id)}
                      className="h-4 w-4 rounded text-[#0040df] border-[#c4c5d9] focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1c1c17] truncate">
                        {noteItem.title || "Untitled Note"}
                      </p>
                      {isInAnotherFolder && (
                        <p className="text-[10px] text-[#ea580c] font-medium">
                          Will be moved from:{" "}
                          {typeof currentFolder === "object"
                            ? currentFolder.name
                            : "Another folder"}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#747688] shrink-0">
                    {new Date(noteItem.updatedAt).toLocaleDateString()}
                  </span>
                </label>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#c4c5d9]/40 pt-4 mt-2">
          <span className="text-xs text-[#5f5e5d] font-mono">
            {selectedNoteIds.length} notes selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5f5e5d] hover:text-[#1c1c17]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={assigning}
              onClick={onSave}
              className="rounded-lg bg-[#0040df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0035bd] shadow-sm disabled:opacity-50"
            >
              {assigning ? "Saving..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
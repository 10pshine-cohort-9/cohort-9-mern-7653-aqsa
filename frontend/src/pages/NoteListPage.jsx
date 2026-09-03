import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar.jsx";
import { getNotes, createNote, updateNote, deleteNote, toggleFavorite } from "../api/notes.js";
import { getCategories } from "../api/category.js";
import { getFolders } from "../api/folder.js";
export default function NoteListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("filter");
  const folderId = searchParams.get("folder");
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadMetadata();
  }, []);
  useEffect(() => {
    fetchNotes();
  }, [selectedCategory, search, filterType, folderId]);
  async function loadMetadata() {
    try {
      const [catData, folderData] = await Promise.all([
        getCategories().catch(() => ({ categories: [] })),
        getFolders().catch(() => ({ folders: [] })),
      ]);
      setCategories(catData.categories || []);
      setFolders(folderData.folders || []);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  }
  async function fetchNotes() {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();
      if (filterType === "favorites") params.favorite = "true";
      if (folderId) params.folder = folderId;
      const data = await getNotes(params);
      setNotes(data.notes || []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }
  async function handleCreateNewNote() {
    try {
      const payload = {
        title: "Untitled Note",
        pages: [{ width: 794, height: 1123, objects: [] }],
        categories: selectedCategory ? [selectedCategory] : [],
        folder: folderId || null,
      };
      const data = await createNote(payload);
      navigate(`/note-editor/${data.note._id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }
  async function handleCardFavoriteToggle(e, noteId) {
    e.stopPropagation();
    try {
      const data = await toggleFavorite(noteId);
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, isFavorite: data.isFavorite } : n))
      );
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }
  async function handleQuickMoveFolder(e, noteId, newFolderId) {
    e.stopPropagation();
    try {
      const data = await updateNote(noteId, { folder: newFolderId || null });
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, folder: data.note.folder } : n))
      );
    } catch (err) {
      console.error("Failed to move note folder:", err);
    }
  }
  async function handleDeleteNote(e, noteId) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }
  function handleEditNote(e, noteId) {
    e.stopPropagation();
    navigate(`/note-editor/${noteId}`);
  }
  const activeFolder = folders.find((f) => f._id === folderId);
  return (
    <div className="min-h-screen bg-[#fdf9f1] text-[#1c1c17] font-sans antialiased overflow-x-hidden">
      <Sidebar />
      <main className="min-h-screen md:ml-[280px] pt-16 md:pt-6 px-4 sm:px-6 md:px-10 pb-16">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1c17]">
                {activeFolder
                  ? activeFolder.name
                  : filterType === "favorites"
                  ? "Favorite Notes"
                  : filterType === "recents"
                  ? "Recent Notes"
                  : "All Notes"}
              </h2>
              {activeFolder && (
                <span
                  className="h-3.5 w-3.5 rounded-full shadow-2xs shrink-0"
                  style={{ backgroundColor: activeFolder.color || "#0040df" }}
                />
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#5f5e5d] mt-1">
              {activeFolder
                ? activeFolder.description || "Notes assigned to this folder."
                : filterType === "favorites"
                ? "Your starred and quick-access workspace documents."
                : "Manage, review, and filter all your workspace notes."}
            </p>
          </div>
          <button
            onClick={handleCreateNewNote}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0040df] text-white py-2.5 px-4 rounded-lg hover:bg-[#0035bd] transition-colors font-medium shadow-sm text-sm shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Note
          </button>
        </header>
        <div className="mb-6">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5f5e5d] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full bg-white border border-[#c4c5d9] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1c1c17] placeholder-[#747688] outline-none focus:border-[#0040df] transition-colors shadow-[0_1px_3px_rgba(28,28,23,0.04)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 border-b border-[#c4c5d9]/50 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              selectedCategory === null
                ? "bg-[#0040df] text-white shadow-xs"
                : "bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0]"
            }`}
          >
            All Tags
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(isSelected ? null : cat._id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#0040df] text-white shadow-xs"
                    : "bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0]"
                }`}
              >
                #{cat.name}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div className="py-24 text-center text-sm text-[#5f5e5d]">
            Loading your notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-[#c4c5d9] bg-white p-8 sm:p-12 text-center shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)]">
            <span className="material-symbols-outlined text-4xl text-[#5f5e5d] mb-2">
              note_stack
            </span>
            <p className="text-base font-semibold text-[#1c1c17]">No notes found</p>
            <p className="text-xs text-[#5f5e5d] mt-1 mb-4">
              {filterType === "favorites"
                ? "You haven't starred any notes yet."
                : "Try a different filter or create a new note."}
            </p>
            <button
              onClick={handleCreateNewNote}
              className="text-xs font-semibold text-[#0040df] hover:underline cursor-pointer"
            >
              + Create a new note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {notes.map((noteItem) => (
              <article
                key={noteItem._id}
                onClick={() => navigate(`/note/${noteItem._id}`)}
                className="bg-white border border-[#c4c5d9] rounded-xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[14rem] shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)] relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className="flex items-center gap-1.5 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={
                          typeof noteItem.folder === "object"
                            ? noteItem.folder?._id || ""
                            : noteItem.folder || ""
                        }
                        onChange={(e) =>
                          handleQuickMoveFolder(e, noteItem._id, e.target.value)
                        }
                        className="h-6 max-w-[120px] sm:max-w-none rounded bg-[#f1ede6] border border-[#c4c5d9]/60 px-1.5 text-[11px] font-semibold text-[#5f5e5d] hover:border-[#0040df] outline-none cursor-pointer truncate"
                      >
                        <option value="">📁 No Folder</option>
                        {folders.map((f) => (
                          <option key={f._id} value={f._id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCardFavoriteToggle(e, noteItem._id)}
                        className="text-[#5f5e5d] hover:text-[#eab308] transition-colors cursor-pointer"
                        title={noteItem.isFavorite ? "Unstar note" : "Star note"}
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={
                            noteItem.isFavorite
                              ? { fontVariationSettings: "'FILL' 1", color: "#eab308" }
                              : undefined
                          }
                        >
                          star
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleEditNote(e, noteItem._id)}
                        className="text-[#5f5e5d] hover:text-[#0040df] transition-colors cursor-pointer"
                        title="Edit note"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(e, noteItem._id)}
                        className="text-[#5f5e5d] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-[#1c1c17] group-hover:text-[#0040df] transition-colors line-clamp-2 break-words">
                    {noteItem.title || "Untitled Note"}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#c4c5d9]/30">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {noteItem.categories?.length > 0 ? (
                      noteItem.categories.map((c) => (
                        <span
                          key={c._id || c}
                          className="px-2 py-0.5 bg-[#f1ede6] text-[11px] font-medium rounded text-[#5f5e5d] truncate max-w-[100px]"
                        >
                          #{c.name || "Tag"}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#747688] font-mono">
                        No tags
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#747688]">
                    {new Date(noteItem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
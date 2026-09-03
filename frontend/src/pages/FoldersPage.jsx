import { useEffect, useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import CreateFolderModal from "../components/Folders/CreateFolderModal";
import AddNotesModal from "../components/Folders/AddNotesModal";
import FolderCard from "../components/Folders/FolderCard";
import { getFolders, createFolder, deleteFolder } from "../api/folder.js";
import { getNotes, updateNote } from "../api/notes.js";
export default function FoldersPage() {
  const [folders, setFolders] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetFolder, setTargetFolder] = useState(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    try {
      setLoading(true);
      const [foldersData, notesData] = await Promise.all([
        getFolders(),
        getNotes({ limit: 100 }),
      ]);
      setFolders(foldersData.folders || []);
      setAllNotes(notesData.notes || []);
    } catch (err) {
      console.error("Failed to load folders or notes:", err);
    } finally {
      setLoading(false);
    }
  }
  async function handleCreateFolder(folderData) {
    try {
      const data = await createFolder(folderData);
      setFolders((prev) => [...prev, data.folder]);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  }
  async function handleDeleteFolder(e, folderId) {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this folder? Notes inside will not be deleted."
      )
    )
      return;
    try {
      await deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f._id !== folderId));
      setAllNotes((prev) =>
        prev.map((n) =>
          (typeof n.folder === "object" ? n.folder?._id : n.folder) === folderId
            ? { ...n, folder: null }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  }
  function openAddNotesModal(e, folder) {
    e.stopPropagation();
    setTargetFolder(folder);
    const currentFolderNoteIds = allNotes
      .filter(
        (n) =>
          (typeof n.folder === "object" ? n.folder?._id : n.folder) ===
          folder._id
      )
      .map((n) => n._id);
    setSelectedNoteIds(currentFolderNoteIds);
  }
  async function handleSaveNotesToFolder() {
    if (!targetFolder) return;
    try {
      setAssigning(true);
      const notesToAdd = allNotes.filter(
        (n) =>
          selectedNoteIds.includes(n._id) &&
          (typeof n.folder === "object" ? n.folder?._id : n.folder) !==
            targetFolder._id
      );
      const notesToRemove = allNotes.filter(
        (n) =>
          !selectedNoteIds.includes(n._id) &&
          (typeof n.folder === "object" ? n.folder?._id : n.folder) ===
            targetFolder._id
      );
      await Promise.all([
        ...notesToAdd.map((n) =>
          updateNote(n._id, { folder: targetFolder._id })
        ),
        ...notesToRemove.map((n) => updateNote(n._id, { folder: null })),
      ]);
      setAllNotes((prev) =>
        prev.map((n) => {
          if (selectedNoteIds.includes(n._id)) {
            return { ...n, folder: targetFolder };
          }
          if (
            (typeof n.folder === "object" ? n.folder?._id : n.folder) ===
            targetFolder._id
          ) {
            return { ...n, folder: null };
          }
          return n;
        })
      );
      setFolders((prev) =>
        prev.map((f) =>
          f._id === targetFolder._id
            ? { ...f, notesCount: selectedNoteIds.length }
            : f
        )
      );
      setTargetFolder(null);
    } catch (err) {
      console.error("Failed to assign notes to folder:", err);
    } finally {
      setAssigning(false);
    }
  }
  return (
    <div className="min-h-screen bg-[#fdf9f1] text-[#1c1c17] font-sans antialiased overflow-x-hidden">
      <Sidebar />
      <main className="min-h-screen md:ml-[280px] pt-20 md:pt-16 px-4 md:px-10 pb-16">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[#1c1c17] mb-1">
              Folders
            </h2>
            <p className="text-sm text-[#5f5e5d]">
              Organize your workspace notes into dedicated notebooks and
              projects.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto flex items-center gap-2 bg-[#0040df] text-white py-2.5 px-4 rounded-lg hover:bg-[#0035bd] transition-colors font-medium shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              create_new_folder
            </span>
            New Folder
          </button>
        </header>
        {loading ? (
          <div className="py-24 text-center text-sm text-[#5f5e5d]">
            Loading folders...
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-xl border border-[#c4c5d9] bg-white p-12 text-center shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)]">
            <span className="material-symbols-outlined text-4xl text-[#5f5e5d] mb-2">
              folder_open
            </span>
            <p className="text-base font-semibold text-[#1c1c17]">
              No folders yet
            </p>
            <p className="text-xs text-[#5f5e5d] mt-1 mb-4">
              Group notes by subjects, clients, or personal topics.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-semibold text-[#0040df] hover:underline"
            >
              + Create your first folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => {
              const count = allNotes.filter(
                (n) =>
                  (typeof n.folder === "object"
                    ? n.folder?._id
                    : n.folder) === folder._id
              ).length;
              return (
                <FolderCard
                  key={folder._id}
                  folder={folder}
                  noteCount={count}
                  onDelete={handleDeleteFolder}
                  onAddNotes={openAddNotesModal}
                />
              );
            })}
          </div>
        )}
      </main>
      {showCreateModal && (
        <CreateFolderModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateFolder}
        />
      )}
      {targetFolder && (
        <AddNotesModal
          targetFolder={targetFolder}
          allNotes={allNotes}
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          onClose={() => setTargetFolder(null)}
          onSave={handleSaveNotesToFolder}
          assigning={assigning}
        />
      )}
    </div>
  );
}
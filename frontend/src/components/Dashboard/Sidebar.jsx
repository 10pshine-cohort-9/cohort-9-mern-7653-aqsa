import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createNote } from "../../api/notes.js";
import api from "../../api/axios.js";
const menuItems = [
  { icon: "home", label: "Home", path: "/dashboard" },
  { icon: "description", label: "Notes", path: "/notes" },
  { icon: "folder", label: "Folders", path: "/folders" },
  { icon: "star", label: "Favorites", path: "/notes?filter=favorites" },
  { icon: "check_circle", label: "Tasks", path: "/tasks" },
  { icon: "sticky_note_2", label: "Sticky Wall", path: "/stickies" },
];
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  async function handleLogout() {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await api.post("/auth/logout");
      setIsOpen(false);
      window.location.replace("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  }
  async function handleCreateNewNote() {
    if (creatingNote) return;
    try {
      setCreatingNote(true);
      const payload = {
        title: "Untitled Note",
        pages: [{ width: 794, height: 1123, objects: [] }],
        categories: [],
        folder: null,
      };
      const data = await createNote(payload);
      setIsOpen(false);
      navigate(`/note-editor/${data.note._id}`);
    } catch (err) {
      console.error("Failed to create note from sidebar:", err);
    } finally {
      setCreatingNote(false);
    }
  }
  function isItemActive(path) {
    const [targetPath, targetSearch] = path.split("?");
    if (location.pathname !== targetPath) return false;
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(targetSearch || "");
    return currentParams.get("filter") === targetParams.get("filter");
  }
  const renderNavItem = (item, closeDrawer = false) => {
    const active = isItemActive(item.path);
    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          navigate(item.path);
          if (closeDrawer) setIsOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg relative transition-colors text-left text-sm font-medium ${
          active
            ? "text-[#0040df] font-bold bg-[#f1ede6]"
            : "text-[#5f5e5d] hover:bg-[#ece8e0] hover:text-[#1c1c17]"
        }`}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] bg-[#0040df] rounded-r" />
        )}
        <span
          className="material-symbols-outlined text-[22px]"
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {item.icon}
        </span>
        <span>{item.label}</span>
      </button>
    );
  };
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#f7f3eb] border-b border-[#c4c5d9] flex items-center justify-between px-5 z-[60]">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#0040df] flex items-center justify-center text-white font-semibold text-sm shadow-xs">
            N
          </div>
          <h1 className="font-display text-lg font-bold tracking-tight text-[#1c1c17]">
            Notes App
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center text-[#1c1c17] p-1.5 rounded-lg hover:bg-[#ece8e0] transition-colors"
          aria-label="Toggle Navigation Drawer"
        >
          <span className="material-symbols-outlined text-[28px]">
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </header>
      <aside className="hidden md:flex w-[280px] h-screen fixed left-0 top-0 border-r border-[#c4c5d9] bg-[#f7f3eb] flex-col p-6 space-y-4 z-40 select-none">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 mb-6 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#0040df] flex items-center justify-center text-white font-semibold text-sm shadow-xs group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight leading-none text-[#1c1c17]">
              Notes App
            </h1>
            <p className="text-xs text-[#5f5e5d] mt-1 uppercase tracking-widest font-semibold">
              Personal Workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateNewNote}
          disabled={creatingNote}
          className="w-full flex items-center justify-center gap-2 bg-[#0040df] text-white py-3 rounded-lg px-4 hover:bg-[#0035bd] active:scale-[0.99] transition-all font-medium shadow-sm mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>{creatingNote ? "Creating..." : "New Note"}</span>
        </button>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => renderNavItem(item))}
        </nav>
        <div className="mt-auto border-t border-[#c4c5d9] pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium text-[#5f5e5d] hover:bg-[#ece8e0] hover:text-[#1c1c17] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>
      <div
        onClick={() => setIsOpen(false)}
        className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      />
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-[280px] bg-[#f7f3eb] border-r border-[#c4c5d9] p-6 z-50 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          onClick={() => {
            navigate("/dashboard");
            setIsOpen(false);
          }}
          className="flex items-center gap-3 mb-6 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#0040df] flex items-center justify-center text-white font-semibold text-sm shadow-xs">
            N
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight leading-none text-[#1c1c17]">
              Noto
            </h1>
            <p className="text-xs text-[#5f5e5d] mt-1 uppercase tracking-widest font-semibold">
              Personal Workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateNewNote}
          disabled={creatingNote}
          className="w-full flex items-center justify-center gap-2 bg-[#0040df] text-white py-3 rounded-lg px-4 hover:bg-[#0035bd] transition-colors font-medium shadow-sm mb-6 disabled:opacity-70"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>{creatingNote ? "Creating..." : "New Note"}</span>
        </button>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => renderNavItem(item, true))}
        </nav>
        <div className="mt-auto border-t border-[#c4c5d9] pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm font-medium text-[#5f5e5d] hover:bg-[#ece8e0] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
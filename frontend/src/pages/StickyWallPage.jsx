import React, { useEffect, useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import StickyHeader from "../components/Sticky/StickyHeader";
import DraggableSticky from "../components/Sticky/DraggableSticky";
import { getStickies, createSticky, updateSticky, deleteSticky } from "../api/sticky.js";
import { socket } from "../api/socket.js";
import axios from "../api/axios.js";
const STICKY_COLORS = [
  { name: "Yellow", bg: "#fef08a", text: "#713f12" },
  { name: "Green", bg: "#bbf7d0", text: "#14532d" },
  { name: "Pink", bg: "#fbcfe8", text: "#831843" },
  { name: "Blue", bg: "#bae6fd", text: "#0369a1" },
  { name: "Orange", bg: "#fed7aa", text: "#7c2d12" },
];
export default function StickyWallPage() {
  const [stickies, setStickies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(STICKY_COLORS[0].bg);
  const [isCreating, setIsCreating] = useState(false);
  useEffect(() => {
    loadStickies();
    fetchUser();
  }, []);
  async function fetchUser() {
    try {
      const { data } = await axios.get("/auth/profile");
      const user = data?.user?._id || data?.user?.id;
      if (user) {
        setUserId(user.toString());
      }
    } catch (err) {
      console.error("Failed to fetch profile for socket room:", err);
    }
  }
  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) {
      socket.connect();
    }
    const handleConnect = () => {
      socket.emit("join_user_room", userId);
    };
    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);
    socket.on("sticky_created", (newSticky) => {
      setStickies((prev) => {
        if (prev.some((s) => s._id === newSticky._id)) return prev;
        return [...prev, newSticky];
      });
    });
    socket.on("sticky_updated", (updatedSticky) => {
      setStickies((prev) =>
        prev.map((s) => (s._id === updatedSticky._id ? updatedSticky : s))
      );
    });
    socket.on("sticky_deleted", (deletedId) => {
      setStickies((prev) => prev.filter((s) => s._id !== deletedId));
    });
    return () => {
      socket.off("connect", handleConnect);
      socket.off("sticky_created");
      socket.off("sticky_updated");
      socket.off("sticky_deleted");
    };
  }, [userId]);
  async function loadStickies() {
    try {
      setLoading(true);
      const data = await getStickies();
      setStickies(data.stickies || []);
    } catch (err) {
      console.error("Failed to load stickies:", err);
    } finally {
      setLoading(false);
    }
  }
  async function handleCreate(e) {
    e.preventDefault();
    if (!content.trim() || isCreating) return;
    try {
      setIsCreating(true);
      const offset = (stickies.length % 15) * 25;
      const newStickyPayload = {
        title: title.trim(),
        content: content.trim(),
        color,
        position: { x: 50 + offset, y: 50 + offset },
      };
      const data = await createSticky(newStickyPayload);
      setStickies((prev) => {
        if (prev.some((s) => s._id === data.sticky._id)) return prev;
        return [...prev, data.sticky];
      });
      setTitle("");
      setContent("");
      setColor(STICKY_COLORS[0].bg);
    } catch (err) {
      console.error("Failed to create sticky:", err);
    } finally {
      setIsCreating(false);
    }
  }
  async function handleUpdate(id, updates) {
    try {
      setStickies((prev) =>
        prev.map((s) => (s._id === id ? { ...s, ...updates } : s))
      );
      await updateSticky(id, updates);
    } catch (err) {
      console.error("Failed to update sticky:", err);
      loadStickies();
    }
  }
  async function handleDelete(id) {
    try {
      setStickies((prev) => prev.filter((s) => s._id !== id));
      await deleteSticky(id);
    } catch (err) {
      console.error("Failed to delete sticky:", err);
      loadStickies();
    }
  }
  return (
    <div className="flex h-screen bg-[#fdf9f1] text-[#1c1c17] font-sans antialiased overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col md:ml-[280px] h-screen relative overflow-hidden">
        <StickyHeader
          content={content}
          setContent={setContent}
          color={color}
          setColor={setColor}
          stickyColors={STICKY_COLORS}
          isCreating={isCreating}
          onCreate={handleCreate}
        />
        <div className="flex-1 relative overflow-auto bg-[radial-gradient(#c4c5d9_1px,transparent_1px)] [background-size:24px_24px]">
          <div className="relative w-[3000px] h-[3000px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-[#5f5e5d] text-sm">
                Loading wall...
              </div>
            ) : stickies.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5f5e5d]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                  sticky_note_2
                </span>
                <p className="text-sm">Your wall is empty. Pin a note above.</p>
              </div>
            ) : (
              stickies.map((sticky) => (
                <DraggableSticky
                  key={sticky._id}
                  sticky={sticky}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotes, getNote, toggleFavorite } from "../../api/notes.js";
export default function ContinueWriting() {
  const navigate = useNavigate();
  const [latestNote, setLatestNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    loadLatestNote();
  }, []);
  async function loadLatestNote() {
    try {
      setLoading(true);
      const res = await getNotes({ limit: 1 });
      const notesList = res.notes || res || [];
      if (notesList.length > 0) {
        const targetId = notesList[0]._id;
        const fullNoteRes = await getNote(targetId);
        const noteData = fullNoteRes.note || fullNoteRes;
        setLatestNote(noteData);
        setIsFav(!!noteData.isFavorite);
      } else {
        setLatestNote(null);
      }
    } catch (err) {
      console.error("Failed to load latest note:", err);
    } finally {
      setLoading(false);
    }
  }
  async function handleFavoriteClick(e) {
    e.stopPropagation();
    if (!latestNote) return;
    const prevFav = isFav;
    setIsFav(!prevFav);
    try {
      await toggleFavorite(latestNote._id);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setIsFav(prevFav);
    }
  }
  function getSnippet(note) {
    if (!note?.pages || note.pages.length === 0) return "No text content yet...";
    const textObjects = [];
    note.pages.forEach((page) => {
      if (page.objects && Array.isArray(page.objects)) {
        page.objects.forEach((obj) => {
          if ((obj.type === "text" || obj.type === "textbox") && obj.content) {
            textObjects.push(obj.content.trim());
          }
        });
      }
    });
    if (textObjects.length === 0) return "No text content yet...";
    return textObjects.join(" ");
  }
  function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const updated = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - updated) / 1000);
    if (diffInSeconds < 60) return "Updated just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Updated ${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Updated ${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Updated ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    return `Updated ${updated.toLocaleDateString()}`;
  }
  return (
    <section className="lg:col-span-8 min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-[#5f5e5d] uppercase tracking-widest font-semibold">
          Continue Writing
        </h3>
        <button
          onClick={() => navigate("/notes")}
          className="text-[#0040df] hover:text-[#0035bd] text-sm font-semibold transition-colors"
        >
          View All
        </button>
      </div>
      {loading ? (
        <div className="bg-white border border-[#c4c5d9] rounded-xl h-[340px] flex items-center justify-center text-xs text-[#747688]">
          Loading note...
        </div>
      ) : !latestNote ? (
        <div className="bg-white border border-[#c4c5d9] rounded-xl h-[340px] flex flex-col items-center justify-center text-center p-6">
          <span className="material-symbols-outlined text-4xl text-[#5f5e5d] mb-2">
            edit_note
          </span>
          <p className="text-base font-semibold text-[#1c1c17]">No notes available</p>
          <p className="text-xs text-[#5f5e5d] mt-1 mb-4">
            Start capturing your ideas by creating your first note.
          </p>
          <button
            onClick={() => navigate("/note-editor")}
            className="px-4 py-2 bg-[#0040df] text-white text-xs font-semibold rounded-lg hover:bg-[#0035bd] transition-colors"
          >
            Create New Note
          </button>
        </div>
      ) : (
        <article
          onClick={() => navigate(`/note-editor/${latestNote._id}`)}
          className="bg-white border border-[#c4c5d9] rounded-xl p-5 md:p-6 lg:p-8 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden h-[340px] flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)]"
        >
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="flex flex-wrap gap-2 max-h-12 overflow-hidden">
              {latestNote.categories && latestNote.categories.length > 0 ? (
                latestNote.categories.map((cat) => (
                  <span
                    key={cat._id || cat}
                    className="px-2 py-1 bg-[#f1ede6] text-xs rounded text-[#5f5e5d] font-medium tracking-wide"
                  >
                    #{typeof cat === "object" ? cat.name : "Tag"}
                  </span>
                ))
              ) : (
                <span className="px-2 py-1 bg-[#f1ede6] text-xs rounded text-[#5f5e5d] font-medium tracking-wide">
                  General
                </span>
              )}
            </div>
            <button
              onClick={handleFavoriteClick}
              className={`transition-colors shrink-0 ${
                isFav ? "text-[#0040df]" : "text-[#5f5e5d] hover:text-[#0040df]"
              }`}
              aria-label="Favorite"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: `'FILL' ${isFav ? 1 : 0}` }}
              >
                star
              </span>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-2xl md:text-3xl font-semibold text-[#1c1c17] mb-3 group-hover:text-[#0040df] transition-colors break-words">
              {latestNote.title || "Untitled Note"}
            </h4>
            <p className="text-sm md:text-base leading-relaxed text-[#434656] line-clamp-4">
              {getSnippet(latestNote)}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-[#c4c5d9]/30">
            <span className="text-sm text-[#5f5e5d] font-mono">
              {formatRelativeTime(latestNote.updatedAt)}
            </span>
          </div>
        </article>
      )}
    </section>
  );
}
import { useNavigate } from "react-router-dom";
export default function FolderCard({ folder, noteCount, onDelete, onAddNotes }) {
  const navigate = useNavigate();
  return (
    <article
      tabIndex={0}
      onClick={(e) => {
        if (e.target.closest("button")) return;
        navigate(`/notes?folder=${folder._id}`);
      }}
      onKeyDown={(e) => {
        if (e.target.closest("button")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/notes?folder=${folder._id}`);
        }
      }}
      className="bg-white border border-[#c4c5d9] rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between h-56 shadow-[0_10px_30px_-10px_rgba(28,28,23,0.08)] relative overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0040df]"
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: folder.color || "#0040df" }}
      />
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[24px]"
              style={{
                color: folder.color || "#0040df",
                fontVariationSettings: "'FILL' 1",
              }}
            >
              folder
            </span>
            <span className="text-xs font-mono text-[#747688]">
              {noteCount} notes
            </span>
          </div>

          <button
            onClick={(e) => onDelete(e, folder._id)}
            className="text-[#747688] hover:text-[#ba1a1a] p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete folder"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
          </button>
        </div>
        <h3 className="font-display text-xl font-semibold text-[#1c1c17] group-hover:text-[#0040df] transition-colors line-clamp-1">
          {folder.name}
        </h3>
        {folder.description && (
          <p className="text-xs text-[#5f5e5d] mt-1.5 line-clamp-2 leading-relaxed">
            {folder.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[#c4c5d9]/30">
        <button
          type="button"
          onClick={(e) => onAddNotes(e, folder)}
          className="flex items-center gap-1 text-xs font-semibold text-[#0040df] hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">
            note_add
          </span>
          Add Existing Notes
        </button>
        <span className="text-xs font-mono text-[#747688]">Open →</span>
      </div>
    </article>
  );
}
import { useState } from "react";
const FOLDER_COLORS = ["#0040df","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308","#22c55e","#14b8a6"];
export default function CreateFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0040df");
  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description, color });
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white border border-[#c4c5d9] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-[#1c1c17]">
          Create New Folder
        </h3>
        <p className="mt-1 text-xs text-[#5f5e5d]">
          Give your folder a name, description, and accent color.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f5e5d] block mb-1">
              Folder Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. University, Project Alpha"
              className="w-full h-9 rounded-lg border border-[#c4c5d9] px-3 text-xs outline-none focus:border-[#0040df]"/>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f5e5d] block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary..."
              className="w-full h-9 rounded-lg border border-[#c4c5d9] px-3 text-xs outline-none focus:border-[#0040df]"/>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f5e5d] block mb-1.5">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    color === c
                      ? "scale-125 ring-2 ring-offset-2 ring-[#1c1c17]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[#c4c5d9]/40 pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5f5e5d] hover:text-[#1c1c17]">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0040df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0035bd] shadow-sm">
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
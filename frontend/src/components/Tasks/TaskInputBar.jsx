import { useRef } from "react";
export default function TaskInputBar({
  quickTitle,
  quickDescription,
  quickDueDate,
  quickPriority,
  quickNote,
  showQuickNote,
  isQuickSubmitting,
  notes,
  maxTitleLength,
  maxDescLength,
  todayStr,
  tomorrowStr,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onPriorityChange,
  onNoteChange,
  onToggleNote,
  onPresetPill,
  onSubmit,
}) {
  const quickInputRef = useRef(null);
  const quickDateRef = useRef(null);
  const handlePillClick = (type) => {
    onPresetPill(type);
    quickInputRef.current?.focus();
  };
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[#c4c5d9] rounded-xl p-3.5 shadow-[0_2px_8px_-2px_rgba(28,28,23,0.04)] focus-within:border-[#0040df] focus-within:shadow-md transition-all space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[#0040df] text-[22px] ml-1 select-none">
          add_circle
        </span>
        <input
          ref={quickInputRef}
          type="text"
          maxLength={maxTitleLength}
          value={quickTitle}
          onChange={onTitleChange}
          placeholder="Add a task... (e.g., Finalize budget tomorrow)"
          className="flex-1 text-sm font-medium text-[#1c1c17] placeholder-[#747688] bg-transparent outline-none"/>
        <button
          type="button"
          onClick={onToggleNote}
          className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
            showQuickNote || quickDescription || quickNote
              ? "bg-[#f1ede6] text-[#0040df]"
              : "text-[#5f5e5d] hover:bg-[#f1ede6]"
          }`}
          title="Add extra details">
          <span className="material-symbols-outlined text-[16px]">notes</span>
          <span className="hidden sm:inline">{showQuickNote ? "Less" : "+ Details"}</span>
        </button>
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => quickDateRef.current?.showPicker?.() || quickDateRef.current?.focus()}
            className="p-1.5 rounded-lg text-[#5f5e5d] hover:bg-[#f1ede6] hover:text-[#0040df] transition-colors"
            title="Pick date">
            <span className="material-symbols-outlined text-[20px]">event</span>
          </button>
          <input
            ref={quickDateRef}
            type="date"
            value={quickDueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="absolute opacity-0 pointer-events-none w-0 h-0"/>
        </div>
        <button
          type="submit"
          disabled={!quickTitle.trim() || isQuickSubmitting}
          className="bg-[#0040df] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0035bd] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs">
          {isQuickSubmitting ? "..." : "Add"}
        </button>
      </div>
      {showQuickNote && (
        <div className="pt-2.5 border-t border-[#c4c5d9]/30 space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              maxLength={maxDescLength}
              value={quickDescription}
              onChange={onDescriptionChange}
              placeholder="Add details, sub-tasks, or context..."
              className="w-full text-xs text-[#1c1c17] placeholder-[#747688] bg-transparent outline-none px-1 resize-none pr-12"/>
            <span className="absolute bottom-1 right-1 text-[10px] text-[#747688] select-none">
              {quickDescription.length}/{maxDescLength}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5d] shrink-0">
              Associated Note:
            </span>
            <select
              value={quickNote}
              onChange={(e) => onNoteChange(e.target.value)}
              className="h-7 rounded border border-[#c4c5d9] bg-white px-2 text-xs text-[#1c1c17] outline-none focus:border-[#0040df] cursor-pointer max-w-xs">
              <option value="">Select a note...</option>
              {notes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title || "Untitled Note"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 pt-2 border-t border-[#c4c5d9]/30 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5d] mr-1 select-none">
          Due:
        </span>
        <button
          type="button"
          onClick={() => handlePillClick("today")}
          className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
            quickDueDate === todayStr || (!quickDueDate && !quickTitle)
              ? "bg-[#0040df] text-white font-semibold shadow-2xs"
              : "bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0]"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handlePillClick("tomorrow")}
          className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
            quickDueDate === tomorrowStr
              ? "bg-[#0040df] text-white font-semibold shadow-2xs"
              : "bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0]"
          }`}>
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => handlePillClick("next-week")}
          className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0] transition-colors">
          Next Week
        </button>
        {quickDueDate && (
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#0040df] px-2 py-0.5 rounded-md text-xs font-semibold">
            <span>📅 {new Date(quickDueDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <button
              type="button"
              onClick={() => handlePillClick("clear")}
              className="hover:text-red-600 font-bold ml-1 text-xs"
              title="Remove custom date"
            >
              ✕
            </button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5d] select-none">
            Priority:
          </span>
          {["Low", "Medium", "High"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPriorityChange(p)}
              className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                quickPriority === p
                  ? "bg-[#1c1c17] text-white"
                  : "bg-[#f1ede6] text-[#5f5e5d] hover:bg-[#ece8e0]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
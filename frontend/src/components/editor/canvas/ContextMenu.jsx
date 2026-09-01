export default function ContextMenu({ contextMenu, page, totalPages, onMoveObjectToPage, setContextMenu }) {
  if (!contextMenu) return null;
  return (
    <div
      className="absolute z-50 min-w-[170px] rounded-xl border border-[#c4c5d9] bg-white py-1.5 text-xs font-semibold text-[#1c1c17] shadow-2xl"
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1 border-b border-[#c4c5d9]/40 px-3 py-1 text-[10px] uppercase tracking-wider text-[#747688]">
        Move to Page
      </div>
      {totalPages.map((targetPage, idx) => {
        const isCurrent = targetPage._id === page._id;
        return (
          <button
            key={targetPage._id}
            disabled={isCurrent}
            onClick={() => {
              onMoveObjectToPage?.(contextMenu.targetObject, page._id, targetPage._id);
              setContextMenu(null);
            }}
            className={`flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-[#f1ede6] ${
              isCurrent ? "cursor-not-allowed bg-gray-50 opacity-40" : ""
            }`}
          >
            <span>Page {idx + 1}</span>
            {isCurrent && <span className="text-[10px] text-[#747688]">(Current)</span>}
          </button>
        );
      })}
    </div>
  );
}
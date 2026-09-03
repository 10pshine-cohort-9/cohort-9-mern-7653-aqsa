import React from "react";
export default function StickyHeader({content,setContent,color,setColor,stickyColors,isCreating,onCreate,}) {
  return (
    <header className="p-3 sm:p-6 md:p-8 bg-[#fdf9f1] border-b border-[#c4c5d9]/40 z-20 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#1c1c17] mb-1">
          Sticky Wall
        </h2>
        <p className="text-xs sm:text-sm text-[#5f5e5d]">
          Drag, drop, and edit ideas instantly. Scroll to explore more space.
        </p>
      </div>
      <form
        onSubmit={onCreate}
        className="flex items-center gap-2 sm:gap-3 bg-white border border-[#c4c5d9] rounded-xl p-2 shadow-xs w-full max-w-xl">
        <div className="flex items-center gap-1.5 px-1 sm:px-2 border-r border-[#c4c5d9]/45">
          {stickyColors.map((c) => (
            <button
              key={c.bg}
              type="button"
              onClick={() => setColor(c.bg)}
              className={`w-5 h-5 sm:w-4 sm:h-4 rounded-full transition-transform shrink-0 ${
                color === c.bg
                  ? "scale-125 ring-1 ring-offset-1 ring-[#1c1c17]"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c.bg }}
            />
          ))}
        </div>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot something down..."
          className="flex-1 text-xs sm:text-sm bg-transparent outline-none px-2 text-[#1c1c17]"
        />
        <button
          type="submit"
          disabled={!content.trim() || isCreating}
          className="bg-[#0040df] text-white px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0035bd] transition-colors disabled:opacity-50 cursor-pointer shrink-0">
          Pin
        </button>
      </form>
    </header>
  );
}
import React, { useEffect, useRef, useState } from "react";
export default function DraggableSticky({ sticky, onUpdate, onDelete }) {
  const posRef = useRef({
    x: sticky.position?.x || 50,
    y: sticky.position?.y || 50,
  });
  const [pos, setPos] = useState(posRef.current);
  const [isDragging, setIsDragging] = useState(false);
  const [draftTitle, setDraftTitle] = useState(sticky.title || "");
  const [draftContent, setDraftContent] = useState(sticky.content || "");
  const isTitleFocused = useRef(false);
  const isContentFocused = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const handleStart = (clientX, clientY, target) => {
    const tag = target.tagName.toLowerCase();
    if (tag === "textarea" || tag === "input" || tag === "button" || target.closest("button")) {
      return false;
    }
    setIsDragging(true);
    dragStart.current = {
      x: clientX - posRef.current.x,
      y: clientY - posRef.current.y,
    };
    return true;
  };
  const handleMouseDown = (e) => {
    if (handleStart(e.clientX, e.clientY, e.target)) {
      e.preventDefault();
    }
  };
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY, e.target);
    }
  };
  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      if (!isDragging) return;
      const newX = Math.max(0, clientX - dragStart.current.x);
      const newY = Math.max(0, clientY - dragStart.current.y);
      posRef.current = { x: newX, y: newY };
      setPos({ x: newX, y: newY });
    };
    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(sticky._id, { position: posRef.current });
      }
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, sticky._id, onUpdate]);
  useEffect(() => {
    if (!isDragging && sticky.position) {
      posRef.current = { x: sticky.position.x, y: sticky.position.y };
      setPos({ x: sticky.position.x, y: sticky.position.y });
    }
  }, [sticky.position, isDragging]);
  useEffect(() => {
    if (!isTitleFocused.current) {
      setDraftTitle(sticky.title || "");
    }
    if (!isContentFocused.current) {
      setDraftContent(sticky.content || "");
    }
  }, [sticky.title, sticky.content]);
  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute w-60 sm:w-64 rounded-xl shadow-lg flex flex-col min-h-[160px] transition-shadow touch-none ${
        isDragging
          ? "cursor-grabbing shadow-2xl z-50 scale-105"
          : "cursor-grab shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] z-10 hover:shadow-xl hover:z-20"
      }`}
      style={{
        backgroundColor: sticky.color || "#fef08a",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
    >
      <div className="flex items-center justify-between p-2 pt-3 px-4">
        <div className="w-8 h-2 rounded-full bg-black/10 mx-auto" />
        <button
          onClick={() => onDelete(sticky._id)}
          className="text-black/30 hover:text-black/70 p-1 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div className="flex-1 p-4 pt-1 flex flex-col">
        <input
          type="text"
          value={draftTitle}
          onFocus={() => { isTitleFocused.current = true; }}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={(e) => {
            isTitleFocused.current = false;
            if (e.target.value !== sticky.title) {
              onUpdate(sticky._id, { title: e.target.value });
            }
          }}
          className="font-display font-bold text-base sm:text-lg mb-1 bg-transparent outline-none text-[#1c1c17] placeholder-black/40"
          placeholder="Title (Optional)"
        />
        <textarea
          value={draftContent}
          onFocus={() => { isContentFocused.current = true; }}
          onChange={(e) => setDraftContent(e.target.value)}
          onBlur={(e) => {
            isContentFocused.current = false;
            if (e.target.value !== sticky.content) {
              onUpdate(sticky._id, { content: e.target.value });
            }
          }}
          placeholder="Note details..."
          className="w-full flex-1 bg-transparent outline-none resize-none text-xs sm:text-sm text-[#1c1c17] leading-relaxed placeholder-black/40"
        />
      </div>
    </div>
  );
}
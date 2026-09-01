import React, { useState, useEffect, useRef } from "react";
const FONT_FAMILIES = ["Arial", "Inter", "Roboto", "Georgia", "Times New Roman", "Playfair Display", "Merriweather", "Courier New", "Fira Code", "Verdana", "Outfit", "Comic Sans MS", "Impact"];
const HEADING_PRESETS = {
  normal: { label: "Normal Text" },
  h1: { label: "Heading 1 (32px)" },
  h2: { label: "Heading 2 (24px)" },
  h3: { label: "Heading 3 (19px)" },
  quote: { label: "Blockquote" },
};
const COLOR_SWATCHES = ["#000000", "#4b5563", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const HIGHLIGHT_SWATCHES = ["#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa", "#e9d5ff"];
const TOOLS = [
  {
    key: "select",
    label: "Select",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
      </svg>
    ),
  },
  {
    key: "text",
    label: "Text",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 6v12" />
      </svg>
    ),
  },
  {
    key: "pen",
    label: "Draw",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    key: "image",
    label: "Image",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "video",
    label: "Video",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "audio",
    label: "Audio",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    key: "eraser",
    label: "Eraser",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
];
export default function EditorToolbar({ activeTool, setActiveTool, activeStyles, zoomLevel = 100, onZoomChange, onCommand, onBeforeCommand }) {
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0 });
  const colorBtnRef = useRef(null);
  const highlightBtnRef = useRef(null);
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 630) onZoomChange?.(30);
      else if (width <= 830) onZoomChange?.(70);
      else onZoomChange?.(100);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onZoomChange]);
  useEffect(() => {
    function handleOutsideClick(e) {
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target) && highlightBtnRef.current && !highlightBtnRef.current.contains(e.target)) {
        setShowColorPalette(false);
        setShowHighlightPalette(false);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  const textDisabled = !activeStyles;
  const styles = activeStyles || {};
  const currentFontSize = Number(styles.fontSize) || 16;
  function btnClass(active, extra = "") {
    return `flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${active ? "bg-gray-900 text-white shadow-xs" : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"} ${extra}`;
  }
  function adjustFontSize(delta) {
    onCommand("fontSize", Math.max(6, Math.min(200, currentFontSize + delta)));
  }
  const openColorPalette = () => {
    if (colorBtnRef.current) {
      const rect = colorBtnRef.current.getBoundingClientRect();
      setPalettePos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowColorPalette(!showColorPalette);
    setShowHighlightPalette(false);
  };
  const openHighlightPalette = () => {
    if (highlightBtnRef.current) {
      const rect = highlightBtnRef.current.getBoundingClientRect();
      setPalettePos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowHighlightPalette(!showHighlightPalette);
    setShowColorPalette(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-white px-3 py-1.5 shadow-xs">
      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50/50 p-0.5">
        {TOOLS.map((tool) => (
          <button key={tool.key} type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={() => setActiveTool(tool.key)} className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${activeTool === tool.key ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900"}`} title={tool.label}>
            {tool.icon}
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="relative flex items-center">
        <select className={`h-8 rounded-md border px-2 text-xs font-medium transition-all cursor-pointer ${activeTool.startsWith("shape:") ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`} value={activeTool.startsWith("shape:") ? activeTool.split(":")[1] : ""} onMouseDown={() => onBeforeCommand?.()} onChange={(e) => e.target.value && setActiveTool(`shape:${e.target.value}`)} title="Pick shape, then click & drag anywhere on canvas">
          <option value="" disabled>⬡ Shapes</option>
          <option value="rectangle">▭ Rectangle</option>
          <option value="circle">◯ Circle</option>
          <option value="triangle">△ Triangle</option>
          <option value="line">― Line</option>
        </select>
      </div>
      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange?.(Math.max(30, zoomLevel - 15))} className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100" title="Zoom Out">−</button>
        <span className="w-12 text-center text-xs font-semibold text-gray-700">{Math.round(zoomLevel)}%</span>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange?.(Math.min(300, zoomLevel + 15))} className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100" title="Zoom In">+</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange?.(100)} className="rounded border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-50" title="Reset Zoom">100%</button>
      </div>
      {activeTool === "pen" && (
        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
          <label className="relative flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 hover:border-gray-300 cursor-pointer" title="Brush Color">
            <span className="h-3.5 w-3.5 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: activeStyles?.brushColor || "#000000" }} />
            <span className="hidden sm:inline">Color</span>
            <input type="color" value={activeStyles?.brushColor || "#000000"} onChange={(e) => onCommand("brushColor", e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
          <select className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none" value={activeStyles?.brushWidth || 3} onChange={(e) => onCommand("brushWidth", Number(e.target.value))}>
            <option value={1}>1px (Fine)</option>
            <option value={3}>3px (Regular)</option>
            <option value={6}>6px (Medium)</option>
            <option value={12}>12px (Thick)</option>
            <option value={24}>24px (Highlighter)</option>
          </select>
        </div>
      )}
      {activeTool === "eraser" && (
        <div className="flex items-center gap-2 border-l border-gray-200 pl-2">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">Drag over any item to erase</span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("clearDrawings")} className="flex h-7 items-center rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">Clear All Drawings</button>
        </div>
      )}
      <div className="h-5 w-px bg-gray-200 mx-1" />
      <div className={`flex flex-wrap items-center gap-1 transition-opacity ${textDisabled ? "pointer-events-none opacity-40" : ""}`}>
        <select className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none" value={styles.heading || "normal"} onMouseDown={() => onBeforeCommand?.()} onChange={(e) => onCommand("heading", e.target.value)}>
          {Object.entries(HEADING_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}
        </select>
        <select className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none max-w-[120px]" value={styles.fontFamily || "Arial"} onMouseDown={() => onBeforeCommand?.()} onChange={(e) => onCommand("fontFamily", e.target.value)}>
          {FONT_FAMILIES.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
        <div className="flex h-8 items-center rounded-md border border-gray-200 bg-white px-1">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={() => adjustFontSize(-1)} className="flex h-6 w-6 items-center justify-center rounded text-gray-600 hover:bg-gray-100" title="Decrease Font Size">−</button>
          <input type="number" min={6} max={200} value={currentFontSize} onMouseDown={() => onBeforeCommand?.()} onChange={(e) => onCommand("fontSize", Number(e.target.value))} className="w-9 text-center text-xs font-medium border-none outline-none focus:ring-0" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={() => adjustFontSize(1)} className="flex h-6 w-6 items-center justify-center rounded text-gray-600 hover:bg-gray-100" title="Increase Font Size">+</button>
        </div>
        <div className="h-5 w-px bg-gray-200 mx-0.5" />
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.bold)} onClick={() => onCommand("bold")} title="Bold"><strong>B</strong></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.italic)} onClick={() => onCommand("italic")} title="Italic"><span className="italic font-serif">I</span></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.underline)} onClick={() => onCommand("underline")} title="Underline"><span className="underline">U</span></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.strikethrough)} onClick={() => onCommand("strikethrough")} title="Strikethrough"><span className="line-through">S</span></button>
        </div>
        <div className="flex items-center gap-1">
          <div ref={colorBtnRef} className="flex h-8 items-center rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={openColorPalette} className="flex items-center gap-1 cursor-pointer" title="Text Color Palette">
              <span className="font-bold border-b-2" style={{ borderColor: styles.color || "#000000" }}>A</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>
          </div>
          <div ref={highlightBtnRef} className="flex h-8 items-center rounded-md border border-gray-200 bg-white px-1.5 text-xs font-medium text-gray-700">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={openHighlightPalette} className="flex items-center gap-1 cursor-pointer" title="Highlight Color Palette">
              <span className="px-1 rounded text-xs" style={{ backgroundColor: styles.highlight || "#ffff00" }}>H</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>
            {styles.highlight && <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className="ml-1 text-gray-400 hover:text-red-500 text-xs" onClick={() => onCommand("highlight", null)} title="Remove Highlight">✕</button>}
          </div>
        </div>
        {showColorPalette && (
          <div className="fixed z-[9999] flex w-36 flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-2xl" style={{ top: `${palettePos.top}px`, left: `${palettePos.left}px` }} onMouseDown={(e) => e.stopPropagation()}>
            {COLOR_SWATCHES.map((color) => (
              <button key={color} type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={() => { onCommand("color", color); setShowColorPalette(false); }} className="h-5 w-5 rounded-full border border-gray-200 shadow-2xs hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
        {showHighlightPalette && (
          <div className="fixed z-[9999] flex w-32 flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-2xl" style={{ top: `${palettePos.top}px`, left: `${palettePos.left}px` }} onMouseDown={(e) => e.stopPropagation()}>
            {HIGHLIGHT_SWATCHES.map((color) => (
              <button key={color} type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} onClick={() => { onCommand("highlight", color); setShowHighlightPalette(false); }} className="h-5 w-5 rounded border border-gray-200 shadow-2xs hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
        <div className="h-5 w-px bg-gray-200 mx-0.5" />
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.textAlign === "left")} onClick={() => onCommand("align", "left")} title="Align Left"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.textAlign === "center")} onClick={() => onCommand("align", "center")} title="Align Center"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.textAlign === "right")} onClick={() => onCommand("align", "right")} title="Align Right"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.textAlign === "justify")} onClick={() => onCommand("align", "justify")} title="Justify"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.bulletList)} onClick={() => onCommand("bulletList")} title="Bullet List"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.numberedList)} onClick={() => onCommand("numberedList")} title="Numbered List"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h14M7 12h14M7 18h14M3 5v2m0 5h2m-2 4v2h2" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(styles.todoList)} onClick={() => onCommand("todoList")} title="Todo List"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false)} onClick={() => onCommand("outdent")} title="Decrease Indent"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-4-4 4-4m-7 4h16" /></svg></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false)} onClick={() => onCommand("indent")} title="Increase Indent"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l4 4-4 4m7-4H4" /></svg></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false, "text-xs font-bold")} onClick={() => onCommand("uppercase")} title="UPPERCASE">AA</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false, "text-xs lowercase font-bold")} onClick={() => onCommand("lowercase")} title="lowercase">aa</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false, "text-xs capitalize font-bold")} onClick={() => onCommand("titlecase")} title="Title Case">Aa</button>
        </div>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); onBeforeCommand?.(); }} className={btnClass(false, "border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600")} onClick={() => onCommand("clearFormatting")} title="Clear All Formatting">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2H10.828a2 2 0 01-1.414-.586L3 12z" /></svg>
        </button>
      </div>
    </div>
  );
}
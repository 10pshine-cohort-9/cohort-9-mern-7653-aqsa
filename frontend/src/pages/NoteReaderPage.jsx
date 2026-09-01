import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReaderCanvas from "../components/Reader/ReaderCanvas";
import { getNote } from "../api/notes.js";
function NoteReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [readyPageIds, setReadyPageIds] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);
  const workspaceContainerRef = useRef(null);
  const pageRefs = useRef({});
  const canvasRefs = useRef({});
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 480) {
        setZoomLevel(35);
      } else if (width < 630) {
        setZoomLevel(45);
      } else if (width <= 830) {
        setZoomLevel(70);
      } else {
        setZoomLevel(100);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const loadNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getNote(id);
      setNote(data.note);
      setActivePageIndex(0);
      setReadyPageIds(new Set());
      canvasRefs.current = {};
    } catch (err) {
      console.error("Failed to load note:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    if (!id) {
      navigate("/notes", { replace: true });
      return;
    }
    loadNote();
  }, [id, navigate, loadNote]);
  useEffect(() => {
    const container = workspaceContainerRef.current;
    if (!container) return;
    function handleWheel(e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 10 : -10;
        setZoomLevel((prev) => Math.min(300, Math.max(30, prev + delta)));
      }
    }
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);
  const goToPage = useCallback(
    (index) => {
      if (!note?.pages?.length) return;
      const clamped = Math.min(Math.max(index, 0), note.pages.length - 1);
      setActivePageIndex(clamped);
      const page = note.pages[clamped];
      pageRefs.current[page._id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [note]
  );
  useEffect(() => {
    function handleKeyDown(e) {
      if (!note?.pages?.length) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToPage(activePageIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPage(activePageIndex - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePageIndex, note, goToPage]);
  const markPageReady = useCallback((pageId) => {
    if (!pageId) return;
    setReadyPageIds((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      return next;
    });
  }, []);
  useEffect(() => {
    if (!note?.pages?.length) return;
    const timeout = setTimeout(() => {
      const allIds = new Set(note.pages.map((p) => p._id));
      setReadyPageIds(allIds);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [note?._id, note?.pages]);
  const pageCount = note?.pages?.length || 0;
  const allPagesReady = pageCount > 0 && readyPageIds.size >= pageCount;
  async function handleExportPDF() {
    if (!note || !allPagesReady || exporting) return;
    try {
      setExporting(true);
      const { jsPDF } = await import("jspdf");
      let doc = null;
      for (const page of note.pages) {
        const canvasApi = canvasRefs.current[page._id];
        const dataUrl = canvasApi?.getDataURL(2);
        if (!dataUrl) continue;
        const width = page.width || 794;
        const height = page.height || 1123;
        const orientation = width > height ? "landscape" : "portrait";
        if (!doc) {
          doc = new jsPDF({ orientation, unit: "px", format: [width, height] });
        } else {
          doc.addPage([width, height], orientation);
        }
        doc.addImage(dataUrl, "PNG", 0, 0, width, height);
      }
      doc?.save(`${(note.title || "untitled-note").trim()}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setExporting(false);
    }
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf9f1]">
        <p className="text-sm font-semibold text-[#5f5e5d]">Loading note...</p>
      </div>
    );
  }
  if (error || !note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fdf9f1]">
        <p className="text-sm font-semibold text-[#ba1a1a]">This note could not be found.</p>
        <button
          onClick={() => navigate("/notes")}
          className="rounded-lg bg-[#0040df] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0035bd]"
        >
          Back to Notes
        </button>
      </div>
    );
  }
  const categories = note.categories || [];
  const folderName = typeof note.folder === "object" ? note.folder?.name : null;
  return (
    <div className="flex h-screen flex-col bg-[#fdf9f1] text-[#1c1c17] select-none">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#c4c5d9] bg-[#f7f3eb] px-4 sm:px-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate("/notes")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c4c5d9] bg-white text-[#1c1c17] hover:bg-[#f1ede6] transition-colors"
            title="Return to Notes"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="font-display font-bold text-lg md:text-xl text-[#1c1c17] truncate max-w-[180px] sm:max-w-[240px] md:max-w-md">
            {note.title || "Untitled Note"}
          </h1>
          <div className="h-6 w-px bg-[#c4c5d9] mx-1 hidden sm:block" />
          {folderName && (
            <span className="hidden lg:flex items-center h-8 rounded-lg border border-[#c4c5d9] bg-white px-2.5 text-xs font-semibold text-[#5f5e5d]">
              📁 {folderName}
            </span>
          )}
          {categories.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 ml-1 max-w-[240px] overflow-hidden">
              {categories.map((cat) => {
                const catId = typeof cat === "object" ? cat._id : cat;
                const catName = typeof cat === "object" ? cat.name : "Tag";
                return (
                  <span
                    key={catId}
                    className="px-2.5 py-1 bg-[#f1ede6] border border-[#c4c5d9]/60 text-xs font-semibold rounded text-[#5f5e5d]"
                  >
                    #{catName}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:block text-xs font-mono font-semibold text-[#5f5e5d]">
            Page {activePageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-[#c4c5d9] bg-white px-1 h-9">
            <button
              onClick={() => setZoomLevel((z) => Math.max(30, z - 10))}
              className="flex h-7 w-7 items-center justify-center rounded text-[#5f5e5d] hover:bg-[#f1ede6]"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="w-10 text-center text-xs font-semibold text-[#5f5e5d]">
              {Math.round(zoomLevel)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(300, z + 10))}
              className="flex h-7 w-7 items-center justify-center rounded text-[#5f5e5d] hover:bg-[#f1ede6]"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={!allPagesReady || exporting}
            title={allPagesReady ? "Export this note as a PDF" : "Waiting for pages to finish loading..."}
            className={`flex items-center gap-1.5 rounded-lg border px-3 sm:px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
              !allPagesReady || exporting
                ? "border-[#c4c5d9] bg-[#ece8e0] text-[#747688] cursor-not-allowed"
                : "border-[#c4c5d9] bg-white text-[#1c1c17] hover:bg-[#f1ede6]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {exporting ? "hourglass_top" : "picture_as_pdf"}
            </span>
            <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export PDF"}</span>
          </button>
          <button
            onClick={() => navigate(`/note-editor/${note._id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0040df] px-3 sm:px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0035bd] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        {pageCount > 1 && (
          <aside className="hidden sm:flex w-20 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-[#c4c5d9] bg-[#f7f3eb] py-4">
            {note.pages.map((page, index) => (
              <button
                key={page._id}
                onClick={() => goToPage(index)}
                className={`flex h-14 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-all ${
                  activePageIndex === index
                    ? "border-[#0040df] bg-white text-[#0040df] ring-2 ring-[#0040df]/30"
                    : "border-[#c4c5d9] bg-white text-[#5f5e5d] hover:border-[#0040df]"
                }`}
                title={`Go to page ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </aside>
        )}
        <main
          ref={workspaceContainerRef}
          className="flex flex-1 overflow-auto bg-[#f1ede6] p-4 sm:p-8 md:p-12 justify-center items-start"
          onClick={() => setSelectedMediaId(null)}
        >
          <div
            className="flex flex-col items-center gap-8 sm:gap-12 origin-top transition-transform duration-100"
            style={{
              transform: `scale(${zoomLevel / 100})`,
            }}
          >
            {note.pages?.map((page, index) => {
              const mediaOverlays =
                page.objects?.filter((obj) => obj.type === "video" || obj.type === "audio") || [];
              return (
                <div
                  key={page._id}
                  ref={(el) => (pageRefs.current[page._id] = el)}
                  className="relative flex flex-col items-center max-w-full"
                >
                  <div
                    className={`relative bg-white rounded-lg shadow-[0_10px_30px_-10px_rgba(28,28,23,0.1)] transition-all ${
                      activePageIndex === index
                        ? "ring-2 ring-[#0040df] ring-offset-4 ring-offset-[#f1ede6]"
                        : "border border-[#c4c5d9]"
                    }`}
                  >
                    <ReaderCanvas
                      ref={(el) => (canvasRefs.current[page._id] = el)}
                      page={page}
                      onReady={markPageReady}
                    />
                    {mediaOverlays.map((media, idx) => {
                      const keyId = media._id || media.publicId || idx;
                      return (
                        <div
                          key={keyId}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMediaId(keyId);
                          }}
                          className={`absolute z-10 flex flex-col rounded-lg bg-white shadow-md border overflow-hidden ${
                            selectedMediaId === keyId
                              ? "border-[#0040df] ring-2 ring-[#0040df]/30"
                              : "border-[#c4c5d9]"
                          }`}
                          style={{
                            left: `${media.x || 50}px`,
                            top: `${media.y || 50}px`,
                            width: media.width ? `${media.width}px` : "320px",
                          }}
                        >
                          <div className="flex h-8 items-center px-3 text-xs font-semibold bg-[#f7f3eb] text-[#5f5e5d]">
                            {media.type.toUpperCase()}
                          </div>
                          <div>
                            {media.type === "video" ? (
                              <video src={media.url} controls className="w-full rounded-b" />
                            ) : (
                              <audio src={media.url} controls className="w-full p-2 bg-[#fdf9f1]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="mt-3 text-xs font-mono font-semibold text-[#5f5e5d]">
                    Page {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
export default NoteReaderPage;
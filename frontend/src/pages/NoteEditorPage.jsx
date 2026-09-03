import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FabricCanvas from "../components/editor/FabricCanvas";
import EditorToolbar from "../components/editor/EditorToolbar";
import { getNote, updateNote, addPage } from "../api/notes.js";
import { getCategories, createCategory } from "../api/category.js";
import { getFolders,createFolder } from "../api/folder.js";
function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [activePageId, setActivePageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSaveCategoryPrompt, setShowSaveCategoryPrompt] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTool, setActiveTool] = useState("select");
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [activeStyles, setActiveStyles] = useState(null);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const canvasRefs = useRef({});
  const workspaceContainerRef = useRef(null);
  const initialTouchDistanceRef = useRef(null);
  const initialZoomRef = useRef(100);
  const noteRef = useRef(note);
  noteRef.current = note;
  function handleBackClick() {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      navigate("/notes");
    }
  }
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [noteData, categoriesData, foldersData] = await Promise.all([
        getNote(id),
        getCategories().catch(() => ({ categories: [] })),
        getFolders().catch(() => ({ folders: [] })),
      ]);
      const loadedNote = noteData.note;
      setNote(loadedNote);
      setAvailableCategories(categoriesData.categories || categoriesData || []);
      setAvailableFolders(foldersData.folders || []);
      setIsDirty(false);
      if (loadedNote.pages?.length > 0) {
        setActivePageId(loadedNote.pages[0]._id);
      }
    } catch (error) {
      console.error("Failed to load editor data:", error);
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    if (!id) {
      navigate("/notes", { replace: true });
      return;
    }
    loadInitialData();
  }, [id, navigate, loadInitialData]);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  useEffect(() => {
    const container = workspaceContainerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 8 : -8;
        setZoomLevel((prev) => Math.min(300, Math.max(30, prev + delta)));
      }
    };
    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialTouchDistanceRef.current = getTouchDistance(e.touches);
        initialZoomRef.current = zoomLevel;
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialTouchDistanceRef.current) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scaleFactor = currentDistance / initialTouchDistanceRef.current;
        const newZoom = Math.min(
          300,
          Math.max(30, Math.round(initialZoomRef.current * scaleFactor))
        );
        setZoomLevel(newZoom);
      }
    };
    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialTouchDistanceRef.current = null;
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [zoomLevel]);
  function handleToggleCategory(category) {
    setIsDirty(true);
    setNote((prev) => {
      if (!prev) return prev;
      const targetId = category._id;
      const currentList = prev.categories || [];
      const exists = currentList.some(
        (cat) => (typeof cat === "object" ? cat._id : cat) === targetId
      );
      const updatedCategories = exists
        ? currentList.filter(
            (cat) => (typeof cat === "object" ? cat._id : cat) !== targetId
          )
        : [...currentList, category];
      return { ...prev, categories: updatedCategories };
    });
  }
  async function handleCreateNewCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await createCategory(newCategoryName.trim());
      const created = res.category || res;
      setAvailableCategories((prev) => [...prev, created]);
      handleToggleCategory(created);
      setNewCategoryName("");
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }
  async function handleCreateNewFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await createFolder({
        name: newFolderName.trim(),
      });
      const created = res.folder || res;
      setAvailableFolders((prev) => [...prev, created]);
      setIsDirty(true);
      setNote((prev) => ({
        ...prev,
        folder: created,
      }));
      setNewFolderName("");
      setShowFolderDropdown(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  }
  const handlePageObjectsChange = useCallback((pageId, canvasObjects) => {
    setIsDirty(true);
    setNote((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((p) => {
          if (p._id !== pageId) return p;
          const existingMedia = p.objects.filter(
            (o) => o.type === "video" || o.type === "audio"
          );
          return { ...p, objects: [...canvasObjects, ...existingMedia] };
        }),
      };
    });
  }, []);
  async function executeSave() {
    setShowSaveCategoryPrompt(false);
    const currentNote = noteRef.current;
    if (!currentNote) return false;
    try {
      setSaving(true);
      Object.values(canvasRefs.current).forEach((canvasRef) => {
        canvasRef?.syncSelection?.();
      });
      const payload = {
        title: currentNote.title,
        pages: currentNote.pages,
        categories: (currentNote.categories || []).map((cat) =>
          typeof cat === "object" ? cat._id : cat
        ),
        folder:
          typeof currentNote.folder === "object"
            ? currentNote.folder?._id
            : currentNote.folder || null,
      };
      await updateNote(currentNote._id, payload);
      setIsDirty(false);
      setSaveError(null);
      return true;
    } catch (error) {
      console.error("Failed to save note:", error);
      setSaveError("Could not save this note. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }
  const handleMediaAdd = useCallback((pageId, newMediaObj) => {
    setIsDirty(true);
    setNote((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        pages: prev.pages.map((p) => {
          if (p._id !== pageId) return p;
          return { ...p, objects: [...p.objects, newMediaObj] };
        }),
      };
      noteRef.current = updated;
      return updated;
    });
    setActiveTool("select");
    setTimeout(() => {
      executeSave();
    }, 0);
  }, []);
  const handleMediaPositionChange = useCallback(
    (pageId, mediaObjRef, newX, newY) => {
      setIsDirty(true);
      setNote((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => {
            if (page._id !== pageId) return page;
            return {
              ...page,
              objects: page.objects.map((obj) => {
                const matches =
                  (obj._id && mediaObjRef._id && obj._id === mediaObjRef._id) ||
                  (obj.publicId &&
                    mediaObjRef.publicId &&
                    obj.publicId === mediaObjRef.publicId) ||
                  (obj.url && mediaObjRef.url && obj.url === mediaObjRef.url);
                if (matches) {
                  return { ...obj, x: newX, y: newY };
                }
                return obj;
              }),
            };
          }),
        };
      });
    },
    []
  );
  const handleDeleteMedia = (pageId, mediaObjRef) => {
    setIsDirty(true);
    setNote((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        if (page._id !== pageId) return page;
        return {
          ...page,
          objects: page.objects.filter((obj) => {
            const matches =
              (obj._id && obj._id === mediaObjRef._id) ||
              (obj.publicId && obj.publicId === mediaObjRef.publicId);
            return !matches;
          }),
        };
      }),
    }));
    setSelectedMediaId(null);
  };
  const handleMoveObjectToPage = useCallback(
    async (rawObj, sourcePageId, targetPageId) => {
      if (sourcePageId === targetPageId) return;
      let exportedObj = null;
      if (rawObj.type === "textbox") {
        exportedObj = {
          type: "text",
          x: Math.max(0, rawObj.left || 0),
          y: Math.max(0, rawObj.top || 0),
          width: rawObj.width || 0,
          height: rawObj.height || 0,
          rotation: rawObj.angle || 0,
          scaleX: rawObj.scaleX || 1,
          scaleY: rawObj.scaleY || 1,
          content: rawObj.text || "",
          style: {
            fill: rawObj.fill,
            fontSize: rawObj.fontSize,
            fontFamily: rawObj.fontFamily,
            fontWeight: rawObj.fontWeight,
            fontStyle: rawObj.fontStyle,
            underline: rawObj.underline,
            linethrough: rawObj.linethrough,
            textAlign: rawObj.textAlign,
            textBackgroundColor: rawObj.textBackgroundColor,
            lineHeight: rawObj.lineHeight,
            charSpacing: rawObj.charSpacing,
          },
          charStyles: rawObj.styles || {},
        };
      } else if (rawObj.type === "image") {
        const media = rawObj.__media || {};
        exportedObj = {
          type: "image",
          x: Math.max(0, rawObj.left || 0),
          y: Math.max(0, rawObj.top || 0),
          width: rawObj.width || 0,
          height: rawObj.height || 0,
          rotation: rawObj.angle || 0,
          scaleX: rawObj.scaleX || 1,
          scaleY: rawObj.scaleY || 1,
          url: media.url || "",
          publicId: media.publicId || "",
          resourceType: "image",
          filename: media.filename || "",
          size: media.size || 0,
        };
      } else if (
        rawObj.__shapeType ||
        ["rect", "circle", "triangle", "line"].includes(rawObj.type)
      ) {
        exportedObj = {
          type: "shape",
          x: Math.max(0, rawObj.left || 0),
          y: Math.max(0, rawObj.top || 0),
          width: rawObj.width || 0,
          height: rawObj.height || 0,
          rotation: rawObj.angle || 0,
          scaleX: rawObj.scaleX || 1,
          scaleY: rawObj.scaleY || 1,
          style: {
            shapeType: rawObj.__shapeType || rawObj.type,
            fill: rawObj.fill || "transparent",
            stroke: rawObj.stroke || "#000000",
            strokeWidth: rawObj.strokeWidth || 2,
            rx: rawObj.rx || 0,
            ry: rawObj.ry || 0,
          },
        };
      } else if (rawObj.type === "path") {
        exportedObj = {
          type: "drawing",
          x: Math.max(0, rawObj.left || 0),
          y: Math.max(0, rawObj.top || 0),
          width: rawObj.width || 0,
          height: rawObj.height || 0,
          rotation: rawObj.angle || 0,
          scaleX: rawObj.scaleX || 1,
          scaleY: rawObj.scaleY || 1,
          drawing: {
            path: rawObj.path,
            fill: rawObj.fill || null,
            stroke: rawObj.stroke || "#000000",
            strokeWidth: rawObj.strokeWidth || 3,
            strokeLineCap: rawObj.strokeLineCap || "round",
            strokeLineJoin: rawObj.strokeLineJoin || "round",
          },
        };
      }
      if (!exportedObj) return;
      const targetCanvasRef = canvasRefs.current[targetPageId];
      if (!targetCanvasRef) return;
      try {
        const success = await targetCanvasRef.addObjectFromData(exportedObj);
        if (success === false) {
          console.error("Target canvas failed to add object, skipping source removal.");
          return;
        }
      } catch (error) {
        console.error("Failed to move object to page:", error);
        return;
      }
      canvasRefs.current[sourcePageId]?.removeObject(rawObj);
      setIsDirty(true);
    },
    []
  );
  async function handleAddPage() {
    try {
      const data = await addPage(id);
      setNote((prev) => ({ ...prev, pages: [...prev.pages, data.page] }));
      setActivePageId(data.page._id);
      setIsDirty(true);
    } catch (error) {
      console.error("Failed to add page:", error);
    }
  }
  function handleSaveClick() {
    if (!note) return;
    if (!note.categories || note.categories.length === 0) {
      setShowSaveCategoryPrompt(true);
    } else {
      executeSave();
    }
  }
  function getActiveCanvasRef() {
    return canvasRefs.current[activePageId];
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf9f1]">
        <p className="text-sm font-semibold text-[#5f5e5d]">Loading editor...</p>
      </div>
    );
  }
  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf9f1]">
        <p className="text-sm font-semibold text-[#ba1a1a]">Note not found.</p>
      </div>
    );
  }
  const assignedCategoryIds = (note.categories || []).map((c) =>
    typeof c === "object" ? c._id : c
  );
  return (
    <div className="flex h-screen w-full max-w-full flex-col overflow-x-hidden bg-[#fdf9f1] text-[#1c1c17] select-none">
      <header className="flex w-full shrink-0 flex-col gap-2 border-b border-[#c4c5d9] bg-[#f7f3eb] px-3 py-2 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-1 sm:min-w-0 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={handleBackClick}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c4c5d9] bg-white text-[#1c1c17] transition-colors hover:bg-[#f1ede6]"
              title="Return to Notes"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <input
              value={note.title || ""}
              onChange={(e) => {
                setIsDirty(true);
                setNote((prev) => ({ ...prev, title: e.target.value }));
              }}
              placeholder="Untitled Note"
              className="w-full min-w-[120px] truncate border-none bg-transparent font-display text-base font-bold text-[#1c1c17] outline-none focus:ring-0 sm:max-w-[240px] sm:text-lg md:max-w-md md:text-xl"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            {isDirty && (
              <span className="rounded bg-[#ffdad6] px-2 py-0.5 font-mono text-[10px] text-[#ba1a1a]">
                Unsaved
              </span>
            )}
            <button
              onClick={handleSaveClick}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                saving || !isDirty
                  ? "cursor-not-allowed bg-[#ece8e0] text-[#747688]"
                  : "bg-[#0040df] text-white hover:bg-[#0035bd]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 overflow-x-auto pb-1 sm:w-auto sm:justify-end sm:pb-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="relative flex items-center">
              <div className="flex items-center gap-1.5">
                {note.folder ? (
                  <span className="flex items-center gap-1 rounded border border-[#c4c5d9]/60 bg-[#f1ede6] px-2 py-1 text-xs font-semibold text-[#5f5e5d]">
                    📁{" "}
                    {typeof note.folder === "object"
                      ? note.folder.name
                      : availableFolders.find((f) => f._id === note.folder)?.name || "Folder"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setNote((prev) => ({ ...prev, folder: null }));
                      }}
                      className="ml-0.5 text-[#5f5e5d] hover:text-[#ba1a1a]"
                    >
                      ✕
                    </button>
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderDropdown((prev) => !prev);
                    setShowCategoryDropdown(false);
                  }}
                  className="flex h-8 items-center gap-1 rounded-lg border border-[#c4c5d9] bg-white px-2.5 text-xs font-semibold text-[#5f5e5d] transition-colors hover:bg-[#f1ede6]"
                >
                  <span>+ Folder</span>
                </button>
              </div>
              {showFolderDropdown && (
                <div
                  className="absolute left-0 top-10 z-50 w-60 rounded-xl border border-[#c4c5d9] bg-white p-3 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#5f5e5d]">
                    Select Folder
                  </p>
                  <div className="mb-2 max-h-36 space-y-1 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setNote((prev) => ({ ...prev, folder: null }));
                        setShowFolderDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                        !note.folder ? "bg-[#0040df] font-semibold text-white" : "text-[#1c1c17] hover:bg-[#f1ede6]"
                      }`}
                    >
                      <span>📁 No Folder</span>
                      {!note.folder && <span>✓</span>}
                    </button>
                    {availableFolders.map((folder) => {
                      const selectedFolderId =
                        typeof note.folder === "object" ? note.folder?._id : note.folder;
                      const isSelected = selectedFolderId === folder._id;
                      return (
                        <button
                          key={folder._id}
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            setNote((prev) => ({ ...prev, folder }));
                            setShowFolderDropdown(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isSelected ? "bg-[#0040df] font-semibold text-white" : "text-[#1c1c17] hover:bg-[#f1ede6]"
                          }`}
                        >
                          <span>📁 {folder.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <form onSubmit={handleCreateNewFolder} className="flex gap-1.5 border-t border-[#c4c5d9]/40 pt-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="New folder..."
                      className="h-7 w-full rounded border border-[#c4c5d9] px-2 text-xs outline-none focus:border-[#0040df]"
                    />
                    <button type="submit" className="h-7 rounded bg-[#0040df] px-2.5 text-xs font-semibold text-white hover:bg-[#0035bd]">
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
            <div className="relative flex items-center gap-1.5">
              <div className="flex max-w-[100px] items-center gap-1.5 overflow-hidden sm:max-w-[200px]">
                {(note.categories || []).map((cat) => {
                  const catId = typeof cat === "object" ? cat._id : cat;
                  const catName =
                    typeof cat === "object"
                      ? cat.name
                      : availableCategories.find((c) => c._id === catId)?.name || "Tag";
                  return (
                    <span
                      key={catId}
                      className="flex items-center gap-1 rounded border border-[#c4c5d9]/60 bg-[#f1ede6] px-2 py-1 text-xs font-semibold text-[#5f5e5d]"
                    >
                      #{catName}
                      <button
                        type="button"
                        onClick={() => handleToggleCategory({ _id: catId })}
                        className="text-[#5f5e5d] hover:text-[#ba1a1a]"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex h-8 items-center gap-1 rounded-lg border border-[#c4c5d9] bg-white px-2.5 text-xs font-semibold text-[#5f5e5d] transition-colors hover:bg-[#f1ede6]"
              >
                <span>+ Tag</span>
              </button>
              {showCategoryDropdown && (
                <div
                  className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-[#c4c5d9] bg-white p-3 shadow-xl sm:left-0 sm:right-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#5f5e5d]">
                    Select Tags
                  </p>
                  <div className="mb-2 max-h-36 space-y-1 overflow-y-auto">
                    {availableCategories.map((category) => {
                      const isSelected = assignedCategoryIds.includes(category._id);
                      return (
                        <button
                          key={category._id}
                          type="button"
                          onClick={() => handleToggleCategory(category)}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isSelected ? "bg-[#0040df] font-semibold text-white" : "text-[#1c1c17] hover:bg-[#f1ede6]"
                          }`}
                        >
                          <span>#{category.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <form onSubmit={handleCreateNewCategory} className="flex gap-1.5 border-t border-[#c4c5d9]/40 pt-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category..."
                      className="h-7 w-full rounded border border-[#c4c5d9] px-2 text-xs outline-none focus:border-[#0040df]"
                    />
                    <button type="submit" className="h-7 rounded bg-[#0040df] px-2.5 text-xs font-semibold text-white hover:bg-[#0035bd]">
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {isDirty && (
              <span className="rounded bg-[#ffdad6] px-2.5 py-1 font-mono text-xs text-[#ba1a1a]">
                Unsaved
              </span>
            )}
            <button
              onClick={handleSaveClick}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                saving || !isDirty
                  ? "cursor-not-allowed bg-[#ece8e0] text-[#747688]"
                  : "bg-[#0040df] text-white hover:bg-[#0035bd]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </header>
      <div className="w-full shrink-0 overflow-x-auto bg-white">
        <EditorToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeStyles={activeStyles}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onCommand={(cmd, val) => getActiveCanvasRef()?.runCommand(cmd, val)}
          onBeforeCommand={() => getActiveCanvasRef()?.syncSelection()}
        />
      </div>
      <main
        ref={workspaceContainerRef}
        className="flex w-full flex-1 items-start justify-center overflow-auto bg-[#f1ede6] p-4 touch-pan-x touch-pan-y sm:p-8 md:p-12"
        onClick={() => {
          setSelectedMediaId(null);
          setShowCategoryDropdown(false);
          setShowFolderDropdown(false);
        }}
      >
        <div
          className="flex origin-top flex-col items-center gap-8 transition-transform duration-75 sm:gap-12"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            width: `${100 / (zoomLevel / 100)}%`,
          }}
        >
          {note.pages?.map((page, index) => {
            const mediaOverlays =
              page.objects?.filter(
                (obj) => obj.type === "video" || obj.type === "audio"
              ) || [];
            return (
              <div
                key={page._id}
                className="relative flex max-w-full flex-col items-center"
                onClick={() => setActivePageId(page._id)}
              >
                <div
                  className={`relative rounded-lg bg-white shadow-[0_10px_30px_-10px_rgba(28,28,23,0.1)] transition-all ${
                    activePageId === page._id
                      ? "ring-2 ring-[#0040df] ring-offset-4 ring-offset-[#f1ede6]"
                      : "border border-[#c4c5d9]"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FabricCanvas
                    ref={(el) => (canvasRefs.current[page._id] = el)}
                    page={page}
                    totalPages={note.pages}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onObjectsChange={(objs) => handlePageObjectsChange(page._id, objs)}
                    onStylesChange={setActiveStyles}
                    onMediaAdd={(media) => handleMediaAdd(page._id, media)}
                    onActivatePage={() => setActivePageId(page._id)}
                    onMoveObjectToPage={handleMoveObjectToPage}
                    onAutoSave={executeSave}
                  />
                  {mediaOverlays.map((media, idx) => {
                    const keyId = media._id || media.publicId || idx;
                    return (
                      <DraggableMedia
                        key={keyId}
                        media={media}
                        isSelected={selectedMediaId === keyId}
                        onSelect={() => setSelectedMediaId(keyId)}
                        onDelete={() => handleDeleteMedia(page._id, media)}
                        onDragEnd={(x, y) =>
                          handleMediaPositionChange(page._id, media, x, y)
                        }
                      />
                    );
                  })}
                </div>
                <span className="mt-3 font-mono text-xs font-semibold text-[#5f5e5d]">
                  Page {index + 1}
                </span>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddPage}
            className="mb-8 flex items-center gap-2 rounded-xl border border-dashed border-[#c4c5d9] bg-white/70 px-6 py-3 text-sm font-semibold text-[#1c1c17] shadow-sm transition-all hover:border-[#0040df] hover:bg-white"
          >
            <span className="material-symbols-outlined text-[20px] text-[#0040df]">
              add_circle
            </span>
            Add Next Page
          </button>
        </div>
      </main>
      {showSaveCategoryPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          onClick={() => setShowSaveCategoryPrompt(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#c4c5d9] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-[#1c1c17]">
              Organize this note
            </h3>
            <p className="mt-1 text-xs text-[#5f5e5d]">
              Pick tags so you can easily filter this in your workspace.
            </p>
            <div className="my-4 max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {availableCategories.length === 0 ? (
                <p className="py-2 text-center text-xs text-[#747688]">
                  No categories created yet.
                </p>
              ) : (
                availableCategories.map((category) => {
                  const isSelected = assignedCategoryIds.includes(category._id);
                  return (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => handleToggleCategory(category)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2 text-xs transition-all ${
                        isSelected
                          ? "border-[#0040df] bg-[#f1ede6] font-semibold text-[#0040df]"
                          : "border-[#c4c5d9] text-[#1c1c17] hover:bg-[#f7f3eb]"
                      }`}
                    >
                      <span>#{category.name}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })
              )}
            </div>
            <form onSubmit={handleCreateNewCategory} className="mb-4 flex gap-1.5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Create new tag..."
                className="h-8 flex-1 rounded-lg border border-[#c4c5d9] px-2.5 text-xs outline-none focus:border-[#0040df]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#f1ede6] px-3 text-xs font-semibold text-[#1c1c17] hover:bg-[#ece8e0]"
              >
                Add
              </button>
            </form>
            <div className="flex items-center justify-end gap-2 border-t border-[#c4c5d9]/40 pt-4">
              <button
                type="button"
                onClick={() => executeSave()}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#5f5e5d] hover:text-[#1c1c17]"
              >
                Skip & Save
              </button>
              <button
                type="button"
                onClick={() => executeSave()}
                className="rounded-lg bg-[#0040df] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0035bd]"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
      {showUnsavedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          onClick={() => setShowUnsavedModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#c4c5d9] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-[#1c1c17]">
              Unsaved Changes
            </h3>
            <p className="mt-1 text-xs text-[#5f5e5d]">
              You have unsaved changes in your note. Leaving now will discard your modifications.
            </p>
            {saveError && (
              <p className="mt-2 text-xs font-medium text-[#ba1a1a]">{saveError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#c4c5d9]/40 pt-4">
              <button
                type="button"
                onClick={() => navigate("/notes")}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={async () => {
                  const saved = await executeSave();
                  if (saved) navigate("/notes");
                }}
                className="rounded-lg bg-[#0040df] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0035bd]"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function DraggableMedia({ media, isSelected, onSelect, onDelete, onDragEnd }) {
  const [pos, setPos] = useState({ x: media.x || 50, y: media.y || 50 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;
  useEffect(() => {
    setPos({ x: media.x || 50, y: media.y || 50 });
  }, [media.x, media.y]);
  const handleMouseDown = (e) => {
    e.preventDefault();
    onSelect();
    setDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      const newPos = {
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      };
      setPos(newPos);
      posRef.current = newPos;
    };
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        onDragEnd(posRef.current.x, posRef.current.y);
      }
    };
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onDragEnd]);
  return (
    <div
      onClick={onSelect}
      className={`absolute z-10 flex flex-col overflow-hidden rounded-lg border bg-white shadow-md ${
        isSelected ? "border-[#0040df] ring-2 ring-[#0040df]/30" : "border-[#c4c5d9]"
      }`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: media.width ? `${media.width}px` : "320px",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        className={`flex h-8 cursor-grab items-center justify-between px-3 text-xs font-semibold ${
          isSelected ? "bg-[#0040df] text-white" : "bg-[#f7f3eb] text-[#5f5e5d]"
        }`}
      >
        <span>{media.type?.toUpperCase()}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hover:opacity-75"
        >
          ✕
        </button>
      </div>
      <div>
        {media.type === "video" ? (
          <video src={media.url} controls className="w-full rounded-b" />
        ) : (
          <audio src={media.url} controls className="w-full bg-[#fdf9f1] p-2" />
        )}
      </div>
    </div>
  );
}
export default NoteEditorPage;
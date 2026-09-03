import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Canvas, Textbox, FabricImage, PencilBrush, Path, Rect, Circle, Triangle, Line } from "fabric";
import { uploadFile } from "../../api/media.js";

import {configureTextbox,loadImageElement,readActiveStyles,exportCanvasObjectsHelper,} from "../editor/canvas/canvasUtils.js";
import ContextMenu from "../editor/canvas/ContextMenu.jsx";
export const TEXT_MIN_WIDTH = 100;
export const TEXT_MAX_WIDTH = 600;
export const MAX_TEXT_LENGTH = 600;
export const MAX_MEDIA_SIZE = 100 * 1024 * 1024; 

const FabricCanvas = forwardRef(function FabricCanvas(
  {
    page,
    totalPages = [],
    activeTool,
    setActiveTool,
    onObjectsChange,
    onStylesChange,
    onMediaAdd,
    onActivatePage,
    onMoveObjectToPage,
    onAutoSave,
  },
  ref
) {
  const canvasEl = useRef(null);
  const wrapperEl = useRef(null);
  const fabricCanvas = useRef(null);
  const mediaInputRef = useRef(null);
  const activeStylesRef = useRef({});
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isHistoryAction = useRef(false);
  const isInitializing = useRef(true);
  const clipboardObj = useRef(null);
  const brushColorRef = useRef("#000000");
  const brushWidthRef = useRef(3);
  const lastSelection = useRef({ obj: null, start: 0, end: 0 });
  const [warningMessage, setWarningMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const onObjectsChangeRef = useRef(onObjectsChange);
  onObjectsChangeRef.current = onObjectsChange;
  const onStylesChangeRef = useRef(onStylesChange);
  onStylesChangeRef.current = onStylesChange;
  function showToastWarning(msg) {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage(null);
    }, 3000);
  }
  function getCanvasState() {
    const canvas = fabricCanvas.current;
    if (!canvas) return null;
    return JSON.stringify(canvas.toJSON(["__media", "__shapeType"]));
  }
  function recordHistory() {
    const canvas = fabricCanvas.current;
    if (!canvas || isInitializing.current || isHistoryAction.current) return;
    const state = getCanvasState();
    if (!state) return;
    const lastState = undoStack.current[undoStack.current.length - 1];
    if (lastState === state) return;
    undoStack.current.push(state);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }
  function exportCanvasObjects() {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const objects = exportCanvasObjectsHelper(canvas);
    onObjectsChangeRef.current?.(objects);
    return objects;
  }
  function deleteSelectedObject() {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
  }
  function removeObject(obj) {
    const canvas = fabricCanvas.current;
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
  }
  async function addObjectFromData(object) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const safeX = object.x || 50;
    const safeY = object.y || 50;
    if (object.type === "text") {
      let content = object.content || "";
      if (content.length > MAX_TEXT_LENGTH) {
        content = content.substring(0, MAX_TEXT_LENGTH);
      }
      const textbox = new Textbox(content, {
        left: safeX,
        top: safeY,
        width: Math.min(Math.max(object.width || 320, TEXT_MIN_WIDTH), TEXT_MAX_WIDTH),
        splitByGrapheme: false,
        fill: object.style?.fill || "#000000",
        fontSize: object.style?.fontSize || 24,
        fontFamily: object.style?.fontFamily || "Arial",
        fontWeight: object.style?.fontWeight || "normal",
        fontStyle: object.style?.fontStyle || "normal",
        underline: object.style?.underline || false,
        linethrough: object.style?.linethrough || false,
        textAlign: object.style?.textAlign || "left",
        textBackgroundColor: object.style?.textBackgroundColor || "",
        lineHeight: object.style?.lineHeight || 1.15,
        charSpacing: object.style?.charSpacing || 0,
      });
      configureTextbox(textbox);
      if (object.charStyles) textbox.styles = object.charStyles;
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
    } else if (object.type === "image" && object.url) {
      try {
        const imageElement = await loadImageElement(object.url);
        const image = new FabricImage(imageElement, {
          left: safeX,
          top: safeY,
          angle: object.rotation || 0,
          scaleX: object.scaleX || 1,
          scaleY: object.scaleY || 1,
        });
        image.set({
          __media: {
            url: object.url,
            publicId: object.publicId,
            resourceType: "image",
            filename: object.filename,
            size: object.size,
          },
        });
        canvas.add(image);
        canvas.setActiveObject(image);
      } catch (err) {
        console.error("Failed to load image:", err);
      }
    } else if (object.type === "shape") {
      const shapeType = object.style?.shapeType;
      const common = {
        left: safeX,
        top: safeY,
        angle: object.rotation || 0,
        scaleX: object.scaleX || 1,
        scaleY: object.scaleY || 1,
        fill: object.style?.fill || "transparent",
        stroke: object.style?.stroke || "#000000",
        strokeWidth: object.style?.strokeWidth || 2,
        strokeUniform: true,
      };
      let shapeObj = null;
      if (shapeType === "rectangle" || shapeType === "rect") {
        shapeObj = new Rect({
          ...common,
          width: object.width || 140,
          height: object.height || 90,
          rx: object.style?.rx || 8,
          ry: object.style?.ry || 8,
        });
      } else if (shapeType === "circle") {
        shapeObj = new Circle({ ...common, radius: (object.width || 100) / 2 });
      } else if (shapeType === "triangle") {
        shapeObj = new Triangle({ ...common, width: object.width || 110, height: object.height || 100 });
      } else if (shapeType === "line") {
        const { x1, y1, x2, y2 } = object.style || {};
        const linePoints = [x1, y1, x2, y2].every((v) => typeof v === "number")
          ? [x1, y1, x2, y2]
          : [0, 0, object.width || 200, 0];
        shapeObj = new Line(linePoints, { ...common });
      }
      if (shapeObj) {
        shapeObj.set("__shapeType", shapeType);
        canvas.add(shapeObj);
        canvas.setActiveObject(shapeObj);
      }
    } else if (object.type === "drawing" && object.drawing?.path) {
      try {
        const path = new Path(object.drawing.path, {
          left: safeX,
          top: safeY,
          angle: object.rotation || 0,
          scaleX: object.scaleX || 1,
          scaleY: object.scaleY || 1,
          fill: object.drawing.fill || null,
          stroke: object.drawing.stroke || "#000000",
          strokeWidth: object.drawing.strokeWidth || 3,
          strokeLineCap: object.drawing.strokeLineCap || "round",
          strokeLineJoin: object.drawing.strokeLineJoin || "round",
        });
        canvas.add(path);
        canvas.setActiveObject(path);
      } catch (err) {
        console.error("Failed to load drawing path:", err);
      }
    }
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
  }
  async function undo() {
    const canvas = fabricCanvas.current;
    if (!canvas || isHistoryAction.current || undoStack.current.length <= 1) return;
    const previousUndoStack = [...undoStack.current];
    const previousRedoStack = [...redoStack.current];
    try {
      isHistoryAction.current = true;
      const currentState = undoStack.current.pop();
      redoStack.current.push(currentState);
      const previousState = undoStack.current[undoStack.current.length - 1];
      await canvas.loadFromJSON(JSON.parse(previousState));
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "textbox") configureTextbox(obj);
      });
      canvas.renderAll();
      exportCanvasObjects();
      updateStyles();
    } catch (error) {
      undoStack.current = previousUndoStack;
      redoStack.current = previousRedoStack;
      console.error("Undo error:", error);
    } finally {
      isHistoryAction.current = false;
    }
  }

  async function redo() {
    const canvas = fabricCanvas.current;
    if (!canvas || isHistoryAction.current || redoStack.current.length === 0) return;
    const previousUndoStack = [...undoStack.current];
    const previousRedoStack = [...redoStack.current];
    try {
      isHistoryAction.current = true;
      const nextState = redoStack.current.pop();
      undoStack.current.push(nextState);
      await canvas.loadFromJSON(JSON.parse(nextState));
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "textbox") configureTextbox(obj);
      });
      canvas.renderAll();
      exportCanvasObjects();
      updateStyles();
    } catch (error) {
      undoStack.current = previousUndoStack;
      redoStack.current = previousRedoStack;
      console.error("Redo error:", error);
    } finally {
      isHistoryAction.current = false;
    }
  }
  async function copySelectedObject() {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || (active.type === "textbox" && active.isEditing)) return;
    const cloned = await active.clone(["__media", "__shapeType"]);
    clipboardObj.current = cloned;
  }
  async function pasteObject() {
    const canvas = fabricCanvas.current;
    if (!canvas || !clipboardObj.current) return;
    const clonedObj = await clipboardObj.current.clone(["__media", "__shapeType"]);
    canvas.discardActiveObject();
    let newLeft = (clonedObj.left || 0) + 20;
    let newTop = (clonedObj.top || 0) + 20;
    clonedObj.set({ left: newLeft, top: newTop, evented: true });
    if (clonedObj.type === "textbox") {
      configureTextbox(clonedObj);
    }
    canvas.add(clonedObj);
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
  }
  async function handleMediaSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_SIZE) {
      showToastWarning(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — max upload size is 100MB.`);
      event.target.value = "";
      setActiveTool("select");
      return;
    }
    try {
      const canvas = fabricCanvas.current;
      if (!canvas) return;
      const uploaded = await uploadFile(file);
      const mediaType = uploaded.resourceType || file.type.split("/")[0];
      if (mediaType === "video" || mediaType === "audio") {
        onMediaAdd?.({
          type: mediaType,
          x: 50,
          y: 50,
          width: mediaType === "video" ? 400 : 320,
          height: mediaType === "video" ? 225 : 60,
          url: uploaded.url,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          filename: uploaded.filename,
          size: uploaded.size,
          duration: uploaded.duration || 0,
        });
      } else {
        const imageElement = await loadImageElement(uploaded.url);
        const image = new FabricImage(imageElement);
        const maxWidth = 400;
        const maxHeight = 400;
        let scale = 1;
        if (image.width > maxWidth) scale = maxWidth / image.width;
        if (image.height * scale > maxHeight) scale = maxHeight / image.height;
        image.set({
          left: 50,
          top: 50,
          scaleX: scale,
          scaleY: scale,
          __media: {
            url: uploaded.url,
            publicId: uploaded.publicId,
            resourceType: "image",
            filename: uploaded.filename,
            size: uploaded.size,
          },
        });
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        exportCanvasObjects();
        setActiveTool("select");
        if (onAutoSave) {
          await onAutoSave();
        }
      }
    } catch (error) {
      console.error("Failed to add media:", error);
      const status = error?.response?.status || error?.status;
      const message = status === 413 || /too large|exceeds|size/i.test(error?.message || "")
        ? "That file is too large — max upload size is 10MB."
        : "Failed to upload media. Please try again.";
      showToastWarning(message);
    }
    event.target.value = "";
  }
  function saveCurrentSelection() {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && obj.type === "textbox") {
      if (obj.isEditing || lastSelection.current.start === lastSelection.current.end) {
        lastSelection.current = {
          obj,
          start: obj.selectionStart ?? 0,
          end: obj.selectionEnd ?? 0,
        };
      }
    }
  }
  function updateStyles() {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") {
      activeStylesRef.current = {};
      onStylesChangeRef.current?.(null);
      return;
    }
    saveCurrentSelection();
    const styles = readActiveStyles(obj);
    activeStylesRef.current = styles;
    onStylesChangeRef.current?.(styles);
  }
  function applyFormatting(styleMap) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const obj = lastSelection.current.obj || canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") return;
    const start = lastSelection.current.start ?? 0;
    const end = lastSelection.current.end ?? 0;
    const hasSelection = start !== end;
    if (hasSelection) {
      obj.setSelectionStyles(styleMap, start, end);
    } else {
      obj.set(styleMap);
      if (obj.text?.length) {
        for (let i = 0; i < obj.text.length; i++) {
          obj.setSelectionStyles(styleMap, i, i + 1);
        }
      }
    }
    obj.styles = JSON.parse(JSON.stringify(obj.styles || {}));
    obj.dirty = true;
    obj.initDimensions();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
    updateStyles();
  }
  function applyListPrefix(listType) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    let obj = lastSelection.current.obj || canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") return;
    const text = obj.text || "";
    const start = obj.selectionStart ?? lastSelection.current.start ?? 0;
    const end = obj.selectionEnd ?? lastSelection.current.end ?? text.length;
    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIdx = text.indexOf("\n", end);
    const blockEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    const block = text.slice(lineStart, blockEnd);
    const lines = block.split("\n");
    const ANY_PREFIX_RE = /^(•\s|\d+\.\s|\[\]\s|\[x\]\s)/;
    const TYPE_PREFIX_RE = {
      bullet: /^•\s/,
      numbered: /^\d+\.\s/,
      todo: /^(\[\]|\[x\])\s/,
    }[listType];
    const isAlreadyThisType = lines.every((line) => TYPE_PREFIX_RE.test(line) || line.trim() === "");
    let counter = 1;
    function markerFor() {
      if (listType === "bullet") return "• ";
      if (listType === "numbered") return `${counter++}. `;
      if (listType === "todo") return "[] ";
      return "";
    }
    const newLines = lines.map((line) => {
      const clean = line.replace(ANY_PREFIX_RE, "");
      if (isAlreadyThisType) return clean;
      if (line.trim() === "") return line;
      return markerFor() + clean;
    });
    const newBlock = newLines.join("\n");
    const fullNewText = text.slice(0, lineStart) + newBlock + text.slice(blockEnd);
    if (fullNewText.length > MAX_TEXT_LENGTH) {
      showToastWarning(`Character limit (${MAX_TEXT_LENGTH}) reached!`);
      return;
    }
    obj.set("text", fullNewText);
    obj.styles = {};
    if (obj.initDimensions) obj.initDimensions();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
    updateStyles();
  }
  function applyIndentation(isIndent) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    let obj = lastSelection.current.obj || canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") return;
    const text = obj.text || "";
    const start = obj.selectionStart ?? lastSelection.current.start ?? 0;
    const end = obj.selectionEnd ?? lastSelection.current.end ?? text.length;
    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIdx = text.indexOf("\n", end);
    const blockEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    const block = text.slice(lineStart, blockEnd);
    const lines = block.split("\n");
    const INDENT_UNIT = "    ";
    const newLines = lines.map((line) => {
      if (isIndent) return INDENT_UNIT + line;
      return line.replace(/^ {1,4}/, "");
    });
    const fullNewText = text.slice(0, lineStart) + newLines.join("\n") + text.slice(blockEnd);
    if (fullNewText.length > MAX_TEXT_LENGTH) {
      showToastWarning(`Character limit (${MAX_TEXT_LENGTH}) reached!`);
      return;
    }
    obj.set("text", fullNewText);
    obj.styles = {};
    if (obj.initDimensions) obj.initDimensions();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
    updateStyles();
  }
  function applyCaseTransform(fn) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    let obj = lastSelection.current.obj || canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") return;
    const text = obj.text || "";
    const start = obj.selectionStart ?? lastSelection.current.start ?? 0;
    const end = obj.selectionEnd ?? lastSelection.current.end ?? text.length;
    if (start !== end) {
      const selected = text.slice(start, end);
      const replaced = text.slice(0, start) + fn(selected) + text.slice(end);
      obj.set("text", replaced);
    } else {
      obj.set("text", fn(text));
    }
    if (obj.initDimensions) obj.initDimensions();
    canvas.requestRenderAll();
    recordHistory();
    exportCanvasObjects();
    updateStyles();
  }
  useEffect(() => {
    if (!canvasEl.current || !page) return;
    const canvas = new Canvas(canvasEl.current, {
      width: page.width || 794,
      height: page.height || 1123,
      backgroundColor: page.background?.value || "#fff",
      preserveObjectStacking: true,
      fireRightClick: true,
      stopContextMenu: true,
    });
    fabricCanvas.current = canvas;
    isInitializing.current = true;
    isHistoryAction.current = false;
    undoStack.current = [];
    redoStack.current = [];
    const handleCanvasChange = () => {
      if (isInitializing.current || isHistoryAction.current) return;
      recordHistory();
      exportCanvasObjects();
    };
    canvas.on("object:scaling", (e) => {
      const obj = e.target;
      if (!obj) return;
      if (obj.type === "textbox") {
        const currentWidth = obj.width * obj.scaleX;
        let clampedWidth = Math.min(Math.max(currentWidth, TEXT_MIN_WIDTH), TEXT_MAX_WIDTH);
        obj.set({ width: clampedWidth, scaleX: 1, scaleY: 1 });
        if (typeof obj.initDimensions === "function") {
          obj.initDimensions();
        }
      }
      canvas.requestRenderAll();
    });
    canvas.on("text:changed", (e) => {
      const tb = e.target;
      if (tb && tb.type === "textbox") {
        if (tb.text && tb.text.length > MAX_TEXT_LENGTH) {
          tb.text = tb.text.substring(0, MAX_TEXT_LENGTH);
          if (typeof tb.initDimensions === "function") {
            tb.initDimensions();
          }
          showToastWarning(`Character limit reached (${MAX_TEXT_LENGTH} chars max per box).`);
        }
      }
      handleCanvasChange();
    });
    canvas.on("object:added", handleCanvasChange);
    canvas.on("object:removed", handleCanvasChange);
    canvas.on("object:modified", () => {
      handleCanvasChange();
      canvas.defaultCursor = "default";
      canvas.setCursor("default");
    });
    canvas.on("text:editing:exited", handleCanvasChange);
    canvas.on("selection:created", () => {
      onActivatePage?.(page._id);
      updateStyles();
    });
    canvas.on("selection:updated", () => {
      onActivatePage?.(page._id);
      updateStyles();
    });
    canvas.on("selection:cleared", () => {
      activeStylesRef.current = {};
      onStylesChangeRef.current?.(null);
    });
    canvas.on("text:editing:entered", updateStyles);
    canvas.on("text:selection:changed", () => {
      const obj = canvas.getActiveObject();
      if (obj && obj.type === "textbox") {
        lastSelection.current = {
          obj,
          start: obj.selectionStart ?? 0,
          end: obj.selectionEnd ?? 0,
        };
      }
      updateStyles();
    });
    loadObjects(canvas, page.objects || []).then(() => {
      isInitializing.current = false;
      const initialState = getCanvasState();
      undoStack.current = initialState ? [initialState] : [];
    });
    return () => {
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, [page?._id]);
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const wrapper = wrapperEl.current;
    if (wrapper) wrapper.addEventListener("contextmenu", handleContextMenu);
    return () => {
      if (wrapper) wrapper.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  useEffect(() => {
    if (!contextMenu) return;
    function handleOutsideClick() {
      setContextMenu(null);
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [contextMenu]);
  useEffect(() => {
    function handleWindowPaste(e) {
      const canvas = fabricCanvas.current;
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      const isEditingText = activeObject?.type === "textbox" && activeObject.isEditing;
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedText = clipboardData?.getData("text/plain");
      if (!pastedText) return;
      if (isEditingText) {
        e.preventDefault();
        const currentText = activeObject.text || "";
        const availableSpace = MAX_TEXT_LENGTH - currentText.length;
        if (availableSpace <= 0) {
          showToastWarning(`Cannot paste. Character limit (${MAX_TEXT_LENGTH}) reached.`);
          return;
        }
        let textToInsert = pastedText;
        if (pastedText.length > availableSpace) {
          textToInsert = pastedText.substring(0, availableSpace);
          showToastWarning(`Pasted text was truncated to fit the ${MAX_TEXT_LENGTH} char limit.`);
        }
        if (typeof activeObject.insertChars === "function") {
          activeObject.insertChars(textToInsert);
        } else {
          const cursorPosition = activeObject.selectionStart || currentText.length;
          const newText =
            currentText.slice(0, cursorPosition) +
            textToInsert +
            currentText.slice(activeObject.selectionEnd || cursorPosition);
          activeObject.set("text", newText);
          activeObject.selectionStart = cursorPosition + textToInsert.length;
          activeObject.selectionEnd = cursorPosition + textToInsert.length;
        }
        if (typeof activeObject.initDimensions === "function") {
          activeObject.initDimensions();
        }
        canvas.requestRenderAll();
        recordHistory();
        exportCanvasObjects();
      }
    }
    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, []);
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    let isDrawingShape = false;
    let shapeOrigin = { x: 0, y: 0 };
    let tempShape = null;
    let isErasing = false;
    function eraseTarget(target) {
      if (!target) return;
      canvas.remove(target);
      canvas.requestRenderAll();
      recordHistory();
      exportCanvasObjects();
    }
    function handleMouseDown(opt) {
      if (opt.e.button === 2) {
        const target = opt.target;
        if (target && wrapperEl.current && fabricCanvas.current) {
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
          const bound = target.getBoundingRect();
          const canvasWidth = canvas.getWidth();
          let menuLeft = bound.left + bound.width + 12;
          let menuTop = bound.top;
          const MENU_WIDTH = 170;
          if (menuLeft + MENU_WIDTH > canvasWidth) {
            menuLeft = Math.max(10, bound.left - MENU_WIDTH - 12);
          }
          setContextMenu({ x: menuLeft, y: menuTop, targetObject: target });
        }
        return;
      }
      setContextMenu(null);
      const pointer = canvas.getScenePoint(opt.e);
      if (activeTool === "eraser") {
        isErasing = true;
        if (opt.target) eraseTarget(opt.target);
        return;
      }
      if (activeTool === "text" && !opt.target) {
        const safeX = Math.min(Math.max(20, pointer.x), (page.width || 794) - 340);
        const safeY = Math.min(Math.max(20, pointer.y), (page.height || 1123) - 100);
        const textbox = new Textbox("Type or paste here...", {
          left: safeX,
          top: safeY,
          width: 320,
          fontSize: 20,
          fontFamily: "Arial",
          fill: "#000000",
          lineHeight: 1.15,
          charSpacing: 0,
        });
        configureTextbox(textbox);
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        textbox.enterEditing();
        textbox.selectAll();
        exportCanvasObjects();
        updateStyles();
        setActiveTool("select");
        return;
      }
      if (activeTool.startsWith("shape:")) {
        const shapeType = activeTool.split(":")[1];
        isDrawingShape = true;
        shapeOrigin = { x: pointer.x, y: pointer.y };
        const commonProps = {
          left: pointer.x,
          top: pointer.y,
          fill: "rgba(59,130,246,0.2)",
          stroke: "#2563eb",
          strokeWidth: 2,
          strokeUniform: true,
        };
        if (shapeType === "rectangle") {
          tempShape = new Rect({ ...commonProps, width: 1, height: 1, rx: 6, ry: 6 });
        } else if (shapeType === "circle") {
          tempShape = new Circle({ ...commonProps, radius: 1 });
        } else if (shapeType === "triangle") {
          tempShape = new Triangle({ ...commonProps, width: 1, height: 1 });
        } else if (shapeType === "line") {
          tempShape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: "#000000",
            strokeWidth: 3,
            strokeLineCap: "round",
          });
        }
        if (tempShape) {
          tempShape.set("__shapeType", shapeType);
          canvas.add(tempShape);
        }
      }
    }
    function handleMouseMove(opt) {
      const pointer = canvas.getScenePoint(opt.e);
      if (isErasing && opt.target) {
        eraseTarget(opt.target);
        return;
      }
      if (!isDrawingShape || !tempShape) return;
      const shapeType = activeTool.split(":")[1];
      if (shapeType === "rectangle" || shapeType === "triangle") {
        const width = Math.abs(pointer.x - shapeOrigin.x);
        const height = Math.abs(pointer.y - shapeOrigin.y);
        tempShape.set({
          left: Math.min(shapeOrigin.x, pointer.x),
          top: Math.min(shapeOrigin.y, pointer.y),
          width: Math.max(width, 5),
          height: Math.max(height, 5),
        });
      } else if (shapeType === "circle") {
        const radius = Math.hypot(pointer.x - shapeOrigin.x, pointer.y - shapeOrigin.y) / 2;
        tempShape.set({
          left: Math.min(shapeOrigin.x, pointer.x),
          top: Math.min(shapeOrigin.y, pointer.y),
          radius: Math.max(radius, 5),
        });
      } else if (shapeType === "line") {
        tempShape.set({ x2: pointer.x, y2: pointer.y });
      }
      canvas.requestRenderAll();
    }
    function handleMouseUp() {
      isErasing = false;
      if (isDrawingShape && tempShape) {
        isDrawingShape = false;
        tempShape.setCoords();
        canvas.setActiveObject(tempShape);
        canvas.requestRenderAll();
        recordHistory();
        exportCanvasObjects();
        setActiveTool("select");
      }
    }
    if (activeTool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
    } else if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = brushWidthRef.current;
      canvas.freeDrawingBrush.color = brushColorRef.current;
    } else if (activeTool === "eraser") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      canvas.defaultCursor = "crosshair";
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "text";
    } else if (activeTool.startsWith("shape:")) {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
    } else if (["image", "video", "audio"].includes(activeTool)) {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "default";
      if (mediaInputRef.current) {
        if (activeTool === "video") mediaInputRef.current.accept = "video/*";
        else if (activeTool === "audio") mediaInputRef.current.accept = "audio/*";
        else mediaInputRef.current.accept = "image/*";
        mediaInputRef.current.click();
      }
    }
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [activeTool, page.width, page.height]);
  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTypingInHtmlField =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTypingInHtmlField) return;
      const canvas = fabricCanvas.current;
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      const isEditingText = activeObject?.type === "textbox" && activeObject.isEditing;
      if (isEditingText) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))
      ) {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelectedObject();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteObject();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (activeObject) deleteSelectedObject();
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);
  async function loadObjects(canvas, objects) {
    for (const object of objects) {
      const safeX = object.x || 50;
      const safeY = object.y || 50;
      if (object.type === "text") {
        let content = object.content || "";
        if (content.length > MAX_TEXT_LENGTH) {
          content = content.substring(0, MAX_TEXT_LENGTH);
        }
        const textbox = new Textbox(content, {
          left: safeX,
          top: safeY,
          width: Math.min(Math.max(object.width || 320, TEXT_MIN_WIDTH), TEXT_MAX_WIDTH),
          splitByGrapheme: false,
          fill: object.style?.fill || "#000000",
          fontSize: object.style?.fontSize || 24,
          fontFamily: object.style?.fontFamily || "Arial",
          fontWeight: object.style?.fontWeight || "normal",
          fontStyle: object.style?.fontStyle || "normal",
          underline: object.style?.underline || false,
          linethrough: object.style?.linethrough || false,
          textAlign: object.style?.textAlign || "left",
          textBackgroundColor: object.style?.textBackgroundColor || "",
          lineHeight: object.style?.lineHeight || 1.15,
          charSpacing: object.style?.charSpacing || 0,
        });
        configureTextbox(textbox);
        if (object.charStyles) {
          textbox.set({ styles: JSON.parse(JSON.stringify(object.charStyles)) });
        }
        canvas.add(textbox);
        continue;
      }
      if (object.type === "image" && object.url) {
        try {
          const imageElement = await loadImageElement(object.url);
          const image = new FabricImage(imageElement, {
            left: safeX,
            top: safeY,
            angle: object.rotation || 0,
            scaleX: object.scaleX || 1,
            scaleY: object.scaleY || 1,
          });
          image.set({
            __media: {
              url: object.url,
              publicId: object.publicId,
              resourceType: "image",
              filename: object.filename,
              size: object.size,
            },
          });
          canvas.add(image);
        } catch (err) {
          console.error("Failed to load image:", err);
        }
        continue;
      }
      if (object.type === "shape") {
        const shapeType = object.style?.shapeType;
        const common = {
          left: safeX,
          top: safeY,
          angle: object.rotation || 0,
          scaleX: object.scaleX || 1,
          scaleY: object.scaleY || 1,
          fill: object.style?.fill || "transparent",
          stroke: object.style?.stroke || "#000000",
          strokeWidth: object.style?.strokeWidth || 2,
          strokeUniform: true,
        };
        let shapeObj = null;
        if (shapeType === "rectangle" || shapeType === "rect") {
          shapeObj = new Rect({
            ...common,
            width: object.width || 140,
            height: object.height || 90,
            rx: object.style?.rx || 8,
            ry: object.style?.ry || 8,
          });
        } else if (shapeType === "circle") {
          shapeObj = new Circle({ ...common, radius: (object.width || 100) / 2 });
        } else if (shapeType === "triangle") {
          shapeObj = new Triangle({ ...common, width: object.width || 110, height: object.height || 100 });
        } else if (shapeType === "line") {
          const { x1, y1, x2, y2 } = object.style || {};
          const linePoints = [x1, y1, x2, y2].every((v) => typeof v === "number")
            ? [x1, y1, x2, y2]
            : [0, 0, object.width || 200, 0];
          shapeObj = new Line(linePoints, { ...common });
        }
        if (shapeObj) {
          shapeObj.set("__shapeType", shapeType);
          canvas.add(shapeObj);
        }
        continue;
      }
      if (object.type === "drawing" && object.drawing?.path) {
        try {
          const path = new Path(object.drawing.path, {
            left: safeX,
            top: safeY,
            angle: object.rotation || 0,
            scaleX: object.scaleX || 1,
            scaleY: object.scaleY || 1,
            fill: object.drawing.fill || null,
            stroke: object.drawing.stroke || "#000000",
            strokeWidth: object.drawing.strokeWidth || 3,
            strokeLineCap: object.drawing.strokeLineCap || "round",
            strokeLineJoin: object.drawing.strokeLineJoin || "round",
          });
          canvas.add(path);
        } catch (err) {
          console.error("Failed to load drawing path:", err);
        }
      }
    }
    canvas.requestRenderAll();
  }
  function handleCommand(command, value) {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    if (command === "brushColor") {
      brushColorRef.current = value;
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = value;
      onStylesChangeRef.current?.({ brushColor: value, brushWidth: brushWidthRef.current });
      return;
    }
    if (command === "brushWidth") {
      brushWidthRef.current = value;
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.width = value;
      onStylesChangeRef.current?.({ brushColor: brushColorRef.current, brushWidth: value });
      return;
    }
    const activeStyles = activeStylesRef.current;
    switch (command) {
      case "heading": {
        const presets = {
          normal: { fontSize: 16, fontWeight: "normal", fontStyle: "normal" },
          h1: { fontSize: 32, fontWeight: "bold", fontStyle: "normal" },
          h2: { fontSize: 24, fontWeight: "bold", fontStyle: "normal" },
          h3: { fontSize: 19, fontWeight: "bold", fontStyle: "normal" },
          quote: { fontSize: 18, fontStyle: "italic", fontWeight: "normal" },
        };
        applyFormatting(presets[value]);
        break;
      }
      case "fontFamily":
        applyFormatting({ fontFamily: value });
        break;
      case "fontSize":
        applyFormatting({ fontSize: Number(value) });
        break;
      case "bold":
        applyFormatting({ fontWeight: activeStyles.bold ? "normal" : "bold" });
        break;
      case "italic":
        applyFormatting({ fontStyle: activeStyles.italic ? "normal" : "italic" });
        break;
      case "underline":
        applyFormatting({ underline: !activeStyles.underline });
        break;
      case "strikethrough":
        applyFormatting({ linethrough: !activeStyles.strikethrough });
        break;
      case "color":
        applyFormatting({ fill: value });
        break;
      case "highlight":
        applyFormatting({ textBackgroundColor: value || "" });
        break;
      case "align": {
        const obj = canvas.getActiveObject() || lastSelection.current.obj;
        if (obj && obj.type === "textbox") {
          obj.set("textAlign", value);
          canvas.requestRenderAll();
          recordHistory();
          exportCanvasObjects();
          updateStyles();
        }
        break;
      }
      case "bulletList":
        applyListPrefix("bullet");
        break;
      case "numberedList":
        applyListPrefix("numbered");
        break;
      case "todoList":
        applyListPrefix("todo");
        break;
      case "indent":
        applyIndentation(true);
        break;
      case "outdent":
        applyIndentation(false);
        break;
      case "uppercase":
        applyCaseTransform((t) => t.toUpperCase());
        break;
      case "lowercase":
        applyCaseTransform((t) => t.toLowerCase());
        break;
      case "titlecase":
        applyCaseTransform((t) => t.replace(/\b\w/g, (char) => char.toUpperCase()));
        break;
      case "clearFormatting":
        applyFormatting({
          fontWeight: "normal",
          fontStyle: "normal",
          underline: false,
          linethrough: false,
          fill: "#000000",
          textBackgroundColor: "",
        });
        break;
      default:
        break;
    }
  }
  useImperativeHandle(ref, () => ({
    runCommand: handleCommand,
    deleteObject: deleteSelectedObject,
    removeObject,
    addObjectFromData,
    copy: copySelectedObject,
    paste: pasteObject,
    undo,
    redo,
    syncSelection: updateStyles,
  }));
  return (
    <div
      ref={wrapperEl}
      className="relative flex w-full justify-center overflow-hidden bg-white shadow-xl"
      style={{
        width: "100%",
        maxWidth: `${page?.width || 794}px`,
        height: `${page?.height || 1123}px`,
      }}
    >
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleMediaSelected}
      />
      <canvas ref={canvasEl} />
     {warningMessage && (
  <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-lg transition-all">
    {warningMessage}
  </div>
)}
      <ContextMenu
        contextMenu={contextMenu}
        page={page}
        totalPages={totalPages}
        onMoveObjectToPage={onMoveObjectToPage}
        setContextMenu={setContextMenu}
      />
    </div>
  );
});
export default FabricCanvas;
import { FabricImage } from "fabric";
export function configureTextbox(textbox) {
  if (!textbox || textbox.type !== "textbox") return;
  textbox.setControlVisible("mt", false);
  textbox.setControlVisible("mb", false);
  textbox.set({ splitByGrapheme: false });
}
export function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
export function getCurrentLineText(obj) {
  if (!obj || !obj.text) return "";
  const cursor = obj.selectionStart ?? 0;
  const upToCursor = obj.text.slice(0, cursor);
  const lineStart = upToCursor.lastIndexOf("\n") + 1;
  const lineEnd = obj.text.indexOf("\n", cursor);
  return obj.text.slice(lineStart, lineEnd === -1 ? obj.text.length : lineEnd);
}
export function readActiveStyles(obj) {
  let base = {
    fontFamily: obj.fontFamily || "Arial",
    fontSize: obj.fontSize || 24,
    color: obj.fill || "#000000",
    textAlign: obj.textAlign || "left",
    bold: obj.fontWeight === "bold" || obj.fontWeight === "700",
    italic: obj.fontStyle === "italic",
    underline: !!obj.underline,
    strikethrough: !!obj.linethrough,
    highlight: obj.textBackgroundColor || null,
    lineHeight: obj.lineHeight || 1.15,
    charSpacing: obj.charSpacing || 0,
  };
  const start = obj.selectionStart ?? 0;
  const end = obj.selectionEnd ?? 0;
  if (start !== end && typeof obj.getSelectionStyles === "function") {
    const stylesAtSelection = obj.getSelectionStyles(start, end);
    if (stylesAtSelection && stylesAtSelection.length > 0) {
      const first = stylesAtSelection[0];
      if (first.fontFamily) base.fontFamily = first.fontFamily;
      if (first.fontSize) base.fontSize = first.fontSize;
      if (first.fill) base.color = first.fill;
      if (first.fontWeight !== undefined) {
        base.bold = first.fontWeight === "bold" || first.fontWeight === "700";
      }
      if (first.fontStyle !== undefined) base.italic = first.fontStyle === "italic";
      if (first.underline !== undefined) base.underline = !!first.underline;
      if (first.linethrough !== undefined) base.strikethrough = !!first.linethrough;
      if (first.textBackgroundColor !== undefined) {
        base.highlight = first.textBackgroundColor || null;
      }
    }
  }
  const currentLine = getCurrentLineText(obj);
  base.bulletList = /^•\s/.test(currentLine);
  base.numberedList = /^\d+\.\s/.test(currentLine);
  base.todoList = /^\[\]\s/.test(currentLine) || /^\[x\]\s/.test(currentLine);
  return base;
}
export function exportCanvasObjectsHelper(canvas) {
  if (!canvas) return [];
  const shapeTypes = ["rect", "circle", "triangle", "line", "polygon"];
  return canvas
    .getObjects()
    .map((obj) => {
      if (obj.type === "textbox") {
        return {
          type: "text",
          x: Math.max(0, obj.left || 0),
          y: Math.max(0, obj.top || 0),
          width: obj.width || 0,
          height: obj.height || 0,
          rotation: obj.angle || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          content: obj.text || "",
          style: {
            fill: obj.fill,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            fontWeight: obj.fontWeight,
            fontStyle: obj.fontStyle,
            underline: !!obj.underline,
            linethrough: !!obj.linethrough,
            textAlign: obj.textAlign,
            textBackgroundColor: obj.textBackgroundColor,
            lineHeight: obj.lineHeight,
            charSpacing: obj.charSpacing,
          },
          charStyles: JSON.parse(JSON.stringify(obj.styles || {})),
        };
      }
      if (obj.type === "image") {
        const media = obj.__media || {};
        return {
          type: "image",
          x: Math.max(0, obj.left || 0),
          y: Math.max(0, obj.top || 0),
          width: obj.width || 0,
          height: obj.height || 0,
          rotation: obj.angle || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          url: media.url || "",
          publicId: media.publicId || "",
          resourceType: "image",
          filename: media.filename || "",
          size: media.size || 0,
        };
      }
      if (obj.__shapeType || (shapeTypes.includes(obj.type) && !obj.path?.length)) {
        return {
          type: "shape",
          x: Math.max(0, obj.left || 0),
          y: Math.max(0, obj.top || 0),
          width: obj.width || 0,
          height: obj.height || 0,
          rotation: obj.angle || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          style: {
            shapeType: obj.__shapeType || obj.type,
            fill: obj.fill || "transparent",
            stroke: obj.stroke || "#000000",
            strokeWidth: obj.strokeWidth || 2,
            rx: obj.rx || 0,
            ry: obj.ry || 0,
            x1: obj.x1 ?? null,
            y1: obj.y1 ?? null,
            x2: obj.x2 ?? null,
            y2: obj.y2 ?? null,
            points: obj.points || null,
            path: obj.path
              ? typeof obj.path === "string"
                ? obj.path
                : obj.path.map((p) => p.join("")).join("")
              : null,
          },
        };
      }
      if (obj.type === "path" && !obj.__shapeType) {
        return {
          type: "drawing",
          x: Math.max(0, obj.left || 0),
          y: Math.max(0, obj.top || 0),
          width: obj.width || 0,
          height: obj.height || 0,
          rotation: obj.angle || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          drawing: {
            path: obj.path,
            fill: obj.fill || null,
            stroke: obj.stroke || "#000000",
            strokeWidth: obj.strokeWidth || 3,
            strokeLineCap: obj.strokeLineCap || "round",
            strokeLineJoin: obj.strokeLineJoin || "round",
          },
        };
      }

      return null;
    })
    .filter(Boolean);
}
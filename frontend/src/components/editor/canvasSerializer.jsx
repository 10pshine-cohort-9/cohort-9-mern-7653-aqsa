import { Textbox, FabricImage, Rect, Circle, Triangle, Line, Path, Polygon } from "fabric";
function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
export async function loadObjectsToCanvas(canvas, objects, pageWidth, pageHeight, clampObj) {
  function sanitizeCoordinate(val, max, fallback = 30) {
    if (typeof val !== "number" || isNaN(val) || val < 0) return fallback;
    if (val > max - 40) return Math.max(10, max - 150);
    return val;
  }
  for (const object of objects) {
    const safeX = sanitizeCoordinate(object.x, pageWidth, 50);
    const safeY = sanitizeCoordinate(object.y, pageHeight, 50);
    if (object.type === "text") {
      const textbox = new Textbox(object.content || "", {
        left: safeX,
        top: safeY,
        width: object.width || 320,
        splitByGrapheme: true,
        angle: object.rotation || 0,
        scaleX: object.scaleX || 1,
        scaleY: object.scaleY || 1,
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
      if (object.charStyles) textbox.styles = object.charStyles;
      clampObj(textbox);
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
        clampObj(image);
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
        shapeObj = new Rect({ ...common, width: object.width || 140, height: object.height || 90, rx: object.style?.rx || 8, ry: object.style?.ry || 8 });
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
        clampObj(shapeObj);
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
        });
        clampObj(path);
        canvas.add(path);
      } catch (err) {
        console.error("Failed to load drawing path:", err);
      }
    }
  }
  canvas.requestRenderAll();
}
export function exportCanvasObjects(canvas) {
  if (!canvas) return [];
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
            underline: obj.underline,
            linethrough: obj.linethrough,
            textAlign: obj.textAlign,
            textBackgroundColor: obj.textBackgroundColor,
            lineHeight: obj.lineHeight,
            charSpacing: obj.charSpacing,
          },
          charStyles: obj.styles || {},
        };
      }
      return null;
    })
    .filter(Boolean);
}
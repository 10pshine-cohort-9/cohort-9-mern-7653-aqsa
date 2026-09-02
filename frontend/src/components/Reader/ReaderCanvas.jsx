import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {Canvas,Textbox,FabricImage,Path,Rect,Circle,Triangle,Line,} from "fabric";

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
function normalizePathData(pathData) {
  if (!pathData) return null;
  if (typeof pathData === "string") return pathData;
  if (Array.isArray(pathData)) {
    return pathData
      .map((segment) => (Array.isArray(segment) ? segment.join(" ") : segment))
      .join(" ");
  }
  return null;
}
const ReaderCanvas = forwardRef(function ReaderCanvas({ page, onReady }, ref) {
  const canvasEl = useRef(null);
  const fabricCanvas = useRef(null);
  useImperativeHandle(ref, () => ({
    getDataURL(multiplier = 2) {
      const canvas = fabricCanvas.current;
      if (!canvas) return null;
      return canvas.toDataURL({ format: "png", quality: 1, multiplier });
    },
  }));
  useEffect(() => {
    if (!canvasEl.current || !page) return;

    const canvas = new Canvas(canvasEl.current, {
      width: page.width || 794,
      height: page.height || 1123,
      backgroundColor: page.background?.value || "#ffffff",
      selection: false,
      skipTargetFind: true,
    });
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "default";
    fabricCanvas.current = canvas;

    let cancelled = false;

    async function loadObjects(objects = []) {
      try {
        for (const object of objects) {
          if (cancelled) break;

          try {
            const safeX = object.x || 0;
            const safeY = object.y || 0;
            const locked = { selectable: false, evented: false, hoverCursor: "default" };
            if (object.type === "text") {
              const textbox = new Textbox(object.content || "", {
                left: safeX,
                top: safeY,
                width: object.width || 320,
                splitByGrapheme: true,
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
                ...locked,
              });
              if (object.charStyles) textbox.styles = object.charStyles;
              canvas.add(textbox);
              continue;
            }
            if (object.type === "image" && object.url) {
              try {
                const imageElement = await loadImageElement(object.url);
                if (!cancelled) {
                  const image = new FabricImage(imageElement, {
                    left: safeX,
                    top: safeY,
                    angle: object.rotation || 0,
                    scaleX: object.scaleX || 1,
                    scaleY: object.scaleY || 1,
                    ...locked,
                  });
                  canvas.add(image);
                }
              } catch (err) {
                console.error("Image load skipped:", err);
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
                ...locked,
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
                shapeObj = new Triangle({
                  ...common,
                  width: object.width || 110,
                  height: object.height || 100,
                });
              } else if (shapeType === "line") {
                shapeObj = new Line([0, 0, object.width || 200, 0], { ...common });
              }

              if (shapeObj) canvas.add(shapeObj);
              continue;
            }
            const rawPath = object.drawing?.path || object.path || object.style?.path;
            if (object.type === "drawing" || object.type === "path" || rawPath) {
              const formattedPath = normalizePathData(rawPath);
              if (formattedPath) {
                const pathObj = new Path(formattedPath, {
                  left: safeX,
                  top: safeY,
                  angle: object.rotation || 0,
                  scaleX: object.scaleX || 1,
                  scaleY: object.scaleY || 1,
                  fill: object.drawing?.fill || object.fill || null,
                  stroke: object.drawing?.stroke || object.stroke || "#000000",
                  strokeWidth: object.drawing?.strokeWidth || object.strokeWidth || 3,
                  strokeLineCap: object.drawing?.strokeLineCap || "round",
                  strokeLineJoin: object.drawing?.strokeLineJoin || "round",
                  ...locked,
                });
                canvas.add(pathObj);
              }
            }
          } catch (objError) {
            console.error("Skipping corrupted object:", objError, object);
          }
        }
      } catch (globalErr) {
        console.error("Global canvas error:", globalErr);
      } finally {
        if (!cancelled) {
          canvas.requestRenderAll();
          onReady?.(page._id);
        }
      }
    }
    loadObjects(page.objects || []);
    return () => {
      cancelled = true;
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, [page]);
  return (
    <div
      className="relative bg-white overflow-hidden"
      style={{ width: page?.width || 794, height: page?.height || 1123 }}>
      <canvas ref={canvasEl} />
    </div>
  );
});

export default ReaderCanvas;
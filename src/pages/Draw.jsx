import { useEffect, useRef, useState } from "react";
import { saveSelection } from "../utils/selection";
import { useNavigate } from "react-router-dom";
import "../css/Draw.css";

function Draw() {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const drawingRef = useRef(false);
    const needsRedrawRef = useRef(true);
    const dprRef = useRef(1);
    const [strokes, setStrokes] = useState([]);
    const undoneRef = useRef([]);

    const [tool, setTool] = useState("draw");
    const [color, setColor] = useState("#111111");
    const [size, setSize] = useState(10);
    const [grid, setGrid] = useState(true);
    const liveStrokeRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

        const resize = () => {
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            dprRef.current = dpr;
            const cssW = canvas.clientWidth;
            const cssH = canvas.clientHeight;
            canvas.width = Math.floor(cssW * dpr);
            canvas.height = Math.floor(cssH * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            needsRedrawRef.current = true;
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const drawFrame = () => {
            if (needsRedrawRef.current) {
                needsRedrawRef.current = false;
                redraw(ctx, canvas, strokes, liveStrokeRef.current);
            }
            rafRef.current = requestAnimationFrame(drawFrame);
        };
        rafRef.current = requestAnimationFrame(drawFrame);

        const getPos = (e) => {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };

        const onDown = (e) => {
            e.preventDefault();
            canvas.setPointerCapture?.(e.pointerId);
            undoneRef.current = [];
            drawingRef.current = true;
            const p = getPos(e);
            liveStrokeRef.current = {
                points: [p],
                color,
                size,
                mode: tool === "erase" ? "erase" : "draw",
            };
            needsRedrawRef.current = true;
        };

        const onMove = (e) => {
            if (!drawingRef.current) return;
            const p = getPos(e);
            const ls = liveStrokeRef.current;
            const last = ls.points[ls.points.length - 1];
            if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.8) {
                ls.points.push(p);
                needsRedrawRef.current = true;
            }
        };

        const onUp = () => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            const ls = liveStrokeRef.current;
            liveStrokeRef.current = null;
            if (ls && ls.points.length > 1) {
                setStrokes((prev) => [...prev, simplifyStroke(ls)]);
            }
            needsRedrawRef.current = true;
        };

        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, [color, size, tool, strokes]);
    useEffect(() => {
        needsRedrawRef.current = true;
    }, [grid]);


    const undo = () => {
        setStrokes((prev) => {
            if (!prev.length) return prev;
            const next = prev.slice(0, -1);
            undoneRef.current.push(prev[prev.length - 1]);
            needsRedrawRef.current = true;
            return next;
        });
    };
    const redo = () => {
        if (!undoneRef.current.length) return;
        const s = undoneRef.current.pop();
        setStrokes((prev) => [...prev, s]);
        needsRedrawRef.current = true;
    };
    const clearAll = () => {
        setStrokes([]);
        undoneRef.current = [];
        needsRedrawRef.current = true;
    };

    const exportPNG = () => {
        const canvas = canvasRef.current;
        const trimmed = trimCanvas(canvas);
        const url = trimmed.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "sketch.png";
        a.click();
    };

    const navigate = useNavigate();

    return (
        <main className="draw-root">
            <header className="draw-toolbar" role="toolbar" aria-label="Drawing tools">
                <div className="draw-group">
                    <button
                        className={`draw-btn ${tool === "draw" ? "active" : ""}`}
                        onClick={() => setTool("draw")}
                        title="Pencil (D)"
                    >
                        draw
                    </button>
                    <button
                        className={`draw-btn ${tool === "erase" ? "active" : ""}`}
                        onClick={() => setTool("erase")}
                        title="Eraser (E)"
                    >
                        erase
                    </button>
                </div>

                <div className="draw-group">
                    <label className="draw-label">
                        Color
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                    </label>
                    <label className="draw-label">
                        Pencil Width
                        <input
                            type="range"
                            min="2"
                            max="40"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                        />
                    </label>
                    <label className="draw-check">
                        <input type="checkbox" checked={grid} onChange={() => setGrid((g) => !g)} />
                        Grid
                    </label>
                </div>

                <div className="draw-group">
                    <button className="draw-btn" onClick={undo} title="Undo (Ctrl/Cmd+Z)">Undo</button>
                    <button className="draw-btn" onClick={redo} title="Redo (Ctrl/Cmd+Shift+Z)">Redo</button>
                    <button className="draw-btn" onClick={clearAll} title="Clear">Clear</button>
                </div>

                <div className="draw-group">
                    <button className="draw-btn primary" onClick={exportPNG} title="Export PNG">Download</button>
                    <button
                        className="draw-btn"
                        onClick={() => {
                            const c = canvasRef.current;
                            if (!c) return;
                            const url = c.toDataURL("image/png");
                            saveSelection({ kind: "drawing", url });
                            navigate("/escher");
                        }}
                        title="Send to Escher"
                    >
                        ➜ Use in Escher
                    </button>
                </div>
            </header>

            <div className={`draw-stage ${grid ? "with-grid" : ""}`}>
                <canvas ref={canvasRef} className="draw-canvas" />
            </div>
        </main>
    );
}

export default Draw;

function simplifyStroke(stroke, epsilon = 0.6) {
    const pts = stroke.points;
    if (pts.length < 3) return stroke;
    const keep = new Array(pts.length).fill(false);
    keep[0] = keep[pts.length - 1] = true;

    const stack = [[0, pts.length - 1]];
    const dist = (p, a, b) => {
        const A = { x: a.x, y: a.y }, B = { x: b.x, y: b.y }, P = { x: p.x, y: p.y };
        const ABx = B.x - A.x, ABy = B.y - A.y;
        const t = ((P.x - A.x) * ABx + (P.y - A.y) * ABy) / (ABx * ABx + ABy * ABy || 1);
        const tclamp = Math.max(0, Math.min(1, t));
        const Qx = A.x + tclamp * ABx, Qy = A.y + tclamp * ABy;
        return Math.hypot(P.x - Qx, P.y - Qy);
    };

    while (stack.length) {
        const [i, j] = stack.pop();
        let maxD = 0, idx = -1;
        for (let k = i + 1; k < j; k++) {
            const d = dist(pts[k], pts[i], pts[j]);
            if (d > maxD) { maxD = d; idx = k; }
        }
        if (maxD > epsilon) {
            keep[idx] = true;
            stack.push([i, idx], [idx, j]);
        }
    }

    const simp = pts.filter((_, i) => keep[i]);
    return { ...stroke, points: simp };
}

function redraw(ctx, canvas, strokes, live) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const drawStroke = (s) => {
        if (!s?.points?.length) return;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = s.size;
        if (s.mode === "erase") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = s.color;
        }
        const pts = s.points;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2;
            const midY = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
    };

    for (const s of strokes) drawStroke(s);
    if (live) drawStroke(live);
}

function strokesToSVG(strokes, width, height) {
    const esc = (s) => s.replace(/"/g, "&quot;");
    const pathD = (pts) => {
        if (!pts?.length) return "";
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 1; i < pts.length - 1; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
        }
        if (pts.length > 1) {
            const p = pts[pts.length - 1];
            d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        }
        return d;
    };

    const paths = strokes.map((s) => {
        const comp = s.mode === "erase" ? "destination-out" : "source-over";
        if (s.mode === "erase") return null;
        return `<path d="${pathD(s.points)}" fill="none" stroke="${esc(s.color)}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).filter(Boolean).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n` +
        paths + `\n</svg>\n`;
}

function trimCanvas(srcCanvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = srcCanvas.width, h = srcCanvas.height;
    const ctx = srcCanvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, w, h);
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const a = data[(y * w + x) * 4 + 3];
            if (a !== 0) {
                if (x < x0) x0 = x;
                if (y < y0) y0 = y;
                if (x > x1) x1 = x;
                if (y > y1) y1 = y;
            }
        }
    }
    if (x1 < x0 || y1 < y0) return srcCanvas; // empty
    const dst = document.createElement("canvas");
    dst.width = x1 - x0 + 2;
    dst.height = y1 - y0 + 2;
    const dctx = dst.getContext("2d");
    dctx.drawImage(srcCanvas, x0, y0, dst.width, dst.height, 0, 0, dst.width, dst.height);
    const out = document.createElement("canvas");
    out.width = Math.round(dst.width / dpr);
    out.height = Math.round(dst.height / dpr);
    out.getContext("2d").drawImage(dst, 0, 0, out.width, out.height);
    return out;
}

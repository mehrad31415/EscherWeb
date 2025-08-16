import { useEffect, useMemo, useRef, useState } from "react";
import { loadSelection, saveSelection, clearSelection } from "../utils/selection";
import { removeBackground } from "@imgly/background-removal";
import createModule from "../components/jikken_E.js";
import { useOpenCV, normalizePoints, applyAffine, prepCanvasForWorld, renderTilingOnCanvas } from "../utils/opencv.js";
import "../css/Escher.css";

function Escher() {
  // Data state
  const [source, setSource] = useState(() => loadSelection());
  const [resultUrl, setResultUrl] = useState("");
  const [targetPts, setTargetPts] = useState(100);
  const [outline, setOutline] = useState([]);
  const [hasEscherized, setHasEscherized] = useState(false);
  const [tilingUrl, setTilingUrl] = useState("");
  const [tactileReady, setTactileReady] = useState(false);

  // Busy state
  const [contourBusy, setContourBusy] = useState(false);
  const [jikkenBusy, setJikkenBusy] = useState(false);

  // Error state
  const [error, setError] = useState("");
  const [escherizedError, setEscherizedError] = useState("");

  // Refs
  const baseOutlineRef = useRef([]);
  const fileRef = useRef(null);
  const contourCanvasRef = useRef(null);
  const escherizedCanvasRef = useRef(null);
  const tileCanvasRef = useRef(null);
  const resultBmpRef = useRef(null);

  const cvReady = useOpenCV();
  const WASM_URL = "/jikken_E.wasm";
  const [jikken, setJikken] = useState(null);

  const handleFile = file => {
    setError("");
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setError("Please upload a PNG or JPG image.");
      return;
    }
    const useFR = file.size <= 4_000_000;
    if (useFR) {
      const fr = new FileReader();
      fr.onload = () => {
        const url = String(fr.result);
        const sel = { kind: "upload", url, description: file.name, author: "Uploaded" };
        setSource(sel);
        saveSelection(sel);
        setResultUrl(""); baseOutlineRef.current = []; setOutline([]);
        resultBmpRef.current = null;
      };
      fr.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      const sel = { kind: "upload", url, description: file.name, author: "Uploaded" };
      setSource(sel);
      setResultUrl(""); baseOutlineRef.current = []; setOutline([]);
      resultBmpRef.current = null;
    }
  };

  const onPickClick = () => fileRef.current?.click();
  const onFileChange = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer?.files?.[0]); };
  const onDragOver = (e) => e.preventDefault();

  const isDrawing = source?.kind === "drawing";
  const srcUrl = source?.url || "";
  const caption = useMemo(() => {
    if (!source) return "No source selected";
    if (isDrawing) return "Your drawing";
    if (source?.kind === "upload") return source.description || "Uploaded image";
    return source.description || "Selected image";
  }, [source, isDrawing]);

  // HiDPI draw helper
  function drawBitmapHiDPI(canvas, bmp) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(bmp.width * dpr);
    canvas.height = Math.round(bmp.height * dpr);
    canvas.style.width = bmp.width + "px";
    canvas.style.height = bmp.height + "px";
    const ctx = canvas.getContext("2d", { alpha: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, bmp.width, bmp.height);
    return { ctx, dpr };
  }

  // Background removal
  const removeBg = async () => {
    if (!srcUrl) return;
    setContourBusy(true);
    setError("");
    try {
      const blob = await fetch(srcUrl, { mode: "cors" }).then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.blob();
      });

      const outBlob = await removeBackground(blob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const newUrl = URL.createObjectURL(outBlob);
      setResultUrl(newUrl);

      const bmp = await createImageBitmap(outBlob);
      resultBmpRef.current = bmp;

      // Draw FG
      const c = contourCanvasRef.current;
      const { ctx } = drawBitmapHiDPI(c, bmp);

      if (cvReady) {
        baseOutlineRef.current = await extractOuterOutlineFromAlpha(bmp);
        const pts = resampleClosed(baseOutlineRef.current, targetPts);
        setOutline(pts);
        drawOutline(ctx, pts);
      }
    } catch (e) {
      console.error(e);
      setError("Background removal failed.");
    } finally {
      setContourBusy(false);
    }
  };

  // Outline logic
  async function extractOuterOutlineFromAlpha(bitmap) {
    const tmp = document.createElement("canvas");
    tmp.width = bitmap.width; tmp.height = bitmap.height;
    tmp.getContext("2d").drawImage(bitmap, 0, 0);
    const src = cv.imread(tmp);
    const planes = new cv.MatVector();
    cv.split(src, planes);
    const A = planes.get(3);

    const mask = new cv.Mat();
    cv.threshold(A, mask, 0, 255, cv.THRESH_BINARY);

    // find largest external contour
    const contours = new cv.MatVector();
    const hier = new cv.Mat();
    cv.findContours(mask, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

    let best = null, bestArea = -1;
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const area = Math.abs(cv.contourArea(c, true));
      if (area > bestArea) { bestArea = area; best = c; }
    }

    let pts = [];
    if (best && best.rows >= 3) {
      const perim = cv.arcLength(best, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(best, approx, Math.max(1, perim * 0.002), true);
      pts = matToPoints(approx);
      approx.delete();
    }

    // cleanup
    src.delete(); planes.delete(); A.delete(); mask.delete(); contours.delete(); hier.delete();
    return pts;
  }

  // Uniform resampling to exactly N points along a closed polyline
  function resampleClosed(pts, N) {
    if (!pts?.length || N <= 2) return [];
    const P = [...pts, pts[0]];
    const cum = [0]; let L = 0;
    for (let i = 1; i < P.length; i++) {
      L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      cum.push(L);
    }
    const step = L / N;
    const out = [];
    let seg = 0;
    for (let k = 0; k < N; k++) {
      const t = k * step;
      while (seg + 1 < cum.length && cum[seg + 1] < t) seg++;
      const t0 = cum[seg], t1 = cum[seg + 1];
      const [x0, y0] = P[seg], [x1, y1] = P[seg + 1];
      const a = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      out.push([x0 + a * (x1 - x0), y0 + a * (y1 - y0)]);
    }
    return out;
  }

  // Draw outline on top of current canvas
  function redrawWithOutline() {
    const bmp = resultBmpRef.current;
    if (!bmp) return;
    const c = contourCanvasRef.current;
    if (!c) return;
    const { ctx } = drawBitmapHiDPI(c, bmp);
    drawOutline(ctx, outline);
  }
  function drawOutline(ctx, pts) {
    if (!pts?.length) return;
    ctx.save();

    // Outline in red
    ctx.strokeStyle = "#ff0000ff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    ctx.stroke();

    // Sample dots in black
    ctx.fillStyle = "#000";
    const step = 1;
    for (let i = 0; i < pts.length; i += step) {
      ctx.beginPath();
      ctx.arc(pts[i][0], pts[i][1], 5.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function matToPoints(cntMat) {
    const out = [];
    if (!cntMat?.data32S) return out;
    const data = cntMat.data32S;
    for (let i = 0; i < data.length; i += 2) out.push([data[i], data[i + 1]]);
    return out;
  }

  useEffect(() => {
    if (!baseOutlineRef.current.length) return;
    if (!contourCanvasRef.current) return;
    const N = targetPts % 2 ? targetPts - 1 : targetPts;
    const pts = resampleClosed(baseOutlineRef.current, N);
    setOutline(pts);
    redrawWithOutline();
  }, [targetPts]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  useEffect(() => {
    if (!cvReady || !baseOutlineRef.current) return;
    const c = contourCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: true });
    ctx.clearRect(0, 0, c.width, c.height);

    const pts = resampleClosed(baseOutlineRef.current, targetPts);
    setOutline(pts);
    drawOutline(ctx, pts);
  }, [targetPts, cvReady]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await createModule({
          locateFile: (p) => (p.endsWith(".wasm") ? WASM_URL : p),
        });
        if (!cancelled) setJikken(mod);
      } catch (e) {
        console.error(e);
        setEscherizedError("Failed to load jikken (wasm).");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function parseTileFile(tileText) {
    const lines = tileText.trim().split(/\r?\n/);
    let idx = 0;

    idx++;
    const [origCount] = lines[idx].split(/\s+/).map(Number);
    idx++;
    idx += origCount;
    const headerParts = lines[idx].trim().split(/\s+/);
    const outCount = parseInt(headerParts[0], 10);
    const ihType = parseInt(headerParts[2], 10); // IH_TYPE is 3rd token
    idx++;
    idx++;

    const outputPoints = [];
    for (let i = 0; i < outCount; i++, idx++) {
      const [x, y] = lines[idx].trim().split(/\s+/).map(Number);
      outputPoints.push({ x, y });
    }
    return { ihType, outputPoints };
  }

  function enforceEvenNoDuplicate(pts) {
    if (!pts?.length) return [];
    const last = pts[pts.length - 1], first = pts[0];
    const closedDup = last && first && Math.hypot(last[0] - first[0], last[1] - first[1]) < 1e-9;
    let out = closedDup ? pts.slice(0, -1) : pts.slice();
    if (out.length % 2 === 1) out = out.slice(0, -1);
    return out;
  }

  function areaXY(pts) {
    let A = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      A += p.x * q.y - q.x * p.y;
    }
    return 0.5 * A;
  }

  async function runJikken() {
    if (!outline.length) {
      setEscherizedError("No outline to run.");
      return;
    }

    setJikkenBusy(true);
    setEscherizedError("");

    const ptsEven = enforceEvenNoDuplicate(outline);
    const inputText =
      [String(ptsEven.length), ...ptsEven.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)]
        .join("\n") + "\n";

    try {
      const mod = await createModule({
        locateFile: (p) => (p.endsWith(".wasm") ? WASM_URL : p),
        noInitialRun: true,
      });
      // Write input BEFORE running main
      mod.FS.writeFile("/input.dat", inputText);
      try {
        mod.callMain(["/input.dat", "/output.dat", "1", "1"]);

        console.log("Root directory:", mod.FS.readdir("/"));
        try {
          const pngData = mod.FS_readFile("tiling.png");
          const blob = new Blob([pngData], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          setTilingUrl(url);
        } catch (err) {
          console.error("No tiling.png found:", err);
        }
        const tileText = new TextDecoder().decode(mod.FS.readFile("/output.dat.tile"));
        const { ihType, outputPoints } = parseTileFile(tileText);

        const inArea = areaXY(outline.map(([x, y]) => ({ x, y })));
        let outPts = outputPoints;
        if (Math.sign(areaXY(outPts)) !== Math.sign(inArea)) {
          outPts = [...outPts].reverse();
        }

        const canonicalPoints = normalizePoints(outPts);
        renderTilingOnCanvas(
          tileCanvasRef.current,
          ihType,
          canonicalPoints,
          { unitsOnShortEdge: 10, bleed: 3, invertY: false }
        );
        setTactileReady(true);

        if (escherizedCanvasRef.current) {
          const bounds = [0, 0, 1, 1];
          const { ctx, toPx } = prepCanvasForWorld(escherizedCanvasRef.current, bounds, { invertY: false });
          ctx.beginPath();
          const first = toPx(canonicalPoints[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < canonicalPoints.length; i++) {
            const pt = toPx(canonicalPoints[i]);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 2;
          ctx.stroke();
          setHasEscherized(true);
        }
      } catch (e) {
        if (!(e instanceof mod.ExitStatus) || e.status !== 0) throw e;
      }
    } catch (e) {
      console.error(e);
      setEscherizedError(`jikken run failed: ${e.message}`);
    } finally {
      setJikkenBusy(false);
    }
  }

  return (
    <main className="escher-root">
      <header className="escher-header">
        <div className="escher-actions">
          <button className="esch-btn" onClick={onPickClick}>Upload image</button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={onFileChange} hidden />
          <button
            className="esch-btn"
            onClick={() => {
              clearSelection();
              setSource(null);
              setResultUrl("");
              baseOutlineRef.current = [];
              setOutline([]);
              resultBmpRef.current = null;

              setTilingUrl("");
              setTactileReady(false);
              if (tileCanvasRef.current) {
                const c = tileCanvasRef.current;
                const g = c.getContext("2d");
                g?.clearRect(0, 0, c.width, c.height);
              }
            }}
            title="Clear current selection"
          >
            Clear selection
          </button>
        </div>
      </header>
      {!source && (
        <div className="esch-dropzone" onDrop={onDrop} onDragOver={onDragOver} onClick={onPickClick} role="button" tabIndex={0}>
          <p>Drop an image here or click to upload — or choose from Search/Draw.</p>
        </div>
      )}
      {source && (
        <div>
          <section className="esch-grid">
            <article className="esch-panel">
              <h2 className="esch-h2">Original</h2>
              <div className="esch-media">
                <img
                  src={source?.url || ""}
                  alt={caption}
                  crossOrigin={source?.kind === "image" ? "anonymous" : undefined}
                />
                {source?.url && (
                  <div className="esch-download">
                    <a href={source.url} download={`${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.png`} className="download-btn">
                      ⬇ Download
                    </a>
                  </div>
                )}
              </div>
              <div className="esch-meta">
                <div className="esch-caption">{caption}</div>
                {source?.author ? <div className="esch-credit">{source.author}</div> : null}
                {source?.kind === "upload" && (
                  <small className="esch-note">Uploaded locally.</small>
                )}
              </div>
            </article>
            <article
              className="esch-panel"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <h2 className="esch-h2">Contour</h2>

              <div className="esch-media" style={{ flex: "1 1 auto" }}>
                <canvas ref={contourCanvasRef} className="esch-canvas" />
              </div>

              <div
                className="esch-meta"
                style={{
                  display: "grid",
                  gap: 8,
                  position: "relative",
                  paddingBottom: "60px"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "60px",
                    left: 0,
                    right: 0,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center" }}>
                    Points
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={targetPts}
                      onChange={(e) => setTargetPts(+e.target.value)}
                      style={{ marginInline: 8 }}
                    />
                    <input
                      type="number"
                      min={10}
                      max={200}
                      step={5}
                      value={targetPts}
                      onChange={(e) => setTargetPts(+e.target.value || 100)}
                      style={{ width: 80 }}
                    />
                  </label>
                  {error && (
                    <small className="esch-note" style={{ color: "crimson" }}>
                      {error}
                    </small>
                  )}
                  {!error && outline.length > 0 && (
                    <small className="esch-note">{outline.length} pts</small>
                  )}
                </div>
                <div
                  className="esch-download"
                  style={{
                    position: "absolute",
                    bottom: "120px",
                    left: 0,
                    right: 0,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center"
                  }}
                >
                  <button
                    className="download-btn"
                    onClick={removeBg}
                    disabled={!srcUrl || contourBusy || !cvReady}
                  >
                    {contourBusy
                      ? "Processing…"
                      : cvReady
                        ? "Get Contour"
                        : "Loading OpenCV…"}
                  </button>
                  <a
                    href={
                      outline.length
                        ? contourCanvasRef.current?.toDataURL("image/png")
                        : undefined
                    }
                    download={
                      outline.length
                        ? `contour_${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.png`
                        : undefined
                    }
                    className="download-btn"
                    onClick={(e) => {
                      if (!outline.length) {
                        e.preventDefault();
                        setError("Please generate a contour first.");
                      }
                    }}
                  >
                    ⬇ Image
                  </a>
                  <a
                    href={
                      outline.length
                        ? URL.createObjectURL(
                          new Blob(
                            [
                              `${outline.length}\n` +
                              outline.map((p) => `${p[0]} ${p[1]}`).join("\n"),
                            ],
                            { type: "text/plain" }
                          )
                        )
                        : undefined
                    }
                    download={
                      outline.length
                        ? `contour_${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.dat`
                        : undefined
                    }
                    className="download-btn"
                    onClick={(e) => {
                      if (!outline.length) {
                        e.preventDefault();
                        setError("Please generate a contour first.");
                      }
                    }}
                  >
                    ⬇ Input.dat
                  </a>
                </div>
              </div>
            </article>
            <article className="esch-panel" style={{
              display: "flex", flexDirection: "column", position: "relative"
            }}>
              <h2 className="esch-h2">Escherized</h2>
              <div className="esch-media" style={{ flex: "1 1 auto" }}>
                <canvas ref={escherizedCanvasRef} className="esch-canvas" />
              </div>
              <div className="esch-meta" style={{
                marginTop: "auto",
                marginBottom: "2000 px",
                display: "grid",
                gap: 8
              }}>
                <div
                  className="esch-download"
                  style={{
                    position: "absolute",
                    bottom: "120px",
                    left: 0,
                    right: 0,
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    justifyContent: "center"
                  }}
                >
                  <button
                    className="download-btn"
                    onClick={runJikken}
                    disabled={jikkenBusy}
                  >
                    {jikkenBusy ? "Running…" : "Escherize"}
                  </button>
                  <a
                    href={hasEscherized ? escherizedCanvasRef.current?.toDataURL("image/png") : undefined}
                    download={hasEscherized ? `escherized_${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.png` : undefined}
                    className={`download-btn ${!hasEscherized ? "disabled" : ""}`}
                    onClick={(e) => {
                      if (!hasEscherized) {
                        e.preventDefault();
                        setEscherizedError("Please run Escherize before downloading.");
                      }
                    }}
                  > ⬇ Download </a>
                </div>
                {escherizedError && (
                  <small
                    className="esch-note"
                    style={{
                      color: "crimson",
                      textAlign: "center",
                      position: "absolute",
                      bottom: "50px",
                      left: 0,
                      right: 0
                    }}
                  > {escherizedError}
                  </small>
                )}
              </div>
            </article>
          </section>
          <section className="bottom-two">
            <article className="esch-panel">
              <h2 className="esch-h2">Tiling by EscherTiling</h2>
              <div className="esch-media">
                {tilingUrl ? (
                  <>
                    <img src={tilingUrl} alt="Generated tiling" style={{ maxWidth: "100%" }} />
                    <div className="esch-download" style={{ marginTop: 8 }}>
                      <a href={tilingUrl} download={`tiling_escher_${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.png`} className="download-btn">
                        ⬇ Download </a>
                    </div>
                  </>
                ) : (
                  <small className="esch-note">No tiling generated yet.</small>
                )}
              </div>
            </article>
            <article className="esch-panel">
              <h2 className="esch-h2">Tiling by tactile-js</h2>
              <div className="esch-canvas-wrap">
                <canvas ref={tileCanvasRef} className="esch-canvas" />
              </div>
              <div className="esch-meta" style={{ textAlign: "center", marginTop: 8 }}>
                <small>Tiling rendered with IsohedralTiling</small>

                {tactileReady ? (
                  <div className="esch-download" style={{ marginTop: 8 }}>
                    <a
                      href={tileCanvasRef.current?.toDataURL("image/png")}
                      download={`tiling_tactile_${caption?.replace(/\s+/g, "_") || "image"}_${Date.now()}.png`}
                      className="download-btn"
                    >
                      ⬇ Download
                    </a>
                  </div>
                ) : (
                  <small className="esch-note" style={{ display: "block", marginTop: 8 }}>
                    No tiling generated yet.
                  </small>
                )}
              </div>
            </article>
          </section>
        </div>
      )}
    </main>
  );
}

export default Escher;

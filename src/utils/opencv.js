import { useState, useEffect } from 'react';
import { IsohedralTiling } from 'tactile-js';

export function useOpenCV() {
  const [ready, setReady] = useState(!!(window.cv && window.cv.Mat));

  useEffect(() => {
    if (ready) return;
    if (document.querySelector('script[data-opencv]')) return;

    const s = document.createElement('script');
    s.src = 'https://docs.opencv.org/4.x/opencv.js';
    s.async = true;
    s.dataset.opencv = '1';
    s.onload = () => { window.cv.onRuntimeInitialized = () => setReady(true); };
    document.body.appendChild(s);
  }, [ready]);

  return ready;
}

export function normalizePoints(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = 1 / Math.max(1e-9, Math.max(maxY - minY, maxX - minX));

  return points.map(p => ({
    x: (p.x - minX) * scale,
    y: (p.y - minY) * scale
  }));
}

export function applyAffine(pt, T) {
  return {
    x: T[0] * pt.x + T[1] * pt.y + T[2],
    y: T[3] * pt.x + T[4] * pt.y + T[5]
  };
}

export function prepCanvasForWorld(canvas, worldBounds, opts = {}) {
  const [xmin, ymin, xmax, ymax] = worldBounds;
  const w = xmax - xmin, h = ymax - ymin;
  const invertY = opts.invertY ?? true;

  const dpr = window.devicePixelRatio || 2;
  const cssW = canvas.clientWidth || 800;
  const cssH = canvas.clientHeight || 600;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const s = Math.min(cssW / w, cssH / h);
  const ox = (cssW - s * w) * 0.5;
  const oy = (cssH - s * h) * 0.5;

  const toPx = ({ x, y }) => ({
    x: ox + (x - xmin) * s,
    y: invertY ? (oy + (ymax - y) * s) : (oy + (y - ymin) * s),
  });

  return { ctx, toPx, s, ox, oy };
}

export function renderTilingOnCanvas(canvas, ihType, canonicalPolygon, opts = {}) {
  if (!canvas) return;
  const { unitsOnShortEdge = 8, bleed = 2, invertY = false } = opts;

  const { view, fill } = worldBoundsForCanvas(canvas, unitsOnShortEdge, bleed);
  const { ctx, toPx } = prepCanvasForWorld(canvas, view, { invertY });

  const tiling = new IsohedralTiling(ihType);
  const palette = ['#ff4400ff', '#009dffff', '#00fc00ff'];

  for (const inst of tiling.fillRegionBounds(...fill)) {
    const T = inst.T;
    const colIndex = tiling.getColour(inst.t1, inst.t2, inst.aspect);
    const col = palette[colIndex];

    const worldPoly = canonicalPolygon.map(p => applyAffine(p, T));
    const px = worldPoly.map(toPx);

    ctx.beginPath();
    ctx.moveTo(px[0].x, px[0].y);
    for (let i = 1; i < px.length; i++) ctx.lineTo(px[i].x, px[i].y);
    ctx.closePath();

    ctx.fillStyle = col;
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#111';
    ctx.stroke();
  }
}

export function worldBoundsForCanvas(canvas, unitsOnShortEdge = 8, bleed = 2) {
  const cssW = canvas.clientWidth || canvas.width || 800;
  const cssH = canvas.clientHeight || canvas.height || 600;
  const ar = cssW / Math.max(1, cssH);
  const h = unitsOnShortEdge;
  const w = h * ar;

  return {
    view: [0, 0, w, h],
    fill: [-bleed, -bleed, w + bleed, h + bleed],
  };
}

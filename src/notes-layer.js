// Textebene: kleine weiße Quadrate, die beim Darüberfahren zu Textfeldern aufgehen.
// Sie stehen fest in der Ansicht (nicht im 3D-Raum), jede Stufe hat ihre eigenen.
// Das Textfeld wächst aus dem Quadrat, möglichst um dessen Mitte herum.

import { notes } from './notes.js';

const DOT = 12;          // Kantenlänge der Quadrate in px
const EDGE = 16;         // Mindestabstand zum Rand der Fläche
const AVOID = 14;        // Abstand zu Menüs, Titel und Hinweisen
const PAD_X = 16, PAD_TOP = 12, PAD_BOTTOM = 14;   // Innenabstand des Textfelds (wie in style.css)

// Zufall mit festem Startwert, damit die Anordnung bei jedem Laden gleich ist
function rng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Bereiche der Fläche, die von Bedienelementen belegt sind (in px relativ zur Fläche)
function blockedRects(container) {
  const pane = container.getBoundingClientRect();
  const sel = ['.place', '#switch', '#levels', '#hint', '#divider'];
  const rects = [];
  for (const s of sel) {
    const els = s.startsWith('#') ? [document.querySelector(s)] : [container.parentElement.querySelector(s)];
    for (const el of els) {
      if (!el || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      rects.push({ x0: r.left - pane.left - AVOID, x1: r.right - pane.left + AVOID, y0: r.top - pane.top - AVOID, y1: r.bottom - pane.top + AVOID });
    }
  }
  // Google-Logo unten links und der Ortungspunkt in der Mitte
  rects.push({ x0: 0, x1: 210, y0: pane.height - 48, y1: pane.height });
  rects.push({ x0: pane.width / 2 - 34, x1: pane.width / 2 + 34, y0: pane.height / 2 - 34, y1: pane.height / 2 + 34 });
  return { rects, w: pane.width, h: pane.height };
}

// Punkte gleichmäßig, aber zufällig über die freie Fläche verteilen
function layout(levelId, count, container) {
  const { rects, w, h } = blockedRects(container);
  const rand = rng(levelId);
  const pts = [];
  let minD = Math.sqrt((w * h) / count) * 0.75;
  let tries = 0;
  while (pts.length < count) {
    const p = { x: EDGE + rand() * (w - 2 * EDGE), y: EDGE + rand() * (h - 2 * EDGE) };
    const blocked = rects.some((b) => p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1);
    const near = pts.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < minD);
    if (!blocked && !near) pts.push(p);
    if (++tries > 500) { minD *= 0.92; tries = 0; }
  }
  return { pts, rects, w, h };
}

export function createNotes(container, placeKey, { onOpen, onClose }) {
  let items = [];
  let openIndex = -1;
  let currentLevel = null;
  let geo = null;

  function render(levelId) {
    const list = notes[levelId] ?? [];
    geo = layout(levelId, list.length, container);
    container.innerHTML = '';
    items = list.map((n, i) => {
      const p = geo.pts[i];
      const el = document.createElement('div');
      el.className = 'note';
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      el.style.setProperty('--delay', (i * 25) + 'ms');
      el.innerHTML = `
        <div class="note-box"><p class="note-text">${n[placeKey] ?? ''}</p></div>`;
      // Öffnen beim Darüberfahren, schließen beim Verlassen (kurze Gnadenfrist)
      let t;
      el.addEventListener('pointerenter', () => { clearTimeout(t); if (openIndex !== i) open(i); });
      el.addEventListener('pointerleave', () => { t = setTimeout(() => openIndex === i && close(), 120); });
      el.addEventListener('pointerdown', (e) => e.stopPropagation());
      container.appendChild(el);
      return el;
    });
    openIndex = -1;
  }

  // Größe und Lage des offenen Feldes: zentriert um das Quadrat,
  // aber innerhalb der Fläche und neben Menüs und Titel
  function place(el) {
    const box = el.querySelector('.note-box');
    const text = box.firstElementChild;
    const width = Math.min(container.clientWidth < 700 ? 240 : 290, container.clientWidth - 2 * EDGE);
    text.style.width = (width - PAD_X * 2 - 3) + 'px';
    const height = text.offsetHeight + PAD_TOP + PAD_BOTTOM + 3;
    const cx = parseFloat(el.style.left), cy = parseFloat(el.style.top);
    let x = cx - width / 2, y = cy - height / 2;
    x = Math.max(EDGE, Math.min(geo.w - EDGE - width, x));
    y = Math.max(EDGE, Math.min(geo.h - EDGE - height, y));
    // Aus belegten Bereichen herausschieben (nur Menüs und Titel, nicht die Mitte)
    for (const r of geo.rects.slice(0, -1)) {
      const hit = x < r.x1 && x + width > r.x0 && y < r.y1 && y + height > r.y0;
      if (!hit) continue;
      const moves = [r.x1 - x, r.x0 - (x + width), r.y1 - y, r.y0 - (y + height)];
      const best = moves.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a));
      if (best === moves[0] || best === moves[1]) x += best; else y += best;
    }
    box.style.setProperty('--w', width + 'px');
    box.style.setProperty('--h', height + 'px');
    box.style.setProperty('--x', (x - cx) + 'px');
    box.style.setProperty('--y', (y - cy) + 'px');
  }

  function show(levelId, on) {
    container.classList.toggle('off', !on);
    if (levelId === currentLevel) return;
    currentLevel = levelId;
    render(levelId);
  }

  function open(i, silent = false) {
    items.forEach((el, j) => {
      if (j === i) place(el);
      el.classList.toggle('open', j === i);
    });
    openIndex = i;
    if (!silent) onOpen?.(i);
  }

  function close(silent = false) {
    items.forEach((el) => el.classList.remove('open'));
    openIndex = -1;
    if (!silent) onClose?.();
  }

  // Neu verteilen, wenn sich die Fläche ändert (Fenstergröße, Vergleich, Trennlinie)
  let resizeT;
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => currentLevel && container.offsetParent && render(currentLevel), 200);
  }).observe(container);

  function setCompare() {}
  function highlight() {}

  // Klick daneben schließt das offene Textfeld
  container.parentElement.addEventListener('pointerdown', () => openIndex >= 0 && close());

  return { show, open, close, highlight, setCompare };
}

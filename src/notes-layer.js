// Textebene: kleine weiße Quadrate, die beim Klicken zu Textfeldern aufgehen.
// Sie stehen fest in der Ansicht (nicht im 3D-Raum), jede Stufe hat ihre eigenen.
// Im Vergleich steht dasselbe Thema in beiden Hälften an derselben Stelle.

import { config } from './config.js';
import { notes } from './notes.js';

// Bereich, in dem Quadrate liegen dürfen (Anteile der Fläche):
// oben links Titel, rechts Stufenleiste, unten Hinweise und Google-Logo
const AREA = { x0: 0.07, x1: 0.68, y0: 0.2, y1: 0.84 };
const BLOCKED = [{ x0: 0, x1: 0.42, y0: 0, y1: 0.24 }];

// Zufall mit festem Startwert, damit die Anordnung bei jedem Laden gleich ist
function rng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const layouts = {};
function layout(levelId, count) {
  if (layouts[levelId]) return layouts[levelId];
  const rand = rng(levelId);
  const pts = [];
  let minD = 0.12;
  let tries = 0;
  while (pts.length < count) {
    const p = {
      x: AREA.x0 + rand() * (AREA.x1 - AREA.x0),
      y: AREA.y0 + rand() * (AREA.y1 - AREA.y0),
    };
    const blocked = BLOCKED.some((b) => p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1);
    const near = pts.some((q) => Math.hypot((p.x - q.x) * 1.4, p.y - q.y) < minD);
    if (!blocked && !near) pts.push(p);
    if (++tries > 400) { minD *= 0.9; tries = 0; }
  }
  return (layouts[levelId] = pts);
}

export function createNotes(container, placeKey, { onHover, onOpen, onClose }) {
  const other = config.order.find((k) => k !== placeKey);
  const otherName = config.places[other]?.name ?? '';
  let items = [];
  let openIndex = -1;
  let compare = false;
  let currentLevel = null;

  function render(levelId) {
    const list = notes[levelId] ?? [];
    const pts = layout(levelId, list.length);
    container.innerHTML = '';
    items = list.map((n, i) => {
      const el = document.createElement('div');
      el.className = 'note';
      el.style.left = (pts[i].x * 100) + '%';
      el.style.top = (pts[i].y * 100) + '%';
      el.style.setProperty('--delay', (i * 25) + 'ms');
      el.classList.toggle('flip-x', pts[i].x > 0.5);
      el.classList.toggle('flip-y', pts[i].y > 0.6);
      el.innerHTML = `
        <button type="button" class="note-dot" aria-label="${n.topic}"></button>
        <span class="note-label">${n.topic}</span>
        <div class="note-card" role="dialog">
          <p class="note-topic">${n.topic}</p>
          <p class="note-text">${n[placeKey] ?? ''}</p>
          <p class="note-other"><span class="note-other-name">${otherName}</span> ${n[other] ?? ''}</p>
        </div>`;
      const dot = el.querySelector('.note-dot');
      dot.addEventListener('pointerenter', () => onHover?.(i, true));
      dot.addEventListener('pointerleave', () => onHover?.(i, false));
      dot.addEventListener('pointerdown', (e) => e.stopPropagation());
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (openIndex === i) close();
        else open(i);
      });
      el.querySelector('.note-card').addEventListener('pointerdown', (e) => e.stopPropagation());
      container.appendChild(el);
      return el;
    });
    openIndex = -1;
  }

  function show(levelId, on) {
    container.classList.toggle('off', !on);
    if (levelId === currentLevel) return;
    currentLevel = levelId;
    render(levelId);
  }

  function open(i, silent = false) {
    items.forEach((el, j) => el.classList.toggle('open', j === i));
    openIndex = i;
    if (!silent) onOpen?.(i);
  }

  function close(silent = false) {
    items.forEach((el) => el.classList.remove('open'));
    openIndex = -1;
    if (!silent) onClose?.();
  }

  function highlight(i, on) {
    items[i]?.classList.toggle('twin', on);
  }

  function setCompare(on) {
    compare = on;
    container.classList.toggle('compare', on);
  }

  // Klick daneben schließt das offene Textfeld
  container.parentElement.addEventListener('pointerdown', () => openIndex >= 0 && close());

  return { show, open, close, highlight, setCompare };
}

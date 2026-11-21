// Textebene: kleine weiße Quadrate, die beim Darüberfahren zu Textfeldern aufgehen.
// Sie stehen fest in der Ansicht (nicht im 3D-Raum), jede Stufe hat ihre eigenen.
// Das Textfeld wächst aus dem Quadrat, möglichst um dessen Mitte herum.

import { notes } from './notes.js?v=1795278797';
import { notesEn } from './notes-en.js?v=1795278797';
import { getLang } from './i18n.js?v=1795278797';

// Text eines Eintrags in der aktuellen Sprache, sonst Deutsch
const textOf = (n, place) => (getLang() === 'en' ? notesEn[n.id]?.[place] : null) ?? n[place];

const PAD_X = 16, PAD_TOP = 12, PAD_BOTTOM = 14;   // Innenabstand des Textfelds (wie in style.css)

// Bereich, in dem Quadrate liegen (Anteile der Fläche), mit festem Sicherheitsabstand
// zu Titel, Menüs, Hinweisen und dem Ortungspunkt in der Mitte.
// Gleiche Lage in beiden Städten, damit vergleichbare Themen an derselben Stelle stehen.
const AREA_WIDE = { x0: 0.24, x1: 0.7, y0: 0.2, y1: 0.84 };
// Mobil liegen Orte und Ebenen unten, die Notizen darüber
const AREA_NARROW = { x0: 0.1, x1: 0.9, y0: 0.18, y1: 0.68 };
const CENTER_GAP = 0.06;

// Feste Ränder für offene Textfelder in px (links Ortsmenü, rechts Stufenleiste, oben Titel)
const SAFE_WIDE = { left: 140, right: 200, top: 120, bottom: 56 };
const SAFE_NARROW = { left: 16, right: 16, top: 110, bottom: 200 };

const narrow = () => matchMedia('(max-width: 640px)').matches;

// Zufall mit festem Startwert, damit die Anordnung bei jedem Laden gleich ist
function rng(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const layouts = {};
function layout(levelId, count) {
  const AREA = narrow() ? AREA_NARROW : AREA_WIDE;
  const key = levelId + (narrow() ? ':n' : ':w');
  if (layouts[key]) return layouts[key];
  const rand = rng(levelId);
  const pts = [];
  let minD = 0.12;
  let tries = 0;
  while (pts.length < count) {
    const p = {
      x: AREA.x0 + rand() * (AREA.x1 - AREA.x0),
      y: AREA.y0 + rand() * (AREA.y1 - AREA.y0),
    };
    const center = Math.abs(p.x - 0.5) < CENTER_GAP && Math.abs(p.y - 0.5) < CENTER_GAP * 1.5;
    const near = pts.some((q) => Math.hypot((p.x - q.x) * 1.4, p.y - q.y) < minD);
    if (!center && !near) pts.push(p);
    if (++tries > 400) { minD *= 0.9; tries = 0; }
  }
  return (layouts[key] = pts);
}

export function createNotes(container, placeKey) {
  let items = [];
  let openIndex = -1;
  let currentLevel = null;

  function render(levelId) {
    const list = notes[levelId] ?? [];
    const pts = layout(levelId, list.length);
    container.innerHTML = '';
    // Ein Eintrag kann für beide Städte gelten (gleiche Stelle) oder nur für eine
    items = list.map((n, i) => {
      if (!n[placeKey]) return null;
      const p = pts[i];
      const el = document.createElement('div');
      el.className = 'note';
      el.style.left = (p.x * 100) + '%';
      el.style.top = (p.y * 100) + '%';
      el.style.setProperty('--delay', (i * 25) + 'ms');
      el.innerHTML = `
        <div class="note-box"><p class="note-text">${textOf(n, placeKey) ?? ''}</p></div>`;
      // Öffnen beim Darüberfahren, schließen beim Verlassen (kurze Gnadenfrist)
      // Mit Maus öffnet Darüberfahren, auf Touchgeräten ein Tippen (nochmal tippen schließt)
      let t;
      el.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(t); if (openIndex !== i) open(i);
      });
      el.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        t = setTimeout(() => openIndex === i && close(), 120);
      });
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (e.pointerType === 'mouse') return;
        openIndex === i ? close() : open(i);
      });
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
    const W = container.clientWidth, H = container.clientHeight;
    const SAFE = narrow() ? SAFE_NARROW : SAFE_WIDE;
    const width = Math.min(W < 700 ? 240 : 290, W - 32);
    text.style.width = (width - PAD_X * 2 - 3) + 'px';
    const height = text.offsetHeight + PAD_TOP + PAD_BOTTOM + 3;
    const cx = el.offsetLeft, cy = el.offsetTop;
    let x = cx - width / 2, y = cy - height / 2;
    // In den sicheren Bereich schieben, falls es dort Platz gibt, sonst an den Rand der Fläche
    const left = W - SAFE.left - SAFE.right >= width ? SAFE.left : 16;
    const right = W - SAFE.left - SAFE.right >= width ? W - SAFE.right : W - 16;
    x = Math.max(left, Math.min(right - width, x));
    y = Math.max(SAFE.top, Math.min(H - SAFE.bottom - height, y));
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
      if (!el) return;
      if (j === i) place(el);
      el.classList.toggle('open', j === i);
    });
    openIndex = i;
  }

  function close(silent = false) {
    items.forEach((el) => el?.classList.remove('open'));
    openIndex = -1;
  }


  // Klick daneben schließt das offene Textfeld
  container.parentElement.addEventListener('pointerdown', () => openIndex >= 0 && close());

  // Nach einem Sprachwechsel neu aufbauen
  function refresh() {
    if (currentLevel) render(currentLevel);
  }

  return { show, open, close, refresh };
}

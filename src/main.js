import { config } from './config.js';
import { createInterior } from './interior.js';
import { createNotes } from './notes-layer.js';

// Kartenmodul wählen: mit Key Google 3D Maps, sonst Cesium mit flachem Satellitenbild
const CESIUM = 'https://cdn.jsdelivr.net/npm/cesium@1.146.0/Build/Cesium/';
let cesiumLoading = null;

function loadCesium() {
  cesiumLoading ??= new Promise((resolve, reject) => {
    window.CESIUM_BASE_URL = CESIUM;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = CESIUM + 'Widgets/widgets.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = CESIUM + 'Cesium.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Cesium could not be loaded'));
    document.head.appendChild(s);
  });
  return cesiumLoading;
}

async function loadEarthModule() {
  if (config.googleApiKey) return import('./earth-google.js');
  await loadCesium();
  return import('./earth.js');
}

const $ = (s) => document.querySelector(s);
const statusEl = $('#status');
const panesEl = $('#panes');

const levels = config.levels;
const INTERIOR = levels.findIndex((l) => l.interior);
const LAST_MAP = INTERIOR - 1;

// Stufe mit den Ausnahmen des Orts (z. B. eigener Blick aufs Gebäude)
const view_ = (pane, i) => ({ ...levels[i], ...(pane.place.views?.[levels[i].id] ?? {}) });

// Kurz vor dem Wechsel in den Raum noch näher heran, in Blickrichtung des Gebäudes
const nearFacade = (pane) => {
  const v = view_(pane, LAST_MAP);
  return { ...v, range: v.range * 0.35 };   // im gleichen Winkel auf den Punkt zu
};

let level = -1;          // -1 = noch nicht angekommen
let busy = false;
let view = null;         // 'bremen' | 'berlin' | 'split'
let focusPane = null;    // Ort, auf den die Pfeiltasten wirken

// ---------- Hilfen ----------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function status(text) {
  statusEl.hidden = !text;
  statusEl.textContent = text || '';
}

// Adresse über OpenStreetMap finden, Ergebnis im Browser merken
async function locate(p) {
  if (!p.geocode) return { lat: p.lat, lon: p.lon };
  const cacheKey = 'geo:' + p.geocode;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached) return cached;
  } catch {}
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(p.geocode);
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const [hit] = await res.json();
    if (!hit) throw new Error('kein Treffer');
    const pos = { lat: +hit.lat, lon: +hit.lon };
    console.info(`Koordinaten für "${p.geocode}"  lat: ${pos.lat}, lon: ${pos.lon}`);
    try { localStorage.setItem(cacheKey, JSON.stringify(pos)); } catch {}
    return pos;
  } catch (err) {
    console.warn('Geocoding fehlgeschlagen, nutze Koordinaten aus config.js', err);
    return { lat: p.lat, lon: p.lon };
  }
}

// ---------- Ein Ort = eine Fläche mit Karte, Innenraum und Notizen ----------

const panes = {};

function createPane(key) {
  const place = config.places[key];
  const el = document.createElement('section');
  el.className = 'pane';
  el.dataset.place = key;
  el.hidden = true;
  el.innerHTML = `
    <div class="earth"></div>
    <div class="interior" hidden></div>
    <div class="veil"></div>
    <div class="notes"></div>
    <header class="place">
      <p class="place-city outlined">${place.name}</p>
      <p class="place-address outlined">${place.venue ? place.venue + ', ' : ''}${place.address}</p>
    </header>`;
  panesEl.appendChild(el);
  el.addEventListener('pointerdown', () => (focusPane = key));

  const pane = {
    key, place, el,
    earthEl: el.querySelector('.earth'),
    interiorEl: el.querySelector('.interior'),
    veil: el.querySelector('.veil'),
    earth: null,
    interior: createInterior(el.querySelector('.interior')),
    notes: createNotes(el.querySelector('.notes'), key, {
      onHover: (topicIndex, on) => otherPanes(key).forEach((p) => p.notes.highlight(topicIndex, on)),
      onOpen: (topicIndex) => otherPanes(key).forEach((p) => view === 'split' ? p.notes.open(topicIndex, true) : p.notes.close()),
      onClose: () => otherPanes(key).forEach((p) => view === 'split' && p.notes.close(true)),
    }),
    ready: null,
    at: -1,             // Stufe, auf der diese Fläche gerade steht
  };
  panes[key] = pane;
  return pane;
}

const otherPanes = (key) => Object.values(panes).filter((p) => p.key !== key && !p.el.hidden);
const activePanes = () => config.order.map((k) => panes[k]).filter((p) => p && !p.el.hidden);

// Karte erst laden, wenn die Fläche zum ersten Mal gezeigt wird
function ensureEarth(pane) {
  pane.ready ??= (async () => {
    const pos = await locate(pane.place);
    const { createEarth } = await loadEarthModule();
    const place = { ...pane.place, lat: pos.lat, lon: pos.lon };
    pane.earth = await createEarth(pane.earthEl, {
      ...config,
      places: { [pane.key]: place },
      startPlace: pane.key,
    });
    pane.earth.setTarget({ ...pos, focusHeight: place.focusHeight, groundAltitude: place.groundAltitude ?? 0 });
    pane.earth.jumpToOverview({ ...pos, heading: place.heading ?? 0 });
    document.body.dataset.mode = pane.earth.mode;
  })();
  return pane.ready;
}

async function fade(pane, on) {
  pane.veil.classList.toggle('on', on);
  await wait(450);
}

// Eine Fläche von ihrer Stufe auf die Zielstufe bringen
async function move(pane, next, { instant = false } = {}) {
  await pane.ready;
  const prev = pane.at;
  if (prev === next) return;
  pane.at = next;
  const { earth, interior } = pane;

  if (instant) {
    if (next === INTERIOR) {
      await earth.flyTo(nearFacade(pane), 0);
      pane.earthEl.hidden = true;
      pane.interiorEl.hidden = false;
      await interior.show(pane.place.interior);
    } else {
      interior.hide();
      pane.interiorEl.hidden = true;
      pane.earthEl.hidden = false;
      await earth.flyTo(view_(pane, next), 0);
    }
    return;
  }

  if (prev === INTERIOR && next < INTERIOR) await interior.recenter();

  if (next === INTERIOR) {
    // Erst ganz nah an die Fassade, dann überblenden
    if (prev !== LAST_MAP) await earth.flyTo(view_(pane, LAST_MAP), config.flightDuration);
    earth.flyTo(nearFacade(pane), 0.9);
    await wait(500);
    await fade(pane, true);
    pane.earthEl.hidden = true;
    pane.interiorEl.hidden = false;
    // Schleier gleich wegnehmen, damit die Ladeanzeige sichtbar ist (gleiche Farbe)
    const loaded = interior.show(pane.place.interior);
    await fade(pane, false);
    await loaded;
  } else if (prev === INTERIOR) {
    await fade(pane, true);
    interior.hide();
    pane.interiorEl.hidden = true;
    pane.earthEl.hidden = false;
    await earth.flyTo(nearFacade(pane), 0);
    await fade(pane, false);
    await earth.flyTo(view_(pane, next), config.flightDuration);
  } else {
    // Sprünge über mehrere Stufen dauern etwas länger, aber nicht linear
    const steps = Math.abs(next - prev);
    const d = config.flightDuration * (1 + 0.25 * (steps - 1));
    await earth.flyTo(view_(pane, next), prev < 0 ? 3.5 : d);
  }
}

// ---------- Ansicht: ein Ort oder beide nebeneinander ----------

async function setView(next) {
  if (next === view) return;
  view = next;
  document.body.dataset.view = view;
  const keys = view === 'split' ? config.order : [view];

  for (const key of config.order) {
    const pane = panes[key] ?? createPane(key);
    pane.el.hidden = !keys.includes(key);
  }
  if (!keys.includes(focusPane)) focusPane = keys[0];
  renderSwitch();

  for (const pane of activePanes()) {
    pane.notes.close(true);
    pane.notes.setCompare(view === 'split');
    if (level >= 0) pane.notes.show(levels[level].id, notesOn);
  }

  // Neu sichtbare Orte direkt auf die aktuelle Stufe bringen
  status(level < 0 ? 'Loading map' : '');
  try {
    await Promise.all(activePanes().map(async (pane) => {
      await ensureEarth(pane);
      if (level >= 0 && pane.at !== level) await move(pane, level, { instant: true });
    }));
  } catch (err) {
    console.error(err);
    status(err.message);
  }
}

function renderSwitch() {
  document.querySelectorAll('#switch [data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  $('#switch [data-toggle=notes]').classList.toggle('active', notesOn);
}

// ---------- Trennlinie im Vergleich ----------

function bindDivider() {
  const divider = $('#divider');
  let dragging = false;
  const set = (x) => {
    const r = panesEl.getBoundingClientRect();
    const f = Math.min(0.8, Math.max(0.2, (x - r.left) / r.width));
    panesEl.style.setProperty('--split', f);
  };
  divider.addEventListener('pointerdown', (e) => {
    dragging = true;
    divider.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  divider.addEventListener('pointermove', (e) => dragging && set(e.clientX));
  divider.addEventListener('pointerup', () => (dragging = false));
  divider.addEventListener('dblclick', () => panesEl.style.setProperty('--split', 0.5));
}

// ---------- Textebene ----------

let notesOn = true;

function setNotes(on) {
  notesOn = on;
  renderSwitch();
  for (const pane of activePanes()) pane.notes.show(levels[Math.max(0, level)].id, notesOn);
}

// ---------- Stufenanzeige ----------

function buildLevelNav() {
  const nav = $('#levels');
  nav.innerHTML = levels
    .map((l, i) => `
      <button type="button" data-level="${i}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="label">${l.label}</span>
        ${l.interior ? '<span class="sub" aria-hidden="true"></span>' : ''}
      </button>`)
    .join('');
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) goTo(+b.dataset.level);
  });
}

function renderLevelNav() {
  document.querySelectorAll('#levels button').forEach((b) => {
    const i = +b.dataset.level;
    b.classList.toggle('active', i === level);
  });
  document.body.dataset.level = levels[level]?.id ?? '';

  // Punkte für die Zoomstufen im Innenraum
  const sub = document.querySelector('#levels .sub');
  const lead = activePanes()[0];
  if (sub && lead) {
    const current = level === INTERIOR ? lead.interior.step : -1;
    sub.innerHTML = Array.from({ length: lead.interior.steps }, (_, i) =>
      `<i class="${i <= current ? 'on' : ''}"></i>`).join('');
  }
}

// ---------- Übergänge ----------

async function goTo(next) {
  next = Math.max(0, Math.min(levels.length - 1, next));
  if (busy || next === level) return;
  busy = true;
  level = next;
  renderLevelNav();
  for (const pane of activePanes()) pane.notes.show(levels[level].id, notesOn);

  try {
    await Promise.all(activePanes().map((pane) => move(pane, next)));
  } catch (err) {
    console.error(err);
  } finally {
    await wait(250); // kleine Pause, damit Trackpad-Nachläufer keine zweite Stufe auslösen
    busy = false;
  }
}

// Im Innenraum gibt es eigene Zoomstufen, erst danach geht es zurück zur Karte
async function step(dir) {
  if (busy) return;
  const lead = activePanes()[0];
  if (level === INTERIOR && lead && (dir > 0 || lead.interior.step > 0)) {
    busy = true;
    try {
      await Promise.all(activePanes().map((p) => p.interior.zoom(dir)));
      renderLevelNav();
    } finally {
      await wait(250);
      busy = false;
    }
    return;
  }
  goTo(level + dir);
}

// ---------- Eingabe ----------

function bindInput() {
  // Scrollen in festen Schritten, runter = näher heran
  let acc = 0;
  let idle;
  addEventListener('wheel', (e) => {
    e.preventDefault();
    if (busy) { acc = 0; return; }
    acc += e.deltaY;
    clearTimeout(idle);
    idle = setTimeout(() => (acc = 0), 180);
    if (Math.abs(acc) > 40) {
      step(Math.sign(acc));
      acc = 0;
    }
  }, { passive: false });

  // Pfeiltasten bewegen die Ansicht des Orts, den man zuletzt angefasst hat
  const held = new Set();
  const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

  addEventListener('keydown', (e) => {
    if (ARROWS.includes(e.key)) { held.add(e.key); e.preventDefault(); }
    if (['+', 'PageDown'].includes(e.key)) step(1);
    if (['-', 'PageUp'].includes(e.key)) step(-1);
    if (e.key === 'Escape') activePanes().forEach((p) => p.notes.close(true));
  });
  addEventListener('keyup', (e) => held.delete(e.key));
  addEventListener('blur', () => held.clear());

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const pane = panes[focusPane];
    if (held.size && !busy && level >= 0 && pane?.earth) {
      const x = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
      const y = (held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0);
      if (x || y) {
        if (level === INTERIOR) pane.interior.pan(x, y, dt);
        else pane.earth.pan(x, y, dt);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  $('#switch').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.toggle === 'notes') setNotes(!notesOn);
  });
}

// ---------- Start ----------

// Google meldet Probleme mit dem Key nur in der Konsole, hier werden sie sichtbar
const consoleError = console.error.bind(console);
console.error = (...args) => {
  const msg = String(args[0] ?? '');
  const m = msg.match(/Google Maps JavaScript API error: (\w+)/);
  if (m) status(`Google map unavailable (${m[1]})`);
  consoleError(...args);
};

async function init() {
  buildLevelNav();
  bindInput();
  bindDivider();
  const params = new URLSearchParams(location.search);
  await setView(params.get('view') || config.startView);
  status('');
  await goTo(0);
}

init();

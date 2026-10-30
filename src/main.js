import { config } from './config.js';
import { createInterior } from './interior.js';

// Kartenmodul wählen: mit Key Google 3D Maps, sonst Cesium mit flachem Satellitenbild
const CESIUM = 'https://cdn.jsdelivr.net/npm/cesium@1.146.0/Build/Cesium/';

function loadCesium() {
  return new Promise((resolve, reject) => {
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
}

async function loadEarthModule() {
  if (config.googleApiKey) return import('./earth-google.js');
  await loadCesium();
  return import('./earth.js');
}

const $ = (s) => document.querySelector(s);
const earthEl = $('#earth');
const interiorEl = $('#interior');
const veil = $('#veil');
const statusEl = $('#status');

const levels = config.levels;
const INTERIOR = levels.findIndex((l) => l.interior);
const LAST_MAP = INTERIOR - 1;

let place = config.places[config.startPlace];
let level = -1;          // -1 = noch nicht angekommen
let busy = false;

// ---------- Hilfen ----------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function status(text) {
  statusEl.hidden = !text;
  statusEl.textContent = text || '';
}

async function fade(on) {
  veil.classList.toggle('on', on);
  await wait(450);
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
    b.classList.toggle('inside', i < level);
  });
  document.body.dataset.level = levels[level]?.id ?? '';

  // Punkte für die Zoomstufen im Innenraum
  const sub = document.querySelector('#levels .sub');
  if (sub && interior) {
    const current = level === INTERIOR ? interior.step : -1;
    sub.innerHTML = Array.from({ length: interior.steps }, (_, i) =>
      `<i class="${i <= current ? 'on' : ''}"></i>`).join('');
  }
}

function renderPlace() {
  document.querySelector('[data-bind=name]').textContent = place.name;
  document.querySelector('[data-bind=address]').textContent = place.address;
}

// ---------- Übergänge ----------

let earth, interior;

async function goTo(next) {
  next = Math.max(0, Math.min(levels.length - 1, next));
  if (busy || next === level) return;
  busy = true;
  const prev = level;
  level = next;
  renderLevelNav();

  try {
    if (prev === INTERIOR && next < INTERIOR) {
      await interior.recenter();
    }
    if (next === INTERIOR) {
      // Erst ganz nah an die Fassade, dann überblenden
      if (prev !== LAST_MAP) await earth.flyTo(levels[LAST_MAP], config.flightDuration);
      earth.flyTo({ range: 22, pitch: -8 }, 0.9);
      await wait(500);
      await fade(true);
      earthEl.hidden = true;
      interiorEl.hidden = false;
      await interior.show(place.interior);
      await fade(false);
    } else if (prev === INTERIOR) {
      await fade(true);
      interior.hide();
      interiorEl.hidden = true;
      earthEl.hidden = false;
      await earth.flyTo({ range: 22, pitch: -8 }, 0);
      await fade(false);
      await earth.flyTo(levels[next], config.flightDuration);
    } else {
      // Sprünge über mehrere Stufen dauern etwas länger, aber nicht linear
      const steps = Math.abs(next - prev);
      const d = config.flightDuration * (1 + 0.25 * (steps - 1));
      await earth.flyTo(levels[next], prev < 0 ? 3.5 : d);
    }
  } finally {
    await wait(250); // kleine Pause, damit Trackpad-Nachläufer keine zweite Stufe auslösen
    busy = false;
  }
}

// Im Innenraum gibt es eigene Zoomstufen, erst danach geht es zurück zur Karte
async function step(dir) {
  if (busy) return;
  if (level === INTERIOR) {
    if (dir > 0 || interior.step > 0) {
      busy = true;
      try {
        await interior.zoom(dir);
        renderLevelNav();
      } finally {
        await wait(250);
        busy = false;
      }
      return;
    }
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

  // Pfeiltasten bewegen die Ansicht, solange sie gedrückt sind
  const held = new Set();
  const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

  addEventListener('keydown', (e) => {
    if (ARROWS.includes(e.key)) { held.add(e.key); e.preventDefault(); }
    if (['+', 'PageDown'].includes(e.key)) step(1);
    if (['-', 'PageUp'].includes(e.key)) step(-1);
  });
  addEventListener('keyup', (e) => held.delete(e.key));
  addEventListener('blur', () => held.clear());

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (held.size && !busy && level >= 0) {
      const x = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
      const y = (held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0);
      if (x || y) {
        if (level === INTERIOR) interior.pan(x, y, dt);
        else earth.pan(x, y, dt);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
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
  renderPlace();
  bindInput();
  status('Loading map');

  const pos = await locate(place);
  try {
    const { createEarth } = await loadEarthModule();
    earth = await createEarth(earthEl, {
      ...config,
      places: { ...config.places, [config.startPlace]: { ...place, lat: pos.lat, lon: pos.lon } },
    });
  } catch (err) {
    console.error(err);
    status(err.message);
    return;
  }
  interior = createInterior(interiorEl);
  document.body.dataset.mode = earth.mode;

  earth.setTarget({ ...pos, height: 0, focusHeight: place.focusHeight });
  earth.jumpToOverview(pos);
  status('');

  await goTo(0);
}

init();

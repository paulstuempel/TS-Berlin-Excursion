// Kartenansicht mit Google 3D Maps (Maps JavaScript API, Bibliothek maps3d).
// Gleiche Schnittstelle wie earth.js (Cesium), damit main.js beide nutzen kann.
//
// Google rechnet die Kamera so: center = Punkt, um den sich alles dreht,
// range = Abstand in Metern, tilt = Neigung (0 senkrecht von oben, 90 waagerecht),
// heading = Himmelsrichtung in Grad.

function loadGoogleMaps(key) {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.__gmReady = resolve;
    window.gm_authFailure = () => reject(new Error('Google rejected the API key'));
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=beta&loading=async&callback=__gmReady`;
    s.async = true;
    s.onerror = () => reject(new Error('Google Maps could not be loaded'));
    document.head.appendChild(s);
  });
}

const M_PER_DEG = 111320;

export async function createEarth(container, { googleApiKey, places, startPlace }) {
  await loadGoogleMaps(googleApiKey);
  const { Map3DElement, Marker3DElement } = await google.maps.importLibrary('maps3d');

  const start = places[startPlace];
  const map = new Map3DElement({
    center: { lat: start.lat, lng: start.lon, altitude: 0 },
    range: 900000,
    tilt: 0,
    heading: 0,
    mode: 'SATELLITE',
    defaultUIHidden: true,
    gestureHandling: 'COOPERATIVE',
  });
  map.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.appendChild(map);

  // Eigene Fläche für Maus und Touch: Ziehen dreht um die Adresse statt zu verschieben.
  // Unten bleibt ein Streifen frei, damit Googles Quellenangaben klickbar bleiben.
  const pad = document.createElement('div');
  pad.className = 'drag-pad';
  container.appendChild(pad);

  // Der orangene Punkt als HTML über der Karte, damit kein Gebäude ihn verdeckt.
  // Die Kamera dreht sich immer um die Adresse, deshalb sitzt sie in der Bildmitte.
  // Nur wenn man mit den Pfeiltasten wegfährt, übernimmt der Marker in der Karte.
  const dot = document.createElement('div');
  dot.className = 'focus-dot';
  container.appendChild(dot);
  const showDot = (on) => dot.classList.toggle('off', !on);

  let target = null;           // { lat, lng }
  let off = { e: 0, n: 0 };    // Verschiebung durch Pfeiltasten in Metern
  let marker = null;
  let animating = false;

  const focus = () => ({
    lat: target.lat + off.n / M_PER_DEG,
    lng: target.lng + off.e / (M_PER_DEG * Math.cos((target.lat * Math.PI) / 180)),
    altitude: target.altitude ?? 0,
  });

  // ---------- Umsehen per Ziehen ----------
  let drag = null;
  pad.addEventListener('pointerdown', (e) => {
    if (animating) return;
    drag = { x: e.clientX, y: e.clientY, h: map.heading ?? 0, t: map.tilt ?? 0 };
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener('pointermove', (e) => {
    if (!drag || animating) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    // Richtung wie im Raum: Ziehen nach rechts dreht die Ansicht nach rechts
    map.heading = (drag.h + dx * 0.25 + 360) % 360;
    map.tilt = Math.max(0, Math.min(85, drag.t + dy * 0.2));
  });
  const end = () => (drag = null);
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);

  // ---------- Kamera ----------

  function fly(endCamera, duration) {
    return new Promise((resolve) => {
      if (!duration) {
        Object.assign(map, endCamera);
        return resolve();
      }
      animating = true;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        animating = false;
        map.removeEventListener('gmp-animationend', finish);
        resolve();
      };
      map.addEventListener('gmp-animationend', finish);
      setTimeout(finish, duration * 1000 + 1500); // falls das Ereignis ausbleibt
      map.flyCameraTo({ endCamera, durationMillis: duration * 1000 });
    });
  }

  function setTarget({ lat, lon, focusHeight = 0 }) {
    target = { lat, lng: lon, altitude: focusHeight };
    off = { e: 0, n: 0 };
    if (marker) marker.remove();
    marker = new Marker3DElement({
      position: { lat, lng: lon, altitude: focusHeight },
      altitudeMode: 'RELATIVE_TO_GROUND',
    });
    // Sichtbar bleiben, auch wenn ein Gebäude davor steht; immer gleich groß
    for (const [k, v] of [['drawsWhenOccluded', true], ['sizePreserved', true]]) {
      try { marker[k] = v; } catch {}
    }
    // Statt Googles Pin ein schlichter orangener Punkt
    const dot = document.createElement('img');
    dot.src = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">' +
      '<circle cx="12" cy="12" r="9.5" fill="#ff4b1f" stroke="#fff" stroke-width="3"/></svg>'
    );
    dot.width = 24;
    dot.height = 24;
    const tpl = document.createElement('template');
    tpl.content.append(dot);
    marker.append(tpl);
    map.append(marker);
  }

  // Pfeiltasten: x = rechts, y = vorwärts (je −1..1), Tempo passt sich der Stufe an
  function pan(x, y, dt) {
    if (!target || animating) return;
    const range = map.range ?? 1000;
    const h = ((map.heading ?? 0) * Math.PI) / 180;
    const speed = range * 0.45;
    const e = off.e + (Math.cos(h) * x + Math.sin(h) * y) * speed * dt;
    const n = off.n + (-Math.sin(h) * x + Math.cos(h) * y) * speed * dt;
    if (Math.hypot(e, n) > range * 1.5) return;
    off = { e, n };
    showDot(false);
    map.center = focus();
  }

  async function recenter(duration = 0.7) {
    if (Math.hypot(off.e, off.n) < 0.5) {
      off = { e: 0, n: 0 };
      return;
    }
    off = { e: 0, n: 0 };
    await fly({ center: focus(), range: map.range, tilt: map.tilt, heading: map.heading }, duration);
    showDot(true);
  }

  // Stufe anfliegen: erst zentrieren, dann zoomen; die gedrehte Blickrichtung bleibt
  async function flyTo({ range, pitch }, duration = 1.8) {
    await recenter();
    await fly({ center: focus(), range, tilt: 90 + pitch, heading: map.heading ?? 0 }, duration);
  }

  function jumpToOverview({ lat, lon }) {
    Object.assign(map, { center: { lat, lng: lon, altitude: 0 }, range: 900000, tilt: 0, heading: 0 });
  }

  return { setTarget, flyTo, pan, recenter, jumpToOverview, mode: 'google3d' };
}

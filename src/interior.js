// Innenraum: eigener 3D-Scan (Polycam GLTF/GLB), 360°-Panorama oder Einbettung.
// Fehlt die Datei, erscheint ein Platzhalterraum.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createInterior(container) {
  let renderer, scene, camera, controls, frame = null, iframe = null;
  let loadedKey = null;
  const note = document.createElement('p');
  note.className = 'interior-note outlined';
  container.appendChild(note);

  function setupThree() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.prepend(renderer.domElement);
    // Falls der Browser den WebGL-Kontext entzieht (z. B. wegen der Google-Karte), neu zeichnen
    renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
    renderer.domElement.addEventListener('webglcontextrestored', () => { if (frame) startLoop(); });

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#1c1a17'); // sehr dunkles, warmes Grau
    camera = new THREE.PerspectiveCamera(55, 1, 0.05, 500);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;   // Mausrad gehört der Stufennavigation
    controls.enablePan = false;
    controls.enableDamping = true;
    resize();
    addEventListener('resize', resize);
  }

  function resize() {
    if (!renderer) return;
    const w = container.clientWidth || innerWidth;
    const h = container.clientHeight || innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function clearScene() {
    if (!scene) return;
    for (const child of [...scene.children]) scene.remove(child);
    note.textContent = '';
  }

  // ---------- Kamera: Zoomstufen im Raum, Bewegen, Zurückzentrieren ----------

  // Abstand zur Raummitte je Zoomstufe, als Anteil des Überblicks
  const ZOOM_STEPS = [1, 0.55, 0.28];
  let home = null;        // { center, radius, dist }
  let step = 0;
  let isPanorama = false;

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  function animate(duration, fn) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / (duration * 1000));
        fn(ease(t));
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  // Modell so platzieren, dass man von schräg oben in den Raum schaut (Puppenhaus-Blick)
  function frameObject(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const offset = new THREE.Vector3(radius * 0.9, radius * 1.1, radius * 1.4);
    home = { center, radius, offset, dist: offset.length() };
    step = 0;
    controls.target.copy(center);
    camera.position.copy(center).add(offset);
    camera.near = radius / 400;
    camera.far = radius * 40;
    camera.updateProjectionMatrix();
    controls.update();
  }

  // Zurück zur Raummitte, Blickrichtung und Abstand bleiben
  async function recenter(duration = 0.6) {
    if (!home || isPanorama) return;
    const shift = home.center.clone().sub(controls.target);
    if (shift.length() < home.radius * 0.01) return;
    const t0 = controls.target.clone();
    const c0 = camera.position.clone();
    await animate(duration, (t) => {
      controls.target.copy(t0).addScaledVector(shift, t);
      camera.position.copy(c0).addScaledVector(shift, t);
    });
  }

  // Eine Zoomstufe im Raum weiter (dir = +1 näher, −1 weiter weg)
  async function zoom(dir) {
    const next = step + dir;
    if (next < 0 || next >= ZOOM_STEPS.length) return false;
    step = next;
    if (isPanorama) {
      const f0 = camera.fov, f1 = 55 * ZOOM_STEPS[step] ** 0.6;
      await animate(0.8, (t) => { camera.fov = f0 + (f1 - f0) * t; camera.updateProjectionMatrix(); });
      return true;
    }
    await recenter();
    const dirVec = camera.position.clone().sub(controls.target).normalize();
    const d0 = camera.position.distanceTo(controls.target);
    const d1 = home.dist * ZOOM_STEPS[step];
    await animate(1.0, (t) => {
      camera.position.copy(controls.target).addScaledVector(dirVec, d0 + (d1 - d0) * t);
    });
    return true;
  }

  // Mit Pfeiltasten über den Boden bewegen; x = rechts, y = vorwärts (je −1..1)
  function pan(x, y, dt) {
    if (!home || isPanorama) return;
    const forward = controls.target.clone().sub(camera.position);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const speed = home.radius * 0.6 * (ZOOM_STEPS[step] + 0.3);   // m pro Sekunde
    const move = right.multiplyScalar(x * speed * dt).addScaledVector(forward, y * speed * dt);
    // nicht weiter als bis knapp über den Raum hinaus
    const next = controls.target.clone().add(move);
    if (next.distanceTo(home.center) > home.radius * 1.2) return;
    controls.target.add(move);
    camera.position.add(move);
  }

  function addLights() {
    scene.add(new THREE.HemisphereLight('#ffffff', '#8a857c', 2.2));
    const sun = new THREE.DirectionalLight('#ffffff', 1.4);
    sun.position.set(4, 8, 6);
    scene.add(sun);
  }

  async function loadGltf({ url, unlit, ceilingCut = 0.35 }) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;

    // Decke abschneiden, damit man von oben in den Raum schauen kann (Puppenhaus)
    const box = new THREE.Box3().setFromObject(model);
    const clip = ceilingCut > 0
      ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y - ceilingCut)]
      : [];
    renderer.localClippingEnabled = clip.length > 0;

    model.traverse((o) => {
      if (!o.isMesh) return;
      const old = o.material;
      // FrontSide: Wände, die zur Kamera hin nach außen zeigen, werden ausgeblendet
      o.material = unlit
        ? new THREE.MeshBasicMaterial({ map: old.map ?? null, color: old.map ? 0xffffff : old.color })
        : old;
      o.material.side = THREE.FrontSide;
      o.material.clippingPlanes = clip;
    });
    addLights();
    scene.add(model);
    frameObject(model);
  }

  async function loadPanorama({ url }) {
    const tex = await new THREE.TextureLoader().loadAsync(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(50, 64, 32),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    sphere.scale.x = -1; // Kugel umstülpen, damit man von innen das Bild sieht
    scene.add(sphere);
    isPanorama = true;
    step = 0;
    camera.fov = 55;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, 0.01);
    controls.rotateSpeed = -0.35;
    controls.update();
  }

  // Ein schlichter Ausstellungsraum als Platzhalter
  function buildPlaceholder(message) {
    addLights();
    const room = new THREE.Group();
    const W = 9, D = 6.5, H = 3.2;

    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, D),
      new THREE.MeshStandardMaterial({ color: '#f4f2ed', side: THREE.BackSide })
    );
    walls.position.y = H / 2;
    room.add(walls);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(walls.geometry),
      new THREE.LineBasicMaterial({ color: '#1a1a1a' })
    );
    edges.position.copy(walls.position);
    room.add(edges);

    const grid = new THREE.GridHelper(W, 18, '#bdb8ad', '#d6d2c8');
    grid.scale.z = D / W;
    grid.position.y = 0.002;
    room.add(grid);

    const plinth = new THREE.MeshStandardMaterial({ color: '#ffffff' });
    [[-2.4, 0.9, -1.2], [0.6, 0.6, 1.4], [2.8, 1.1, -1.6]].forEach(([x, h, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), plinth);
      m.position.set(x, h / 2, z);
      room.add(m);
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#ff4b1f' });
    const art = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.04), frameMat);
    art.position.set(-0.5, 1.6, -D / 2 + 0.03);
    room.add(art);

    scene.add(room);
    // Kamera so, dass man durch die offene Vorderseite schaut
    walls.material.side = THREE.BackSide;
    frameObject(room);
    note.textContent = message;
  }

  // Schutz gegen ein leeres Bild: Leinwand ohne Größe oder kaputte Kamera
  function sanityCheck() {
    const w = container.clientWidth, h = container.clientHeight;
    const size = renderer.getSize(new THREE.Vector2());
    if (w && h && (size.x !== w || size.y !== h)) resize();
    const p = camera.position;
    const broken = !Number.isFinite(p.x + p.y + p.z) ||
      !Number.isFinite(controls.target.x + controls.target.y + controls.target.z) ||
      p.distanceTo(controls.target) < 1e-3;
    if (broken && home) {
      controls.target.copy(home.center);
      camera.position.copy(home.center).add(home.offset);
    }
  }

  function startLoop() {
    if (frame) cancelAnimationFrame(frame);
    const tick = () => {
      sanityCheck();
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopLoop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  }

  async function show(interiorCfg) {
    const key = JSON.stringify(interiorCfg);

    if (interiorCfg.type === 'iframe') {
      if (renderer) renderer.domElement.hidden = true;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.allow = 'fullscreen; xr-spatial-tracking';
        container.prepend(iframe);
      }
      if (iframe.src !== interiorCfg.url) iframe.src = interiorCfg.url;
      iframe.hidden = false;
      loadedKey = key;
      return;
    }

    if (iframe) iframe.hidden = true;
    setupThree();
    renderer.domElement.hidden = false;
    resize();

    if (loadedKey !== key) {
      clearScene();
      isPanorama = false;
      try {
        if (interiorCfg.type === 'panorama') await loadPanorama(interiorCfg);
        else await loadGltf(interiorCfg);
      } catch (err) {
        console.warn('Innenraum nicht gefunden, zeige Platzhalter.', err);
        buildPlaceholder(`Placeholder. Put the Polycam export at ${interiorCfg.url}`);
      }
      loadedKey = key;
    } else if (home && !isPanorama) {
      // Beim erneuten Betreten wieder im Überblick starten
      step = 0;
      controls.target.copy(home.center);
      camera.position.copy(home.center).add(home.offset);
    } else if (isPanorama) {
      step = 0;
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }
    startLoop();
  }

  function hide() {
    stopLoop();
  }

  return {
    show, hide, zoom, pan, recenter,
    get step() { return step; },
    steps: ZOOM_STEPS.length,
  };
}

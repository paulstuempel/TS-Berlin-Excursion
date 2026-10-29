// Innenraum: eigener 3D-Scan (Polycam GLTF/GLB), 360°-Panorama oder Einbettung.
// Fehlt die Datei, erscheint ein Platzhalterraum.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createInterior(container) {
  let renderer, scene, camera, controls, frame = null, iframe = null;
  let loadedKey = null;
  const note = document.createElement('p');
  note.className = 'interior-note';
  container.appendChild(note);

  function setupThree() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.prepend(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e6df');
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

  // Modell so platzieren, dass man von schräg oben in den Raum schaut (Puppenhaus-Blick)
  function frameObject(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(radius * 0.9, radius * 1.1, radius * 1.4));
    camera.near = radius / 200;
    camera.far = radius * 40;
    camera.updateProjectionMatrix();
    controls.update();
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

  function startLoop() {
    if (frame) return;
    const tick = () => {
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
      try {
        if (interiorCfg.type === 'panorama') await loadPanorama(interiorCfg);
        else await loadGltf(interiorCfg);
      } catch (err) {
        console.warn('Innenraum nicht gefunden, zeige Platzhalter.', err);
        buildPlaceholder(`Platzhalter. Lege den Export aus Polycam unter ${interiorCfg.url} ab.`);
      }
      loadedKey = key;
    }
    startLoop();
  }

  function hide() {
    stopLoop();
  }

  return { show, hide };
}

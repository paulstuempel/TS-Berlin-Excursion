// Exponate in hoher Auflösung: das Bild wird wie ein Abziehbild auf den Scan projiziert
// und folgt so den Falten und Unebenheiten der echten Tafel. Leicht transparent,
// damit Licht und Schatten des Scans durchscheinen.
// Zuerst eine kleine Fassung, die scharfe erst beim Heranzoomen.

import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

const v = (a) => new THREE.Vector3(...a);

export function addWorks(scene, model, works = [], base = '') {
  const meshes = [];
  model.traverse((o) => o.isMesh && meshes.push(o));
  model.updateMatrixWorld(true);
  const loader = new THREE.TextureLoader();
  const items = [];

  for (const w of works) {
    // Rechteck aus drei Ecken: oben links, oben rechts, unten links (so wie man davor steht)
    const tl = v(w.tl), tr = v(w.tr), bl = v(w.bl);
    const right = tr.clone().sub(tl), down = bl.clone().sub(tl);
    const width = right.length(), height = down.length();
    const x = right.normalize(), y = down.normalize().negate();
    const z = new THREE.Vector3().crossVectors(x, y).normalize();   // zeigt zum Betrachter
    const center = tl.clone().addScaledVector(x, width / 2).addScaledVector(y, -height / 2);
    const rot = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const size = new THREE.Vector3(width, height, w.depth ?? 0.12);

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: w.opacity ?? 0.9,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    const group = new THREE.Group();
    for (const mesh of meshes) {
      const geo = new DecalGeometry(mesh, center, rot, size);
      if (geo.attributes.position.count) group.add(new THREE.Mesh(geo, material));
    }
    scene.add(group);

    const load = (file) => loader.loadAsync(base + file).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      material.map?.dispose();
      material.map = tex;
      material.needsUpdate = true;
    });
    items.push({ material, group, load, w, hiLoaded: false });
    load(w.low).catch((e) => console.warn('Exponat fehlt', w.low, e));
  }

  return {
    // Beim ersten Heranzoomen die scharfen Fassungen nachladen
    sharpen() {
      for (const it of items) {
        if (it.hiLoaded || !it.w.high) continue;
        it.hiLoaded = true;
        it.load(it.w.high).catch((e) => console.warn('Exponat fehlt', it.w.high, e));
      }
    },
  };
}

// Freie Bildflächen, z. B. die Straße hinter den Fenstern oder ein Aufkleber auf dem Glas.
// Ecken wie bei den Exponaten: oben links, oben rechts, unten links (von innen gesehen).
export function addPlanes(scene, planes = [], base = '') {
  const loader = new THREE.TextureLoader();
  for (const p of planes) {
    const tl = v(p.tl), tr = v(p.tr), bl = v(p.bl);
    const right = tr.clone().sub(tl), down = bl.clone().sub(tl);
    const geo = new THREE.PlaneGeometry(right.length(), down.length());
    const x = right.clone().normalize(), y = down.clone().normalize().negate();
    const z = new THREE.Vector3().crossVectors(x, y).normalize();
    const mat = new THREE.MeshBasicMaterial({
      transparent: p.transparent ?? false,
      opacity: p.opacity ?? 1,
      depthWrite: !(p.transparent ?? false),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    mesh.position.copy(tl).addScaledVector(right, 0.5).addScaledVector(down, 0.5);
    mesh.renderOrder = p.transparent ? 2 : 0;
    scene.add(mesh);
    loader.loadAsync(base + p.image).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.needsUpdate = true;
    }).catch((e) => console.warn('Bild fehlt', p.image, e));
  }
}

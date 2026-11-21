// Entfernt Dreiecke außerhalb des Raums (Schwerpunkt in removeBoxes)
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import fs from 'fs';
const [,, input, output, cfgPath] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgPath));
const io = new NodeIO(); const doc = await io.read(input);
let before = 0, after = 0;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const pos = prim.getAttribute('POSITION').getArray(); const idx = prim.getIndices();
  const ia = idx.getArray(); const keep = [];
  for (let t = 0; t < ia.length; t += 3) {
    const c = [0,1,2].map(k => (pos[ia[t]*3+k] + pos[ia[t+1]*3+k] + pos[ia[t+2]*3+k]) / 3);
    before++;
    const out = cfg.removeBoxes.some(b => c[0]>=b[0]&&c[1]>=b[1]&&c[2]>=b[2]&&c[0]<=b[3]&&c[1]<=b[4]&&c[2]<=b[5]);
    if (!out) { keep.push(ia[t], ia[t+1], ia[t+2]); after++; }
  }
  idx.setArray(new Uint32Array(keep));
}
await doc.transform(prune());
await io.write(output, doc);
console.log('triangles', before, '->', after);

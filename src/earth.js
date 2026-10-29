// Ersatz-Kartenansicht mit Cesium, wenn kein Google Key eingetragen ist:
// Satellitenbild von Esri auf flachem Globus, damit die Mechanik testbar ist.
// (Googles Photorealistic 3D Tiles sind für Projekte im EWR gesperrt,
// deshalb läuft die Google-Ansicht über earth-google.js.)

export async function createEarth(container) {
  const Cesium = window.Cesium;
  const rad = Cesium.Math.toRadians;

  const viewer = new Cesium.Viewer(container, {
    baseLayer: new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: new Cesium.Credit('Esri, Maxar, Earthstar Geographics'),
      })
    ),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    requestRenderMode: false,
  });

  const scene = viewer.scene;
  scene.globe.baseColor = Cesium.Color.fromCssColorString('#d9d6cf');
  scene.backgroundColor = Cesium.Color.fromCssColorString('#e9e6df');
  scene.skyBox.show = false;
  scene.sun.show = false;
  scene.moon.show = false;
  scene.fog.enabled = true;

  // Steuerung: kein freies Zoomen und Verschieben, nur Umsehen um die Adresse
  const ssc = scene.screenSpaceCameraController;
  ssc.enableZoom = false;
  ssc.enableTranslate = false;
  ssc.enableLook = false;
  ssc.enableRotate = true;
  ssc.enableTilt = true;
  ssc.enableCollisionDetection = true;

  let target = null;
  let enu = null;                 // Ost/Nord/Oben-Achsen an der Adresse
  let off = { e: 0, n: 0 };       // Verschiebung durch Pfeiltasten in Metern
  let marker = null;

  const focusPoint = () => {
    const east = Cesium.Matrix4.getColumn(enu, 0, new Cesium.Cartesian4());
    const north = Cesium.Matrix4.getColumn(enu, 1, new Cesium.Cartesian4());
    const p = Cesium.Cartesian3.clone(target);
    Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(new Cesium.Cartesian3(east.x, east.y, east.z), off.e, new Cesium.Cartesian3()), p);
    Cesium.Cartesian3.add(p, Cesium.Cartesian3.multiplyByScalar(new Cesium.Cartesian3(north.x, north.y, north.z), off.n, new Cesium.Cartesian3()), p);
    return p;
  };

  // Aktuelle Kamera relativ zum Drehpunkt (gilt, solange lookAt aktiv ist)
  const currentHpr = () => new Cesium.HeadingPitchRange(
    viewer.camera.heading,
    viewer.camera.pitch,
    Cesium.Cartesian3.magnitude(viewer.camera.position)
  );

  // Pfeiltasten: x = rechts, y = vorwärts (je −1..1), Tempo passt sich der Stufe an
  function pan(x, y, dt) {
    if (!target) return;
    const hpr = currentHpr();
    const speed = hpr.range * 0.45;               // m pro Sekunde
    const h = hpr.heading;
    const de = (Math.cos(h) * x + Math.sin(h) * y) * speed * dt;
    const dn = (-Math.sin(h) * x + Math.cos(h) * y) * speed * dt;
    const e = off.e + de, n = off.n + dn;
    if (Math.hypot(e, n) > hpr.range * 1.5) return;   // nicht verloren gehen
    off = { e, n };
    viewer.camera.lookAt(focusPoint(), hpr);
  }

  // Zurück auf die Adresse gleiten, Blickrichtung und Abstand bleiben
  function recenter(duration = 0.7) {
    if (Math.hypot(off.e, off.n) < 0.5) {
      off = { e: 0, n: 0 };
      return Promise.resolve();
    }
    const start = { ...off };
    const hpr = currentHpr();
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / (duration * 1000));
        const k = 1 - (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        off = { e: start.e * k, n: start.n * k };
        viewer.camera.lookAt(focusPoint(), hpr);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  function setTarget({ lat, lon, height }) {
    target = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    enu = Cesium.Transforms.eastNorthUpToFixedFrame(target);
    off = { e: 0, n: 0 };
    if (marker) viewer.entities.remove(marker);
    marker = viewer.entities.add({
      position: target,
      point: {
        pixelSize: 11,
        color: Cesium.Color.fromCssColorString('#ff4b1f'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  // Kamera auf eine Stufe bringen: immer auf die Adresse zentriert,
  // die Blickrichtung (heading), die man sich gedreht hat, bleibt erhalten.
  async function flyTo({ range, pitch }, duration = 1.8) {
    await recenter();   // erst auf die Adresse zentrieren, dann zoomen
    off = { e: 0, n: 0 };
    const camera = viewer.camera;
    const heading = camera.heading;
    const offset = new Cesium.HeadingPitchRange(heading, rad(pitch), range);
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    return new Promise((resolve) => {
      const lock = () => {
        camera.lookAt(target, offset);   // Drehpunkt = Adresse
        resolve();
      };
      if (duration === 0) return lock();
      camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
        offset,
        duration,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: lock,
        cancel: resolve,
      });
    });
  }

  // Startposition weit oben, damit der erste Flug wie ein Anflug wirkt
  function jumpToOverview({ lat, lon }) {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat - 1.2, 900000),
      orientation: { heading: 0, pitch: rad(-70), roll: 0 },
    });
  }

  function setInteractive(on) {
    ssc.enableInputs = on;
  }

  return { viewer, setTarget, flyTo, pan, recenter, jumpToOverview, setInteractive, mode: 'fallback' };
}

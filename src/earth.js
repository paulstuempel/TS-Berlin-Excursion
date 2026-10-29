// Kartenansicht mit Cesium.
// Mit Google-Key: fotorealistische 3D-Kacheln (wie Google Earth).
// Ohne Key: Satellitenbild von Esri auf flachem Globus, damit die Mechanik testbar ist.

const Cesium = window.Cesium;
const rad = Cesium.Math.toRadians;

export async function createEarth(container, { googleApiKey }) {
  const useGoogle = Boolean(googleApiKey);

  const viewer = new Cesium.Viewer(container, {
    baseLayer: useGoogle
      ? false
      : new Cesium.ImageryLayer(
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
  scene.globe.show = !useGoogle;
  scene.globe.baseColor = Cesium.Color.fromCssColorString('#d9d6cf');
  scene.backgroundColor = Cesium.Color.fromCssColorString('#e9e6df');
  scene.skyBox.show = false;
  scene.sun.show = false;
  scene.moon.show = false;
  scene.fog.enabled = true;

  if (useGoogle) {
    try {
      const tileset = await Cesium.createGooglePhotorealistic3DTileset(
        { key: googleApiKey, onlyUsingWithGoogleGeocoder: true },
        { maximumScreenSpaceError: 8 }
      );
      scene.primitives.add(tileset);
    } catch (err) {
      console.error('Google 3D Tiles konnten nicht geladen werden', err);
      throw new Error('Google 3D Tiles nicht erreichbar. API Key und Map Tiles API prüfen.');
    }
  }

  // Steuerung: kein freies Zoomen und Verschieben, nur Umsehen um die Adresse
  const ssc = scene.screenSpaceCameraController;
  ssc.enableZoom = false;
  ssc.enableTranslate = false;
  ssc.enableLook = false;
  ssc.enableRotate = true;
  ssc.enableTilt = true;
  ssc.enableCollisionDetection = true;

  let target = null;
  let marker = null;

  function setTarget({ lat, lon, height }) {
    target = Cesium.Cartesian3.fromDegrees(lon, lat, height);
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
  function flyTo({ range, pitch }, duration = 1.8) {
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

  return { viewer, setTarget, flyTo, jumpToOverview, setInteractive, mode: useGoogle ? 'google' : 'fallback' };
}

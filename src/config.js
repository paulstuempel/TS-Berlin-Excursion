// Alles, was du ohne Programmierkenntnisse anpassen kannst, steht hier.

export const config = {
  // Google Maps API Key mit aktivierter "Maps JavaScript API" (für 3D Maps).
  // Der Key ist öffentlich sichtbar und deshalb in der Google Cloud Console
  // auf paulstuempel.github.io und localhost beschränkt.
  // Leer lassen = Ersatzmodus mit Cesium und flachem Satellitenbild (Esri).
  googleApiKey: 'AIzaSyBtcr8TikIKK3AxwVNp1QfPvavB-13bnPA',

  // Welcher Ort beim Laden gezeigt wird (später kommt hier der zweite Ort dazu).
  startPlace: 'bremen',

  places: {
    bremen: {
      name: 'Bremen',
      address: 'Am Dobben 27 bis 32',
      // Feste Position (über OpenStreetMap gefunden). Für einen neuen Ort kannst du
      // geocode: 'Straße Nr, PLZ Stadt' setzen, dann wird die Adresse gesucht
      // und die Koordinaten erscheinen in der Browser-Konsole.
      geocode: false,
      lat: 53.0776649,
      lon: 8.8234398,
      // Innenraum ab Stufe 5
      //   type: 'gltf'      → eigene Datei aus Polycam (GLTF/GLB)
      //   type: 'panorama'  → 360°-Bild (equirektangulares JPG)
      //   type: 'iframe'    → fremde Einbettung (z. B. Polycam Embed-Link)
      interior: {
        type: 'gltf',
        url: 'assets/bremen/interior.glb',
        unlit: true,          // Polycam-Texturen enthalten schon das Licht
        ceilingCut: 0.9,      // so viele Meter werden oben abgeschnitten (0 = Decke bleibt)
      },
    },
  },

  // Die fünf Stufen. range = Abstand der Kamera zur Adresse in Metern,
  // pitch = Neigung in Grad (−90 senkrecht von oben, 0 waagerecht).
  levels: [
    { id: 'stadt',     label: 'Stadt',     range: 16000, pitch: -60 },
    { id: 'bezirk',    label: 'Bezirk',    range: 4200,  pitch: -52 },
    { id: 'kiez',      label: 'Kiez',      range: 1100,  pitch: -42 },
    { id: 'gebaeude',  label: 'Gebäude',   range: 230,   pitch: -28 },
    { id: 'innenraum', label: 'Innenraum', interior: true },
  ],

  // Wie lange eine Kamerafahrt zwischen zwei Stufen dauert (Sekunden)
  flightDuration: 1.8,
}

// Alles, was du ohne Programmierkenntnisse anpassen kannst, steht hier.

export const config = {
  // Google Maps API Key mit aktivierter "Map Tiles API".
  // Leer lassen = Ersatzmodus mit flachen Satellitenbildern (Esri), ohne 3D-Gebäude.
  googleApiKey: '',

  // Welcher Ort beim Laden gezeigt wird (später kommt hier der zweite Ort dazu).
  startPlace: 'bremen',

  places: {
    bremen: {
      name: 'Bremen',
      address: 'Am Dobben 27 bis 32',
      // Wird beim ersten Laden über OpenStreetMap gesucht und im Browser gespeichert.
      // Die gefundenen Koordinaten stehen in der Browser-Konsole. Wenn du sie unten
      // bei lat/lon einträgst und geocode auf false setzt, ist die Position fest.
      geocode: 'Am Dobben 30, 28203 Bremen',
      lat: 53.0779,          // ungefähr, wird durch geocode ersetzt
      lon: 8.8235,
      // Bodenhöhe über dem Ellipsoid in Metern (nur im Google-3D-Modus wichtig).
      // In Bremen liegt der Boden etwa 45 m über dem Ellipsoid.
      groundHeight: 45,
      // Innenraum ab Stufe 5
      //   type: 'gltf'      → eigene Datei aus Polycam (GLTF/GLB)
      //   type: 'panorama'  → 360°-Bild (equirektangulares JPG)
      //   type: 'iframe'    → fremde Einbettung (z. B. Polycam Embed-Link)
      interior: {
        type: 'gltf',
        url: 'assets/bremen/interior.glb',
        unlit: true,          // Polycam-Texturen enthalten schon das Licht
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

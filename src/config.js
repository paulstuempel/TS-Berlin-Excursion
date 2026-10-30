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
      address: 'Am Dobben 27 to 32',
      // Feste Position (über OpenStreetMap gefunden). Für einen neuen Ort kannst du
      // geocode: 'Straße Nr, PLZ Stadt' setzen, dann wird die Adresse gesucht
      // und die Koordinaten erscheinen in der Browser-Konsole.
      geocode: false,
      // Punkt an der Gebäudeecke (Kreuzung), etwas vor der Fassade:
      // dort liegt der Ausstellungsraum im Erdgeschoss
      lat: 53.077964,
      lon: 8.82334,
      // Höhe des Punkts und Drehpunkts über dem Boden in Metern (Erdgeschoss)
      focusHeight: 3,
      // Blickrichtung beim Start in Grad (0 = von Süden nach Norden schauen).
      // 215 schaut von der Kreuzung im Nordosten auf die Ecke mit dem Raum
      heading: 215,
      // Innenraum ab Stufe 5
      //   type: 'gltf'      → eigene Datei aus Polycam (GLTF/GLB)
      //   type: 'panorama'  → 360°-Bild (equirektangulares JPG)
      //   type: 'iframe'    → fremde Einbettung (z. B. Polycam Embed-Link)
      interior: {
        type: 'gltf',
        url: 'assets/bremen/interior.glb',
        unlit: true,          // Polycam-Texturen enthalten schon das Licht
        ceilingCut: 0.35,     // so viele Meter werden oben abgeschnitten (0 = Decke bleibt)
      },
    },
  },

  // Die fünf Stufen (Beschriftung auf Englisch). range = Abstand der Kamera zur Adresse in Metern,
  // pitch = Neigung in Grad (−90 senkrecht von oben, 0 waagerecht).
  levels: [
    { id: 'city',     label: 'City',     range: 16000, pitch: -60 },
    { id: 'district', label: 'District', range: 1700,  pitch: -50 },
    { id: 'street',   label: 'Street',   range: 230,   pitch: -28 },
    { id: 'building', label: 'Building', range: 85,    pitch: -38 },
    { id: 'room',     label: 'Room',     interior: true },
  ],

  // Wie lange eine Kamerafahrt zwischen zwei Stufen dauert (Sekunden)
  flightDuration: 1.8,
}

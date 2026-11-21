// Alles, was du ohne Programmierkenntnisse anpassen kannst, steht hier.

export const config = {
  // Google Maps API Key mit aktivierter "Maps JavaScript API" (für 3D Maps).
  // Der Key ist öffentlich sichtbar und deshalb in der Google Cloud Console
  // auf paulstuempel.github.io und localhost beschränkt.
  // Leer lassen = Ersatzmodus mit Cesium und flachem Satellitenbild (Esri).
  googleApiKey: 'AIzaSyBtcr8TikIKK3AxwVNp1QfPvavB-13bnPA',

  // Ort beim Laden: 'bremen' oder 'berlin'
  startView: 'bremen',

  // Reihenfolge der Orte im Menü
  order: ['bremen', 'berlin'],

  places: {
    bremen: {
      name: 'Bremen',
      address: { de: 'Am Dobben 27 bis 32', en: 'Am Dobben 27 to 32' },
      venue: 'Data Atlas',
      // Feste Position (über OpenStreetMap gefunden). Für einen neuen Ort kannst du
      // geocode: 'Straße Nr, PLZ Stadt' setzen, dann wird die Adresse gesucht
      // und die Koordinaten erscheinen in der Browser-Konsole.
      geocode: false,
      // Punkt an der Gebäudeecke (Kreuzung), etwas vor der Fassade:
      // dort liegt der Ausstellungsraum im Erdgeschoss
      lat: 53.07797,
      lon: 8.82343,
      // Höhe des Punkts und Drehpunkts über dem Boden in Metern (Erdgeschoss)
      focusHeight: 1.5,
      // Höhe der Straße in Googles Höhenmaß (auf der Karte ausgemessen)
      groundAltitude: 6.2,
      // Blickrichtung beim Start in Grad (0 = von Süden nach Norden schauen).
      // 215 schaut von der Kreuzung im Nordosten auf die Ecke mit dem Raum
      heading: 215,
      // Eigener Blick pro Ebene: Locality über den Dächern, steil von oben,
      // mit Blick von der Kreuzung auf die Ecke (heading = Blickrichtung in Grad)
      views: {
        locality: { range: 160, pitch: -48, heading: 215 },
      },
      // Innenraum auf der Ebene Space
      //   type: 'gltf'      → eigene Datei aus Polycam (GLTF/GLB)
      //   type: 'panorama'  → 360°-Bild (equirektangulares JPG)
      //   type: 'iframe'    → fremde Einbettung (z. B. Polycam Embed-Link)
      interior: {
        type: 'gltf',
        url: 'assets/bremen/interior.glb',
        unlit: true,          // Polycam-Texturen enthalten schon das Licht
        ceilingCut: 0,        // Decke ist im Scan schon entfernt; sonst Meter, die oben abgeschnitten werden
      },
    },

    berlin: {
      name: 'Berlin',
      address: 'Stephanstraße 11',
      venue: 'Pickle Bar',
      // Wird beim ersten Laden über OpenStreetMap gesucht (Koordinaten stehen dann
      // in der Browser-Konsole und können hier fest eingetragen werden)
      geocode: false,
      // OpenStreetMap setzt Nr. 11 mitten aufs Dach (52.534502). Der Punkt liegt
      // stattdessen an der Fassade zur Straße, wo der Eingang ist
      lat: 52.534466,
      lon: 13.3515841,
      focusHeight: 1.5,
      // Höhe der Straße in Googles Höhenmaß (auf der Karte ausgemessen)
      groundAltitude: 37,
      heading: 354,
      // Locality über den Dächern, steil von oben, Blick von der Straße auf das Haus
      // (in Bodennähe sind Googles Daten hier wegen der Bäume unbrauchbar)
      views: {
        locality: { range: 140, pitch: -50, heading: 354 },
      },
      interior: {
        type: 'gltf',
        url: 'assets/berlin/interior.glb',   // Polycam Scan vom 21.11.2026
        unlit: true,
        ceilingCut: 0.35,     // Meter, die oben abgeschnitten werden, damit man von oben hineinsieht
        turn: 165,            // Startblick von der Eingangstür aus in den Raum (Grad)
        message: { de: 'Noch kein Scan.', en: 'No scan yet.' },
      },
    },
  },

  // Die drei Ebenen (Beschriftung steht in i18n.js unter der id). range = Abstand der Kamera zur Adresse in Metern,
  // pitch = Neigung in Grad (−90 senkrecht von oben, 0 waagerecht).
  levels: [
    { id: 'city',     label: 'City',     range: 16000, pitch: -60 },
    { id: 'locality', label: 'Locality', range: 160,   pitch: -45 },
    { id: 'space',    label: 'Space',    interior: true },
  ],

  // Wie lange eine Kamerafahrt zwischen zwei Stufen dauert (Sekunden)
  flightDuration: 1.8,
}

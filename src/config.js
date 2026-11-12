// Alles, was du ohne Programmierkenntnisse anpassen kannst, steht hier.

export const config = {
  // Google Maps API Key mit aktivierter "Maps JavaScript API" (für 3D Maps).
  // Der Key ist öffentlich sichtbar und deshalb in der Google Cloud Console
  // auf paulstuempel.github.io und localhost beschränkt.
  // Leer lassen = Ersatzmodus mit Cesium und flachem Satellitenbild (Esri).
  googleApiKey: 'AIzaSyBtcr8TikIKK3AxwVNp1QfPvavB-13bnPA',

  // Ansicht beim Laden: 'bremen', 'berlin' oder 'split' (beide nebeneinander)
  startView: 'bremen',

  // Reihenfolge der Orte (links, rechts)
  order: ['bremen', 'berlin'],

  places: {
    bremen: {
      name: 'Bremen',
      address: 'Am Dobben 27 to 32',
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
      // Eigener Blick pro Stufe: Building knapp über den Dächern, steil von oben,
      // mit Blick von der Kreuzung auf die Ecke (heading = Blickrichtung in Grad)
      views: {
        building: { range: 85, pitch: -54, heading: 215 },
      },
      // Innenraum ab Stufe 5
      //   type: 'gltf'      → eigene Datei aus Polycam (GLTF/GLB)
      //   type: 'panorama'  → 360°-Bild (equirektangulares JPG)
      //   type: 'iframe'    → fremde Einbettung (z. B. Polycam Embed-Link)
      interior: {
        type: 'gltf',
        url: 'assets/bremen/interior.glb',
        unlit: true,          // Polycam-Texturen enthalten schon das Licht
        ceilingCut: 0,        // Decke ist im Scan schon entfernt; sonst Meter, die oben abgeschnitten werden
        // Exponate in hoher Auflösung, als Abziehbild auf den Scan gelegt.
        // tl, tr, bl = Ecken oben links, oben rechts, unten links in Metern (Koordinaten des Scans),
        // so wie man vor dem Exponat steht. Dateien liegen in assets/bremen/works/
        works: [
          { name: 'Einleitung',  low: 'works/01-einleitung-low.jpg',  high: 'works/01-einleitung-high.jpg',
            tl: [3.12, 0.45, -2.56], tr: [1.385, 0.45, -2.56], bl: [3.12, -0.775, -2.56], depth: 0.12 },
          { name: 'Zeitstrahl',  low: 'works/02-zeitstrahl-low.jpg',  high: 'works/02-zeitstrahl-high.jpg',
            tl: [-2.16, 0.34, -0.55], tr: [-2.16, 0.34, 4.43], bl: [-2.16, -1.575, -0.55], depth: 0.1 },
          { name: 'Karte',       low: 'works/03-karte-low.jpg',       high: 'works/03-karte-high.jpg',
            tl: [-2.035, 0.34, 4.25], tr: [-2.035, 0.34, 0.30], bl: [-2.035, -1.54, 4.25], depth: 0.07 },
          { name: 'Lückentext',  low: 'works/04-lueckentext-low.jpg', high: 'works/04-lueckentext-high.jpg',
            tl: [0.39, 0.36, 1.41], tr: [0.39, 0.36, 4.88], bl: [0.39, -1.61, 1.41], depth: 0.12 },
        ],
        // Straße hinter der Fensterfront (aus Fotos montiert, weichgezeichnet)
        // und der Schriftzug auf dem Glas, von innen spiegelverkehrt
        planes: [
          { image: 'windows/strasse.jpg', tl: [-5.2, 0.62, -6.78], tr: [6.9, 0.62, -6.78], bl: [-5.2, -1.35, -6.78] },
          { image: 'windows/eingang.jpg', tl: [7.3, 0.55, -5.4], tr: [7.3, 0.55, -3.4], bl: [7.3, -2.05, -5.4] },
          { image: 'windows/sticker.png', transparent: true, opacity: 0.92,
            tl: [2.85, 0.45, -6.64], tr: [4.45, 0.45, -6.64], bl: [2.85, 0.075, -6.64] },
        ],
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
      // Building knapp über den Dächern, steil von oben, Blick von der Straße auf das Haus
      // (in Bodennähe sind Googles Daten hier wegen der Bäume unbrauchbar)
      views: {
        building: { range: 70, pitch: -55, heading: 354 },
      },
      interior: {
        type: 'none',
        message: 'No scan yet.',
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

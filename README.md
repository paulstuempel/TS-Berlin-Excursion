# Kontext Atlas

Sketch für eine Webseite, die zwei Ausstellungsorte verbindet. Man scrollt in festen Stufen von der Stadt bis in den Ausstellungsraum.

| Stufe | Ansicht |
|---|---|
| 01 Stadt | Karte, ca. 16 km Abstand |
| 02 Bezirk | ca. 4 km |
| 03 Kiez | ca. 1 km |
| 04 Gebäude | ca. 230 m |
| 05 Innenraum | eigener 3D-Scan (Polycam) |

Scrollen oder Pfeiltasten wechseln die Stufe, Ziehen dreht die Ansicht um die Adresse.

## Lokal ansehen

Die Seite braucht keinen Build. Im Projektordner einen kleinen Server starten:

```
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. (Doppelklick auf `index.html` funktioniert nicht, weil Browser dann keine Module laden.)

## Einstellungen

Alles Wichtige steht in `src/config.js`:

- `googleApiKey` für die fotorealistischen 3D-Kacheln. Ohne Key läuft ein Ersatzmodus mit flachem Satellitenbild.
- Adresse, Koordinaten und Bodenhöhe pro Ort
- Abstand und Neigung jeder Stufe
- Innenraum pro Ort (`gltf`, `panorama` oder `iframe`)

### Google API Key besorgen

1. Auf console.cloud.google.com ein Projekt anlegen, Abrechnung aktivieren
2. Unter "APIs & Dienste" die **Map Tiles API** aktivieren
3. Unter "Anmeldedaten" einen API Key erstellen und auf die eigene Domain bzw. `localhost` beschränken
4. Key in `src/config.js` eintragen

### Innenraum

Polycam Export als **GLTF** (bzw. GLB) unter `assets/bremen/interior.glb` ablegen. Exportiert Polycam eine `.gltf` mit Texturordner, alles in `assets/bremen/` legen und `url` in der config anpassen.

Für eine 360° Aufnahme: equirektangulares JPG ablegen und in der config `type: 'panorama'` setzen.

## Aufbau

```
index.html        Gerüst
style.css         Gestaltung
src/config.js     Orte, Stufen, Keys
src/main.js       Stufenlogik, Scrollen, Übergänge
src/earth.js      Kartenansicht (Cesium)
src/interior.js   Innenraum (three.js)
assets/<ort>/     3D-Scans und Bilder
```

## Nächste Schritte

- Zweiter Ort und Umschalten (Vollbild mit Buttons, Splitview, Slider)
- Textebene je Stufe mit Ein/Aus-Schalter
- Eventuell Texte von Besucher*innen

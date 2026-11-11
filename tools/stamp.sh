#!/bin/sh
# Versionsstempel an alle eigenen Dateien hängen, damit Browser nach einem Update
# nicht die alte Version aus dem Zwischenspeicher nehmen. Vor jedem Commit ausführen.
v=$(date +%s)
cd "$(dirname "$0")/.."
sed -i -E "s#href=\"style\.css(\?v=[0-9]+)?\"#href=\"style.css?v=$v\"#; s#src=\"src/main\.js(\?v=[0-9]+)?\"#src=\"src/main.js?v=$v\"#" index.html
sed -i -E "s#'(\./[a-z-]+\.js)(\?v=[0-9]+)?'#'\1?v=$v'#g" src/*.js
echo "Version $v"

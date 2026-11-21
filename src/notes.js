// Textebene: Kurznotizen je Ebene (City, Locality, Space).
// Ein Eintrag mit bremen und berlin steht in beiden Städten an derselben Stelle.
// Ein Eintrag mit nur einer Stadt (z. B. aus einem Interview) erscheint nur dort.
// Quelle: „Kurznotizen Ebenen Bremen und Berlin“ (11. November 2026).
// id bleibt fest und verbindet die deutsche Fassung mit der englischen (notes-en.js).
// check: true markiert Angaben, die im Dokument noch als „prüfen“ vermerkt sind.

export const notes = {
  // Stadt, dazu die abstrakteren und politischen Punkte
  city: [
    { id: 'c01', topic: 'Größe', bremen: 'In der Stadt Bremen leben rund 588.000 Menschen.', berlin: 'In Berlin leben rund 3,7 Millionen Menschen, gut sechsmal so viele.' },
    { id: 'c02', topic: 'Status', bremen: 'Bremen bildet mit Bremerhaven das kleinste Bundesland.', berlin: 'Berlin ist Stadtstaat und Bundeshauptstadt zugleich.' },
    { id: 'c03', topic: 'Umland', bremen: 'Bremen ist ganz von Niedersachsen umschlossen.', berlin: 'Berlin ist ganz von Brandenburg umschlossen.' },
    { id: 'c04', topic: 'Gliederung', bremen: 'Die Stadt gliedert sich in Stadtteile mit gewählten Beiräten.', berlin: 'Die Stadt gliedert sich in zwölf Bezirke mit eigenen Bezirksparlamenten.' },
    { id: 'c05', topic: 'Wachstum', bremen: 'Bremen wächst seit 2021 wieder, vor allem durch Zuzug.', berlin: 'Berlin wächst, weil Zuwanderung den Sterbeüberschuss mehr als ausgleicht.' },
    { id: 'c06', topic: 'Regierungschef', bremen: 'Bürgermeister ist Andreas Bovenschulte von der SPD.', berlin: 'Kai Wegner von der CDU führt die Geschäfte, bis ein neuer Senat steht.' },
    { id: 'c07', topic: 'Koalition', bremen: 'Seit 2019 regieren SPD, Grüne und Linke.', berlin: 'Seit dem 2. November verhandeln Linke, Grüne und SPD über dieselbe Koalition.' },
    { id: 'c08', topic: 'Kräfte', bremen: 'Die SPD stellt den Bürgermeister seit Ende des Zweiten Weltkriegs ohne Unterbrechung.', berlin: 'Die Linke wurde 2026 erstmals stärkste Kraft, die SPD fiel auf 12,1 Prozent.' },
    { id: 'c10', topic: 'Haushalt', bremen: 'Der Stabilitätsrat sieht für Bremen eine drohende Haushaltsnotlage.', berlin: 'Berlin hat 2025 rund drei Milliarden Euro aus dem Haushalt gestrichen.' },
    { id: 'c11', topic: 'Sparkurs', bremen: 'Bremen spart unter einem Sanierungsprogramm bis 2027.', berlin: 'Die Berliner Kultur verlor 2025 rund 130 Millionen Euro, knapp zwölf Prozent ihres Budgets.' },
    { id: 'c13', topic: 'Medienförderer', bremen: 'Medien fördert vor allem die nordmedia, gemeinsam für Niedersachsen und Bremen.', berlin: 'Medien fördern das Medienboard und die Medienanstalt Berlin Brandenburg.' },
    { id: 'c14', topic: 'Programm', bremen: 'CLOSEUP ist ein Stipendium der nordmedia mit der Wirtschaftssenatorin.', berlin: 'Das MIZ Babelsberg ist das Innovationsprogramm der Medienanstalt.' },
    { id: 'c15', topic: 'Summe', bremen: 'Der Data Atlas erhielt 2026 genau 20.000 Euro.' },
    { id: 'c18', topic: 'Stadtplanung', bremen: 'Für die Mozarttrasse wurde in den 1960ern ein Teil des Rembertiviertels abgerissen.', berlin: 'Im Stephankiez wurde 1991 gegen den Widerstand des Landes erstmals Milieuschutz durchgesetzt.' },
    { id: 'c19', topic: 'Protest', bremen: 'Nachbar:innen verhinderten die Mozarttrasse, 1973 und 1974 wurde sie aufgegeben.' },
    { id: 'c21', topic: 'Drogenhilfe', bremen: 'In der Bahnhofsvorstadt bündeln sich Drogenhilfe und Wohnungslosenhilfe.', berlin: 'Am Kleinen Tiergarten gibt es eine offene Drogenszene und den Drogenkonsumraum Birkenstube.' },
    { id: 'c22', topic: 'Migration', bremen: 'Zugewanderte machen in der Bahnhofsvorstadt laut Beirat Mitte fast 40 Prozent aus.', berlin: 'Moabit hat libanesische, westafrikanische, türkische und osteuropäische Gemeinschaften.', check: true },
    { id: 'c24', topic: 'Mieten', bremen: 'Die Bestandsmiete liegt in der Bahnhofsvorstadt bei 9,77 Euro je Quadratmeter, im Ostertor bei 9,05 Euro.', berlin: 'Neue Angebote im Stephankiez kosten im Schnitt rund 13,50 Euro je Quadratmeter.' },
  ],

  // Umgebung, Viertel, Straße und Gebäude
  locality: [
    { id: 'l01', topic: 'Lage', bremen: 'Die Bahnhofsvorstadt liegt zwischen Hauptbahnhof und Innenstadt, das Viertel schließt östlich an.', berlin: 'Moabit liegt nordwestlich des Zentrums, der Berliner Hauptbahnhof gehört dazu.' },
    { id: 'l02', topic: 'Zuschnitt', berlin: 'Moabit ist ein Ortsteil, der Stephankiez ein Kiez in seinem Nordosten.' },
    { id: 'l03', topic: 'Verwaltung', berlin: 'Moabit gehört seit 2001 zum Bezirk Mitte, vorher zu Tiergarten.' },
    { id: 'l04', topic: 'Entstehung', bremen: '1847 öffnete Bremens erster Bahnhof dort, wo heute der Hauptbahnhof steht.', berlin: 'Moabit entstand ab 1716 als Kolonie und wurde 1861 Teil Berlins.' },
    { id: 'l05', topic: 'Name', berlin: 'Der Name geht vermutlich auf Hugenotten zurück, die ihr Land terre de Moab nannten.' },
    { id: 'l06', topic: 'Krieg', bremen: 'In der Bahnhofsvorstadt blieben nach dem Krieg laut Team nur rund 5 Prozent der Bausubstanz erhalten.', berlin: 'Im Stephankiez sind rund 90 Prozent der historischen Bausubstanz erhalten.', check: true },
    { id: 'l09', topic: 'Barriere', bremen: 'Die Hochstraße Breitenweg trennt Bahnhof und Innenstadt.', berlin: 'Moabit ist ganz von Spree und Kanälen umgeben und nur über Brücken erreichbar.' },
    { id: 'l10', topic: 'Randlage', bremen: 'Die Bahnhofsvorstadt ist für viele ein Ort, den man nur durchquert.' },
    { id: 'l11', topic: 'Szene', bremen: 'Das Viertel ist seit den 1970ern ein Ort von Kinos, Kneipen, Cafés und Szene.' },
    { id: 'l12', topic: 'Name', bremen: '„Dobben“ ist der Name eines früheren Wasserlaufs.', berlin: 'Straße und Kiez sind nach Heinrich von Stephan benannt, dem preußischen Generalpostdirektor.' },
    { id: 'l13', topic: 'Untergrund', berlin: 'Moabit entstand auf der früheren Großen Stadtheide, die im 13. Jahrhundert an Berlin kam.' },
    { id: 'l14', topic: 'Stadtrand', bremen: 'Ab 1349 war der Dobben eine Landwehr, ein Verteidigungsgraben am Rand der Stadt.' },
    { id: 'l15', topic: 'Frühe Bauten', berlin: '1717 legten Hugenotten in Moabit Maulbeerplantagen an.' },
    { id: 'l16', topic: 'Umbau', berlin: 'Die meisten Häuser im Stephankiez entstanden zwischen 1870 und 1910.' },
    { id: 'l17', topic: 'Wohnlage damals', berlin: 'Der Stephankiez war ein Arbeiterviertel.' },
    { id: 'l18', topic: 'Wohnlage heute', berlin: 'Der Stephankiez gilt heute als gefragte Wohnlage.' },
    { id: 'l19', topic: 'Bebauung', bremen: 'Die Häuser stammen meist aus dem späten 19. Jahrhundert und haben zwei bis drei Geschosse.', berlin: 'Die Gründerzeithäuser haben hohe Decken, Stuckfassaden und verschachtelte Hinterhöfe.' },
    { id: 'l20', topic: 'Grün', berlin: 'Hohe Straßenbäume und Kopfsteinpflaster prägen das Bild.' },
    { id: 'l22', topic: 'Verkehr', bremen: 'Am Dobben verbindet als Hauptstraße den Hauptbahnhof mit dem Viertel.' },
    { id: 'l23', topic: 'Nahverkehr', bremen: 'Straßenbahnen fahren hier seit 1881, die Linie 10 seit 1919.', berlin: 'Die nächsten Bahnhöfe sind die U9 Birkenstraße und Westhafen.' },
    { id: 'l26', topic: 'Besondere Häuser', berlin: 'In der Stephanstraße 60 wohnte 1968 und 1969 die Kommune 1.' },
    { id: 'l27', topic: 'Nachbarschaft', bremen: 'Das Viertel mit Kinos und Kneipen beginnt direkt hinter der Kreuzung.', berlin: 'In den Kiez sind zuletzt viele Familien, Kreative und Studierende gezogen.' },
    { id: 'l28', topic: 'Typ', bremen: 'Das Haus ist ein Geschäftshaus aus dem Werk eines Nachkriegsarchitekten.', berlin: 'Das Haus ist ein Gewerbebau mitten im Gründerzeitkiez.' },
    { id: 'l29', topic: 'Architekt', bremen: 'Entworfen hat es Th. Siegfried A. Morschel, der von 1920 bis 2002 lebte.' },
    { id: 'l31', topic: 'Erdgeschoss', bremen: 'Im Erdgeschoss war eine Filiale der Sparkasse Bremen.', berlin: 'Im Erdgeschoss liegt die Pickle Bar.' },
    { id: 'l32', topic: 'Nachbarn im Haus', bremen: 'Die Sparkasse betreibt dort bis heute einen Geldautomaten, rund um die Uhr.', berlin: 'Das Studio von Slavs and Tatars liegt in einem ähnlichen Gewerbebau ein paar Häuser weiter.' },
    { id: 'l33', topic: 'Sichtbarkeit', bremen: 'Das Haus steht sichtbar an einem der wichtigsten Verkehrsknoten Bremens.', berlin: 'Große Fenster öffnen den Raum zu Passant:innen und Nachbar:innen.' },
    { id: 'l35', topic: 'Zugang', bremen: 'Der Raum liegt ebenerdig an der Straße.', berlin: 'Der Raum ist nur teilweise barrierefrei, ein zweiter Zugang führt über den Haupteingang des Hauses.', check: true },
    { id: 'l36', topic: 'Bezug zum Thema', bremen: 'Morschel baute 1961 auch das Tivoli Hochhaus an der Hochstraße in der Bahnhofsvorstadt.' },
  ],

  // Raum, Betrieb und Programm
  space: [
    { id: 's01', topic: 'Status', bremen: 'Der Raum war ein Leerstand, den das Team für kurze Zeit nutzen konnte.', berlin: 'Die Pickle Bar ist seit 2020 ein dauerhafter Ort.' },
    { id: 's02', topic: 'Betrieb', bremen: 'Betrieben wurde die Ausstellung vom Projektteam des Data Atlas.', berlin: 'Betrieben wird der Non Profit Raum von Slavs and Tatars und der Kuratorin Anastasia Marukhina.' },
    { id: 's03', topic: 'Vorgeschichte', bremen: 'Vor dem Leerstand waren hier eine Bank und ein Hörgeräteakustiker mit drei Hörstudios.' },
    { id: 's04', topic: 'Zustand', bremen: 'Der Raum ist im Rohbau, mit offenen Decken, Kabeln und fehlendem Fußboden.' },
    { id: 's05', topic: 'Spuren', bremen: 'Kabel für Geldautomaten, Kasse, Bildschirme und Intranet zeigen die alte Bank.' },
    { id: 's06', topic: 'Küche', bremen: 'Küche und Pausenraum stammen aus der Firmenzeit.', berlin: 'Statt Wein und Käse gibt es fermentierte Speisen und Spirituosen.' },
    { id: 's07', topic: 'Leitmotiv', berlin: 'Der Raum erzählt von Gastfreundschaft und Sprache.' },
    { id: 's08', topic: 'Inhalt', bremen: 'Die Ausstellung zeigte Bodenpreise, Investments, Problemimmobilien, Drogenhilfe und Obdachlosigkeit.', berlin: 'Das Programm behandelt Geschichte, materielle Kultur, Sprache und Gender in Eurasien.' },
    { id: 's09', topic: 'Format', bremen: 'Gezeigt wurden Wandmodule, ein Immobilienquartett, ein Centerpiece und ein großes Banner.', berlin: 'Gezeigt werden vor allem Performances, Gespräche und Workshops.' },
    { id: 's10', topic: 'Metapher', berlin: 'Die kostenlosen Gurken werden als politische Metapher verstanden.' },
    { id: 's11', topic: 'Zeitraum', bremen: 'Die Pilotausstellung lief vom 25. September bis 4. Oktober 2026.', berlin: 'Die Bar öffnete im September 2020 zur Berlin Art Week, gemeinsam mit den KW.' },
    { id: 's12', topic: 'Öffnung', bremen: 'Geöffnet war an sechs Ausstellungstagen mit zwei Events.', berlin: 'Geöffnet wird nur zu Veranstaltungen, mit begrenzter Kapazität.' },
    { id: 's13', topic: 'Publikum', bremen: 'Rund 350 Besucher:innen kamen in die Ausstellung.' },
    { id: 's14', topic: 'Finanzierung', bremen: 'Gefördert wurde die Ausstellung mit 20.000 Euro von CLOSEUP.', berlin: 'Bekannt sind Mitgliedschaften, eine Förderung ist nicht bekannt.' },
    { id: 's15', topic: 'Ausblick', bremen: 'Das Team beantragt Förderung, um den Data Atlas weiterzuführen.', berlin: 'Die Bar arbeitet mit einer Residency und Pop ups außerhalb Berlins weiter.' },
  ],
};

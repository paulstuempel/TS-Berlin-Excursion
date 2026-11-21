// Sprache der Seite (Deutsch oder Englisch) und alle festen Texte.
// Wahl wird im Browser gemerkt; ?lang=de oder ?lang=en in der Adresse geht vor.

const KEY = 'kontext-atlas-lang';

function initial() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'de' || q === 'en') return q;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {}
  return (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

let lang = initial();
const listeners = new Set();

export const getLang = () => lang;

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch {}
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn(lang));
}

export const onLang = (fn) => listeners.add(fn);

// Text in der aktuellen Sprache: Schlüssel aus ui oder ein Objekt { de, en }
export function t(x) {
  if (x == null) return '';
  if (typeof x === 'string') return ui[x]?.[lang] ?? x;
  return x[lang] ?? x.en ?? x.de ?? '';
}

export const ui = {
  notes:        { de: 'Notizen', en: 'Notes' },
  about:        { de: 'About', en: 'About' },
  close:        { de: 'Schließen', en: 'Close' },
  hint:         { de: 'Scrollen zum Zoomen, Ziehen zum Umsehen,<br>Pfeiltasten zum Bewegen', en: 'Scroll to zoom, drag to look around,<br>arrow keys to move' },
  loadingMap:   { de: 'Karte wird geladen', en: 'Loading map' },
  loadingRoom:  { de: 'Raum wird geladen', en: 'Loading room' },
  city:         { de: 'Stadt', en: 'City' },
  locality:     { de: 'Umgebung', en: 'Locality' },
  space:        { de: 'Raum', en: 'Space' },
};

// Einführung (About). Absätze als Liste, Titel getrennt.
export const about = {
  de: {
    title: 'Space as a publication, publishing space',
    body: [
      'Vom 20. bis 23. November 2026 ist die Klasse Temporary Spaces der HfK Bremen mit Prof. Asli Serbest in Berlin unterwegs. Der Arbeitstitel des Programms lautet „Not Pulp But Public, Fiction!“. Uns begleitet die Frage, wie man die eigene Praxis mit sich trägt und sie in kurzer Zeit an einem neuen Ort ankommen lässt.',
      'Frisch eingemacht nehme ich die Erfahrungen und Eindrücke aus der Produktion einer Ausstellung mit nach Berlin. Ich habe sie in den letzten Monaten mit Johanna Rose-Jastram (Journalismus), Philipp Buhlmann (Ausstellungsdesign) und Kristina Schmidt (Kulturmanagement) mithilfe des CLOSEUP Stipendiums umgesetzt.',
      'Die Ausstellung Data Atlas Bahnhofsvorstadt Am Dobben in Bremen machte datenjournalistische und archivarische Forschung zu einem problembehafteten Bremer Stadtteil öffentlich und stellte sie im direkten Umfeld der Bahnhofsvorstadt aus. Zu den Inhalten kam eine weitere Ebene hinzu, eine soziale, verortete und programmatische. Sie bestand aus Gesprächen, Besuchen, der Nachbarschaft und der Besonderheit des Ortes selbst, einer leerstehenden alten Sparkassenfiliale auf Zeit. Aus der Ausstellung, ihren Inhalten und ihrem Prozess soll nun eine gedruckte Publikation entstehen. Als Kommunikationsdesigner beschäftigt mich dabei die Frage, wie man Inhalte im Raum publiziert, und umgekehrt, wie man die Inhalte einer Ausstellung publiziert, ohne rein dokumentarisch zu arbeiten.',
      'Eine Orientierung bietet die Praxis von Slavs and Tatars. Ihre Arbeit ruht auf Ausstellungen, Büchern und Lecture Performances. Die Bücher sind eigenständige Werke. Das Kollektiv arbeitet in Recherchezyklen, und jede Ausstellung ist eine Ausgabe in einer Reihe. In Moabit betreibt das Kollektiv die Pickle Bar, deren Leitsatz lautet „hospitality and discourse are inseparable“. Das Einlegen (to pickle) lässt sich als programmatisches Bild für alternatives Publizieren lesen. Etwas wird haltbar gemacht, weitergegeben und in verändertem Kontext genossen.',
      'Paul Soulellis beschreibt Publizieren als fortlaufende, öffentliche Handlung über verschiedene Kontexte hinweg (Paul Soulellis, <i>Performing Publishing. Infrathin Tales from the Printed Web</i>, Hyperallergic 2014).',
      'Data Atlas und Pickle Bar sind dabei keine Gegenstücke. Beide zeigen „alternative ways of making things public“, wie es im Exkursionsprogramm heißt.',
      'Diese Webseite ist ein Werkzeug auf diesem Weg und nicht das Projekt selbst. Sie führt in drei Ebenen von der Stadt über die Umgebung in den Raum und stellt beide Orte nebeneinander. Die Notizen sind Fragmente aus Recherche und Gesprächen. Im Moment enthalten sie vor allem Faktisches. Mit Erfahrungen aus der Exkursion und Inhalten der Projekte füllen sie sich weiter.',
    ],
  },
  en: {
    title: 'Space as a publication, publishing space',
    body: [
      'From 20 to 23 November 2026, the class Temporary Spaces of HfK Bremen is travelling through Berlin with Prof. Asli Serbest. The working title of the programme is “Not Pulp But Public, Fiction!”. We are accompanied by the question of how to carry one’s own practice and let it arrive in a new place within a short time.',
      'Freshly pickled, I bring the experiences and impressions from producing an exhibition with me to Berlin. Over the past months I realised it with Johanna Rose-Jastram (journalism), Philipp Buhlmann (exhibition design) and Kristina Schmidt (cultural management), supported by the CLOSEUP grant.',
      'The exhibition Data Atlas Bahnhofsvorstadt at Am Dobben in Bremen made data journalism and archival research on a troubled Bremen district public and showed it in the immediate surroundings of the Bahnhofsvorstadt. A further layer was added to the content, a social, situated and programmatic one. It consisted of conversations, visits, the neighbourhood and the particularity of the place itself, a vacant former savings bank branch in temporary use. The exhibition, its content and its process are now to become a printed publication. As a communication designer, I am interested in how content can be published in space, and conversely, how the content of an exhibition can be published without working in a purely documentary way.',
      'The practice of Slavs and Tatars offers orientation. Their work rests on exhibitions, books and lecture performances. The books are works in their own right. The collective works in research cycles, and each exhibition is an issue in a series. In Moabit the collective runs the Pickle Bar, whose motto is “hospitality and discourse are inseparable”. Pickling can be read as a programmatic image for alternative publishing. Something is preserved, passed on and enjoyed in a changed context.',
      'Paul Soulellis describes publishing as a continuous, public act across different contexts (Paul Soulellis, <i>Performing Publishing. Infrathin Tales from the Printed Web</i>, Hyperallergic 2014).',
      'Data Atlas and Pickle Bar are not counterparts. Both show “alternative ways of making things public”, as the excursion programme puts it.',
      'This website is a tool along this path and not the project itself. It leads through three levels from the city through the locality into the space and places both sites side by side. The notes are fragments from research and conversations. At the moment they mostly contain facts. With experiences from the excursion and content from the projects, they will continue to fill up.',
    ],
  },
};

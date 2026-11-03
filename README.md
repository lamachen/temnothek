# 🐜 TEMNOTHEK

Interaktive, visuelle Bestimmung von **Temnothorax**-Arten und ihren Lookalikes
(*Leptothorax*, *Formicoxenus*, *Harpagoxenus*, *Stenamma*, kleine *Myrmica*) –
Fokus Deutschland + Nachbarraum.

**Kein Bestimmungsbuch, sondern ein Werkzeug:**
- 🧭 **Visuelle Reise** (Start-Ansicht) – Szene für Szene: animierte Erklär-Bilder zeigen, *worauf* man schaut
  (Licht-Sweep = Glanz, Vinyl-Rillen = costulae, Tandem-Animation = Verhalten …). Antworten in Alltagsvergleichen
  („wie Sandpapier“, „wie poliert“), Fachbegriff nur als Fußnote. Snappige Step-Transitions, Fortschritts-Pfad,
  animierter Stimmigkeits-Ring am Ende.
- 🎬 **Verhalten bestimmt mit** – Tandemlaufen, Einrollen, Stich-Drohen, Gast bei Waldameisen, Brutraub als eigene Szenen.
- 📷 **Foto-Check** – eigenes Makro per Drag&Drop, synchron zoom-/pannbar neben dem Belegfoto **derselben Ansicht**.
- 🌿/🔬 **Feld- & Labor-Modus** – einfache Sprache + Feld-Tipps vs. Messwerte/Tabellen (oben rechts umschaltbar).
- 🎯 **Lebend-Filter** – Merkmale antippen, Kandidatenliste schrumpft live, jede Karte begründet („Warum?“).
- 🛡️ **Verifizierte Belegfotos** – Museumsbelege (CASENT-Nummern, CC-BY 4.0) mit Herkunftssiegel; kein Community-Ratebild.
- 📐 **Verhältnistreue SVG-Zeichnungen** – parametrisch aus publizierten Winkeln/Ratios erzeugt, alle Arten gleich orientiert.
- ⚔️ **Verwechslungs-Duell** – synchron zoom-/pannbarer A/B-Vergleich (mit Touch-Zoom-Buttons) + **Ghost-Overlay** der Zeichnungen mit Opazitätsregler.
- 🧪 **Morph-Lab** – Slider für Dornenwinkel/-länge, Knotenwinkel/-höhe morphen die Zeichnung live und zeigen, welche Arten im Formfenster liegen.
- 🔬 **Mess-Bank** – eigenes Foto kalibrieren, Strecken in µm messen, Ratios gegen publizierte Spannen prüfen, D4-Diskriminanz.
- 🚦 **Ehrlichkeits-Ampel** – grün/gelb/rot inkl. „per Foto NICHT trennbar“ bei kryptischen Paaren.
- 📓 **Fund-Journal** – lokal (IndexedDB), mit GPS, Foto, Export.
- 📴 **Offline-fähig** – statische Web-App, Service Worker, keine Serverkosten, keine Konten.

## Lokal starten

Variante A (empfohlen, aktiviert Offline-Caching/PWA):

```bash
cd temnothek
python3 -m http.server 8080        # oder: npx serve .
# dann im Browser: http://localhost:8080
```

Variante B: `index.html` direkt doppelklicken – funktioniert ebenfalls
(dann ohne Service-Worker/Offline-Cache).

Als App installieren: im Browser „Installieren“ / „Zum Startbildschirm hinzufügen“.

## Struktur

```
temnothek/
├── index.html            Shell
├── styles.css            Theme (dunkel/hell), Layout
├── js/data.js            Arten-DB, Merkmale, Duelle, Glossar, Quellen
├── js/morph.js           SVG-Engine (Profil, Kopfdorsal, Anatomie, Range-Plots)
├── js/engine.js          Scoring, nächste Frage, Ampel, Morphometrie
├── js/ui.js              Router & Views (Bestimmen, Arten, Duell, Mess-Bank, Journal, Wissen)
├── assets/img/           22 verifizierte Belegfotos (~208 KB)
├── sw.js, manifest.webmanifest   PWA/Offline
├── QUELLEN.md            Provenienz- & Verifikationslog aller Bilder/Fakten
└── README.md
```

## Daten erweitern

Neue Art → Eintrag in `TAXA` (js/data.js): `chars`-Gewichte (1/0.4/0), `region`,
`habitat`, `morphParams` (Winkel & Ratios aus der Literatur!), `bilder` mit
`specimen`+`quelle`+`url`. Neues Duell → `DUELLE`. Neuer Ratio-Bereich →
`MORPH_RANGES` (nur publizierte Spannen aufnehmen, Quelle angeben).

## Lizenzhinweis

Privates Projekt. Belegfotos: © California Academy of Sciences / AntWeb, CC-BY 4.0,
via AntWiki & Wikimedia Commons. Eigener Code & Zeichnungen: frei für private Nutzung.

## 🌍 GitHub Pages (Hosting)

Dieses Repo deployt automatisch per **GitHub Actions** auf GitHub Pages:
Workflow `.github/workflows/pages.yml` baut bei jedem Push auf `main` ein `_site/`-Artefakt
(nur die statischen App-Dateien) und veröffentlicht es unter
`https://<username>.github.io/temnothek/`.

Setup-Schritte (einmalig, bereits erledigt falls du dieses Repo von lamachen/temnothek hast):
1. Repo **public** anlegen (Pages + freie Actions-Minuten).
2. Unter *Settings → Pages* die Quelle auf **GitHub Actions** setzen (passiert automatisch per API/Workflow).
3. Push auf `main` → Action läuft → Seite live. Status: *Actions*-Tab.

Lokal bleibt die App trotzdem voll nutzbar (`python3 -m http.server`), inkl. Offline-Cache via Service Worker.

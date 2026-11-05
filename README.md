# 🐜 TEMNOTHEK v4 – FOKUS

Reine Foto-Bestimmungsapp für **Temnothorax** und Lookalikes (*Leptothorax*, *Formicoxenus*,
*Harpagoxenus*, *Stenamma*, kleine *Myrmica*) – Deutschland + Nachbarraum.

**Prinzip:** Bestimmen über **verifizierte Belegfotos**, optimal präsentiert. Kein Fragebogen,
keine Szenen, kein Beiwerk.

- 📷 **Belegfoto-Wand** (Start): jede Art als Karte mit Museums-Belegfoto in **Leitansicht Profil**
  (alle gleich orientiert = direkt vergleichbar), DE-Status Badge, 🛡️ = Provenanz-Popover
  (CASENT-Nummer / Revisionstafel, Quelle, Lizenz CC-BY 4.0, Prüfvermerk).
- 🎯 **Merkmals-Punkte**: pulsierende Marker auf den Fotos zeigen die diagnostischen Regionen
  (Kopf-Skulptur, Propodealdornen, Knoten …) – auf Wand, Dossier, Duell und in der Lightbox.
- 🔍 **Lightbox**: jedes Dossier-Foto groß, zoom-/panbar (Rad, Buttons, Ziehen, Doppelklick-Reset),
  Marker an/aus, Belegkette direkt darunter.
- ⚔️ **Duell**: verwechslungsgefährliche Paare mit **synchronem Zoom/Pan** auf beiden Belegfotos,
  Ansichten-Umschalter (Profil/Kopf/Dorsal), Ehrlichkeits-Ampel („per Foto NICHT trennbar"),
  Form-Overlay der verhältnistreuen Zeichnungen mit Opazitätsregler.
- 🔍 **Foto-Check**: eigenes Makro per Drag&Drop gegen das Belegfoto **derselben Ansicht**,
  synchron zoombar; bleibt nur in der Sitzung, verlässt das Gerät nicht.
- 📖 **Dossier**: Belegfotos aller Ansichten (Profil zuerst), verhältnistreue parametrische
  Zeichnung (publizierte Winkel/Ratios, CS-normiert), Steckbrief, Biologie, Jahresaktivität,
  Verwechslungs-Links; im 🔬 Labor-Modus zusätzlich publizierte Morphometrie-Spannen.
- 🔬 **Mess-Bank**: Foto kalibrieren, Strecken in µm messen, Ratios gegen publizierte Spannen,
  D4-Diskriminanz – für Paare, die per Foto nicht trennbar sind.
- 🌿/🔬 **Feld-/Labor-Modus**: schaltet Sprache & Tiefe der Zusatzinformationen.
- 📴 **Offline & kostenlos**: statische Web-App + Service Worker, keine Server, keine Konten.

## Bild-Sicherheit

Kein Community-Ratebild: Jedes eingebettete Foto hängt an einem physischen Museumsspecimen
(AntWeb / California Academy of Sciences, CASENT-Nummer) oder an einer Bildtafel einer
peer-reviewten Revision, ist CC-BY 4.0 lizenziert und wurde zusätzlich visuell gegengeprüft.
Details: [QUELLEN.md](QUELLEN.md).

## Lokal starten

Ordner downloaden und `index.html` öffnen – oder irgendein Statik-Server, z. B.:
`python3 -m http.server 8080` im Projektordner. Live: https://lamachen.github.io/temnothek/

Privates, nicht-kommerzielles Projekt.

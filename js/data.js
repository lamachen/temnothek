/* =========================================================================
   TEMNOTHEK – Datenschicht
   Alle Fakten mit Quellenverweis (siehe QUELLEN.md).
   Gewichte: 1 = typisch, 0.4 = möglich/selten, 0 = ausgeschlossen
   ========================================================================= */
"use strict";

const APP_META = {
  name: "TEMNOTHEK",
  version: "3.0.0",
  stand: "2026-11",
  lizenzHinweis: "Privates, nicht-kommerzielles Projekt. Belegfotos: AntWeb / California Academy of Sciences via AntWiki & Wikimedia Commons, CC-BY 4.0."
};

/* ---------- Regionen (Bundesland -> Regionsgewicht-Schlüssel) ---------- */
const REGIONEN = {
  west:    { label: "West (NRW, RLP, SL, HE)" },
  sued:    { label: "Süd (BY, BW)" },
  ost:     { label: "Ost (SN, ST, TH, BB, MV)" },
  nord:    { label: "Nord (NI, SH, HH, HB)" },
  mitte:   { label: "Mitte (übergreifend)" }
};
const BUNDESLAENDER = {
  "BW":"sued","BY":"sued","HE":"west","NRW":"west","RP":"west","SL":"west",
  "BB":"ost","MV":"ost","SN":"ost","ST":"ost","TH":"ost",
  "NI":"nord","SH":"nord","HH":"nord","HB":"nord","BE":"ost"
};

/* ---------- Habitate ---------- */
const HABITATE = {
  wald:      { label: "Wald & Forst",           icon: "" },
  trocken:   { label: "Trockenrasen / Felssteppe", icon: "🪨" },
  baum:      { label: "Baum / Kronenraum / Totholz am Stamm", icon: "🌳" },
  stein:     { label: "Steine, Mauern, Bruch",  icon: "🧱" },
  streu:     { label: "Streu, Moos, Boden",     icon: "🍂" },
  urban:     { label: "Urban / Park / Garten",  icon: "🏙️" }
};

/* ---------- Merkmale (Charakter-System für den Lebend-Filter) ---------- */
const CHARAKTERE = [
  { id:"c_size", region:"Steckbrief", label:"Größe der Arbeiterin", icon:"📏",
    states:{ s1:"< 2,2 mm", s2:"2,2–3,0 mm", s3:"3,0–4,0 mm", s4:"> 4,0 mm" } },
  { id:"c_color", region:"Kopf & Körper", label:"Grundfärbung", icon:"🎨",
    states:{ gelb:"gelb", gelbbraun:"gelbbraun", braun:"braun", schwarz:"schwarzbraun", band:"zweifarbig / gebändert" } },
  { id:"c_sculpt", region:"Kopf & Körper", label:"Kopfoberseite (Skulptur)", icon:"🔍",
    states:{ glatt:"glatt & glänzend", areoGlanz:"fein netzig, glänzend", areoMatt:"gleichmäßig netzig, matt",
             costulae:"netzig + Längsriefen, matt", rugos:"grob runzlig / gerunzelt, matt" } },
  { id:"c_spine", region:"Mesosoma", label:"Propodealdornen", icon:"📐",
    states:{ kurz:"kurz / stumpf / zahnförmig", mittel:"mittellang, zugespitzt", lang:"lang & zugespitzt" } },
  { id:"c_node", region:"Stielchen", label:"Petiolus-Knoten (seitlich)", icon:"⛰️",
    states:{ schuppe:"rundlich-schuppig", stumpf:"stumpfwinklig, breiter Rücken (100–115°)",
             scharf:"scharfkantig, schmaler Rücken (72–82°)", knotig:"rundlich-knotig" } },
  { id:"c_ant", region:"Kopf & Körper", label:"Antennenglieder", icon:"📡",
    states:{ a11:"11", a12:"12" } },
  { id:"c_hair", region:"Mesosoma", label:"Abstehende Behaarung", icon:"🌾",
    states:{ spaerlich:"spärlich / fehlend", maessig:"mäßig", dicht:"dicht & auffällig" } },
  { id:"c_nest", region:"Fund & Nest", label:"Nestfund / Mikrohabitat", icon:"🏠",
    states:{ eichel:"Eicheln, Zweige, Rinde am Boden", baum:"Baumhöhlen, borke, Kronenraum",
             stein:"unter Steinen / in Felsritzen", streu:"Streu, Moos, Boden", parasit:"Gast in fremden Nestern (Sozialparasit)" } },
  { id:"c_gaster", region:"Stielchen", label:"Gaster-Oberfläche", icon:"✨",
    states:{ einheitlich:"einfarbig", band:"helle Binde(n)", spiegel:"spiegelglänzend, punktiert" } }
];

/* ---------- Morphometrie: verifizierte Wertebereiche (Csösz et al. 2015,
     über AntWiki-Schlüssel; Angaben als [min, max] der Art) ---------- */
const MORPH_RANGES = {
  "SPST/CS": { label:"Dornenlänge / Kopfgröße", quelle:"Csösz et al. 2015 (AntWiki-Schlüssel, Couplets 9/17)",
    werte:{ t_nylanderi:[0.265,0.297], t_crassispinus:[0.280,0.338] } },
  "PEH/CS": { label:"Knotenhöhe / Kopfgröße", quelle:"Csösz et al. 2015 (Couplet 10)",
    werte:{ t_crassispinus:[0.366,0.407] } },
  "PL/CS": { label:"Petioluslänge / Kopfgröße", quelle:"Csösz et al. 2015 (Couplet 13)",
    werte:{ t_saxonicus:[0.390,0.422] } }
};

/* ---------- Diskriminanz-Formel (Csösz et al. 2015, D4) ---------- */
const DISCRIMINANT_D4 = {
  label:"D4 (crassispinus ↔ crasecundus)",
  quelle:"Csösz et al. 2015: D4 = +0,0392·SL − 0,0746·SPST + 0,0933·SPL − 0,0295·SPWI − 7,2179 (95 % Treffer einzeln, 97 % Nestmittel)",
  koeff: { SL:+0.0392, SPST:-0.0746, SPL:+0.0933, SPWI:-0.0295, konst:-7.2179 },
  hinweis:"Vorzeichen-Konvention (welcher Wert welcher Art entspricht) bitte gegen das Originalpublikat prüfen – die App rechnet den Score, deutet ihn aber nicht automatisch."
};

/* =========================================================================
   TAXA
   statusDE: "heimisch" | "moeglich" | "unwahrscheinlich" | "fremd"
   traffic:  rote Paare = per Foto nicht sicher trennbar
   ========================================================================= */
const TAXA = [
{
  id:"t_nylanderi", name:"Temnothorax nylanderi", autor:"(Förster, 1850)",
  deutsch:"Nylanders Knotenameise", gruppe:"nylanderi-Gruppe / nylanderi-Komplex",
  statusDE:"heimisch", statusText:"In West-, Mittel- und Süddeutschland verbreitet, lokal häufig; im Osten an crassispinus ersetzt (parapatrisch).",
  region:{west:1, sued:1, ost:0.5, nord:0.4, mitte:0.9},
  habitat:{wald:1, trocken:0.5, baum:0.6, stein:0.4, streu:0.8, urban:0.5},
  groesse:"2,0–3,0 mm", kolonie:"meist < 200 Arbeiterinnen, monogyn",
  nist:"Eicheln, tote Zweige, Rindenstücke, Steine, gelegentlich bodennah an Bäumen",
  aktiv:"Mai–September",
  biologie:"Klassische „Eichelameise“ der Laubwälder; langsame, friedliche Art; Wirt des Bandwurms Anomotaenia brevis (dann hell gefärbte, langlebige Arbeiterinnen).",
  chars:{ c_size:{s2:1,s3:0.3,s1:0.3}, c_color:{gelbbraun:1,braun:0.6,gelb:0.3},
    c_sculpt:{costulae:1,areoMatt:0.3}, c_spine:{mittel:1,lang:0.3},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{maessig:1,spaerlich:0.4},
    c_nest:{eichel:1,baum:0.6,streu:0.7,stein:0.4}, c_gaster:{einheitlich:1} },
  morph:{ SPST_CS:[0.265,0.297] },
  morphParams:{ spineAngle:36, spineLen:0.28, nodeAngle:108, nodeHeight:0.39, headRatio:1.12, sculpt:"costulae" },
  bilder:[
    { file:"t_nylanderi_head.jpg", view:"Kopf frontal", specimen:"CASENT0178771", quelle:"AntWiki: Temnothorax nylanderi", url:"https://antwiki.org/wiki/Temnothorax_nylanderi" },
    { file:"t_nylanderi_profile.jpg", view:"Profil", specimen:"CASENT0178771", quelle:"AntWiki: Temnothorax nylanderi", url:"https://antwiki.org/wiki/Temnothorax_nylanderi" }
  ],
  lookalikes:["t_crassispinus","t_crasecundus","t_parvulus","t_saxonicus"]
},
{
  id:"t_crassispinus", name:"Temnothorax crassispinus", autor:"(Karavaiev, 1926)",
  deutsch:"Östliche Knotenameise", gruppe:"nylanderi-Gruppe / nylanderi-Komplex",
  statusDE:"heimisch", statusText:"Ost- und Süddeutschland sowie Mitteldeutschland; westliche Grenze parapatrisch zu nylanderi.",
  region:{west:0.4, sued:0.8, ost:1, nord:0.6, mitte:0.8},
  habitat:{wald:1, trocken:0.5, baum:0.5, stein:0.4, streu:0.9, urban:0.4},
  groesse:"2,0–3,0 mm", kolonie:"few dozen bis ~200 Arbeiterinnen",
  nist:"Hohlräume in toten Zweigen und Eicheln, Laubstreu",
  aktiv:"Mai–September",
  biologie:"Ökologisch das ost-mitteleuropäische Gegenstück zu nylanderi; bildet mit crasecundus ein kryptisches Geschwisterpaar.",
  chars:{ c_size:{s2:1,s1:0.3}, c_color:{gelbbraun:1,braun:0.5},
    c_sculpt:{areoGlanz:1,costulae:0.3,areoMatt:0.3}, c_spine:{mittel:1,lang:0.4},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{eichel:1,streu:0.8,stein:0.4}, c_gaster:{einheitlich:1} },
  morph:{ SPST_CS:[0.280,0.338], PEH_CS:[0.366,0.407] },
  morphParams:{ spineAngle:37, spineLen:0.31, nodeAngle:107, nodeHeight:0.385, headRatio:1.14, sculpt:"areoGlanz" },
  bilder:[
    { file:"t_crassispinus_profile.jpg", view:"Profil", specimen:"CASENT0173198", quelle:"Wikimedia Commons / AntWeb", url:"https://commons.wikimedia.org/wiki/File:Temnothorax_crassispinus_casent0173198_profile_1.jpg" },
    { file:"t_crassispinus_dorsal.jpg", view:"Dorsal", specimen:"CASENT0173198", quelle:"Wikimedia Commons / AntWeb", url:"https://commons.wikimedia.org/wiki/File:Temnothorax_crassispinus_casent0173198_dorsal_1.jpg" }
  ],
  lookalikes:["t_nylanderi","t_crasecundus","t_parvulus"]
},
{
  id:"t_crasecundus", name:"Temnothorax crasecundus", autor:"Seifert & Csősz, 2015",
  deutsch:"Kryptische Knotenameise Ost", gruppe:"nylanderi-Gruppe / nylanderi-Komplex",
  statusDE:"moeglich", statusText:"Kryptische, erst 2015 abgetrennte Art; Eurokaukasien bis Ostmitteleuropa – deutsche Nachweise v. a. im Osten zu erwarten, leicht unterbestimmt als crassispinus.",
  region:{west:0.1, sued:0.2, ost:0.7, nord:0.5, mitte:0.3},
  habitat:{wald:0.9, trocken:0.4, stein:0.4, streu:0.8},
  groesse:"2,0–3,0 mm", kolonie:"klein, monogyn",
  nist:"wie crassispinus: Zweige, Eicheln, Streu",
  aktiv:"Mai–September",
  biologie:"Von crassispinus morphologisch nur morphometrisch (Nest-Centroid-Clustering) trennbar – das Lehrbuchbeispiel einer kryptischen Art.",
  chars:{ c_size:{s2:1,s1:0.3}, c_color:{gelbbraun:1,braun:0.5},
    c_sculpt:{areoGlanz:1,areoMatt:0.4}, c_spine:{mittel:1,lang:0.4},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{eichel:1,streu:0.8}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:37, spineLen:0.30, nodeAngle:107, nodeHeight:0.39, headRatio:1.13, sculpt:"areoGlanz" },
  bilder:[
    { file:"t_crasecundus_head.jpg", view:"Kopf frontal", specimen:"Belegbild der Revision", quelle:"AntWiki: Temnothorax crasecundus (Revisionsmaterial Seifert & Csősz 2015)", url:"https://antwiki.org/wiki/Temnothorax_crasecundus" },
    { file:"t_crasecundus_dorsal.jpg", view:"Dorsal", specimen:"Belegbild der Revision", quelle:"AntWiki: Temnothorax crasecundus", url:"https://antwiki.org/wiki/Temnothorax_crasecundus" }
  ],
  lookalikes:["t_crassispinus","t_nylanderi"],
  kryptisch:true
},
{
  id:"t_parvulus", name:"Temnothorax parvulus", autor:"(Schenck, 1852)",
  deutsch:"Kleine Knotenameise", gruppe:"nylanderi-Gruppe",
  statusDE:"heimisch", statusText:"In Deutschland punktuell, v. a. Mitte/Süd und wärmere Trockenstandorte; insgesamt selten erfasst.",
  region:{west:0.5, sued:0.7, ost:0.6, nord:0.3, mitte:0.7},
  habitat:{trocken:0.9, wald:0.6, stein:0.7, streu:0.5},
  groesse:"1,8–2,5 mm", kolonie:"sehr klein",
  nist:"Eicheln, Ritzen, Steine, trockene Zweige",
  aktiv:"Juni–September",
  biologie:"Kleinste heimische Temnothorax; Kopf gleichmäßig netzig-matt (ohne glänzende Mittelzone) – dadurch von crassispinus/nylanderi unterscheidbar.",
  chars:{ c_size:{s1:1,s2:0.5}, c_color:{gelbbraun:1,gelb:0.5},
    c_sculpt:{areoMatt:1}, c_spine:{kurz:0.7,mittel:0.6},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{eichel:0.9,stein:0.6,streu:0.5}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:35, spineLen:0.26, nodeAngle:110, nodeHeight:0.37, headRatio:1.10, sculpt:"areoMatt" },
  bilder:[
    { file:"t_parvulus_profile.jpg", view:"Profil", specimen:"CASENT0173197", quelle:"AntWiki: Temnothorax parvulus", url:"https://antwiki.org/wiki/Temnothorax_parvulus" },
    { file:"t_parvulus_head.jpg", view:"Kopf frontal", specimen:"CASENT0173197", quelle:"AntWiki: Temnothorax parvulus", url:"https://antwiki.org/wiki/Temnothorax_parvulus" }
  ],
  lookalikes:["t_crassispinus","t_nylanderi"]
},
{
  id:"t_affinis", name:"Temnothorax affinis", autor:"(Mayr, 1855)",
  deutsch:"Baum-Knotenameise", gruppe:"affinis-Verwandtschaft",
  statusDE:"heimisch", statusText:"Eine der häufigsten streng baumlebenden Ameisen Deutschlands – wird wegen verborgener Lebensweise selten gesehen.",
  region:{west:0.9, sued:0.9, ost:0.9, nord:0.7, mitte:0.9},
  habitat:{baum:1, wald:0.8, urban:0.4, stein:0.2},
  groesse:"2,3–3,2 mm", kolonie:"klein bis mittel, in Stamm- & Asthöhlen",
  nist:"Hohlräume in lebenden und toten Bäumen, Astlöcher, borke",
  aktiv:"Mai–September",
  biologie:"Streng arboreal; grob runzlig-matte Skulptur und lange Dornen machen sie unter heimischen Temnothorax unverwechselbar.",
  chars:{ c_size:{s2:1,s3:0.2}, c_color:{braun:1,schwarz:0.3},
    c_sculpt:{rugos:1}, c_spine:{lang:1},
    c_node:{knotig:1,stumpf:0.3}, c_ant:{a12:1}, c_hair:{maessig:1,dicht:0.4},
    c_nest:{baum:1}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:44, spineLen:0.36, nodeAngle:100, nodeHeight:0.40, headRatio:1.16, sculpt:"rugos" },
  bilder:[
    { file:"t_affinis_profile.jpg", view:"Profil", specimen:"CASENT0173201", quelle:"Wikimedia Commons / AntWeb", url:"https://commons.wikimedia.org/wiki/File:Temnothorax_affinis_casent0173201_profile_1.jpg" }
  ],
  lookalikes:["t_nylanderi","t_saxonicus"]
},
{
  id:"t_saxonicus", name:"Temnothorax saxonicus / tergestinus-Komplex", autor:"Seifert, 1995",
  deutsch:"Sächsische Knotenameise", gruppe:"nylanderi-Gruppe (tergestinus-Komplex)",
  statusDE:"heimisch", statusText:"Dunkle, grob gerunzelte Art ost-/mitteldeutscher Trockengebiete; taxonomisch Teil des tergestinus-Komplexes (AntWiki führt saxonicus als eigene Art).",
  region:{west:0.2, sued:0.5, ost:1, nord:0.4, mitte:0.6},
  habitat:{trocken:0.9, stein:0.9, wald:0.4, streu:0.5},
  groesse:"2,2–3,0 mm", kolonie:"klein",
  nist:"unter Steinen, Felsritzen, trockene Hänge",
  aktiv:"Mai–September",
  biologie:"Dunkelbraun bis schwarzbraun, Kopfoberseite grob längsrunzlig-matt – auf Sachsen/Thüringen etc. beschränkte Trockenrasen-Art.",
  chars:{ c_size:{s2:1,s3:0.3}, c_color:{braun:1,schwarz:0.6},
    c_sculpt:{rugos:1}, c_spine:{mittel:1},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{stein:0.9,streu:0.5,eichel:0.3}, c_gaster:{einheitlich:1} },
  morph:{ PL_CS:[0.390,0.422] },
  morphParams:{ spineAngle:34, spineLen:0.28, nodeAngle:105, nodeHeight:0.40, headRatio:1.20, sculpt:"rugos" },
  bilder:[
    { file:"t_saxonicus_head.jpg", view:"Kopf frontal", specimen:"CASENT0179902", quelle:"AntWiki: Temnothorax saxonicus", url:"https://antwiki.org/wiki/Temnothorax_saxonicus" },
    { file:"t_saxonicus_profile.jpg", view:"Profil", specimen:"CASENT0179902", quelle:"AntWiki: Temnothorax saxonicus", url:"https://antwiki.org/wiki/Temnothorax_saxonicus" }
  ],
  lookalikes:["t_nylanderi","t_affinis"]
},
{
  id:"t_recedens", name:"Temnothorax recedens", autor:"(Brullé, 1833)",
  deutsch:"Pannonische Knotenameise", gruppe:"recedens-Verwandtschaft",
  statusDE:"fremd", statusText:"In Deutschland nicht etabliert; nächstes Vorkommen pannonisch (Österreich/Burgenland, Ungarn) – als Fund nahe Grenze oder Verschleppung denkbar.",
  region:{west:0.05, sued:0.1, ost:0.15, nord:0.05, mitte:0.1},
  habitat:{trocken:1, stein:0.9},
  groesse:"2,0–2,8 mm", kolonie:"klein",
  nist:"unter Steinen, trockene Böden",
  aktiv:"Juni–September",
  biologie:"Dunkle, glänzende Art der Steppengebiete; kurzer Dornen, glatter glänzender Kopf mit helleren Beinen.",
  chars:{ c_size:{s2:1}, c_color:{schwarz:1,braun:0.4},
    c_sculpt:{glatt:1}, c_spine:{kurz:1,mittel:0.3},
    c_node:{stumpf:0.6,knotig:0.6}, c_ant:{a12:1}, c_hair:{spaerlich:1},
    c_nest:{stein:1,streu:0.4}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:28, spineLen:0.20, nodeAngle:105, nodeHeight:0.37, headRatio:1.15, sculpt:"glatt" },
  bilder:[
    { file:"t_recedens_head.jpg", view:"Kopf frontal", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Temnothorax recedens", url:"https://antwiki.org/wiki/Temnothorax_recedens" },
    { file:"t_recedens_dorsal.jpg", view:"Dorsal", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Temnothorax recedens", url:"https://antwiki.org/wiki/Temnothorax_recedens" }
  ],
  lookalikes:["t_saxonicus"]
},
{
  id:"t_unifasciatus", name:"Temnothorax unifasciatus", autor:"(Latreille, 1802)",
  deutsch:"Gebänderte Knotenameise", gruppe:"tuberum-Verwandtschaft",
  statusDE:"unwahrscheinlich", statusText:"Süd- bis südliches Mitteleuropa; für Deutschland keine gesicherten Nachweise – Grenze Alpen/Südalpen.",
  region:{west:0.05, sued:0.15, ost:0.1, nord:0.05, mitte:0.1},
  habitat:{stein:0.9, trocken:0.8, baum:0.4},
  groesse:"2,0–3,0 mm", kolonie:"klein",
  nist:"Steine, Mauern, auch borke",
  aktiv:"Juni–September",
  biologie:"Namensgebende helle Gasterbinde; warme Felshabitate des Südens.",
  chars:{ c_size:{s2:1}, c_color:{band:1,gelbbraun:0.5},
    c_sculpt:{areoMatt:0.6,costulae:0.6}, c_spine:{mittel:1},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{dicht:1,maessig:0.5},
    c_nest:{stein:0.9,baum:0.4}, c_gaster:{band:1} },
  morph:{},
  morphParams:{ spineAngle:36, spineLen:0.29, nodeAngle:106, nodeHeight:0.38, headRatio:1.14, sculpt:"areoMatt" },
  bilder:[
    { file:"t_unifasciatus_profile.jpg", view:"Profil", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Temnothorax unifasciatus", url:"https://antwiki.org/wiki/Temnothorax_unifasciatus" }
  ],
  lookalikes:["t_tuberum"]
},
{
  id:"t_tuberum", name:"Temnothorax tuberum", autor:"(Fabricius, 1775)",
  deutsch:"Geknöpfte Knotenameise", gruppe:"tuberum-Verwandtschaft",
  statusDE:"unwahrscheinlich", statusText:"Mediterran bis südliches Mitteleuropa; alte Mitteleuropa-Angaben teils fraglich, Alpen-Südrand möglich.",
  region:{west:0.1, sued:0.2, ost:0.1, nord:0.05, mitte:0.1},
  habitat:{baum:0.8, stein:0.6, trocken:0.6, wald:0.5},
  groesse:"2,2–3,2 mm", kolonie:"klein",
  nist:"borke, Zweige, Mauern",
  aktiv:"Juni–September",
  biologie:"Sehr deutlich abstehend behaart, gaster oft gebändert; wärmeliebend.",
  chars:{ c_size:{s2:1}, c_color:{band:1,braun:0.5},
    c_sculpt:{costulae:1}, c_spine:{mittel:1,lang:0.4},
    c_node:{stumpf:1}, c_ant:{a12:1}, c_hair:{dicht:1},
    c_nest:{baum:0.8,eichel:0.6,stein:0.5}, c_gaster:{band:1} },
  morph:{},
  morphParams:{ spineAngle:38, spineLen:0.30, nodeAngle:105, nodeHeight:0.38, headRatio:1.13, sculpt:"costulae" },
  bilder:[
    { file:"t_tuberum_profile.jpg", view:"Profil", specimen:"Belegbild (Wiki-/Commons-Tafel)", quelle:"Wikipedia: Temnothorax tuberum", url:"https://en.wikipedia.org/wiki/Temnothorax_tuberum" }
  ],
  lookalikes:["t_unifasciatus"]
},
{
  id:"l_acervorum", name:"Leptothorax acervorum", autor:"(Fabricius, 1775)",
  deutsch:"Garten-Knotenameise / Wald-Knotenameise", gruppe:"Leptothorax (Schwestergattung)",
  statusDE:"heimisch", statusText:"In Deutschland weit verbreitet und häufig (Wälder, Gärten) – die häufigste Verwechslung mit Temnothorax.",
  region:{west:1, sued:1, ost:1, nord:1, mitte:1},
  habitat:{wald:1, streu:0.9, urban:0.6, baum:0.5, stein:0.4},
  groesse:"2,8–4,0 mm", kolonie:"mittel, oft polygyn",
  nist:"Totholz, Zweige, Streu, unter Steinen",
  aktiv:"April–September",
  biologie:"Größer als Temnothorax, Mesosoma oft hell gebändert, Knoten niedriger-rundlich; Dornen kurz.",
  chars:{ c_size:{s3:1,s2:0.4,s4:0.2}, c_color:{band:1,braun:0.6},
    c_sculpt:{costulae:0.8,areoMatt:0.6}, c_spine:{kurz:1},
    c_node:{knotig:0.7,schuppe:0.5}, c_ant:{a12:1}, c_hair:{maessig:1,dicht:0.4},
    c_nest:{streu:0.9,eichel:0.7,baum:0.5,stein:0.5}, c_gaster:{band:0.8,einheitlich:0.6} },
  morph:{},
  morphParams:{ spineAngle:30, spineLen:0.18, nodeAngle:115, nodeHeight:0.34, headRatio:1.18, sculpt:"costulae" },
  bilder:[
    { file:"l_acervorum_head.jpg", view:"Kopf frontal", specimen:"CASENT0173138", quelle:"AntWiki: Leptothorax acervorum", url:"https://antwiki.org/wiki/Leptothorax_acervorum" },
    { file:"l_acervorum_profile.jpg", view:"Profil", specimen:"CASENT0173138", quelle:"AntWiki: Leptothorax acervorum", url:"https://antwiki.org/wiki/Leptothorax_acervorum" }
  ],
  lookalikes:["t_nylanderi","t_crassispinus","l_muscorum"]
},
{
  id:"l_muscorum", name:"Leptothorax muscorum", autor:"(Nylander, 1846)",
  deutsch:"Moos-Knotenameise", gruppe:"Leptothorax (Schwestergattung)",
  statusDE:"heimisch", statusText:"Weit verbreitet, Trocken- und Magerrasen bis Moore; farblich extrem variabel (gelb bis schwarzbraun).",
  region:{west:0.9, sued:0.9, ost:0.9, nord:0.8, mitte:0.9},
  habitat:{trocken:0.9, streu:0.8, stein:0.6, wald:0.4},
  groesse:"2,0–3,0 mm", kolonie:"sehr klein",
  nist:"Moos, Streu, unter Steinen",
  aktiv:"Mai–September",
  biologie:"Variabelste Färbung aller heimischen Knotenameisen; Knoten rundlich, Skulptur fein netzig.",
  chars:{ c_size:{s2:1,s1:0.4}, c_color:{gelbbraun:1,braun:0.8,schwarz:0.3},
    c_sculpt:{areoMatt:0.8,glatt:0.3}, c_spine:{mittel:1,kurz:0.4},
    c_node:{knotig:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{streu:0.9,stein:0.6,eichel:0.4}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:32, spineLen:0.24, nodeAngle:112, nodeHeight:0.35, headRatio:1.12, sculpt:"areoMatt" },
  bilder:[
    { file:"l_muscorum_profile.jpg", view:"Profil (dunkle Morphe)", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Leptothorax muscorum", url:"https://antwiki.org/wiki/Leptothorax_muscorum" }
  ],
  lookalikes:["t_parvulus","l_acervorum"]
},
{
  id:"l_fabarum", name:"Leptothorax fabarum", autor:"(Seifert, 1983)",
  deutsch:"Bohnen-Knotenameise", gruppe:"Leptothorax (Schwestergattung)",
  statusDE:"heimisch", statusText:"Trockenrasen Mitteleuropas; in Deutschland zerstreut. (Karte ohne Belegfoto – folgt in späterer Version.)",
  region:{west:0.6, sued:0.7, ost:0.7, nord:0.5, mitte:0.7},
  habitat:{trocken:1, stein:0.7},
  groesse:"2,0–3,0 mm", kolonie:"sehr klein",
  nist:"Moos, Steine, trockene Böden",
  aktiv:"Mai–September",
  biologie:"Gelbliche Trockenrasen-Art, muscorum ähnlich; Trennung morphometrisch.",
  chars:{ c_size:{s2:1}, c_color:{gelb:1,gelbbraun:0.8},
    c_sculpt:{areoMatt:0.8}, c_spine:{mittel:1},
    c_node:{knotig:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{streu:0.8,stein:0.7}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:32, spineLen:0.24, nodeAngle:112, nodeHeight:0.35, headRatio:1.12, sculpt:"areoMatt" },
  bilder:[], lookalikes:["l_muscorum"]
},
{
  id:"f_nitidulus", name:"Formicoxenus nitidulus", autor:"(Nylander, 1846)",
  deutsch:"Glänzende Gastameise", gruppe:"Formicoxenus (Gast der Waldameisen)",
  statusDE:"heimisch", statusText:"Selten und geschützt; lebt als Gast in Nestern von Formica (Waldameisen) – Zufallsfunde am Nestrand.",
  region:{west:0.3, sued:0.4, ost:0.4, nord:0.3, mitte:0.4},
  habitat:{wald:1},
  groesse:"1,8–2,6 mm", kolonie:"sehr klein, im Formica-Nest",
  nist:"Gast in Waldameisennestern",
  aktiv:"Juni–August",
  biologie:"Spiegelglänzend, dicht punktiert; unverwechselbarer Glanz; streng an Formica-Nester gebunden, Rote-Liste-Art.",
  chars:{ c_size:{s1:1,s2:0.3}, c_color:{braun:0.6,schwarz:0.6},
    c_sculpt:{areoGlanz:0.6,glatt:0.4}, c_spine:{kurz:1},
    c_node:{knotig:1}, c_ant:{a12:1}, c_hair:{maessig:0.6,dicht:0.6},
    c_nest:{parasit:1}, c_gaster:{spiegel:1} },
  morph:{},
  morphParams:{ spineAngle:26, spineLen:0.15, nodeAngle:115, nodeHeight:0.34, headRatio:1.10, sculpt:"glatt" },
  bilder:[
    { file:"f_nitidulus_dorsal.jpg", view:"Dorsal", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Formicoxenus nitidulus", url:"https://antwiki.org/wiki/Formicoxenus_nitidulus" }
  ],
  lookalikes:["t_parvulus"]
},
{
  id:"h_sublaevis", name:"Harpagoxenus sublaevis", autor:"(Nylander, 1849)",
  deutsch:"Sklavenjäger-Knotenameise", gruppe:"Sozialparasit von Leptothorax",
  statusDE:"heimisch", statusText:"Selten, zerstreut; raidet Leptothorax-Nester (v. a. acervorum).",
  region:{west:0.2, sued:0.4, ost:0.4, nord:0.3, mitte:0.3},
  habitat:{wald:0.8, streu:0.6},
  groesse:"3,0–4,0 mm", kolonie:"winzig, mit Sklavenarbeiterinnen",
  nist:"Gast-/Raubnester in Leptothorax-Kolonien",
  aktiv:"Juni–August",
  biologie:"Großer kantiger Kopf, zahnförmige Propodealfortsätze; Sklavenhaltende Art.",
  chars:{ c_size:{s3:1}, c_color:{braun:1},
    c_sculpt:{costulae:1}, c_spine:{kurz:1},
    c_node:{knotig:0.6,stumpf:0.6}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{parasit:1}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:25, spineLen:0.14, nodeAngle:108, nodeHeight:0.36, headRatio:1.25, sculpt:"costulae" },
  bilder:[
    { file:"h_sublaevis_dorsal.jpg", view:"Dorsal", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Harpagoxenus sublaevis", url:"https://antwiki.org/wiki/Harpagoxenus_sublaevis" }
  ],
  lookalikes:["l_acervorum"]
},
{
  id:"s_debile", name:"Stenamma debile", autor:"(Förster, 1850)",
  deutsch:"Schwachameise", gruppe:"Stenamma (Myrmicinae, eigene Gattung)",
  statusDE:"heimisch", statusText:"Feuchte Wälder Mittel- und Süddeutschlands; in Streu und Bodennestern, oft übersehen.",
  region:{west:0.6, sued:0.7, ost:0.5, nord:0.4, mitte:0.6},
  habitat:{wald:1, streu:1},
  groesse:"2,5–3,5 mm", kolonie:"klein",
  nist:"Boden, Streu, morsches Holz",
  aktiv:"Mai–September",
  biologie:"Matt, grob skulpturiert, langer Stielchenknoten; wirkt wie eine „mini-Myrmica“ ohne Stichapparat-Glanz.",
  chars:{ c_size:{s2:1,s3:0.4}, c_color:{braun:1,gelbbraun:0.5},
    c_sculpt:{rugos:1}, c_spine:{mittel:0.7,lang:0.7},
    c_node:{knotig:1}, c_ant:{a12:1}, c_hair:{maessig:1},
    c_nest:{streu:1,eichel:0.4}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:40, spineLen:0.30, nodeAngle:100, nodeHeight:0.42, headRatio:1.15, sculpt:"rugos" },
  bilder:[
    { file:"s_debile_profile.jpg", view:"Profil", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Stenamma debile", url:"https://antwiki.org/wiki/Stenamma_debile" }
  ],
  lookalikes:["t_affinis","m_schencki"]
},
{
  id:"m_schencki", name:"Myrmica schencki u. a. kleine Myrmica", autor:"(Emery, 1894)",
  deutsch:"Kleine Knotenameisen-Lookalikes: Myrmica", gruppe:"Myrmica (andere Tribus-Verwandtschaft)",
  statusDE:"heimisch", statusText:"Myrmica-Arten (z. B. schencki, sabuleti) sind häufig und werden von Einsteiger:innen mit Temnothorax verwechselt – gehören aber in eine andere Verwandtschaft.",
  region:{west:1, sued:1, ost:1, nord:1, mitte:1},
  habitat:{trocken:0.9, streu:0.8, stein:0.7, wald:0.5},
  groesse:"3,5–5,0 mm", kolonie:"mittel bis groß",
  nist:"Boden, unter Steinen, Moos",
  aktiv:"April–Oktober",
  biologie:"Erkennbar an: deutlich abgesetztem Postpetiolus, Frontalloben über den Mandibeln, Stichelscheide (Gifteingang) und kräftigerer Skulptur – keine Temnothorax.",
  chars:{ c_size:{s3:1,s4:0.5}, c_color:{braun:1,schwarz:0.5},
    c_sculpt:{costulae:1,rugos:0.6}, c_spine:{mittel:0.8,lang:0.6},
    c_node:{schuppe:1}, c_ant:{a12:1}, c_hair:{dicht:1},
    c_nest:{streu:0.9,stein:0.7}, c_gaster:{einheitlich:1} },
  morph:{},
  morphParams:{ spineAngle:42, spineLen:0.32, nodeAngle:95, nodeHeight:0.44, headRatio:1.10, sculpt:"costulae" },
  bilder:[
    { file:"m_schencki_profile.jpg", view:"Profil (Arbeiterin)", specimen:"AntWeb-Beleg (Nr. auf Quellseite)", quelle:"AntWiki: Myrmica schencki", url:"https://antwiki.org/wiki/Myrmica_schencki" }
  ],
  lookalikes:["s_debile","t_affinis"]
}
];

/* ---------- Verwechslungs-Duelle ---------- */
const DUELLE = [
  { a:"t_nylanderi", b:"t_crassispinus", trennbar:"teilweise",
    merkmale:[
      "Kopfoberseite: nylanderi durchgehend netzig + Längsriefen (matt) – crassispinus mit glänzenderer Mittelzone",
      "Dornenlänge SPST/CS: nylanderi 0,265–0,297 · crassispinus 0,280–0,338 (Überlappung!)",
      "Geografie: West/Mitte (nylanderi) vs. Ost/Süd (crassispinus), Kontaktzone parapatrisch"
    ],
    fazit:"Gutes Makro kann die Skulpturtendenz zeigen – sichere Trennung nur morphometrisch (Mehrere Arbeiterinnen messen)." },
  { a:"t_crassispinus", b:"t_crasecundus", trennbar:"nein",
    merkmale:[
      "Kein zuverlässiges Einzelmerkmal – kryptisches Geschwisterpaar",
      "Trennung nur über Morphometrie mehrerer Arbeiterinnen (Diskriminanz D4, Csösz et al. 2015)"
    ],
    fazit:"Per Foto NICHT trennbar. App zeigt bewusst ROT und verweist auf den Mess-Modus." },
  { a:"t_crassispinus", b:"t_parvulus", trennbar:"ja",
    merkmale:[
      "Kopf: parvulus gleichmäßig netzig-matt, crassispinus mit glänzender Mittelzone",
      "Größe: parvulus deutlich kleiner (< 2,5 mm)",
      "Dornen: parvulus kürzer"
    ],
    fazit:"Mit gutem Makro/Foto bestimmbar." },
  { a:"t_nylanderi", b:"t_saxonicus", trennbar:"ja",
    merkmale:[
      "Kopf: saxonicus grob längsrunzlig & dunkel, nylanderi fein riefig & heller",
      "Habitat: saxonicus Trockenrasen/Steine, nylanderi Laubwald-Streu"
    ],
    fazit:"Per Foto meist gut trennbar." },
  { a:"t_crassispinus", b:"l_acervorum", trennbar:"ja",
    merkmale:[
      "Größe: acervorum größer (bis 4 mm)",
      "Mesosoma bei acervorum oft hell gebändert, Knoten niedriger-rundlich, Dornen kurz",
      "acervorum: Nest auch in größeren Totholz-Stücken, Kolonien größer/polygyn"
    ],
    fazit:"Per Foto bestimmbar." },
  { a:"l_muscorum", b:"t_parvulus", trennbar:"teilweise",
    merkmale:[
      "Knotenform: muscorum rundlicher, parvulus stumpfwinkliger",
      "Färbung: muscorum extrem variabel (auch schwarzbraun)",
      "Sichere Trennung morphometrisch"
    ],
    fazit:"Makro hilft, Messung empfohlen." },
  { a:"t_parvulus", b:"m_schencki", trennbar:"ja",
    merkmale:[
      "Myrmica: Postpetiolus deutlich abgesetzt, Frontalloben, Stichapparat, größer",
      "Temnothorax: 2-gliedriges Stielchen ohne diese Kombination"
    ],
    fazit:"Per Foto bestimmbar (Gattungsebene)." },
  { a:"t_affinis", b:"t_nylanderi", trennbar:"ja",
    merkmale:[
      "affinis: grob runzlig-matt, lange Dornen, streng baumlebend",
      "nylanderi: fein riefig, kürzere Dornen, Boden/Eichel"
    ],
    fazit:"Per Foto gut bestimmbar." }
];

/* ---------- Glossar / Anatomie ---------- */
const GLOSSAR = {
  clypeus:"Vorderer Kopfschild über den Mandibeln.",
  frontalcarinae:"Längsleisten zwischen den Antennenbasen; ihr Abstand (FRS) ist Messstrecke.",
  scape:"Erstes, stielartiges Antennenglied.",
  auge:"Seitenauge; Lage und Größe helfen bei Gattungsfragen.",
  propodealdornen:"Dornen am Hinterende des Mesosomas – Länge & Winkel sind Schlüsselmerkmale (SPST).",
  petiolus:"Erstes Stielchenglied mit Knoten (Node); Form/Winkel des Knotens = Kernmerkmal.",
  postpetiolus:"Zweites Stielchenglied vor der Gaster.",
  gaster:"Hinterleib (Metasoma) ohne Stielchen.",
  mesosoma:"Mittelsegment (Thorax + Propodeum).",
  skulptur:"Oberflächenmuster: netzig (areolat), gerieft (costulat), runzlig (rugos), glatt.",
  cs:"CS = Kopfgröße = Mittel aus CL (Kopflänge) und CWb (Kopfbreite).",
  spst:"SPST = Länge der Propodealdornen.",
  peh:"PEH = Höhe des Petiolus-Knotens."
};

/* ---------- Quellenregister ---------- */
const QUELLEN = [
  { id:"Q1", text:"Csősz, S. et al. (2015): Revision der Temnothorax nylanderi-Gruppe (morphometrischer Schlüssel). Basis des AntWiki-Schlüssels „Key to Temnothorax nylanderi species group workers“.", url:"https://antwiki.org/wiki/Key_to_Temnothorax_nylanderi_species_group_workers" },
  { id:"Q2", text:"Seifert, B. (2018): The Ants of Central and North Europe. – Standardwerk & Verbreitung Deutschland.", url:"https://antwiki.org/wiki/Temnothorax" },
  { id:"Q3", text:"Seifert & Csősz (2015): Temnothorax crasecundus sp. n. – kryptische Art, Nest-Centroid-Clustering.", url:"https://antwiki.org/wiki/Temnothorax_crasecundus" },
  { id:"Q4", text:"AntWiki-Artenseiten (Verbreitung, Synonyme, Bildtafeln).", url:"https://antwiki.org/wiki/Temnothorax" },
  { id:"Q5", text:"AntWeb / California Academy of Sciences: Belegfotos mit Specimen-IDs, Lizenz CC-BY 4.0 (via AntWiki & Wikimedia Commons).", url:"https://www.antweb.org" },
  { id:"Q6", text:"Rote Liste Zentrum / Seifert (2011): Gesamtartenliste der Ameisen Deutschlands.", url:"https://www.rote-liste-zentrum.de/organismengruppen/wirbellose-tiere/ameisen-hymenoptera-formicidae/" },
  { id:"Q7", text:"Báthori & Csősz (2024): Taxonomy of the Palearctic socially parasitic Temnothorax (PLOS ONE) – Kontext Sozialparasiten.", url:"https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0308712" }
];

/* ---------- v2: Einfach-Erklärungen & Feld-Tipps ---------- */
const ERKLAERUNGEN = {
  c_size:  "Vergleiche die Arbeiterin ohne Fühler: von Kopfvorderkante bis Gasterspitze.",
  c_color: "Der Gesamteindruck bei Tageslicht – einzelne dunkle Segmente ignorieren.",
  c_sculpt: "Wie die Kopfoberseite unter Lupe/Makro wirkt: matt gerieben, runzlig oder glänzend.",
  c_spine: "Die zwei „Dornen“ am hinteren Ende des Mesosomas (Rückenpanzers).",
  c_node:  "Der „Buckel“ des Stielchens zwischen Mesosoma und Gaster, von der Seite betrachtet.",
  c_ant:   "Antennenglieder inklusive des langen Basisglieds zählen – nur mit gutem Makro sinnvoll.",
  c_hair:  "Abstehende Borsten auf Rücken und Gaster – nicht das feine, anliegende Härchen.",
  c_nest:  "Wo hast du das Tier oder Nest gefunden? Das ist oft das stärkste Indiz.",
  c_gaster: "Muster und Glanz des Hinterleibs (Gaster)."
};
const FELDTIPPS = {
  t_nylanderi: "Kleine gelbbraune Waldameise aus Eicheln und Totholz-Zweigen; Kopf wirkt unter der Lupe längs „matt gerieben“. In West-/Mitteldeutschland der Standard-Verdacht bei „Eichelameise“.",
  t_crassispinus: "Sieht nylanderi zum Verwechseln ähnlich, Kopfmitte oft etwas glänzender; im Osten die typische Eichel-/Zweig-Ameise. Von crasecundus nur per Messung trennbar.",
  t_crasecundus: "Der „Zwilling“ von crassispinus – äußerlich praktisch identisch. Im Osten bei crassispinus-Verdacht ohne Messung bewusst „offen“ bleiben.",
  t_parvulus: "Deutlich kleiner, Kopf gleichmäßig matt ohne glänzende Mittellinie; mag trockene, warme Stellen.",
  t_affinis: "Lebt fast nur auf Bäumen; grob raspelig-matter Körper mit langen Dornen – unverwechselbar, wenn man sie einmal gesehen hat.",
  t_saxonicus: "Dunkle, grob runzlige Art trockener Rasen und Steinhänge (Ost/Mitte); Kopf längs „geschnitzt“ wirkend.",
  t_recedens: "Glänzende, dunkle Steppenart – in Deutschland praktisch nicht zu erwarten, allenfalls grenznah zu Österreich.",
  t_unifasciatus: "Helle Binde auf der Gaster; südliche Art, in Deutschland absolute Ausnahme.",
  t_tuberum: "Auffällig „stachelig“ behaart, oft gebändert; Südart, gehört nicht zum deutschen Standard-Set.",
  l_acervorum: "Größer, Mesosoma oft hell gebändert, kurze Dornen – die häufigste „falsche Temnothorax“ in Wald und Garten.",
  l_muscorum: "Klein, Farbe von gelb bis fast schwarz; Moos & Trockenrasen; Knoten rundlicher als bei Temnothorax.",
  l_fabarum: "Gelbliche Trockenrasen-Art, muscorum sehr ähnlich – sicher nur per Messung.",
  f_nitidulus: "Spiegelglänzender Winzling als Gast in Waldameisen-Nestern; abseits eines Formica-Hügels fast ausgeschlossen.",
  h_sublaevis: "Kräftige Sklavenjägerin mit kantigem Kopf und Zahn-Fortsätzen; lebt in Leptothorax-Nestern.",
  s_debile: " matter, runzliger Streubewohner mit langen dünnen Dornen; wirkt wie eine Mini-Waldameise ohne glänzende Stichpartie.",
  m_schencki: "Echte Myrmica sind kräftiger, mit sichtbarer Stichspitze und extra Hinterleibs-Knoten – eine andere Liga als Temnothorax."
};
CHARAKTERE.forEach(c => { c.erklaerung = ERKLAERUNGEN[c.id] || ""; });
TAXA.forEach(t => { t.feldTip = FELDTIPPS[t.id] || ""; });

/* ---------- v2.2: Kontext-Layer Land & Jahresaktivität ---------- */
const LAENDER = {
  DE: { label: "Deutschland", subregion: true },
  AT: { label: "Österreich",  subregion: false },
  CH: { label: "Schweiz",     subregion: false }
};
const MONATE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

/* Aktivitätskurven (Sichtbarkeit/Aktivität von Arbeiterinnen, gemäßigtes Mitteleuropa).
   Werte 0..1 = relative Wahrscheinlichkeit, im Monat Arbeiterinnen zu beobachten.
   Muster nach Phänologie aus Q2/Q4; wo unsicher, bewusst konservativ breit. */
const AKTIVITAETSMUSTER = {
  wald:      [0, 0, 0.1, 0.3, 0.7, 0.9, 1.0, 1.0, 0.8, 0.4, 0.1, 0],
  baum:      [0, 0, 0.0, 0.2, 0.6, 0.9, 1.0, 0.9, 0.6, 0.2, 0.0, 0],
  xerotherm: [0, 0, 0.0, 0.3, 0.7, 1.0, 1.0, 0.9, 0.5, 0.1, 0.0, 0],
  frueh:     [0, 0, 0.2, 0.5, 0.8, 0.9, 1.0, 0.9, 0.7, 0.4, 0.1, 0],
  breit:     [0, 0, 0.2, 0.5, 0.8, 1.0, 1.0, 1.0, 0.8, 0.5, 0.1, 0]
};
const LANDGEWICHTE = {
  t_nylanderi:  { DE: 1.0, AT: 0.7, CH: 0.7 },
  t_crassispinus:{ DE: 1.0, AT: 0.8, CH: 0.6 },
  t_crasecundus:{ DE: 0.5, AT: 0.6, CH: 0.3 },
  t_parvulus:   { DE: 0.6, AT: 0.8, CH: 0.7 },
  t_affinis:    { DE: 1.0, AT: 0.9, CH: 0.9 },
  t_saxonicus:  { DE: 0.8, AT: 0.7, CH: 0.4 },
  t_recedens:   { DE: 0.05, AT: 1.0, CH: 0.3 },
  t_unifasciatus:{ DE: 0.1, AT: 0.7, CH: 0.8 },
  t_tuberum:    { DE: 0.15, AT: 0.6, CH: 0.7 },
  l_acervorum:  { DE: 1.0, AT: 1.0, CH: 1.0 },
  l_muscorum:   { DE: 1.0, AT: 1.0, CH: 1.0 },
  l_fabarum:    { DE: 0.8, AT: 0.8, CH: 0.7 },
  f_nitidulus:  { DE: 0.4, AT: 0.4, CH: 0.4 },
  h_sublaevis:  { DE: 0.5, AT: 0.6, CH: 0.5 },
  s_debile:     { DE: 0.7, AT: 0.6, CH: 0.6 },
  m_schencki:   { DE: 1.0, AT: 1.0, CH: 1.0 }
};
const AKTIVITAET_PRO_TAXON = {
  t_nylanderi: "wald", t_crassispinus: "wald", t_crasecundus: "wald",
  t_parvulus: "xerotherm", t_affinis: "baum", t_saxonicus: "xerotherm",
  t_recedens: "xerotherm", t_unifasciatus: "xerotherm", t_tuberum: "xerotherm",
  l_acervorum: "frueh", l_muscorum: "breit", l_fabarum: "breit",
  f_nitidulus: "baum", h_sublaevis: "wald", s_debile: "wald", m_schencki: "breit"
};
TAXA.forEach(t => {
  t.land = LANDGEWICHTE[t.id] || { DE: 0.5, AT: 0.5, CH: 0.5 };
  t.aktivitaet = AKTIVITAETSMUSTER[AKTIVITAET_PRO_TAXON[t.id] || "wald"];
});

/* ---------- v3: Verhalten als Merkmal + Alltags-Sprache für ALLES ---------- */
CHARAKTERE.push({
  id: "c_behavior", region: "Verhalten", label: "Verhalten / auffällige Szene", icon: "🎬",
  erklaerung: "Was hast du beobachtet? Verhalten ist oft eindeutiger als jedes Haar.",
  states: {
    tandem: "Tandemlaufen beim Umzug",
    ruhig: "langsam & vorsichtig, rollt sich ein",
    aggressiv: "flink & wehrhaft (Stich/Gift)",
    gast: "winziger Glanzläufer zwischen Waldameisen",
    raid: "trägt fremde Brut weg"
  }
});
ERKLAERUNGEN.c_behavior = "Verhalten beobachten lohnt: Manche Arten verraten sich durch einzigartige Szenen.";
const VERHALTEN = {
  t_nylanderi:   { ruhig: 1, tandem: 0.9 },
  t_crassispinus:{ ruhig: 1, tandem: 0.9 },
  t_crasecundus: { ruhig: 1, tandem: 0.9 },
  t_parvulus:    { ruhig: 1, tandem: 0.6 },
  t_affinis:     { ruhig: 0.9, tandem: 0.4 },
  t_saxonicus:   { ruhig: 1, tandem: 0.5 },
  t_recedens:    { ruhig: 1 },
  t_unifasciatus:{ ruhig: 1 },
  t_tuberum:     { ruhig: 1 },
  t_tergestinus: { ruhig: 1 },
  l_acervorum:   { ruhig: 0.8, tandem: 0.2 },
  l_muscorum:    { ruhig: 0.9 },
  l_fabarum:     { ruhig: 0.9 },
  f_nitidulus:   { gast: 1, ruhig: 0.3 },
  h_sublaevis:   { raid: 1, ruhig: 0.4 },
  s_debile:      { ruhig: 1 },
  m_schencki:    { aggressiv: 1 }
};
TAXA.forEach(t => { t.chars.c_behavior = VERHALTEN[t.id] || { ruhig: 0.6 }; });

/* Alltags-Sprache: Titel + Bild-Text je Zustand (statt Fachjargon als Frage) */
const PLAIN = {
  c_sculpt: {
    glatt:     { titel: "Wie poliert",        text: "Das Licht spiegelt sich klar auf dem Kopf – wie bei einem polierten Stein." },
    areoGlanz: { titel: "Wie Seide",          text: "Fein genetzt, aber mit sanftem Schimmer; die Kopfmitte wirkt heller." },
    areoMatt:  { titel: "Wie Sandpapier",     text: "Gleichmäßig matt – nirgends ein Glanzpunkt, wie feines Sandpapier." },
    costulae:  { titel: "Wie eine Vinylplatte", text: "Matt, mit feinen Längsrillen – wie die Rillen einer Schallplatte." },
    rugos:     { titel: "Wie alte Baumrinde", text: "Grobe Runzeln und Kanten, tief matt – wie rissige Rinde oder alte Haut." }
  },
  c_spine: {
    kurz:  { titel: "Nur stumpfe Zähnchen", text: "Am Hinterrücken sitzen kaum mehr als kurze, stumpfe Zacken." },
    mittel:{ titel: "Klare Dornen",         text: "Deutliche, zugespitzte Dornen – etwa so lang wie an der Basis breit." },
    lang:  { titel: "Lange Stacheln",       text: "Die Dornen ragen auffällig ab – wie kleine Dornen einer Rose." }
  },
  c_node: {
    schuppe: { titel: "Flache Schuppe",   text: "Der Buckel ist kaum erhoben und sanft gerundet – wie eine kleine Schuppe." },
    stumpf:  { titel: "Breiter First",    text: "Oben ein breiter, flacher Rücken – wie ein stumpfer Hausfirst." },
    scharf:  { titel: "Scharfe Kante",    text: "Oben eine schmale, scharfe Kante – wie ein schmaler Grat." },
    knotig:  { titel: "Runder Knopf",     text: "Ein deutlich rundes Knöpfchen auf dem Stiel – wie eine kleine Perle." }
  },
  c_hair: {
    spaerlich: { titel: "Fast nackt",     text: "Keine abstehenden Borsten zu sehen – der Körper wirkt glatt behaart." },
    maessig:   { titel: "Einzelne Borsten", text: "Hier und dort stehen feine Borsten ab – erst im Makro offensichtlich." },
    dicht:     { titel: "Wie eine Bürste", text: "Viele deutlich abstehende Borsten – der Umriss wirkt fransig." }
  },
  c_size: {
    s1: { titel: "Stecknadelkopf", text: "Kaum größer als ein Stecknadelkopf – unter 2,2 mm." },
    s2: { titel: "Reiskorn",       text: "Etwa wie ein kleines Reiskorn – 2,2 bis 3 mm." },
    s3: { titel: "Streichholzkopf",text: "Deutlich kräftiger – wie ein Streichholzkopf, 3 bis 4 mm." },
    s4: { titel: "Größer",         text: "Größer als ein Streichholzkopf – über 4 mm." }
  },
  c_color: {
    gelb:     { titel: "Wie heller Honig", text: "Gelb bis strohfarben, insgesamt sehr hell." },
    gelbbraun:{ titel: "Wie Milchkaffee",  text: "Helles Gelbbraun, wie Milchkaffee oder helles Leder." },
    braun:    { titel: "Wie Kastanie",     text: "Sattes Mittelbraun, wie eine Kastanienschale." },
    schwarz:  { titel: "Wie Zartbitter",   text: "Dunkelbraun bis schwarz, wie Zartbitterschokolade." },
    band:     { titel: "Zweifarbig",       text: "Helle Binde(n) auf dunklerem Körper – deutlich gemustert." }
  },
  c_gaster: {
    einheitlich: { titel: "Einfarbig",     text: "Der Hinterleib ist einheitlich gefärbt, ohne Binde." },
    band:        { titel: "Helle Binde",   text: "Ein helles Band ringelt sich über den Hinterleib." },
    spiegel:     { titel: "Wie Glas",      text: "Der Hinterleib spiegelt wie poliertes Glas, mit feinen Pünktchen." }
  },
  c_ant: {
    a11: { titel: "11 Glieder", text: "Die Fühler haben 11 Glieder (nur im starken Makro zählbar)." },
    a12: { titel: "12 Glieder", text: "Die Fühler haben 12 Glieder (nur im starken Makro zählbar)." }
  },
  c_nest: {
    eichel: { titel: "Eichel & Zweig",  text: "In einer Eichel oder einem toten Zweig – aufgebrochen liegt Brut darin." },
    baum:   { titel: "Auf dem Baum",    text: "An Rinde, in Astlöchern oder Stammhöhlen – die Tiere laufen am Holz." },
    stein:  { titel: "Stein & Mauer",   text: "Unter Steinen oder in Mauerspalten – trocken und sonnig." },
    streu:  { titel: "Laub & Moos",     text: "Im Streu- oder Moospolster am Boden, schattig-feucht bis trocken." },
    parasit:{ titel: "In fremdem Nest", text: "Mitten im Nest anderer Ameisenarten – als Gast oder Räuber." }
  },
  c_behavior: {
    tandem:    { titel: "Tandemlaufen",   text: "Beim Umzug führt eine Ameise die andere am Fühler – Hintereinander im Tandem. Klassisch für Temnothorax!" },
    ruhig:     { titel: "Vorsichtig & rollt sich ein", text: "Langsam, zögerlich; bei Störung einrollen oder fliehen statt angreifen." },
    aggressiv: { titel: "Flink & wehrhaft", text: "Schnell, attackiert und krümmt den Hinterleib zum Stich." },
    gast:      { titel: "Glanzläufer im Ameisenhaufen", text: "Winzige, spiegelglänzende Tiere, die zwischen großen Waldameisen laufen." },
    raid:      { titel: "Brutraub",       text: "Eine kräftige Ameise trägt Brut aus einem fremden Nest weg." }
  }
};
CHARAKTERE.forEach(c => { c.plain = PLAIN[c.id] || {}; });

/* Reihenfolge der visuellen Reise (freundlich → spezifisch) */
const REISEN_FOLGE = ["c_nest", "c_behavior", "c_size", "c_color", "c_sculpt", "c_spine", "c_node", "c_hair", "c_gaster", "c_ant"];

QUELLEN.push({ id: "Q8", text: "Tandemlaufen als Umzugsverhalten bei Temnothorax: belegt u. a. durch die AntWiki-Bildgalerie (Tandem-Foto T. crassispinus, M. Kukla) und die Literatur zu Tandem-Rekrutierung (Franks & Richardson 2006; Toupo et al. 2015).", url: "https://antwiki.org/wiki/Temnothorax_crassispinus" });

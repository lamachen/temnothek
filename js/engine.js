/* =========================================================================
   TEMNOTHEK – Bestimmungs-Engine
   Bayesianisches Gewichte-Scoring über Merkmale + Regionen-/Habitat-Prior,
   Info-Gain-Vorschlag für die nächste Frage, Ehrlichkeits-Ampel.
   ========================================================================= */
"use strict";

const Engine = (function () {

  function prior(taxon, ctx) {
    let p = 1;
    if (ctx.land) p *= (taxon.land || {})[ctx.land] ?? 0.3;
    if (ctx.monat !== undefined && ctx.monat !== null && ctx.monat !== "") {
      const a = (taxon.aktivitaet || [])[+ctx.monat];
      p *= (a === undefined ? 0.5 : Math.max(0.03, a));
    }
    if (ctx.region) p *= (taxon.region[ctx.region] ?? 0.2);
    if (ctx.habitate && ctx.habitate.length) {
      const hs = ctx.habitate.map(h => taxon.habitat[h] ?? 0.15);
      p *= Math.max(...hs);
    }
    return p;
  }

  function likelihood(taxon, choices) {
    let l = 1;
    for (const [cid, state] of Object.entries(choices)) {
      const w = (taxon.chars[cid] || {})[state];
      l *= (w === undefined ? 0.35 : Math.max(0.02, w));
    }
    return l;
  }

  /* Score aller Taxa gegeben Kontext + Merkmalsauswahl */
  function bewerte(ctx) {
    const roh = TAXA.map(t => {
      const s = prior(t, ctx) * likelihood(t, ctx.choices || {});
      return { taxon: t, score: s };
    });
    const sum = roh.reduce((a, b) => a + b.score, 0) || 1;
    roh.forEach(r => r.anteil = r.score / sum);
    roh.sort((a, b) => b.score - a.score);
    return roh;
  }

  /* Welche Frage trennt die aktuellen Top-Kandidaten am besten?
     = Merkmal mit größter Spreizung der Gewichte über die Top-Taxa */
  function naechsteFrage(ctx, topN, exclude) {
    exclude = exclude || [];
    const top = bewerte(ctx).slice(0, topN || 4).map(r => r.taxon);
    if (top.length < 2) return null;
    let best = null;
    for (const c of CHARAKTERE) {
      if (ctx.choices && ctx.choices[c.id]) continue;
      if (exclude.includes(c.id)) continue;
      let spreiz = 0, begr = "";
      for (const s of Object.keys(c.states)) {
        const ws = top.map(t => (t.chars[c.id] || {})[s] ?? 0);
        const spread = Math.max(...ws) - Math.min(...ws);
        if (spread > spreiz) {
          spreiz = spread;
          const gut = top.filter(t => ((t.chars[c.id] || {})[s] ?? 0) >= 0.8).map(t => kurz(t.name));
          begr = `„${c.states[s]}“ trifft auf: ${gut.join(", ") || "–"}`;
        }
      }
      if (!best || spreiz > best.spreiz) best = { char: c, spreiz, begr };
    }
    return best;
  }

  function kurz(name) {
    return name
      .replace("Temnothorax ", "T. ").replace("Leptothorax ", "L. ")
      .replace("Formicoxenus ", "F. ").replace("Harpagoxenus ", "H. ")
      .replace("Stenamma ", "S. ").replace("Myrmica ", "M. ");
  }

  /* Ehrlichkeits-Ampel für Top-Ergebnis */
  function ampel(ranking, ctx) {
    const anzahlFilter = Object.keys(ctx.choices || {}).length + (ctx.region ? 1 : 0) + ((ctx.habitate || []).length ? 1 : 0);
    const top = ranking[0], zweit = ranking[1];
    if (!top || top.score <= 0) return { stufe: "rot", text: "Keine Art passt zu dieser Kombination – Auswahl prüfen." };
    const kryptik = top.taxon.kryptisch || (zweit && kryptischesPaar(top.taxon.id, zweit.taxon.id));
    if (kryptik) return { stufe: "rot", text: `${kurz(top.taxon.name)} und ${kurz(zweit.taxon.name)} sind per Foto/Merkmal NICHT sicher trennbar (kryptisches Paar). Nur Morphometrie mehrerer Arbeiterinnen entscheidet – Mess-Modus nutzen.` };
    if (anzahlFilter === 0) return { stufe: "gelb", text: "Noch keine Merkmale gewählt – das ist nur die Verbreitungs-Wahrscheinlichkeit. Merkmale antippen, um zu schärfen." };
    const verhaeltnis = zweit && zweit.score > 0 ? top.score / zweit.score : 99;
    if (verhaeltnis < 1.5) return { stufe: "gelb", text: `Noch mehrdeutig: ${kurz(top.taxon.name)} vs. ${kurz(zweit.taxon.name)} nahe beieinander. Nächste trennende Frage unten antippen oder Duell-Modus öffnen.` };
    if (verhaeltnis < 4) return { stufe: "gelb", text: `Wahrscheinlich ${top.taxon.name}. Ein weiteres Merkmal oder ein Makrofoto-K Vergleich im Duell-Modus bringt Sicherheit.` };
    return { stufe: "gruen", text: `Stimmig: ${top.taxon.name} passt zu allen angegebenen Merkmalen und zum Fundkontext. Im Arten-Dossier gegen die Belegfotos prüfen.` };
  }

  function kryptischesPaar(a, b) {
    return DUELLE.some(d => d.trennbar === "nein" && ((d.a === a && d.b === b) || (d.a === b && d.b === a)));
  }

  /* ---------- Morphometrie-Bank ---------- */
  function berechneRatios(m) { // m in µm: CL, CWb, SPST, PEH, PL
    const out = {};
    if (m.CL && m.CWb) {
      const CS = (m.CL + m.CWb) / 2;
      out.CS = CS;
      if (m.SPST) out["SPST/CS"] = m.SPST / CS;
      if (m.PEH) out["PEH/CS"] = m.PEH / CS;
      if (m.PL) out["PL/CS"] = m.PL / CS;
      out["CL/CWb"] = m.CL / m.CWb;
    }
    return out;
  }

  function d4(m) {
    const k = DISCRIMINANT_D4.koeff;
    if (![m.SL, m.SPST, m.SPL, m.SPWI].every(v => v > 0)) return null;
    return k.SL * m.SL + k.SPST * m.SPST + k.SPL * m.SPL + k.SPWI * m.SPWI + k.konst;
  }

  /* Liegt ein Ratio-Wert innerhalb der publizierten Spanne einer Art? */
  function ratioTreffer(ratioKey, wert) {
    const cfg = MORPH_RANGES[ratioKey];
    if (!cfg) return [];
    return Object.entries(cfg.werte)
      .filter(([, v]) => wert >= v[0] && wert <= v[1])
      .map(([tid]) => tid);
  }

  return { bewerte, naechsteFrage, ampel, berechneRatios, d4, ratioTreffer, kryptischesPaar, kurz };
})();

/* =========================================================================
   TEMNOTHEK – Morphologie-Engine (SVG)
   Zeichnet Arbeitinnen-Seitenansicht & Kopfdorsalansicht PARAMETRISCH aus
   publizierten Verhältnissen (Winkel/Längenverhältnisse aus Q1/Q2).
   Dadurch sind alle Arten exakt gleich orientiert, skaliert und nur in den
   diagnostischen Dimensionen unterschiedlich -> echtes Vergleichsmaterial.
   ========================================================================= */
"use strict";

const Morph = (function () {

  /* Skulptur-Muster als SVG-Pattern-Overlay für Kopf dorsal */
  function sculptDefs(id, typ, col) {
    col = col || "#3d2a18";
    const p = [];
    if (typ === "costulae") {
      p.push(`<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
        <rect width="6" height="6" fill="none"/><path d="M0 0 V6" stroke="${col}" stroke-width="1.1" opacity=".55"/></pattern>`);
    } else if (typ === "areoMatt") {
      p.push(`<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.1" fill="none" stroke="${col}" stroke-width=".7" opacity=".5"/>
        <circle cx="4" cy="3.6" r="1.0" fill="none" stroke="${col}" stroke-width=".7" opacity=".4"/></pattern>`);
    } else if (typ === "areoGlanz") {
      p.push(`<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.0" fill="none" stroke="${col}" stroke-width=".6" opacity=".35"/>
        <path d="M4.5 5.5 h1.6" stroke="#fff" stroke-width=".7" opacity=".5"/></pattern>`);
    } else if (typ === "rugos") {
      p.push(`<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
        <path d="M0 1 q2 1.4 0 3 t0 3" fill="none" stroke="${col}" stroke-width="1.4" opacity=".6"/></pattern>`);
    } else { /* glatt */
      p.push(`<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M1 6 q3 -3 6 -4" stroke="#fff" stroke-width=".8" fill="none" opacity=".55"/></pattern>`);
    }
    return p.join("");
  }

  /* ---------- Seitenansicht (Profil) ----------
     params: spineAngle (° zur Mesosoma-Achse), spineLen (rel. zu CS),
             nodeAngle (° Front-Dorsum des Petiolus), nodeHeight (PEH/CS),
             headRatio (CL/CWb -> Kopflänge im Profil)                       */
  function profilSVG(params, opt) {
    opt = opt || {};
    const W = opt.w || 420, H = opt.h || 260;
    const uid = opt.uid || ("m" + Math.random().toString(36).slice(2, 8));
    const col = opt.color || "#8a5a33";
    const line = opt.line || "#3d2a18";
    const S = 150; // Pixel pro "CS-Einheit" (CS=1)
    const sa = (params.spineAngle || 35) * Math.PI / 180;
    const sl = (params.spineLen || 0.28) * S;
    const na = (params.nodeAngle || 105) * Math.PI / 180;
    const nh = (params.nodeHeight || 0.38) * S;
    const hl = (params.headRatio || 1.12) * 0.62 * S; // Kopflänge im Profil
    const sculpt = params.sculpt || "areoMatt";

    // Koordinaten (y nach unten)
    const kopfX = 60, kopfY = 120;
    const mesoX = kopfX + hl * 0.9, mesoY = 112;
    const mesoL = 1.23 * S * 0.62;
    const propX = mesoX + mesoL, propY = 116;
    // Dorn: Richtung nach hinten-oben mit Winkel sa zur Achse
    const dornX = propX + Math.cos(sa) * sl, dornY = propY - Math.sin(sa) * sl;
    // Petiolus-Knoten: Frontprofil trifft Dorsum mit Winkel na
    const petX = propX + 26, petY = 128;
    const knotenH = nh;
    const halbW = knotenH / Math.tan(na / 2); // halbe Breite aus Winkel
    const postX = petX + halbW + 16, postY = 130;
    const gastX = postX + 34, gastY = 132;

    const defs = sculptDefs("sc_" + uid, sculpt, line);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="morphsvg" role="img" aria-label="Schematische Seitenansicht">
      <defs>${defs}
        <linearGradient id="bg_${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity=".75"/>
        </linearGradient>
      </defs>
      <g color="${line}">
      <!-- Kopf -->
      <ellipse cx="${kopfX}" cy="${kopfY}" rx="${hl / 2}" ry="${hl / 2.5}" fill="url(#bg_${uid})" stroke="${line}" stroke-width="2"/>
      <ellipse cx="${kopfX}" cy="${kopfY}" rx="${hl / 2}" ry="${hl / 2.5}" fill="url(#sc_${uid})" stroke="none"/>
      <circle cx="${kopfX - hl * 0.18}" cy="${kopfY - 2}" r="4.5" fill="${line}" opacity=".85"/>
      <!-- Antenne -->
      <path d="M${kopfX - hl * 0.3} ${kopfY + 6} q-26 10 -34 34" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${kopfX - hl * 0.3 - 34} ${kopfY + 40} q-4 12 2 20" fill="none" stroke="${line}" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Mandibel -->
      <path d="M${kopfX - hl * 0.42} ${kopfY + 12} l-10 8 l12 2 z" fill="${col}" stroke="${line}" stroke-width="1.5"/>
      <!-- Mesosoma -->
      <path d="M${kopfX + hl * 0.42} ${kopfY - 6}
               Q ${mesoX + 10} ${mesoY - 26} ${mesoX + mesoL * 0.5} ${mesoY - 20}
               Q ${propX - 8} ${propY - 22} ${propX} ${propY - 10}
               L ${propX + 4} ${propY + 14}
               Q ${mesoX + mesoL * 0.5} ${mesoY + 22} ${mesoX + 6} ${mesoY + 20}
               Q ${kopfX + hl * 0.5} ${kopfY + 16} ${kopfX + hl * 0.42} ${kopfY - 6} Z"
            fill="url(#bg_${uid})" stroke="${line}" stroke-width="2"/>
      <!-- Propodealdorn (Winkel = Parameter) -->
      <path d="M${propX - 2} ${propY - 8} L${dornX} ${dornY} L${propX + 6} ${propY - 2} Z" fill="${col}" stroke="${line}" stroke-width="2"/>
      <!-- Petiolus-Knoten (Winkel & Höhe = Parameter) -->
      <path d="M${petX - halbW - 8} ${petY + 12}
               L${petX - halbW} ${petY + 4}
               L${petX} ${petY + 4 - knotenH}
               L${petX + halbW} ${petY + 4}
               L${petX + halbW + 8} ${petY + 14}
               Q ${petX} ${petY + 22} ${petX - halbW - 8} ${petY + 12} Z"
            fill="url(#bg_${uid})" stroke="${line}" stroke-width="2"/>
      <!-- Postpetiolus -->
      <ellipse cx="${postX}" cy="${postY + 6}" rx="13" ry="11" fill="url(#bg_${uid})" stroke="${line}" stroke-width="2"/>
      <!-- Gaster -->
      <ellipse cx="${gastX}" cy="${gastY + 6}" rx="40" ry="27" fill="url(#bg_${uid})" stroke="${line}" stroke-width="2"/>
      <path d="M${gastX - 34} ${gastY - 4} q30 -10 62 2" stroke="${line}" stroke-width="1" fill="none" opacity=".5"/>
      <!-- Beine -->
      <path d="M${mesoX + 14} ${mesoY + 18} q-6 30 -22 40 M${mesoX + 40} ${mesoY + 20} q0 32 -10 44 M${propX - 4} ${propY + 12} q10 30 2 46"
            fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
      </g>
      <!-- Mess-Annotationen -->
      <g font-family="ui-monospace,monospace" font-size="11" fill="${opt.txt || "#c9b28f"}">
        <line x1="${propX - 2}" y1="${propY - 8}" x2="${propX + 46}" y2="${propY - 8}" stroke="${opt.txt || "#c9b28f"}" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>
        <line x1="${propX - 2}" y1="${propY - 8}" x2="${dornX}" y2="${dornY}" stroke="#e8b04b" stroke-width="1.4"/>
        <text x="${dornX + 6}" y="${dornY - 4}">Dorn ${(params.spineAngle || 0)}° · SPST/CS ${(params.spineLen || 0).toFixed(2)}</text>
        <line x1="${petX - halbW}" y1="${petY + 4}" x2="${petX + halbW}" y2="${petY + 4}" stroke="#e8b04b" stroke-width="1.2"/>
        <text x="${petX - halbW}" y="${petY + 34}">Node ${(params.nodeAngle || 0)}°</text>
      </g>
      ${opt.scalebar ? `<g><line x1="${W - 120}" y1="${H - 18}" x2="${W - 30}" y2="${H - 18}" stroke="${opt.txt || "#c9b28f"}" stroke-width="2"/><text x="${W - 120}" y="${H - 24}" font-size="10" font-family="ui-monospace,monospace" fill="${opt.txt || "#c9b28f"}">0,5 mm (schematisch, CS-normiert)</text></g>` : ""}
    </svg>`;
  }

  /* ---------- Kopfdorsalansicht ----------
     headRatio = CL/CWb, sculpt = Muster, carinae = Frontalleisten sichtbar   */
  function kopfSVG(params, opt) {
    opt = opt || {};
    const W = opt.w || 260, H = opt.h || 260;
    const uid = opt.uid || ("k" + Math.random().toString(36).slice(2, 8));
    const col = opt.color || "#8a5a33", line = opt.line || "#3d2a18";
    const r = params.headRatio || 1.12;
    const cw = 84, cl = cw * Math.min(1.45, Math.max(0.95, r));
    const cx = W / 2, cy = H / 2;
    const defs = sculptDefs("kc_" + uid, params.sculpt || "areoMatt", line);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="morphsvg" role="img" aria-label="Schematische Kopfdorsalansicht">
      <defs>${defs}</defs>
      <g color="${line}">
      <path d="M${cx} ${cy - cl / 2}
               q ${cw / 2} 0 ${cw / 2} ${cl / 2}
               q 0 ${cl / 2} -${cw / 2} ${cl / 2}
               q -${cw / 2} 0 -${cw / 2} -${cl / 2}
               q 0 -${cl / 2} ${cw / 2} -${cl / 2} Z"
            fill="${col}" stroke="${line}" stroke-width="2.4"/>
      <path d="M${cx} ${cy - cl / 2}
               q ${cw / 2} 0 ${cw / 2} ${cl / 2}
               q 0 ${cl / 2} -${cw / 2} ${cl / 2}
               q -${cw / 2} 0 -${cw / 2} -${cl / 2}
               q 0 -${cl / 2} ${cw / 2} -${cl / 2} Z"
            fill="url(#kc_${uid})" stroke="none"/>
      <!-- Augen -->
      <ellipse cx="${cx - cw / 2 + 2}" cy="${cy}" rx="7" ry="11" fill="${line}" opacity=".85"/>
      <ellipse cx="${cx + cw / 2 - 2}" cy="${cy}" rx="7" ry="11" fill="${line}" opacity=".85"/>
      <!-- Frontalcarinae -->
      <path d="M${cx - 9} ${cy - cl * 0.28} v ${cl * 0.42} M${cx + 9} ${cy - cl * 0.28} v ${cl * 0.42}" stroke="${line}" stroke-width="2.2" fill="none"/>
      <!-- Antennen -->
      <path d="M${cx - 9} ${cy - cl * 0.24} q -34 -6 -46 18 M${cx + 9} ${cy - cl * 0.24} q 34 -6 46 18" stroke="${line}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M${cx - 55} ${cy - 5} q -8 16 -2 26 M${cx + 55} ${cy - 5} q 8 16 2 26" stroke="${line}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Mandibeln -->
      <path d="M${cx - 12} ${cy + cl / 2 - 2} l -6 14 l 14 -4 z M${cx + 12} ${cy + cl / 2 - 2} l 6 14 l -14 -4 z" fill="${col}" stroke="${line}" stroke-width="1.6"/>
      </g>
      <text x="${cx - cw / 2}" y="${cy + cl / 2 + 26}" font-size="11" font-family="ui-monospace,monospace" fill="${opt.txt || "#c9b28f"}">CL/CWb = ${r.toFixed(2)}</text>
    </svg>`;
  }

  /* ---------- Interaktive Anatomie-Grafik (Wissen) ---------- */
  function anatomieSVG() {
    return `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg" class="anatomie">
      <g fill="#a9713d" stroke="#40291a" stroke-width="2">
        <ellipse data-g="clypeus" cx="70" cy="120" rx="34" ry="28"/>
        <path data-g="mesosoma" d="M100 108 Q150 84 205 92 Q240 96 246 112 L250 128 Q210 142 160 138 Q118 134 100 122 Z"/>
        <path data-g="propodealdornen" d="M244 104 L276 84 L252 112 Z"/>
        <path data-g="petiolus" d="M252 128 L262 118 L272 104 L282 118 L292 130 Q272 140 252 128 Z"/>
        <ellipse data-g="postpetiolus" cx="302" cy="126" rx="12" ry="10"/>
        <ellipse data-g="gaster" cx="360" cy="128" rx="46" ry="30"/>
      </g>
      <circle data-g="auge" cx="52" cy="116" r="6" fill="#40291a"/>
      <path data-g="frontalcarinae" d="M64 100 v22 M76 100 v22" stroke="#40291a" stroke-width="2.4" fill="none"/>
      <path data-g="scape" d="M60 96 q-24 -18 -40 -6" stroke="#40291a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <g class="hotlabels" font-size="11" fill="var(--txt,#e9dcc3)" font-family="ui-monospace,monospace">
        <text x="20" y="60">scape</text><line x1="34" y1="64" x2="42" y2="86" stroke="currentColor" stroke-width=".8" opacity=".6"/>
        <text x="52" y="170">clypeus</text>
        <text x="30" y="96">frontal-<tspan x="30" dy="12">carinae</tspan></text>
        <text x="140" y="70">mesosoma</text>
        <text x="252" y="64">propodealdornen</text>
        <text x="250" y="170">petiolus</text>
        <text x="292" y="170">postpetiolus</text>
        <text x="352" y="80">gaster</text>
        <text x="18" y="132">auge</text>
      </g>
    </svg>`;
  }

  /* ---------- Range-Plot (Morphometrie-Bank) ---------- */
  function rangePlotSVG(ratioKey, userWert) {
    const cfg = MORPH_RANGES[ratioKey];
    const eintr = Object.entries(cfg.werte);
    const alle = eintr.flatMap(([, v]) => v).concat(userWert != null ? [userWert] : []);
    const min = Math.min(...alle) - 0.01, max = Math.max(...alle) + 0.01;
    const W = 460, zeile = 30, H = eintr.length * zeile + 40;
    const x = v => 40 + (v - min) / (max - min) * (W - 90);
    let rows = "";
    eintr.forEach(([tid, v], i) => {
      const t = TAXA.find(t => t.id === tid);
      const y = 24 + i * zeile;
      rows += `<text x="4" y="${y + 4}" font-size="11" fill="var(--txt,#e9dcc3)" font-style="italic">${(t ? t.name : tid).replace("Temnothorax ", "T. ").replace("Leptothorax ", "L. ")}</text>
        <line x1="${x(v[0])}" y1="${y}" x2="${x(v[1])}" y2="${y}" stroke="#7fb069" stroke-width="7" stroke-linecap="round" opacity=".85"/>
        <text x="${x(v[1]) + 8}" y="${y + 4}" font-size="10" fill="var(--mut,#9c8f7a)" font-family="ui-monospace,monospace">${v[0].toFixed(3)}–${v[1].toFixed(3)}</text>`;
    });
    let marker = "";
    if (userWert != null) {
      marker = `<line x1="${x(userWert)}" y1="10" x2="${x(userWert)}" y2="${H - 26}" stroke="#e8b04b" stroke-width="2"/>
        <text x="${x(userWert) + 4}" y="${H - 12}" font-size="11" fill="#e8b04b" font-family="ui-monospace,monospace">dein Wert: ${userWert.toFixed(3)}</text>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="rangeplot">
      <text x="4" y="12" font-size="11" fill="var(--mut,#9c8f7a)">${ratioKey} – ${cfg.label}</text>${rows}${marker}</svg>`;
  }


  /* ---------- v2: visuelle Merkmals-Miniaturen für Chips ---------- */
  let visUid = 0;
  function stateVis(cid, sid) {
    const u = "sv" + (visUid++);
    const ink = "currentColor";
    const open = `<svg class="statevis" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    const close = `</svg>`;
    const body = (() => {
      switch (cid) {
        case "c_size": {
          const mm = { s1: 1.8, s2: 2.6, s3: 3.5, s4: 4.6 }[sid] || 2.5;
          const w = mm * 11;
          return `<line x1="5" y1="27" x2="${5 + w}" y2="27" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>
                  <circle cx="${5 + w / 2}" cy="15" r="${2 + mm}" fill="${ink}" opacity=".8"/>
                  <text x="5" y="37" font-size="9" fill="${ink}" font-family="ui-monospace,monospace">${String(mm).replace(".", ",")} mm</text>`;
        }
        case "c_color": {
          const c = { gelb: "#d9b36a", gelbbraun: "#b98a4e", braun: "#8a5a33", schwarz: "#3a2a20" }[sid];
          if (sid === "band") return `<rect x="8" y="8" width="48" height="24" rx="8" fill="#8a5a33"/><rect x="8" y="16" width="48" height="7" fill="#e6cf9a"/>`;
          return `<rect x="8" y="8" width="48" height="24" rx="8" fill="${c || "#8a5a33"}"/>`;
        }
        case "c_sculpt": {
          const typ = { glatt: "glatt", areoGlanz: "areoGlanz", areoMatt: "areoMatt", costulae: "costulae", rugos: "rugos" }[sid] || "areoMatt";
          return `<defs>${sculptDefs(u, typ, ink)}</defs><rect x="8" y="6" width="48" height="28" rx="7" fill="${ink}" opacity=".18"/><rect x="8" y="6" width="48" height="28" rx="7" fill="url(#${u})" stroke="${ink}" stroke-width="1.4"/>`;
        }
        case "c_spine": {
          const d = { kurz: "L38 22 L44 18 L42 25", mittel: "L38 22 L50 12 L44 25", lang: "L38 22 L56 6 L46 26" }[sid] || "L38 22 L50 12 L44 25";
          return `<path d="M8 26 Q20 14 34 20 L44 26 Q26 33 8 26 Z" fill="${ink}" opacity=".8"/>
                  <path d="M36 21 ${d.slice(1)} Z" fill="${ink}"/>`;
        }
        case "c_node": {
          const sh = {
            schuppe: "M14 30 Q32 18 50 30 Z",
            stumpf: "M12 30 L24 14 L40 14 L52 30 Z",
            scharf: "M16 30 L31 6 L34 6 L48 30 Z",
            knotig: "M14 30 Q14 10 32 10 Q50 10 50 30 Z"
          }[sid] || "M12 30 L24 14 L40 14 L52 30 Z";
          return `<path d="${sh}" fill="${ink}" opacity=".85"/><line x1="8" y1="30" x2="56" y2="30" stroke="${ink}" stroke-width="1.6"/>`;
        }
        case "c_ant": {
          const n = sid === "a11" ? 11 : 12;
          let c = "";
          for (let i = 0; i < n; i++) c += `<circle cx="${7 + i * 4.6}" cy="${i % 2 ? 18 : 21}" r="2.5" fill="${ink}"/>`;
          return c + `<text x="7" y="34" font-size="9" fill="${ink}" font-family="ui-monospace,monospace">${n} Glieder</text>`;
        }
        case "c_hair": {
          const n = { spaerlich: 2, maessig: 5, dicht: 9 }[sid] || 4;
          let h = `<path d="M8 30 Q32 20 56 30" fill="none" stroke="${ink}" stroke-width="2.4"/>`;
          for (let i = 0; i < n; i++) { const x = 10 + i * (44 / Math.max(1, n - 1 || 1)); h += `<line x1="${x}" y1="${28 - Math.abs(x - 32) * 0.18}" x2="${x - 2}" y2="${16 - Math.abs(x - 32) * 0.18}" stroke="${ink}" stroke-width="1.6"/>`; }
          return h;
        }
        case "c_nest": {
          const e = { eichel: "🌰", baum: "🌳", stein: "🪨", streu: "🍂", parasit: "🎭" }[sid] || "❔";
          return `<text x="32" y="28" font-size="22" text-anchor="middle">${e}</text>`;
        }
        case "c_gaster": {
          if (sid === "band") return `<ellipse cx="32" cy="20" rx="20" ry="13" fill="#6b4426"/><path d="M14 17 q18 -6 36 0 l0 5 q-18 -5 -36 0 z" fill="#e6cf9a"/>`;
          if (sid === "spiegel") return `<ellipse cx="32" cy="20" rx="20" ry="13" fill="#4a3220"/><ellipse cx="32" cy="20" rx="20" ry="13" fill="#4a3220"/><circle cx="25" cy="15" r="3.4" fill="#fff" opacity=".85"/><circle cx="36" cy="22" r="2.2" fill="#fff" opacity=".6"/><circle cx="30" cy="26" r="1.6" fill="#fff" opacity=".5"/>`;
          return `<ellipse cx="32" cy="20" rx="20" ry="13" fill="#6b4426"/>`;
        }
      }
      return "";
    })();
    return open + body + close;
  }

  /* ---------- v2.2: Jahresaktivitäts-Leiste ---------- */
  function aktivitaetsSVG(monate, current, opt) {
    opt = opt || {};
    const W = opt.w || 460, H = 74, bw = (W - 20) / 12;
    const labels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
    let bars = "";
    monate.forEach((v, i) => {
      const h = 4 + v * 40;
      const x = 10 + i * bw;
      const cur = current !== null && current !== undefined && +current === i;
      bars += `<rect x="${x + 2}" y="${58 - h}" width="${bw - 5}" height="${h}" rx="3"
        fill="${cur ? "#e8b04b" : "#7fb069"}" opacity="${cur ? 1 : 0.35 + v * 0.5}"/>
        <text x="${x + bw / 2 - 2}" y="70" font-size="9" text-anchor="middle" fill="${cur ? "#e8b04b" : "currentColor"}" opacity=".8">${labels[i]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="aktivitaet" role="img" aria-label="Jahresaktivität">${bars}</svg>`;
  }

  return { profilSVG, kopfSVG, anatomieSVG, rangePlotSVG, stateVis, aktivitaetsSVG };
})();

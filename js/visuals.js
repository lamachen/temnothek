/* =========================================================================
   TEMNOTHEK v3 – VISUALS
   Animizierte Erklär-Szenen: jede Antwortkarte zeigt BILDHAFT, was gemeint
   ist (Licht-Sweep = Glanz, Rillen = Vinyl, Tandem-Animation = Verhalten …).
   Alle Generatoren liefern Inline-SVG; Animationen laufen über CSS-Klassen
   (Keyframes in styles.css: vx-*).
   ========================================================================= */
"use strict";

const Visuals = (function () {
  const INK = "currentColor";
  const ACC = "#e8b04b";
  const GRN = "#7fb069";
  let uid = 0;
  const U = () => "vx" + (uid++);

  const svg = (inner, vb) => `<svg class="vscene" viewBox="${vb || "0 0 200 120"}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  /* einfache Ameisen-Silhouette (Seitenansicht) */
  function ant(x, y, s, o) {
    o = o || {};
    const col = o.col || INK;
    const gaster = o.curl
      ? `<path d="M${x + 10 * s} ${y} q${9 * s} ${-7 * s} ${4 * s} ${-12 * s} q${-4 * s} ${-4 * s} ${-8 * s} 0 q${-4 * s} ${5 * s} 0 ${10 * s}" fill="${col}"/>`
      : `<ellipse cx="${x + 13 * s}" cy="${y}" rx="${8 * s}" ry="${5.5 * s}" fill="${col}"/>`;
    const sting = o.sting
      ? `<path d="M${x + 19 * s} ${y - 2 * s} q${7 * s} ${-6 * s} ${2 * s} ${-11 * s}" stroke="${ACC}" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round"/>
         <circle class="vx-pulse" cx="${x + 21 * s}" cy="${y - 13 * s}" r="${2.4 * s}" fill="${ACC}"/>` : "";
    return `<g class="${o.cls || ""}">
      <ellipse cx="${x - 8 * s}" cy="${y}" rx="${5 * s}" ry="${4.4 * s}" fill="${col}"/>
      <ellipse cx="${x}" cy="${y - 1 * s}" rx="${4.4 * s}" ry="${3.4 * s}" fill="${col}"/>
      ${gaster}
      <path d="M${x - 12 * s} ${y - 2 * s} q${-4 * s} ${-5 * s} ${-8 * s} ${-4 * s}" stroke="${col}" stroke-width="${1.2 * s}" fill="none" stroke-linecap="round"/>
      <path d="M${x - 4 * s} ${y + 3 * s} l${-3 * s} ${6 * s} M${x} ${y + 3 * s} l0 ${6.5 * s} M${x + 5 * s} ${y + 3 * s} l${3 * s} ${6 * s}" stroke="${col}" stroke-width="${1.1 * s}" stroke-linecap="round"/>
      ${sting}
      ${o.shine ? `<circle class="vx-pulse" cx="${x + 12 * s}" cy="${y - 3 * s}" r="${1.6 * s}" fill="#fff"/><circle class="vx-pulse" cx="${x + 8 * s}" cy="${y + 1 * s}" r="${1.1 * s}" fill="#fff"/>` : ""}
    </g>`;
  }

  /* ---------- Skulptur: Kopf dorsal mit Licht-Verhalten ---------- */
  function sculpt(sid) {
    const u = U();
    const kopf = `<path d="M100 18 q34 0 34 40 q0 40 -34 40 q-34 0 -34 -40 q0 -40 34 -40 Z" fill="#8a5a33" stroke="${INK}" stroke-width="2.5"/>`;
    let fx = "";
    if (sid === "glatt") {
      fx = `<path d="M100 18 q34 0 34 40 q0 40 -34 40 q-34 0 -34 -40 q0 -40 34 -40 Z" fill="url(#g${u})"/>
        <g clip-path="url(#c${u})"><rect class="vx-sweep" x="40" y="10" width="26" height="100" fill="#fff" opacity=".5"/></g>
        <path class="vx-pulse" d="M84 34 l4 -8 l4 8 l-4 3 Z" fill="#fff" opacity=".9"/>`;
    } else if (sid === "areoGlanz") {
      fx = `<g clip-path="url(#c${u})">${dots(66, 20, 68, 78, 7, .5)}
        <rect class="vx-sweep slow" x="40" y="10" width="18" height="100" fill="#fff" opacity=".28"/></g>`;
    } else if (sid === "areoMatt") {
      fx = `<g clip-path="url(#c${u})">${dots(66, 20, 68, 78, 5.5, .85)}
        <g class="vx-pulse" stroke="${ACC}" stroke-width="2" fill="none">
          <path d="M40 30 l14 8 M40 60 l14 8 M40 90 l14 8"/><path d="M56 36 l-5 4 M56 66 l-5 4 M56 96 l-5 4"/></g></g>`;
    } else if (sid === "costulae") {
      fx = `<g clip-path="url(#c${u})">${[78, 86, 94, 102, 110, 118].map(x => `<path d="M${x} 22 q${x > 100 ? 3 : -3} 36 0 72" stroke="${INK}" stroke-width="2.2" fill="none" opacity=".75"/>`).join("")}</g>`;
    } else {
      fx = `<g clip-path="url(#c${u})">${[28, 42, 56, 70, 84].map(y => `<path d="M70 ${y} q10 6 20 0 t20 0 t20 0" stroke="${INK}" stroke-width="3.4" fill="none" opacity=".8"/>`).join("")}</g>`;
    }
    return svg(`<defs>
        <clipPath id="c${u}"><path d="M100 18 q34 0 34 40 q0 40 -34 40 q-34 0 -34 -40 q0 -40 34 -40 Z"/></clipPath>
        <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>
      </defs>
      ${kopf}${fx}
      <circle cx="152" cy="86" r="26" fill="none" stroke="${ACC}" stroke-width="3"/>
      <line x1="170" y1="104" x2="186" y2="118" stroke="${ACC}" stroke-width="5" stroke-linecap="round"/>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Makro/Lupe</text>`);
  }
  function dots(x, y, w, h, step, op) {
    let d = "";
    for (let i = 0; i < w; i += step) for (let j = 0; j < h; j += step)
      d += `<circle cx="${x + i + (j % (step * 2) ? step / 2 : 0)}" cy="${y + j}" r="${step / 3.4}" fill="${INK}" opacity="${op * 0.55}"/>`;
    return d;
  }

  /* ---------- Dornen ---------- */
  function spine(sid) {
    const d = { kurz: "L138 52 L146 46 L142 56", mittel: "L138 52 L156 36 L146 58", lang: "L138 52 L168 26 L150 60" }[sid] || "L138 52 L156 36 L146 58";
    return svg(`<path d="M40 66 Q70 40 105 48 Q130 52 138 60 L142 74 Q100 84 60 78 Q44 74 40 66 Z" fill="#8a5a33" stroke="${INK}" stroke-width="2.5"/>
      <path class="vx-draw" d="M136 54 ${d.slice(1)} Z" fill="#8a5a33" stroke="${ACC}" stroke-width="2.5"/>
      <path class="vx-draw" d="M138 52 L176 52" stroke="${INK}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".6"/>
      <text x="12" y="108" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Hinterrücken = Propodeum</text>`);
  }

  /* ---------- Knoten ---------- */
  function node(sid) {
    const sh = {
      schuppe: "M70 84 Q100 62 130 84 Z",
      stumpf: "M66 84 L84 56 L116 56 L134 84 Z",
      scharf: "M72 84 L96 40 L104 40 L128 84 Z",
      knotig: "M70 84 Q70 48 100 48 Q130 48 130 84 Z"
    }[sid] || "M66 84 L84 56 L116 56 L134 84 Z";
    return svg(`<line x1="30" y1="84" x2="170" y2="84" stroke="${INK}" stroke-width="2" opacity=".5"/>
      <path class="vx-draw" d="${sh}" fill="#8a5a33" stroke="${ACC}" stroke-width="2.6"/>
      <path d="M40 70 q20 -8 30 6 M130 76 q16 -6 30 4" stroke="${INK}" stroke-width="3" fill="none" opacity=".55"/>
      <text x="12" y="108" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Stielchen-Knoten von der Seite</text>`);
  }

  /* ---------- Behaarung ---------- */
  function hair(sid) {
    const n = { spaerlich: 0, maessig: 5, dicht: 11 }[sid];
    if (n === undefined) return svg("");
    let h = `<path d="M30 78 Q100 52 170 78" fill="none" stroke="#8a5a33" stroke-width="14" stroke-linecap="round"/>`;
    for (let i = 0; i < n; i++) {
      const x = 40 + i * (120 / Math.max(1, n - 1));
      const y = 70 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 12;
      h += `<line class="vx-tw" style="animation-delay:${i * 0.12}s" x1="${x}" y1="${y}" x2="${x - 3}" y2="${y - 14}" stroke="${ACC}" stroke-width="2.2" stroke-linecap="round"/>`;
    }
    if (n === 0) h += `<text x="100" y="40" text-anchor="middle" font-size="12" fill="${INK}" opacity=".7">keine abstehenden Borsten</text>`;
    return svg(h + `<text x="12" y="108" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Rücken-Umriss im Makro</text>`);
  }

  /* ---------- Größe ---------- */
  function size(sid) {
    const obj = {
      s1: `<circle cx="150" cy="60" r="7" fill="${ACC}"/><line x1="150" y1="67" x2="150" y2="100" stroke="${INK}" stroke-width="2.5"/><text x="128" y="112" font-size="10" fill="${INK}" opacity=".7">Stecknadel</text>`,
      s2: `<ellipse cx="150" cy="62" rx="16" ry="7" fill="#f4ede1" stroke="${INK}" stroke-width="1.6"/><text x="132" y="112" font-size="10" fill="${INK}" opacity=".7">Reiskorn</text>`,
      s3: `<rect x="146" y="40" width="8" height="46" rx="3" fill="#c97b2d"/><rect x="144" y="34" width="12" height="10" rx="3" fill="${ACC}"/><text x="126" y="112" font-size="10" fill="${INK}" opacity=".7">Streichholz</text>`,
      s4: `<rect x="146" y="30" width="9" height="56" rx="3" fill="#c97b2d"/><rect x="144" y="22" width="13" height="12" rx="3" fill="${ACC}"/><text x="120" y="112" font-size="10" fill="${INK}" opacity=".7">größer als ein Streichholz</text>`
    }[sid];
    const s = { s1: 0.55, s2: 0.8, s3: 1.05, s4: 1.35 }[sid];
    return svg(`<line x1="24" y1="88" x2="176" y2="88" stroke="${INK}" stroke-width="1.6" opacity=".4"/>
      ${ant(70, 78, s, {})}
      ${obj}
      <path class="vx-draw" d="M40 96 L100 96" stroke="${ACC}" stroke-width="2.4"/>
      <text x="40" y="110" font-size="10" fill="${ACC}" font-family="ui-monospace,monospace">Körperlänge</text>`);
  }

  /* ---------- Farbe ---------- */
  function color(sid) {
    const c = { gelb: ["#e8cd8a", "#d9b36a"], gelbbraun: ["#c99a5e", "#b98a4e"], braun: ["#9a6a3d", "#7a4c28"], schwarz: ["#4a3628", "#2a1c12"] }[sid];
    if (sid === "band") return svg(`<defs><linearGradient id="b${U()}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4426"/><stop offset=".45" stop-color="#6b4426"/><stop offset=".45" stop-color="#e6cf9a"/><stop offset=".62" stop-color="#e6cf9a"/><stop offset=".62" stop-color="#6b4426"/><stop offset="1" stop-color="#6b4426"/></linearGradient></defs>
      <rect x="40" y="20" width="120" height="80" rx="18" fill="url(#b${uid - 1})" stroke="${INK}" stroke-width="2"/>
      <path class="vx-sweep slow" d="M52 26 l20 0 l-14 68 l-20 0 Z" fill="#fff" opacity=".18"/>`);
    return svg(`<defs><radialGradient id="r${U()}"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient></defs>
      <rect x="40" y="20" width="120" height="80" rx="18" fill="url(#r${uid - 1})" stroke="${INK}" stroke-width="2"/>
      <ellipse class="vx-pulse" cx="78" cy="42" rx="20" ry="10" fill="#fff" opacity=".22"/>`);
  }

  /* ---------- Gaster ---------- */
  function gaster(sid) {
    const u = U();
    let fx = "";
    if (sid === "band") fx = `<path d="M52 52 q48 -14 96 0 l0 12 q-48 -12 -96 0 Z" fill="#e6cf9a"/>`;
    if (sid === "spiegel") fx = `<g clip-path="url(#gc${u})"><rect class="vx-sweep" x="40" y="20" width="22" height="90" fill="#fff" opacity=".55"/></g>
      <circle cx="80" cy="46" r="3" fill="#fff" opacity=".8"/><circle cx="110" cy="66" r="2.2" fill="#fff" opacity=".6"/><circle cx="92" cy="78" r="1.8" fill="#fff" opacity=".5"/>`;
    return svg(`<defs><clipPath id="gc${u}"><ellipse cx="100" cy="60" rx="52" ry="34"/></clipPath></defs>
      <ellipse cx="100" cy="60" rx="52" ry="34" fill="#6b4426" stroke="${INK}" stroke-width="2.5"/>${fx}
      <path d="M40 40 q10 -6 18 -2" stroke="${INK}" stroke-width="3" fill="none" opacity=".5"/>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Hinterleib (Gaster)</text>`);
  }

  /* ---------- Fühlerglieder ---------- */
  function antennae(sid) {
    const n = sid === "a11" ? 11 : 12;
    let c = "";
    for (let i = 0; i < n; i++) {
      const x = 30 + i * 12, y = 60 - Math.sin(i / (n - 1) * Math.PI) * 26;
      c += `<circle class="vx-count" style="animation-delay:${i * 0.14}s" cx="${x}" cy="${y}" r="${i === 0 ? 6 : 4.4}" fill="${i === 0 ? ACC : INK}" opacity=".85"/>`;
    }
    return svg(c + `<text x="150" y="104" font-size="15" fill="${ACC}" font-family="ui-monospace,monospace" class="vx-pulse">${n}</text>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Glieder zählen (Makro)</text>`);
  }

  /* ---------- Szenen (Fundort) ---------- */
  function scene(sid) {
    if (sid === "eichel") return svg(`
      <path class="vx-float" d="M30 20 q14 -8 22 4 q-12 10 -22 -4 Z" fill="#b98a4e"/>
      <ellipse cx="100" cy="70" rx="42" ry="30" fill="#8a5a33" stroke="${INK}" stroke-width="2.5"/>
      <path d="M62 58 q38 -22 76 0 l-6 -12 q-32 -16 -64 0 Z" fill="#5d3d20"/>
      <ellipse cx="100" cy="70" rx="26" ry="16" fill="#3d2a18"/>
      ${[88, 100, 112].map((x, i) => `<circle class="vx-pulse" style="animation-delay:${i * .4}s" cx="${x}" cy="${68 + (i % 2) * 6}" r="4" fill="#e6cf9a"/>`).join("")}
      ${ant(140, 92, .7, { cls: "vx-walk" })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Eichel/Zweig aufgebrochen: Brut darin</text>`);
    if (sid === "baum") return svg(`
      <rect x="70" y="8" width="60" height="104" rx="8" fill="#7a5230" stroke="${INK}" stroke-width="2.5"/>
      <path d="M82 12 q6 40 0 96 M104 10 q-6 44 2 100 M118 14 q4 40 -2 94" stroke="${INK}" stroke-width="2" fill="none" opacity=".5"/>
      <ellipse cx="100" cy="52" rx="12" ry="9" fill="#2a1c12"/>
      ${ant(96, 78, .7, { cls: "vx-walk" })}${ant(112, 34, .6, { cls: "vx-walk2" })}
      <path class="vx-float" d="M28 30 q12 -6 18 4 q-10 8 -18 -4 Z" fill="#7fb069"/>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Rinde/Astloch: Tiere laufen am Holz</text>`);
    if (sid === "stein") return svg(`
      <circle class="vx-sun" cx="168" cy="22" r="12" fill="${ACC}"/>
      <path d="M20 96 l34 -34 l40 8 l30 -18 l56 44 Z" fill="#8d8578" stroke="${INK}" stroke-width="2.5"/>
      <path d="M54 62 l40 8 l-8 26 l-38 -6 Z" fill="#6e675c"/>
      <path d="M96 72 l14 4 l-4 14 l-12 -4 Z" fill="#241c14"/>
      ${ant(102, 84, .6, { cls: "vx-walk" })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Stein/Mauerspalte: sonnig-trocken</text>`);
    if (sid === "streu") return svg(`
      <path d="M14 92 q30 -18 60 -6 t60 -4 t52 8 l0 22 l-172 0 Z" fill="#6b4426"/>
      <path class="vx-float" d="M40 66 q16 -10 26 2 q-14 12 -26 -2 Z" fill="#b98a4e"/>
      <path class="vx-float" style="animation-delay:.8s" d="M120 58 q14 -8 22 2 q-12 10 -22 -2 Z" fill="#9a6a3d"/>
      <circle cx="70" cy="86" r="7" fill="#7fb069"/><circle cx="84" cy="88" r="6" fill="#5d8a4a"/><circle cx="60" cy="90" r="5" fill="#7fb069"/>
      ${ant(110, 84, .7, { cls: "vx-walk" })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Streu/Moos am Boden</text>`);
    return svg(`
      <path d="M30 96 q40 -46 80 -40 q40 6 60 40 Z" fill="#5d4a2e" stroke="${INK}" stroke-width="2.5"/>
      ${ant(70, 74, 1.0, {})}${ant(120, 66, 1.0, {})}
      ${ant(96, 82, .5, { cls: "vx-walk", shine: true })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Nesthügel großer Ameisen: winziger Gast</text>`);
  }

  /* ---------- Verhalten ---------- */
  function behavior(sid) {
    if (sid === "tandem") return svg(`
      <line x1="16" y1="92" x2="184" y2="92" stroke="${INK}" stroke-width="2" opacity=".4"/>
      <g class="vx-tandem">
        ${ant(60, 82, .9, {})}${ant(96, 82, .9, {})}
        <path d="M74 76 q10 -6 16 0" stroke="${ACC}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </g>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Führe ich dich: Tandemlaufen beim Umzug</text>`);
    if (sid === "ruhig") return svg(`
      <circle class="vx-ring" cx="100" cy="70" r="34" fill="none" stroke="${ACC}" stroke-width="2"/>
      ${ant(92, 72, 1.0, { curl: true })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Bei Störung: einrollen / zögern statt Angriff</text>`);
    if (sid === "aggressiv") return svg(`
      <path class="vx-dash" d="M28 60 l22 0 M24 74 l26 0 M28 88 l22 0" stroke="${INK}" stroke-width="2" opacity=".5"/>
      ${ant(90, 72, 1.1, { sting: true })}
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Flink, attackiert, krümmt die Gaster (Stich)</text>`);
    if (sid === "gast") return svg(`
      ${ant(52, 70, 1.5, {})}${ant(130, 66, 1.5, {})}
      ${ant(96, 84, .6, { cls: "vx-walk", shine: true })}
      <circle class="vx-pulse" cx="104" cy="78" r="2" fill="#fff"/>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Winzig & spiegelglatt zwischen Waldameisen</text>`);
    return svg(`
      <line x1="16" y1="94" x2="184" y2="94" stroke="${INK}" stroke-width="2" opacity=".4"/>
      <g class="vx-walk">${ant(84, 82, 1.2, {})}
        <ellipse cx="108" cy="70" rx="9" ry="6" fill="#f4ede1" stroke="${INK}" stroke-width="1.6"/></g>
      <text x="12" y="112" font-size="11" fill="${INK}" opacity=".7" font-family="ui-monospace,monospace">Brutraub: fremde Brut wird weggetragen</text>`);
  }

  /* ---------- Dispatch ---------- */
  function forState(cid, sid) {
    switch (cid) {
      case "c_sculpt": return sculpt(sid);
      case "c_spine": return spine(sid);
      case "c_node": return node(sid);
      case "c_hair": return hair(sid);
      case "c_size": return size(sid);
      case "c_color": return color(sid);
      case "c_gaster": return gaster(sid);
      case "c_ant": return antennae(sid);
      case "c_nest": return scene(sid);
      case "c_behavior": return behavior(sid);
    }
    return "";
  }

  /* =========================================================================
     v3.1 – WHITEBOARD-REISE
     Eine große "Tafel": ein geschwungener Pfad zeichnet sich von Station zu
     Station vor, die Kamera fliegt hinterher und zoomt je nach Detailgrad.
     stationSketch(cid) liefert Strich-Motive (Pfade, lokale Box ~±70),
     boardSVG() baut Tafel + Pfad + Stationsgruppen (Zeichnen rein über CSS).
     ========================================================================= */
  const K = (x, y, r) => `M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  const E = (x, y, rx, ry) => `M${x - rx},${y} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0`;
  const antD = o => [
    K(o - 26, 0, 8), K(o - 9, -2, 7), E(o + 13, 0, 12, 9),
    `M${o - 28},7 l-6,13 M${o - 10},6 l-3,13 M${o + 7},8 l4,12`
  ];

  /* Kamerazoom je Station: Detail-Motive liegen klein auf der Tafel (SKALA),
     die Kamera zoomt heran -> Proportionen bleiben ehrlich, Lesbarkeit groß. */
  const STATION_ZOOM = { c_nest: 1.05, c_behavior: 1.05, c_size: 1.15, c_color: 1.1, c_sculpt: 1.55, c_spine: 1.5, c_node: 1.6, c_hair: 1.5, c_gaster: 1.35, c_ant: 1.6, ziel: 1.12 };
  const STATION_SKALA = { c_nest: 1, c_behavior: 0.9, c_size: 0.9, c_color: 0.85, c_sculpt: 0.62, c_spine: 0.62, c_node: 0.6, c_hair: 0.62, c_gaster: 0.7, c_ant: 0.6, ziel: 0.9 };

  function stationSketch(cid) {
    switch (cid) {
      case "c_nest": return [E(0, 8, 30, 26), "M-30,2 Q0,-24 30,2", "M0,-18 L7,-38", "M-56,36 q12,-14 26,0", "M32,36 q11,-13 24,0"];
      case "c_behavior": return antD(-34).concat(antD(30), ["M-4,-1 L10,-3"]);
      case "c_size": return antD(-28).concat(["M8,-30 H64", "M8,-30 v9 M19,-30 v5 M30,-30 v9 M41,-30 v5 M52,-30 v9 M64,-30 v6"]);
      case "c_color": return antD(0).concat([K(-42, 46, 8), K(-14, 46, 8), K(14, 46, 8), K(42, 46, 8)]);
      case "c_sculpt": return [K(-4, -8, 30), "M-18,-16 q6,-4 12,0", "M-20,-4 q6,-4 12,0", "M-16,8 q6,-4 12,0", K(22, 18, 16), "M33,29 L46,42"];
      case "c_spine": return ["M-40,16 Q-16,-18 20,-10", "M14,-10 L30,-26", "M22,-8 L38,-22", E(46, 6, 14, 10), K(-46, 10, 9)];
      case "c_node": return ["M-34,20 L-12,-16 L0,-14 L12,22", "M-12,-16 Q-4,-25 0,-14", "M-46,22 H24", E(34, -4, 12, 9)];
      case "c_hair": return ["M-40,20 Q0,-24 40,14", "M-28,6 l-6,-16", "M-12,-6 l-3,-17", "M6,-10 l2,-17", "M24,-2 l7,-15"];
      case "c_gaster": return [E(0, 0, 34, 24), "M-16,-19 q5,19 0,38", "M0,-24 q5,24 0,48", "M16,-19 q5,19 0,38"];
      case "c_ant": return ["M-40,26 Q-24,-20 0,-16", K(8, -14, 5), K(18, -11, 5), K(28, -8, 5), K(38, -5, 6)];
      case "ziel": return ["M-8,42 V-40", "M-8,-40 L34,-30 L-8,-20", "M-22,42 H8", K(46, -34, 7)];
    }
    return [K(0, 0, 24)];
  }

  /* Catmull-Rom -> Bezier: Pfad läuft EXAKT durch alle Stationspunkte */
  function pfadD(pts) {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function boardSVG(liste) {
    const STEP = 460, W = 260 + liste.length * STEP + 260, H = 640;
    const pts = [{ x: 40, y: 400 }];
    const st = liste.map((s, i) => {
      const p = { x: 260 + i * STEP, y: 360 + Math.sin(i * 1.05) * 45 };
      pts.push(p);
      return Object.assign({ p, i }, s);
    });
    const zielP = { x: 260 + liste.length * STEP, y: 360 + Math.sin(liste.length * 1.05) * 45 };
    pts.push(zielP);
    const stations = st.concat([{ cid: "ziel", nr: "", label: "Ziel", p: zielP, i: liste.length }]);
    const inner = stations.map(s => {
      const sk = STATION_SKALA[s.cid] || 1;
      const motive = stationSketch(s.cid);
      return `<g class="station" id="st${s.i}" data-cid="${s.cid}" transform="translate(${s.p.x},${s.p.y.toFixed(1)})">
        <g class="skgroup" transform="scale(${sk})">
          ${motive.map((d, k) => `<path class="sk" style="--d:${(k * 0.13).toFixed(2)}s" d="${d}" fill="none" stroke="currentColor" stroke-width="${(3 / sk).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}
        </g>
        ${s.nr ? `<g class="snr"><circle cx="-78" cy="-84" r="16"/><text x="-78" y="-78">${s.nr}</text></g>` : ""}
        <g class="sdone"><circle cx="78" cy="-84" r="15"/><path d="M71,-84 l5,6 l10,-12"/></g>
        <g class="sskip"><circle cx="78" cy="-84" r="15"/><text x="78" y="-79">⏭</text></g>
      </g>`;
    }).join("");
    const d = pfadD(pts);
    const svg = `<svg id="boardsvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Reise-Tafel">
      <path class="wbguide" d="${d}" fill="none"/>
      <path id="wbpath" d="${d}" pathLength="100" fill="none"/>
      ${inner}
    </svg>`;
    return { svg, pts, W, H, d };
  }
  const esc0 = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  return { forState, ant, stationSketch, boardSVG, STATION_ZOOM, STATION_SKALA };
})();

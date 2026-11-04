/* =========================================================================
   TEMNOTHEK v3.3 – SZENEN-WELT
   Durchillustrierte, zusammenhängende Reise-Landschaft im Stil naturkund-
   licher Feldführer-Poster: mehrschichtige Panoramen (Parallax), verhältnis-
   treue illustrierte Ameisen (Farbe, Schatten, Borsten, Dornen, Knoten),
   Kopf-Schilde mit echter Textur und ECHTE Belegfotos als Foto-Abzüge
   INNERHALB der Szenen (Hybrid). Optionen sind Akteure/Objekte in der
   Szene – keine Karten daneben.
   ========================================================================= */
"use strict";

const Scenes = (function () {

  /* ---------------- Palette ---------------- */
  const PAL = {
    sky1: "#f8eed6", sky2: "#efd9ac", sun: "#f6c667",
    far1: "#bcc7a4", far2: "#a4b48b",
    mid1: "#87996c", mid2: "#6d815a", trunk: "#8a6a48",
    grass: "#9aa06b", soil1: "#6e4f33", soil2: "#52381f",
    leaf1: "#84a75e", leaf2: "#5c7f42", bark1: "#7b5a3e", bark2: "#5e4430",
    paper: "#fff8e8", ink: "#3a2c1c", mut: "#7c6a4f",
    accent: "#d97706", ring: "#c2410c"
  };
  const ANT_COL = {
    gelb: ["#e3c078", "#c9a355"], gelbbraun: ["#c99a55", "#a87b3c"],
    braun: ["#8a5a33", "#6b4224"], schwarz: ["#4a382c", "#33251c"],
    band: ["#4a382c", "#33251c"]
  };

  let UID = 0;
  const u = p => p + (UID++);
  const X = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------------- Shared defs ---------------- */
  function defs(id) {
    return `<defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${PAL.sky1}"/><stop offset="1" stop-color="${PAL.sky2}"/></linearGradient>
      <radialGradient id="${id}sun"><stop offset="0" stop-color="${PAL.sun}" stop-opacity=".95"/>
        <stop offset=".55" stop-color="${PAL.sun}" stop-opacity=".35"/><stop offset="1" stop-color="${PAL.sun}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}soil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${PAL.soil1}"/><stop offset="1" stop-color="${PAL.soil2}"/></linearGradient>
      <linearGradient id="${id}leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${PAL.leaf1}"/><stop offset="1" stop-color="${PAL.leaf2}"/></linearGradient>
      <linearGradient id="${id}bark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${PAL.bark1}"/><stop offset="1" stop-color="${PAL.bark2}"/></linearGradient>
      <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--ab1,#8a5a33)"/><stop offset="1" stop-color="var(--ab2,#6b4224)"/></linearGradient>
      <linearGradient id="${id}gast" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--ab1,#8a5a33)"/><stop offset=".6" stop-color="var(--ab2,#6b4224)"/><stop offset="1" stop-color="var(--ab1,#8a5a33)"/></linearGradient>
      <filter id="${id}sh" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#2c1c0c" flood-opacity=".28"/></filter>
      <filter id="${id}sh2" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#2c1c0c" flood-opacity=".3"/></filter>
      <filter id="${id}blur"><feGaussianBlur stdDeviation="3"/></filter>
      <clipPath id="${id}clip"><circle cx="0" cy="0" r="46"/></clipPath>
    </defs>`;
  }

  /* ---------------- Panorama-Ebenen (Parallax) ---------------- */
  function panoramaFar() {
    const W = 2100, H = 700, id = u("pf");
    let clouds = "";
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 300 + (i % 3) * 40, y = 90 + (i % 4) * 46;
      clouds += `<g transform="translate(${x},${y})" opacity=".8"><g class="cloud" style="--cd:${26 + i * 4}s">
        <ellipse cx="0" cy="0" rx="70" ry="16" fill="#fffdf4"/><ellipse cx="-38" cy="6" rx="40" ry="11" fill="#fffdf4"/>
        <ellipse cx="40" cy="7" rx="46" ry="12" fill="#fffdf4"/></g></g>`;
    }
    let ridge = `M0,${H * 0.62}`;
    for (let x = 0; x <= W; x += 60) ridge += ` L${x},${H * 0.62 - Math.sin(x / 210) * 26 - Math.sin(x / 83) * 9}`;
    ridge += ` L${W},${H} L0,${H} Z`;
    let ridge2 = `M0,${H * 0.72}`;
    for (let x = 0; x <= W; x += 50) ridge2 += ` L${x},${H * 0.72 - Math.sin(x / 160 + 2) * 20 - Math.sin(x / 61) * 7}`;
    ridge2 += ` L${W},${H} L0,${H} Z`;
    let trees = "";
    for (let i = 0; i < 26; i++) {
      const x = 40 + i * 82 + (i % 3) * 17, h = 46 + (i % 5) * 14, y = H * 0.72 - Math.sin(x / 160 + 2) * 20 - Math.sin(x / 61) * 7;
      trees += `<path d="M${x},${y} l${-h * 0.28},0 l${h * 0.28},${-h} l${h * 0.28},${h} Z" fill="${PAL.far2}" opacity=".9"/>`;
    }
    return `<svg class="plysvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">
      ${defs(id)}
      <rect width="${W}" height="${H}" fill="url(#${id}sky)"/>
      <circle cx="${W * 0.78}" cy="120" r="150" fill="url(#${id}sun)"/>
      <circle cx="${W * 0.78}" cy="120" r="34" fill="#fbe1a0"/>
      ${clouds}
      <path d="${ridge}" fill="${PAL.far1}"/>
      <path d="${ridge2}" fill="${PAL.far2}"/>${trees}
      <path d="M${W * 0.2},150 q14,-10 28,0 q-14,-6 -28,0 M${W * 0.26},168 q11,-8 22,0 q-11,-5 -22,0" stroke="#8b7d5e" stroke-width="2.4" fill="none" opacity=".7"/>
    </svg>`;
  }

  function panoramaMid() {
    const W = 3600, H = 700, id = u("pm");
    let out = "";
    for (let i = 0; i < 12; i++) {
      const x = 140 + i * 300 + (i % 4) * 36, top = 250 + (i % 3) * 40;
      out += `<g opacity=".95">
        <path d="M${x},${H} C${x - 10},${H * 0.72} ${x + 8},${top + 120} ${x - 4},${top}" stroke="${PAL.trunk}" stroke-width="${16 + (i % 3) * 6}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${x - 6}" cy="${top - 26}" rx="${64 + (i % 3) * 22}" ry="${40 + (i % 2) * 14}" fill="${PAL.mid1}"/>
        <ellipse cx="${x + 34}" cy="${top + 2}" rx="${48 + (i % 2) * 18}" ry="${30 + (i % 3) * 8}" fill="${PAL.mid2}"/>
        <ellipse cx="${x - 44}" cy="${top + 8}" rx="${40 + (i % 4) * 10}" ry="${26 + (i % 2) * 8}" fill="${PAL.mid2}" opacity=".85"/>
        <ellipse cx="${x - 26}" cy="${top - 44}" rx="${34 + (i % 2) * 12}" ry="${22 + (i % 3) * 6}" fill="${PAL.mid1}" opacity=".9"/>
        <ellipse cx="${x + 16}" cy="${top - 34}" rx="${28 + (i % 4) * 8}" ry="${18 + (i % 2) * 6}" fill="#93a878" opacity=".8"/>
        <path d="M${x - 40},${top - 10} q18,-14 40,-8 M${x - 10},${top + 6} q16,-10 34,-4" stroke="${PAL.mid2}" stroke-width="3" fill="none" opacity=".5"/></g>`;
    }
    for (let i = 0; i < 40; i++) {
      const x = 60 + i * 90 + (i % 5) * 12, y = H - 20 - (i % 4) * 10;
      out += `<path d="M${x},${y} q-6,-26 -14,-34 M${x},${y} q0,-30 4,-40 M${x},${y} q8,-24 16,-30" stroke="${PAL.mid2}" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>`;
    }
    return `<svg class="plysvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true">
      ${defs(id)}${out}</svg>`;
  }

  /* durchgehender Boden (liegt in der Content-Ebene, 1:1 mit Kamera) */
  const gTop = x => 520 + Math.sin((x - 260) / 460 * 1.05) * 45;
  function groundStrip(W) {
    const H = 700, id = u("pg");
    let tufts = "", stones = "", moss = "";
    for (let x = 30; x < W; x += 46) {
      const y = gTop(x) - 14;
      tufts += `<path d="M${x},${y} q-5,-20 -12,-26 M${x},${y} q0,-24 3,-32 M${x},${y} q7,-18 14,-24" stroke="${PAL.grass}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".9"/>`;
    }
    for (let i = 0; i < W / 260; i++) {
      const x = 90 + i * 260 + (i % 3) * 55, y = gTop(x) + 40 + (i % 4) * 26;
      stones += `<ellipse cx="${x}" cy="${y}" rx="${16 + (i % 3) * 7}" ry="${9 + (i % 2) * 4}" fill="#8d8577" opacity=".8"/>
        <ellipse cx="${x - 4}" cy="${y - 3}" rx="${8 + (i % 2) * 3}" ry="4" fill="#a49a88" opacity=".8"/>`;
      moss += `<ellipse cx="${x + 120}" cy="${gTop(x + 120) + 30 + (i % 3) * 12}" rx="${26 + (i % 4) * 8}" ry="7" fill="${PAL.mid2}" opacity=".5"/>`;
    }
    return `<svg class="groundsvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" style="position:absolute;inset:0">
      ${defs(id)}
      <path d="M0,${gTop(0).toFixed(1)} ${Array.from({ length: Math.ceil(W / 80) }, (_, k) => `L${(k + 1) * 80},${gTop((k + 1) * 80).toFixed(1)}`).join(" ")} L${W},${H} L0,${H} Z" fill="url(#${id}soil)"/>
      <path d="M0,${gTop(0).toFixed(1)} ${Array.from({ length: Math.ceil(W / 80) }, (_, k) => `L${(k + 1) * 80},${gTop((k + 1) * 80).toFixed(1)}`).join(" ")}" stroke="${PAL.grass}" stroke-width="7" fill="none" opacity=".95"/>
      ${moss}${stones}${tufts}
    </svg>`;
  }

  /* ---------------- illustrierte Ameise (verhältnistreu) ---------------- */
  function fieldAnt(p, o) {
    o = o || {};
    const L = o.len || 120, col = ANT_COL[o.col || "braun"] || ANT_COL.braun;
    const id = u("a");
    const mydefs = `<defs>
      <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset="1" stop-color="${col[1]}"/></linearGradient>
      <linearGradient id="${id}gast" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset=".6" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient>
    </defs>`;
    const hr = L * 0.15;
    const hx = L * 0.10, hy = -L * 0.10;
    const spL = (p.spineLen || 0.28) * L * 0.68;
    const spA = (p.spineAngle || 36) * Math.PI / 180;
    const nA = (p.nodeAngle || 107) * Math.PI / 180;
    const nH = (p.nodeHeight || 0.385) * L * 0.52;
    const nw = Math.max(L * 0.045, nH / Math.tan(Math.min(1.35, nA / 2)) * 0.55);
    /* Rumpf: durchgehend, Kopf ueberlappend */
    const meso = `<path d="M${L * 0.20},${-L * 0.02} Q${L * 0.28},${-L * 0.17} ${L * 0.40},${-L * 0.15} Q${L * 0.52},${-L * 0.13} ${L * 0.55},${-L * 0.02} Q${L * 0.53},${L * 0.07} ${L * 0.40},${L * 0.07} Q${L * 0.27},${L * 0.07} ${L * 0.20},${L * 0.02} Z" fill="url(#${id}body)"/>`;
    const neck = `<path d="M${hx + hr * 0.5},${hy - hr * 0.25} L${L * 0.24},${-L * 0.08} L${L * 0.24},${L * 0.03} L${hx + hr * 0.5},${hy + hr * 0.45} Z" fill="${col[1]}"/>`;
    const spine = (bx, by, k) => {
      const dx = Math.cos(spA) * spL * k, dy = -Math.sin(spA) * spL;
      return `<path d="M${bx - L * 0.02},${by + L * 0.02} Q${bx + dx * 0.6},${by + dy * 0.8} ${bx + dx},${by + dy} Q${bx + dx * 0.3},${by + dy * 0.2} ${bx + L * 0.03},${by + L * 0.04} Z" fill="${col[1]}"/>`;
    };
    const node = p.nodeShape === "schuppe"
      ? `<path d="M${L * 0.60 - nw},${L * 0.05} Q${L * 0.62},${-nH * 1.9} ${L * 0.60 + nw},${L * 0.05} Z" fill="url(#${id}body)"/>`
      : `<path d="M${L * 0.60 - nw},${L * 0.05} L${L * 0.615 - nw * 0.3},${-nH} Q${L * 0.62},${-nH - L * 0.015} ${L * 0.625 + nw * 0.3},${-nH} L${L * 0.60 + nw},${L * 0.05} Z" fill="url(#${id}body)"/>`;
    const gx = L * 0.845, gy = -L * 0.045;
    const gaster = o.curl
      ? `<path d="M${gx - L * 0.17},${gy} Q${gx - L * 0.17},${gy - L * 0.19} ${gx},${gy - L * 0.19} Q${gx + L * 0.19},${gy - L * 0.19} ${gx + L * 0.17},${gy + L * 0.06} Q${gx + L * 0.12},${gy + L * 0.16} ${gx + L * 0.02},${gy + L * 0.12} Q${gx - L * 0.06},${gy + L * 0.08} ${gx - L * 0.05},${gy} Z" fill="url(#${id}gast)"/>`
      : `<ellipse cx="${gx}" cy="${gy}" rx="${L * 0.19}" ry="${L * 0.135}" fill="url(#${id}gast)"/>`;
    const waist = `<path d="M${L * 0.54},${-L * 0.04} L${L * 0.64},${-L * 0.05} L${L * 0.64},${L * 0.03} L${L * 0.54},${L * 0.04} Z" fill="${col[1]}"/>`;
    const band = o.col === "band" ? `<path d="M${gx - L * 0.10},${gy - L * 0.10} q${L * 0.08},${L * 0.11} 0,${L * 0.20}" stroke="#e8d8a8" stroke-width="${L * 0.045}" fill="none" opacity=".9"/>` : "";
    const shine = o.shine ? `<ellipse class="sweepx" cx="${gx - L * 0.05}" cy="${gy - L * 0.05}" rx="${L * 0.045}" ry="${L * 0.09}" fill="#fff" opacity=".5"/>` : "";
    const sting = o.sting ? `<path d="M${gx + L * 0.17},${gy - L * 0.04} q${L * 0.10},${-L * 0.10} ${L * 0.05},${-L * 0.19}" stroke="${PAL.ring}" stroke-width="${L * 0.026}" fill="none" stroke-linecap="round"/>` : "";
    const leg = (x, bx, ty) => `<path d="M${x},${L * 0.05} L${x - bx},${L * 0.17} L${x - bx - ty},${L * 0.32}" stroke="${col[1]}" stroke-width="${L * 0.026}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const legs = leg(L * 0.27, L * 0.07, L * 0.05) + leg(L * 0.37, L * 0.02, L * 0.05) + leg(L * 0.47, -L * 0.04, -L * 0.05)
      + `<g opacity=".55">` + leg(L * 0.30, L * 0.06, L * 0.04) + leg(L * 0.40, L * 0.0, L * 0.04) + leg(L * 0.50, -L * 0.05, -L * 0.04) + `</g>`;
    let hairs = "";
    const hn = o.hair === "dicht" ? 14 : o.hair === "maessig" ? 7 : o.hair === "spaerlich" ? 2 : 0;
    for (let i = 0; i < hn; i++) {
      const t = i / (hn - 1 || 1);
      const x = L * 0.22 + t * L * 0.62, y = -L * 0.15 + Math.sin(t * 3.1) * L * 0.05;
      hairs += `<path d="M${x.toFixed(1)},${y.toFixed(1)} l${(-2 + t * 5).toFixed(1)},${-L * 0.07}" stroke="${col[0]}" stroke-width="1.5" opacity=".9" stroke-linecap="round"/>`;
    }
    const antenna = `<g class="antenna">
      <path d="M${hx - hr * 0.72},${hy - hr * 0.42} L${hx - hr * 1.5},${hy - hr * 1.35}" stroke="${col[1]}" stroke-width="${L * 0.024}" stroke-linecap="round" fill="none"/>
      <path d="M${hx - hr * 1.5},${hy - hr * 1.35} q${-hr * 0.55},${-hr * 0.12} ${-hr * 0.95},${hr * 0.05}" stroke="${col[1]}" stroke-width="${L * 0.03}" stroke-linecap="round" fill="none"/>
      <circle cx="${hx - hr * 2.5},${hy - hr * 1.26}" r="${hr * 0.17}" fill="${col[1]}"/></g>`;
    const mand = `<path d="M${hx - hr * 0.92},${hy + hr * 0.12} q${-hr * 0.5},${hr * 0.28} ${-hr * 0.16},${hr * 0.55} q${hr * 0.32},${hr * 0.12} ${hr * 0.5},${-hr * 0.08} Z" fill="${col[1]}"/>`;
    return `<g class="fant ${o.cls || ""}">${mydefs}
      <ellipse cx="${L * 0.5}" cy="${L * 0.35}" rx="${L * 0.40}" ry="${L * 0.045}" fill="#2c1c0c" opacity=".16" filter="url(#ppblur)"/>
      ${legs}${neck}${meso}${spine(L * 0.50, -L * 0.13, 1)}${spine(L * 0.475, -L * 0.135, 0.7)}${waist}${node}${gaster}${band}${shine}${sting}
      <ellipse cx="${hx}" cy="${hy}" rx="${hr}" ry="${hr * 0.92}" fill="url(#${id}body)"/>
      ${mand}${antenna}
      <ellipse cx="${hx - hr * 0.45}" cy="${hy - hr * 0.12}" rx="${hr * 0.22}" ry="${hr * 0.26}" fill="#20140c"/>
      <circle cx="${hx - hr * 0.52}" cy="${hy - hr * 0.2}" r="${hr * 0.07}" fill="#fff" opacity=".85"/>
      ${hairs}
    </g>`;
  }

  /* Skulptur-Textur als Muster (fuer Lupen-Makro) */
  function texFor(sculpt, w, h, S) {
    let t = "";
    const dots = (n, op) => { for (let i = 0; i < n; i++) { const x = -w / 2 + Math.random() * w, y = -h / 2 + Math.random() * h; t += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(S * 0.016).toFixed(1)}" fill="#2c1c0c" opacity="${op}"/>`; } };
    if (sculpt === "glatt") t += `<ellipse cx="${-w * 0.15}" cy="${-h * 0.15}" rx="${w * 0.22}" ry="${h * 0.14}" fill="#fff" opacity=".3"/>`;
    if (sculpt === "areoGlanz") { dots(60, ".3"); t += `<ellipse cx="${-w * 0.12}" cy="${-h * 0.14}" rx="${w * 0.18}" ry="${h * 0.12}" fill="#fff" opacity=".28"/>`; }
    if (sculpt === "areoMatt") dots(95, ".38");
    if (sculpt === "costulae") { dots(50, ".32"); [-0.3, -0.15, 0, 0.15, 0.3].map(k => { t += `<path d="M${w * k},${-h / 2} q${w * 0.02},${h * 0.5} 0,${h}" stroke="#2c1c0c" stroke-width="${S * 0.02}" fill="none" opacity=".55"/>`; }); }
    if (sculpt === "rugos") [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map(k => { t += `<path d="M${w * k},${-h / 2} q${w * 0.09},${h * 0.26} ${-w * 0.05},${h * 0.5} q${-w * 0.08},${h * 0.26} ${w * 0.06},${h * 0.5}" stroke="#2c1c0c" stroke-width="${S * 0.026}" fill="none" opacity=".55"/>`; });
    return t;
  }

  /* ---------------- Kopf-Schild frontal mit Textur ---------------- */
  function headFront(sculpt, S, colKey) {
    const id = u("h"), col = ANT_COL[colKey || "braun"];
    const mydefs = `<defs><linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset="1" stop-color="${col[1]}"/></linearGradient></defs>`;
    const w = S * 0.98, h = S * 0.86;
    let tex = "";
    const dots = (n, op) => { let t = ""; for (let i = 0; i < n; i++) { const x = -w / 2 + Math.random() * w, y = -h * 0.62 + Math.random() * h * 0.78; t += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(S * 0.013).toFixed(1)}" fill="#2c1c0c" opacity="${op}"/>`; } return t; };
    if (sculpt === "glatt") tex = `<ellipse cx="${-w * 0.16}" cy="${-h * 0.3}" rx="${w * 0.18}" ry="${h * 0.12}" fill="#fff" opacity=".22"/>`;
    if (sculpt === "areoGlanz") tex = dots(44, ".26") + `<ellipse cx="${-w * 0.14}" cy="${-h * 0.28}" rx="${w * 0.15}" ry="${h * 0.10}" fill="#fff" opacity=".2"/>`;
    if (sculpt === "areoMatt") tex = dots(72, ".32");
    if (sculpt === "costulae") tex = dots(38, ".28") + [-0.26, -0.13, 0, 0.13, 0.26].map(t => `<path d="M${w * t},${-h * 0.5} q${w * 0.02},${h * 0.28} 0,${h * 0.56}" stroke="#2c1c0c" stroke-width="${S * 0.015}" fill="none" opacity=".5"/>`).join("");
    if (sculpt === "rugos") tex = [-0.38, -0.23, -0.08, 0.07, 0.22, 0.37].map(t => `<path d="M${w * t},${-h * 0.55} q${w * 0.08},${h * 0.15} ${-w * 0.04},${h * 0.28} q${-w * 0.07},${h * 0.15} ${w * 0.05},${h * 0.3}" stroke="#2c1c0c" stroke-width="${S * 0.02}" fill="none" opacity=".5"/>`).join("");
    return `<g class="hfront">${mydefs}
      <path d="M${-w / 2},${-h * 0.34} Q${-w * 0.54},${-h * 0.62} ${-w * 0.2},${-h * 0.66} Q0,${-h * 0.7} ${w * 0.2},${-h * 0.66} Q${w * 0.54},${-h * 0.62} ${w / 2},${-h * 0.34} Q${w * 0.52},${h * 0.1} ${w * 0.26},${h * 0.4} Q0,${h * 0.56} ${-w * 0.26},${h * 0.4} Q${-w * 0.52},${h * 0.1} ${-w / 2},${-h * 0.34} Z" fill="url(#${id}body)" filter="url(#ppsh2)"/>
      ${tex}
      <path d="M${-w * 0.10},${-h * 0.18} L${-w * 0.08},${h * 0.16} M${w * 0.10},${-h * 0.18} L${w * 0.08},${h * 0.16}" stroke="#2c1c0c" stroke-width="${S * 0.018}" fill="none" opacity=".55"/>
      <path d="M${-w * 0.14},${h * 0.18} Q0,${h * 0.30} ${w * 0.14},${h * 0.18} Q0,${h * 0.10} ${-w * 0.14},${h * 0.18} Z" fill="${col[1]}" opacity=".9"/>
      <ellipse cx="${-w * 0.45}" cy="${-h * 0.02}" rx="${w * 0.055}" ry="${h * 0.10}" fill="#20140c"/>
      <ellipse cx="${w * 0.45}" cy="${-h * 0.02}" rx="${w * 0.055}" ry="${h * 0.10}" fill="#20140c"/>
      <circle cx="${-w * 0.465}" cy="${-h * 0.07}" r="${S * 0.011}" fill="#fff" opacity=".8"/>
      <circle cx="${w * 0.435}" cy="${-h * 0.07}" r="${S * 0.011}" fill="#fff" opacity=".8"/>
      <path d="M${-w * 0.13},${h * 0.34} q${-w * 0.12},${h * 0.10} ${-w * 0.01},${h * 0.14} q${w * 0.09},${h * 0.03} ${w * 0.12},${-h * 0.05} Z" fill="${col[1]}"/>
      <path d="M${w * 0.13},${h * 0.34} q${w * 0.12},${h * 0.10} ${w * 0.01},${h * 0.14} q${-w * 0.09},${h * 0.03} ${-w * 0.12},${-h * 0.05} Z" fill="${col[1]}"/>
      <g class="antenna"><path d="M${-w * 0.08},${h * 0.30} L${-w * 0.24},${-h * 0.26}" stroke="${col[1]}" stroke-width="${S * 0.026}" fill="none" stroke-linecap="round"/>
        <path d="M${-w * 0.24},${-h * 0.26} q${-w * 0.10},${-h * 0.14} ${-w * 0.17},${-h * 0.22}" stroke="${col[1]}" stroke-width="${S * 0.03}" fill="none" stroke-linecap="round"/>
        <circle cx="${-w * 0.42}" cy="${-h * 0.50}" r="${S * 0.016}" fill="${col[1]}"/></g>
      <g class="antenna"><path d="M${w * 0.08},${h * 0.30} L${w * 0.24},${-h * 0.26}" stroke="${col[1]}" stroke-width="${S * 0.026}" fill="none" stroke-linecap="round"/>
        <path d="M${w * 0.24},${-h * 0.26} q${w * 0.10},${-h * 0.14} ${w * 0.17},${-h * 0.22}" stroke="${col[1]}" stroke-width="${S * 0.03}" fill="none" stroke-linecap="round"/>
        <circle cx="${w * 0.42}" cy="${-h * 0.50}" r="${S * 0.016}" fill="${col[1]}"/></g>
    </g>`;
  }

  /* ---------------- Foto-Abzug IN der Szene ---------------- */
  function photoPrint(q, x, y, rot, s) {
    s = s || 1;
    const w = 104 * s, h = 118 * s;
    return `<g class="pol2" data-t="${q.t}" data-f="${q.f}" transform="translate(${x},${y}) rotate(${rot})" style="cursor:zoom-in">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="${PAL.paper}" filter="url(#ppsh)"/>
      <image href="assets/img/${q.f}" xlink:href="assets/img/${q.f}" x="${-w / 2 + 7 * s}" y="${-h / 2 + 7 * s}" width="${w - 14 * s}" height="${w - 14 * s}" preserveAspectRatio="xMidYMid slice"/>
      <text x="0" y="${h / 2 - 8 * s}" text-anchor="middle" font-size="${9 * s}px" fill="${PAL.mut}" font-family="ui-monospace,monospace">${X(q.lab)}</text>
      <rect x="${-14 * s}" y="${-h / 2 - 7 * s}" width="${28 * s}" height="${13 * s}" fill="#e8b04b" opacity=".55" transform="rotate(-3)"/>
      <circle class="polglow" cx="0" cy="0" r="${w * 0.72}" fill="none"/>
    </g>`;
  }

  /* Feldführer-Etikett mit Führerlinie */
  function tag(x, y, txt, s) {
    s = s || 1;
    const w = txt.length * 6.6 * s + 16 * s;
    return `<g class="ftag">
      <path d="M${x},${y} L${x},${y - 26 * s}" stroke="${PAL.mut}" stroke-width="1.6" stroke-dasharray="3 3"/>
      <rect x="${x - w / 2}" y="${y - 26 * s - 22 * s}" width="${w}" height="${22 * s}" rx="4" fill="${PAL.paper}" opacity=".95" filter="url(#ppsh)"/>
      <text x="${x}" y="${y - 26 * s - 7 * s}" text-anchor="middle" font-size="${12 * s}px" font-weight="600" fill="${PAL.ink}" font-family="'Segoe Print','Comic Sans MS',cursive">${X(txt)}</text>
    </g>`;
  }

  const wrap = (inner, w, h) => `<svg class="tsvg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${defs("pp")}${inner}</svg>`;
  const opt = (sid, d, inner) => `<g class="opt" data-s="${sid}" style="--d:${d}s">${inner}
      <ellipse class="ringc" fill="none"/></g>`;

  /* ================= Tableaus je Station ================= */
  const T = {
    c_nest() {
      const P = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 };
      return wrap(`
        ${opt("eichel", 0.15, `<g transform="translate(110,330)">
          <ellipse cx="0" cy="26" rx="52" ry="14" fill="${PAL.mid2}" opacity=".5"/>
          <path d="M-34,20 q-6,-40 22,-52 q30,-10 40,18 q6,22 -8,34 Z" fill="url(#ppbark)"/>
          <path d="M-30,-24 q26,-20 56,-2 q-26,-8 -56,2 Z" fill="${PAL.bark2}"/>
          <circle cx="6" cy="6" r="7" fill="#241708"/>
          <g transform="translate(30,14) scale(.5)">${fieldAnt(P, { len: 60, col: "braun" })}</g>
          <g transform="translate(-46,20) scale(.44)">${fieldAnt(P, { len: 60, col: "braun" })}</g>
          ${tag(0, 100, "Eichel & Rinde")}</g>`)}
        ${opt("baum", 0.3, `<g transform="translate(300,300)">
          <path d="M-40,60 C-46,-10 -30,-70 -34,-110 L34,-110 C30,-60 44,-6 40,60 Z" fill="url(#ppbark)"/>
          <path d="M-18,-30 q16,-22 34,-4 q-6,26 -22,26 q-12,0 -12,-22 Z" fill="#241708"/>
          <g transform="translate(-6,-14) scale(.42)">${fieldAnt(P, { len: 60, col: "braun" })}</g>
          <path d="M-40,20 q-14,6 -22,20 M40,26 q16,4 24,18" stroke="${PAL.mid2}" stroke-width="5" fill="none" stroke-linecap="round"/>
          ${tag(0, 116, "Baumhöhle & Borke")}</g>`)}
        ${opt("stein", 0.45, `<g transform="translate(480,330)">
          <path d="M-52,26 q-10,-44 30,-52 q44,-8 52,30 q4,20 -14,24 Z" fill="#8d8577"/>
          <path d="M-40,-16 q22,-16 52,-6" stroke="#a49a88" stroke-width="5" fill="none"/>
          <path d="M-20,24 q10,-10 26,-8 q14,2 18,10 Z" fill="#241708"/>
          <g transform="translate(2,16) scale(.44)">${fieldAnt(P, { len: 60, col: "braun" })}</g>
          ${tag(0, 100, "unter Steinen")}</g>`)}
        ${opt("streu", 0.6, `<g transform="translate(650,330)">
          <path d="M-56,26 q10,-18 30,-14 q8,-16 28,-10 q16,-12 30,4 q16,0 20,20 Z" fill="${PAL.mid2}"/>
          <path d="M-40,10 q14,-24 34,-16 M-6,2 q12,-20 30,-12" stroke="${PAL.grass}" stroke-width="4" fill="none"/>
          <ellipse cx="-16" cy="18" rx="14" ry="6" fill="#c9b283"/><ellipse cx="12" cy="22" rx="12" ry="5" fill="#d8c294"/>
          <g transform="translate(-4,8) scale(.42)">${fieldAnt(P, { len: 60, col: "braun" })}</g>
          ${tag(0, 100, "Streu & Moos")}</g>`)}
        ${opt("parasit", 0.75, `<g transform="translate(820,310)">
          <path d="M-58,50 q10,-46 58,-50 q50,-4 60,50 Z" fill="#6b4a2f"/>
          <path d="M-40,26 q18,-10 36,0 M-24,6 q16,-8 32,0 M-8,-12 q12,-6 24,0" stroke="#4f3521" stroke-width="4" fill="none"/>
          <g transform="translate(-30,10) scale(.9)">${fieldAnt({ spineAngle: 30, spineLen: 0.3, nodeAngle: 100, nodeHeight: 0.4 }, { len: 64, col: "schwarz" })}</g>
          <g transform="translate(14,26) scale(.34)">${fieldAnt(P, { len: 60, col: "gelb", shine: true })}</g>
          ${tag(0, 116, "Gast im fremden Nest")}</g>`)}`, 940, 460);
    },
    c_behavior() {
      const P = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 };
      return wrap(`
        ${opt("tandem", 0.15, `<g transform="translate(120,330)"><g class="walkpair">
          <g transform="scale(.62)">${fieldAnt(P, { len: 110, col: "braun" })}</g>
          <g transform="translate(-78,0) scale(.62)">${fieldAnt(P, { len: 110, col: "braun" })}</g>
          <path d="M-6,-8 L-16,-8" stroke="${PAL.accent}" stroke-width="2.6" stroke-dasharray="2 3"/></g>
          ${tag(0, 96, "Tandemlauf beim Umzug")}</g>`)}
        ${opt("ruhig", 0.32, `<g transform="translate(320,332)">
          <g class="curlant" transform="scale(.62)">${fieldAnt(Object.assign({}, P, {}), { len: 110, col: "braun", curl: true })}</g>
          <path d="M28,-26 q14,-10 8,-24 q-6,-10 -16,-6" stroke="${PAL.accent}" stroke-width="2.4" fill="none" stroke-dasharray="3 3"/>
          ${tag(0, 96, "vorsichtig, rollt sich ein")}</g>`)}
        ${opt("aggressiv", 0.48, `<g transform="translate(500,330)">
          <g transform="scale(.62) rotate(-6)">${fieldAnt(P, { len: 110, col: "braun", sting: true })}</g>
          <path class="stingflash" d="M64,-40 l16,-12 M68,-30 l18,-4" stroke="${PAL.ring}" stroke-width="3" stroke-linecap="round"/>
          ${tag(0, 96, "flink & wehrhaft (Stich)")}</g>`)}
        ${opt("gast", 0.64, `<g transform="translate(680,318)">
          <g transform="scale(1.5)">${fieldAnt({ spineAngle: 32, spineLen: 0.32, nodeAngle: 102, nodeHeight: 0.42 }, { len: 90, col: "schwarz" })}</g>
          <g class="scurry" transform="translate(30,26) scale(.3)">${fieldAnt(P, { len: 60, col: "gelb", shine: true })}</g>
          ${tag(0, 110, "Glanzläufer bei Waldameisen")}</g>`)}
        ${opt("raid", 0.8, `<g transform="translate(860,326)">
          <g transform="scale(.66)">${fieldAnt({ spineAngle: 34, spineLen: 0.3, nodeAngle: 104, nodeHeight: 0.4 }, { len: 110, col: "braun" })}</g>
          <ellipse cx="-6" cy="-40" rx="12" ry="8" fill="#f4ede1" stroke="#c9b283" stroke-width="1.6"/>
          ${tag(0, 98, "trägt fremde Brut weg")}</g>`)}`, 960, 460);
    },
    c_size() {
      const P = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 };
      const pair = (x, objScale, antLen, obj, label) => `<g transform="translate(${x},340)">
          <g transform="scale(${objScale})">${obj}</g>
          <g transform="translate(${objScale * 40},${objScale * 8}) scale(${antLen / 110})">${fieldAnt(P, { len: 110, col: "braun" })}</g>
          ${tag(0, 100, label)}</g>`;
      return wrap(`
        ${opt("s1", 0.15, pair(110, 0.5, 26, `<ellipse cx="0" cy="0" rx="16" ry="12" fill="#c9b283"/><ellipse cx="-4" cy="-3" rx="6" ry="4" fill="#e0cfa8"/>`, "< 2,2 mm"))}
        ${opt("s2", 0.35, pair(300, 0.8, 44, `<ellipse cx="0" cy="0" rx="26" ry="11" fill="#f0e6d0" stroke="#c9b283" stroke-width="2"/><path d="M-20,0 q20,-6 40,0" stroke="#c9b283" stroke-width="1.6" fill="none"/>`, "2,2–3,0 mm"))}
        ${opt("s3", 0.55, pair(510, 1.1, 62, `<circle cx="0" cy="0" r="30" fill="#c9a227"/><circle cx="0" cy="0" r="24" fill="none" stroke="#a8841c" stroke-width="2"/><text x="0" y="5" text-anchor="middle" font-size="13" fill="#7a5f10" font-family="ui-monospace,monospace">1 CENT</text>`, "3,0–4,0 mm"))}
        ${opt("s4", 0.78, pair(740, 1.3, 88, `<path d="M-26,10 q-8,-26 12,-34 q24,-8 30,14 q4,18 -12,24 Z" fill="#8a6a48"/><path d="M-18,-14 q14,-10 30,-2" stroke="#6d5233" stroke-width="3" fill="none"/>`, "> 4,0 mm"))}`, 900, 460);
    },
    c_color() {
      const P = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 };
      const leaf = `<path d="M-140,60 Q0,-40 140,60 Q0,110 -140,60 Z" fill="url(#ppleaf)"/><path d="M-120,62 Q0,10 120,62" stroke="${PAL.leaf2}" stroke-width="3" fill="none"/>`;
      const one = (sid, d, x, col, label, shine) => opt(sid, d, `<g transform="translate(${x},320)">${leaf}
          <g transform="translate(-40,26) scale(.6)">${fieldAnt(P, { len: 110, col, shine })}</g>${tag(0, 150, label)}</g>`);
      return wrap(`
        ${one("gelb", 0.12, 110, "gelb", "gelb", true)}
        ${one("gelbbraun", 0.3, 300, "gelbbraun", "gelbbraun")}
        ${one("braun", 0.48, 490, "braun", "braun")}
        ${one("schwarz", 0.66, 680, "schwarz", "schwarzbraun")}
        ${one("band", 0.84, 860, "band", "gebändert", true)}`, 960, 460);
    },
    c_sculpt() {
      const chips = { glatt: ["t_recedens", "t_recedens_head.jpg"], areoGlanz: ["t_crassispinus", "t_crassispinus_head.jpg"], areoMatt: ["t_parvulus", "t_parvulus_head.jpg"], costulae: ["t_nylanderi", "t_nylanderi_head.jpg"], rugos: ["t_saxonicus", "t_saxonicus_head.jpg"] };
      const labs = { glatt: "glatt & glänzend", areoGlanz: "fein netzig, glänzend", areoMatt: "netzig & matt", costulae: "netzig + Längsriefen", rugos: "grob runzlig" };
      const cols = { glatt: "schwarz", areoGlanz: "braun", areoMatt: "gelbbraun", costulae: "braun", rugos: "braun" };
      const Pset = { glatt: { spineAngle: 34, spineLen: 0.25, nodeAngle: 100, nodeHeight: 0.37 }, areoGlanz: { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 }, areoMatt: { spineAngle: 38, spineLen: 0.26, nodeAngle: 105, nodeHeight: 0.4 }, costulae: { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 }, rugos: { spineAngle: 34, spineLen: 0.3, nodeAngle: 104, nodeHeight: 0.4 } };
      let x = 105, out = "", d = 0.12;
      for (const sid of ["glatt", "areoGlanz", "areoMatt", "costulae", "rugos"]) {
        const col = ANT_COL[cols[sid]];
        out += opt(sid, d, `<g transform="translate(${x},308)">
          <path d="M-64,40 q64,-12 128,0 q-64,10 -128,0 Z" fill="url(#ppbark)" opacity=".85"/>
          <g transform="translate(-52,6) scale(1.02)">${fieldAnt(Pset[sid], { len: 118, col: cols[sid] })}</g>
          <g class="lupe" transform="translate(20,-104)">
            <circle r="46" fill="${col[0]}"/>
            <g clip-path="url(#ppclip)">${texFor(sid, 92, 92, 150)}</g>
            <circle r="46" fill="none" stroke="#3a2c1c" stroke-width="7"/>
            <circle r="46" fill="none" stroke="#fffdf4" stroke-width="2" opacity=".6"/>
            <path d="M32,34 L52,54" stroke="#3a2c1c" stroke-width="9" stroke-linecap="round"/>
            <path d="M-26,-26 q12,-9 26,-6" stroke="#fff" stroke-width="4.5" fill="none" opacity=".5" stroke-linecap="round"/>
          </g>
          ${photoPrint({ t: chips[sid][0], f: chips[sid][1], lab: "Belegfoto" }, 96, -18, 6, 0.58)}
          ${tag(-16, 148, labs[sid], 0.92)}</g>`);
        x += 195; d += 0.14;
      }
      return wrap(out, 1000, 460);
    },
    c_spine() {
      const set = { kurz: { p: { spineAngle: 40, spineLen: 0.16, nodeAngle: 105, nodeHeight: 0.4 }, lab: "kurz / zahnförmig", t: "l_acervorum", f: "l_acervorum_profile.jpg" },
        mittel: { p: { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 }, lab: "mittellang, zugespitzt", t: "t_crassispinus", f: "t_crassispinus_profile.jpg" },
        lang: { p: { spineAngle: 30, spineLen: 0.42, nodeAngle: 108, nodeHeight: 0.38 }, lab: "lang & zugespitzt", t: "t_affinis", f: "t_affinis_profile.jpg" } };
      let x = 170, out = "", d = 0.15;
      for (const sid of ["kurz", "mittel", "lang"]) {
        const s = set[sid];
        out += opt(sid, d, `<g transform="translate(${x},300)">
          <path d="M-124,50 q124,-16 248,0 q-124,12 -248,0 Z" fill="url(#ppbark)"/>
          <g transform="translate(-58,14) scale(1.05)">${fieldAnt(s.p, { len: 130, col: sid === "kurz" ? "braun" : "braun" })}</g>
          ${photoPrint({ t: s.t, f: s.f, lab: "Belegfoto" }, 104, 6, -5, 0.78)}
          ${tag(-30, 150, s.lab)}</g>`);
        x += 300; d += 0.2;
      }
      return wrap(out, 960, 460);
    },
    c_node() {
      const shapes = {
        schuppe: { d: "M-30,26 q30,-64 60,0 Z", lab: "rundlich-schuppig" },
        stumpf: { d: "M-42,26 L-10,-22 Q0,-30 10,-22 L42,26 Z", lab: "stumpf, breiter Rücken" },
        scharf: { d: "M-24,26 L-4,-30 Q0,-36 4,-30 L24,26 Z", lab: "scharfkantig, schmal" },
        knotig: { d: "M-34,26 q6,-40 34,-40 q28,0 34,40 Z", lab: "rundlich-knotig" } };
      let x = 130, out = "", d = 0.14;
      for (const sid of ["schuppe", "stumpf", "scharf", "knotig"]) {
        const s = shapes[sid];
        out += opt(sid, d, `<g transform="translate(${x},300)">
          <path d="M-70,60 q70,-22 140,0 q-70,20 -140,0 Z" fill="url(#ppleaf)" opacity=".9"/>
          <path d="M-70,26 L-46,26" stroke="#6b4224" stroke-width="7" stroke-linecap="round"/>
          <path d="M46,26 L74,26" stroke="#6b4224" stroke-width="7" stroke-linecap="round"/>
          <g transform="translate(0,0)" style="--ab1:#8a5a33;--ab2:#6b4224"><path d="${s.d}" fill="url(#ppbody)" filter="url(#ppsh2)"/>
            <path d="M${sid === "stumpf" ? -10 : -4},-22 Q0,${sid === "scharf" ? -36 : -30} ${sid === "stumpf" ? 10 : 4},-22" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/></g>
          ${tag(0, 136, s.lab, 0.92)}</g>`);
        x += 235; d += 0.16;
      }
      return wrap(out, 980, 460);
    },
    c_hair() {
      const P = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385 };
      const one = (sid, d, x, hair, lab) => opt(sid, d, `<g transform="translate(${x},310)">
          <circle cx="0" cy="-30" r="64" fill="url(#ppsun)" opacity=".8"/>
          <g transform="scale(.85)">${fieldAnt(P, { len: 120, col: "schwarz", hair })}</g>
          ${tag(0, 122, lab)}</g>`);
      return wrap(`
        ${one("spaerlich", 0.15, 180, "spaerlich", "keine/kaum Borsten")}
        ${one("maessig", 0.45, 490, "maessig", "mäßig behaart")}
        ${one("dicht", 0.75, 800, "dicht", "dicht & auffällig")}`, 960, 460);
    },
    c_gaster() {
      const g = (sid, d, x, inner, lab) => opt(sid, d, `<g transform="translate(${x},310)">
          <path d="M-80,54 q80,-20 160,0 q-80,20 -160,0 Z" fill="url(#ppleaf)" opacity=".9"/>
          <g transform="translate(0,-6)" style="--ab1:#4a382c;--ab2:#33251c">
            <ellipse cx="0" cy="0" rx="56" ry="40" fill="url(#ppgast)" filter="url(#ppsh2)"/>
            <path d="M-40,-14 q-8,14 0,28" stroke="#241708" stroke-width="2" fill="none" opacity=".5"/>${inner}</g>
          ${tag(0, 128, lab)}</g>`);
      return wrap(`
        ${g("einheitlich", 0.15, 180, `<ellipse cx="-16" cy="-14" rx="14" ry="8" fill="#fff" opacity=".22"/>`, "einfarbig")}
        ${g("band", 0.45, 490, `<path d="M-20,-36 q8,36 0,72 M6,-39 q8,39 0,78" stroke="#e8d8a8" stroke-width="9" fill="none" opacity=".9"/>`, "helle Binden")}
        ${g("spiegel", 0.75, 800, `<ellipse class="sweepx" cx="-10" cy="-8" rx="10" ry="22" fill="#fff" opacity=".55"/>`, "spiegelglänzend")}`, 960, 460);
    },
    c_ant() {
      const chain = (n, x) => { let s = `<path d="M${x - 60},40 q20,-52 52,-58" stroke="#6b4224" stroke-width="6" fill="none" stroke-linecap="round"/>`; let cx = x - 4, cy = -22;
        for (let i = 0; i < n; i++) { s += `<circle cx="${cx}" cy="${cy}" r="${i === n - 1 ? 10 : 7.4}" fill="#8a5a33" stroke="#5e4430" stroke-width="1.6"/><text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="9" fill="${PAL.mut}" font-family="ui-monospace,monospace">${i + 1}</text>`; cx += 13; cy += 4; } return s; };
      return wrap(`
        ${opt("a11", 0.2, `<g transform="translate(260,300)"><path d="M-120,60 q120,-26 240,0 q-120,24 -240,0 Z" fill="url(#ppleaf)" opacity=".85"/>${chain(11, -40)}${tag(0, 136, "11 Fühlerglieder")}</g>`)}
        ${opt("a12", 0.55, `<g transform="translate(680,300)"><path d="M-130,60 q130,-26 260,0 q-130,24 -260,0 Z" fill="url(#ppleaf)" opacity=".85"/>${chain(12, -46)}${tag(0, 136, "12 Fühlerglieder")}</g>`)}`, 960, 460);
    },
    ziel() {
      return wrap(`
        <g transform="translate(430,250)">
          <path d="M-8,120 L-8,-90" stroke="#6d5233" stroke-width="10" stroke-linecap="round"/>
          <path d="M-8,-90 L96,-70 L-8,-50 Z" fill="${PAL.accent}"/>
          <path d="M-26,120 L14,120" stroke="#6d5233" stroke-width="8" stroke-linecap="round"/>
          <g transform="translate(150,-30) rotate(-2)">
            <rect x="-150" y="-90" width="300" height="190" rx="8" fill="${PAL.paper}" filter="url(#ppsh)"/>
            <rect x="-150" y="-90" width="300" height="30" rx="8" fill="#e5d9bd"/>
            <text x="0" y="-70" text-anchor="middle" font-size="15" font-weight="700" fill="${PAL.ink}" font-family="'Segoe Print','Comic Sans MS',cursive">Deine Route – Feldnotiz</text>
            <g id="recapSlot"></g>
            <rect x="-30" y="-102" width="60" height="20" fill="#e8b04b" opacity=".6" transform="rotate(-2)"/>
          </g>
          ${tag(150, 130, "Ziel erreicht", 1)}</g>`, 900, 460);
    }
  };

  function tableau(cid) { return (T[cid] || T.ziel)(); }

  return { panoramaFar, panoramaMid, groundStrip, fieldAnt, headFront, photoPrint, tag, tableau, PAL };
})();

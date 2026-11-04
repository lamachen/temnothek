/* =========================================================================
   TEMNOTHEK – UI v2 (Router, Views, Interaktion)
   Workflow: Schnellpfad (geführte visuelle Fragen) → Foto-Check (eigenes
   Bild synchron gegen Belegfotos) → Lebend-Filter (alle Merkmale) →
   Ergebnis mit Ehrlichkeits-Ampel. Feld-/Labor-Modus überall.
   ========================================================================= */
"use strict";

const UI = (function () {

  /* ---------------- State ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } }
  };
  const state = Object.assign({
    region: null, habitate: [], choices: {}, theme: "dark", mode: "feld",
    onboarded: false, qpEnde: false, land: "DE", monat: new Date().getMonth()
  }, JSON.parse(store.get("temnothek_state") || "{}"));
  if (state.monat === null || state.monat === undefined || state.monat === "") state.monat = new Date().getMonth();
  function save() { store.set("temnothek_state", JSON.stringify(state)); }

  /* Sitzungs-Foto (bewusst nicht persistent – Datenschutz & Speicher) */
  let sessionFoto = { data: null, view: "profil" };

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const taxon = id => TAXA.find(t => t.id === id);
  const istLabor = () => state.mode === "labor";

  function refBild(t, view) {
    const m = { profil: /profil/i, kopf: /kopf/i, dorsal: /dorsal/i }[view];
    return (m && t.bilder.find(b => m.test(b.view))) || t.bilder[0] || null;
  }
  /* v3.1: Leitansicht Profil zuerst; Marker-Punkte ("schau hier") je Ansicht */
  const rangAnsicht = vw => /profil/i.test(vw) ? 0 : /kopf/i.test(vw) ? 1 : /dorsal/i.test(vw) ? 2 : 3;
  function mkDots(view) {
    const key = /profil/i.test(view) ? "profil" : /kopf/i.test(view) ? "kopf" : /dorsal/i.test(view) ? "dorsal" : null;
    if (!key || !FOTO_MARKS[key]) return "";
    return FOTO_MARKS[key].map(m => `<span class="mkdot" style="left:${m.x}%;top:${m.y}%" title="${esc(m.l)}"></span>`).join("");
  }

  /* ---------------- Provenanz-Popover ---------------- */
  let popEl = null;
  function provenanzPopover(anchor, bild, t) {
    closePopover();
    popEl = el("div", "popover");
    popEl.innerHTML = `
      <div class="pop-title">🛡️ Verifiziertes Belegbild</div>
      <table class="pop-table">
        <tr><td>Art</td><td><i>${esc(t.name)}</i></td></tr>
        <tr><td>Ansicht</td><td>${esc(bild.view)}</td></tr>
        <tr><td>Beleg</td><td>${esc(bild.specimen || "–")}</td></tr>
        <tr><td>Quelle</td><td><a href="${esc(bild.url)}" target="_blank" rel="noopener">${esc(bild.quelle)}</a></td></tr>
        <tr><td>Lizenz</td><td>CC-BY 4.0 (AntWeb / California Academy of Sciences)</td></tr>
        <tr><td>Prüfung</td><td>Belegketten-Check + visuelle Sichtkontrolle</td></tr>
      </table>
      <div class="pop-note">AntWeb-Bilder hängen an physischen Museumsspecimen mit Bestimmungshistorie – nicht an Community-Vermutungen.</div>`;
    document.body.appendChild(popEl);
    const r = anchor.getBoundingClientRect();
    popEl.style.top = Math.min(window.innerHeight - 260, r.bottom + 8) + "px";
    popEl.style.left = Math.max(8, Math.min(window.innerWidth - 320, r.left - 140)) + "px";
    setTimeout(() => document.addEventListener("click", outsidePop, { once: true }), 0);
  }
  function outsidePop(e) { if (popEl && !popEl.contains(e.target)) closePopover(); }
  function closePopover() { if (popEl) { popEl.remove(); popEl = null; } }

  /* ---------------- Synchron-Zoom/Pan (mit Touch-Buttons) ---------------- */
  function attachSync(boxes) {
    const st = { s: 1, x: 0, y: 0 };
    const apply = () => boxes.forEach(b => {
      const inn = b.querySelector(".syncinner"); if (inn) inn.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`;
    });
    boxes.forEach(b => {
      b.addEventListener("wheel", e => { e.preventDefault(); st.s = Math.min(8, Math.max(1, st.s * (e.deltaY < 0 ? 1.15 : 0.87))); apply(); }, { passive: false });
      let drag = null;
      b.addEventListener("pointerdown", e => { drag = { x: e.clientX - st.x, y: e.clientY - st.y }; b.setPointerCapture(e.pointerId); b.classList.add("greift"); });
      b.addEventListener("pointermove", e => { if (drag) { st.x = e.clientX - drag.x; st.y = e.clientY - drag.y; apply(); } });
      b.addEventListener("pointerup", () => { drag = null; b.classList.remove("greift"); });
      b.addEventListener("dblclick", () => { st.s = 1; st.x = 0; st.y = 0; apply(); });
    });
    const bar = el("div", "syncbtns",
      `<button data-z="1.3" title="größer">＋</button><button data-z="0.77" title="kleiner">－</button><button data-z="0" title="zurücksetzen">⟲</button>`);
    bar.addEventListener("click", e => {
      const z = e.target.dataset ? e.target.dataset.z : undefined; if (z === undefined) return;
      if (+z === 0) { st.s = 1; st.x = 0; st.y = 0; } else st.s = Math.min(8, Math.max(1, st.s * +z));
      apply();
    });
    return { bar, apply };
  }

  /* ---------------- Bausteine ---------------- */
  function statusBadge(t) {
    const map = { heimisch: ["badge-heimisch", "heimisch in DE"], moeglich: ["badge-moeglich", "in DE möglich"],
      unwahrscheinlich: ["badge-unw", "unwahrscheinlich"], fremd: ["badge-fremd", "nicht in DE"] };
    const [c, l] = map[t.statusDE] || ["", t.statusDE];
    return `<span class="badge ${c}">${l}</span>`;
  }

  function stateChip(c, sid, an) {
    const pl = (c.plain || {})[sid] || { titel: c.states[sid], text: "" };
    return `<button class="chip vis ${an ? "an" : ""}" data-c="${c.id}" data-s="${sid}" title="${esc(pl.text || c.states[sid])} – Fachbegriff: ${esc(c.states[sid])}">
      ${Morph.stateVis(c.id, sid)}<span>${esc(pl.titel)}</span><em class="fach">${esc(c.states[sid])}</em></button>`;
  }

  function artKarte(t, score) {
    /* v3.1: Leitansicht = Profil, damit ALLE Karten vergleichbar orientiert sind */
    const b = refBild(t, "profil") || t.bilder[0];
    const k = el("div", "artkarte");
    k.innerHTML = `
      <div class="artkarte-bild">
        ${b ? `<img src="assets/img/${b.file}" alt="${esc(t.name)}, ${esc(b.view)}" loading="lazy">` : `<div class="keinbild">kein Belegbild<br>in v1</div>`}
        ${b ? `<button class="shield" title="Bild-Provenienz anzeigen">🛡️</button>` : ""}
      </div>
      <div class="artkarte-body">
        <div class="artkarte-name"><i>${esc(t.name)}</i> <span class="autor">${esc(t.autor)}</span></div>
        <div class="artkarte-deutsch">${esc(t.deutsch)}</div>
        <div class="badges">${statusBadge(t)}${t.kryptisch ? `<span class="badge badge-krypt">kryptisch</span>` : ""}</div>
        ${score !== undefined ? `<div class="scorebar"><div style="width:${Math.min(100, score * 100).toFixed(1)}%"></div></div>
          <div class="scoretxt">${(score * 100).toFixed(1)} % Übereinstimmung</div>` : ""}
      </div>`;
    k.querySelector(".artkarte-bild").addEventListener("click", () => location.hash = "#/art/" + t.id);
    const sh = k.querySelector(".shield");
    if (sh && b) sh.addEventListener("click", e => { e.stopPropagation(); provenanzPopover(sh, b, t); });
    return k;
  }

  /* ================= View: REISE (visuelle Führung) ================= */
  let reise = null;
  function resetReise() { reise = { antworten: {}, reihenfolge: [], skip: {} }; }
  const REISE_FRAGE = {
    c_nest:     ["Wo hast du die Ameisen gesehen?", "Der Fundort grenzt sofort ein: Tippe die Szene, die deiner Beobachtung am nächsten kommt."],
    c_behavior: ["Ist dir eine auffällige Szene oder ein Verhalten aufgefallen?", "Verhalten ist oft einzigartig – Tandemlaufen z. B. verrät Knotenameisen fast sofort."],
    c_size:     ["Wie groß ist ein einzelnes Tier – im Vergleich zu Alltagsdingen?", "Größe trennt Gattungen: Myrmica & Co. sind deutlich kräftiger."],
    c_color:    ["Welchen Farb-Eindruck bekommst du bei Tageslicht?", "Die Grundstimmung hilft – Bänderung und Glanz kommen gleich danach."],
    c_sculpt:   ["Wie wirkt die Kopf-Oberfläche im guten Licht (Makro/Handy-Zoom)?", "Das Muster auf dem Kopf ist eines der stärksten Merkmale überhaupt."],
    c_spine:    ["Was ragt am Hinterrücken heraus – die „Rückendornen“?", "Dornenlänge und -form trennen Arten und Gattungen."],
    c_node:     ["Welche Form hat der kleine Buckel an der „Taille“ (von der Seite)?", "Der Stielchen-Knoten ist der Namensgeber der Knotenameisen."],
    c_hair:     ["Siehst du abstehende Borsten auf Rücken und Hinterleib?", "Manche Arten wirken deutlich „fransiger“ als andere."],
    c_gaster:   ["Wie sieht der Hinterleib aus?", "Binden oder Spiegelglanz sind schnelle Ausschluss-Kriterien."],
    c_ant:      ["Nur für Makro-Profis: Wie viele Fühlerglieder zählst du?", "Letzter Feinschliff – gerne überspringen, wenn nicht zählbar."]
  };

  let reiseCleanup = null;
  function viewReise() {
    if (!reise) resetReise();
    if (reiseCleanup) { reiseCleanup(); reiseCleanup = null; }
    const v = el("div", "view reiseview");
    v.innerHTML = `<div class="reise-bg" aria-hidden="true"></div>
      <div class="kamera pan" id="kamera">
        <div class="plyr" id="plyrF"></div>
        <div class="plyr" id="plyrM"></div>
        <div class="board" id="board"></div>
        <div class="kamera-hud" id="khud"></div>
        <div class="wb-tools">
          <button class="btn winzig" id="zurueck">← zurück</button>
          <button class="btn winzig" id="skip">weiß ich nicht ⏭</button>
          <button class="btn winzig" id="experte">🎛️ Filter</button>
        </div>
      </div>
      <div id="stepwrap"></div>`;
    const wrap = v.querySelector("#stepwrap");
    const kamera = v.querySelector("#kamera");
    const board = v.querySelector("#board");
    const plyF = v.querySelector("#plyrF"), plyM = v.querySelector("#plyrM");
    plyF.innerHTML = Scenes.panoramaFar();
    plyM.innerHTML = Scenes.panoramaMid();

    /* Geometrie (Pfadpunkte) aus dem Board-Modul, Landschaft aus der Szenen-Welt */
    const B = Visuals.boardSVG(REISEN_FOLGE.map((cid, i) => ({ cid, nr: i + 1, label: cid })));
    board.style.width = B.W + "px";
    board.style.height = B.H + "px";
    board.innerHTML = Scenes.groundStrip(B.W) +
      `<svg class="trailsvg" viewBox="0 0 ${B.W} ${B.H}" width="${B.W}" height="${B.H}" style="position:absolute;inset:0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path id="trailguide" d="${B.d}" fill="none"/>
        <path id="trail" d="${B.d}" pathLength="100" fill="none"/>
      </svg>` +
      REISEN_FOLGE.map((cid, i) => {
        const p = B.pts[i + 1];
        return `<div class="tstation" id="wst${i}" style="left:${p.x}px;top:${(p.y - 221).toFixed(1)}px">${Scenes.tableau(cid)}</div>`;
      }).join("") +
      `<div class="tstation ziel" id="wst10" style="left:${B.pts[11].x}px;top:${(B.pts[11].y - 221).toFixed(1)}px">${Scenes.tableau("ziel")}</div>`;
    const trail = board.querySelector("#trail");
    const wst = i => board.querySelector("#wst" + i);
    let curIdx = 0, lock = false;

    /* Kameraflug mit Parallax: Ferne/Mitte reisen langsamer als die Vordergrund-Ebene */
    const LAYERS = [[plyF, 0.42, 0.94, -0.10], [plyM, 0.7, 0.97, -0.02]];
    function camera(i, sofort) {
      curIdx = i;
      const cid = i < REISEN_FOLGE.length ? REISEN_FOLGE[i] : "ziel";
      const z = Visuals.STATION_ZOOM[cid] || 1.05;
      const p = B.pts[i + 1] || B.pts[B.pts.length - 1];
      const kw = kamera.clientWidth || 640, kh = kamera.clientHeight || 460;
      const setT = (elm, tr) => {
        if (sofort) elm.style.transition = "none";
        elm.style.transform = tr;
        if (sofort) requestAnimationFrame(() => { elm.style.transition = ""; });
      };
      setT(board, `translate(${(kw / 2 - z * p.x).toFixed(1)}px, ${(kh / 2 - z * (p.y + 40)).toFixed(1)}px) scale(${z})`);
      for (const [elm, f, zf, off] of LAYERS)
        setT(elm, `translate(${(kw / 2 - zf * p.x * f).toFixed(1)}px, ${(kh / 2 - zf * p.y * f + kh * off).toFixed(1)}px) scale(${zf})`);
      /* Ameisen-Pfad (Trittspuren) zeichnet sich vor die Kamera */
      trail.style.strokeDashoffset = String(100 - 100 * ((i + 1) / (B.pts.length - 1)));
      const ch = CHARAKTERE.find(x => x.id === cid);
      v.querySelector("#khud").innerHTML = cid === "ziel"
        ? `🏁 <b>Ziel</b> · deine Route ist vollständig`
        : `🧭 Szene <b>${i + 1}/${REISEN_FOLGE.length}</b> · ${esc(ch ? ch.label : "")}`;
    }

    function fillRecap() {
      const slot = board.querySelector("#recapSlot");
      if (!slot || slot.dataset.fill) return;
      slot.dataset.fill = "1";
      slot.innerHTML = `<svg x="-132" y="-52" width="264" height="118" viewBox="0 0 ${B.W} ${B.H}">
        <path d="${B.d}" fill="none" stroke="${Scenes.PAL.accent}" stroke-width="16" stroke-linecap="round" opacity=".85"/>
        ${REISEN_FOLGE.map((cid, j) => {
          const q = B.pts[j + 1];
          const ant = reise.antworten[cid], skp = reise.skip[cid];
          return `<circle cx="${q.x}" cy="${q.y.toFixed(1)}" r="30" fill="${ant ? Scenes.PAL.leaf2 : skp ? "#9a938a" : "#fff"}" stroke="${Scenes.PAL.accent}" stroke-width="9"/>
            <text x="${q.x}" y="${(+q.y + 11).toFixed(1)}" text-anchor="middle" font-size="34" fill="#fff" font-family="ui-monospace,monospace">${j + 1}</text>`;
        }).join("")}
      </svg>`;
    }

    function syncBoard(i) {
      for (let j = 0; j <= REISEN_FOLGE.length; j++) {
        const cid = REISEN_FOLGE[j];
        const ant = cid ? reise.antworten[cid] : null;
        const skp = cid ? reise.skip[cid] : null;
        const w = wst(j);
        w.classList.toggle("live", j <= i);
        w.classList.toggle("done", !!ant);
        w.classList.toggle("skippen", !!skp && !ant);
        if (!ant) {
          w.classList.remove("settled");
          w.querySelectorAll(".opt").forEach(n => n.classList.remove("chosen", "dim"));
        }
      }
      if (i >= REISEN_FOLGE.length) fillRecap();
    }
    const onRs = () => camera(curIdx, true);
    window.addEventListener("resize", onRs);
    reiseCleanup = () => window.removeEventListener("resize", onRs);

    const ctxR = () => ({ land: state.land || "DE", monat: state.monat, habitate: [], choices: reise.antworten });
    const ranking = () => Engine.bewerte(ctxR());
    const naechster = () => REISEN_FOLGE.find(c => !reise.antworten[c] && !reise.skip[c]) || null;

    function weiter() {
      const r = ranking();
      const amp = Engine.ampel(r, ctxR());
      if ((amp.stufe === "gruen" || r[0].anteil >= 0.55) && reise.reihenfolge.length >= 2) return renderErgebnis(false);
      const nx = naechster();
      if (!nx) return renderErgebnis(true);
      const idx = REISEN_FOLGE.indexOf(nx);
      syncBoard(idx);
      camera(idx);
    }

    /* Antwort = Akteur/Objekt IN der Szene antippen: handgezeichneter Ring
      legt sich darum, Uebrige treten zurueck, Kamera fliegt weiter.
      Foto-Abzaege (pol2) oeffnen stattdessen die Provenanz. */
    board.addEventListener("click", e => {
      const pol = e.target.closest(".pol2");
      if (pol) {
        e.stopPropagation(); e.preventDefault();
        const t = taxon(pol.dataset.t);
        const b = t && t.bilder.find(x => x.file === pol.dataset.f);
        if (b) provenanzPopover(pol, b, t);
        return;
      }
      const o = e.target.closest(".opt");
      if (!o || lock) return;
      const w = o.closest(".tstation");
      if (!w.classList.contains("live") || w.classList.contains("settled")) return;
      lock = true;
      const i = +w.id.slice(3);
      const cid = REISEN_FOLGE[i];
      let bb;
      try { bb = o.getBBox(); } catch (err) { bb = { x: -90, y: -90, width: 180, height: 180 }; }
      const rc = o.querySelector(".ringc");
      rc.setAttribute("cx", (bb.x + bb.width / 2).toFixed(1));
      rc.setAttribute("cy", (bb.y + bb.height / 2).toFixed(1));
      rc.setAttribute("rx", (bb.width / 2 + 12).toFixed(1));
      rc.setAttribute("ry", (bb.height / 2 + 12).toFixed(1));
      o.classList.add("chosen");
      w.classList.add("settled");
      w.querySelectorAll(".opt").forEach(n => { if (n !== o) n.classList.add("dim"); });
      setTimeout(() => {
        lock = false;
        reise.antworten[cid] = o.dataset.s;
        if (!reise.reihenfolge.includes(cid)) reise.reihenfolge.push(cid);
        weiter();
      }, 480);
    });

    v.querySelector("#zurueck").addEventListener("click", () => {
      if (lock) return;
      const last = reise.reihenfolge.pop();
      if (last) delete reise.antworten[last];
      else { const l = REISEN_FOLGE.filter(c => reise.skip[c]).pop(); if (l) delete reise.skip[l]; }
      const nx = naechster();
      const idx = nx ? REISEN_FOLGE.indexOf(nx) : 0;
      wrap.innerHTML = "";
      syncBoard(idx);
      camera(idx);
    });
    v.querySelector("#skip").addEventListener("click", () => {
      if (lock) return;
      const cid = REISEN_FOLGE[curIdx];
      if (cid && !reise.antworten[cid]) reise.skip[cid] = true;
      weiter();
    });
    v.querySelector("#experte").addEventListener("click", () => {
      state.choices = Object.assign({}, reise.antworten); save(); location.hash = "#/filter"; render();
    });

    function renderErgebnis(complete) {
      const r = ranking();
      const amp = Engine.ampel(r, ctxR());
      const top = r.filter(x => x.score > 0).slice(0, 3);
      const anteil = top[0] ? top[0].anteil : 0;
      const umfang = 2 * Math.PI * 52;
      wrap.innerHTML = `
        <section class="step glass ergebnis-step">
          <div class="ringwrap">
            <svg class="ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" opacity=".15" stroke-width="8"/>
              <circle id="ringfg" cx="60" cy="60" r="52" fill="none" stroke="${amp.stufe === "gruen" ? "#7fb069" : amp.stufe === "gelb" ? "#e0a458" : "#c1553f"}" stroke-width="8" stroke-linecap="round"
                stroke-dasharray="${umfang}" stroke-dashoffset="${umfang}" transform="rotate(-90 60 60)"/>
            </svg>
            <div class="ringtxt"><b>${Math.round(anteil * 100)}%</b><span>Stimmigkeit</span></div>
          </div>
          <h2>${complete ? "Deine Reise endet hier – vorläufig:" : "Das passt zu deiner Beobachtung:"}</h2>
          <div class="ampel ampel-${amp.stufe}"><span class="licht"></span><div>${esc(amp.text)}</div></div>
          <div class="ranking">${top.map(x => { const k = artKarte(x.taxon, x.anteil); return k.outerHTML; }).join("")}</div>
          <div class="herleitung-chips">${reise.reihenfolge.map(cid => {
            const c = CHARAKTERE.find(x => x.id === cid);
            const pl = (c.plain || {})[reise.antworten[cid]] || {};
            return `<span class="chip kleinstatic">${c.icon} ${esc(pl.titel || reise.antworten[cid])}</span>`;
          }).join("")}</div>
          <div class="row">
            ${top.length >= 2 ? `<button class="btn" id="rduell">⚔️ Duell: Top 2</button>` : ""}
            ${top.length ? `<button class="btn" id="rdossier">📖 Dossier</button>` : ""}
            ${amp.stufe === "gruen" ? `<button class="btn" id="rjournal">📓 Ins Journal</button>` : ""}
            <button class="btn winzig" id="rneu">🧭 Neue Reise</button>
            <button class="btn winzig" id="rexperte">🎛️ Experten-Filter</button>
          </div>
        </section>`;
      /* Karten-Events (outerHTML verloren) -> neu anbinden */
      wrap.querySelectorAll(".ranking .artkarte").forEach((k, i) => {
        k.querySelector(".artkarte-bild").addEventListener("click", () => location.hash = "#/art/" + top[i].taxon.id);
        const sh = k.querySelector(".shield");
        if (sh) sh.addEventListener("click", e => { e.stopPropagation(); const b = top[i].taxon.bilder[0]; if (b) provenanzPopover(sh, b, top[i].taxon); });
      });
      const rd = wrap.querySelector("#rduell");
      if (rd) rd.addEventListener("click", () => {
        const d = DUELLE.findIndex(d => (d.a === top[0].taxon.id && d.b === top[1].taxon.id) || (d.b === top[0].taxon.id && d.a === top[1].taxon.id));
        location.hash = "#/duell/" + (d >= 0 ? d : 0); render();
      });
      const rdo = wrap.querySelector("#rdossier");
      if (rdo) rdo.addEventListener("click", () => { location.hash = "#/art/" + top[0].taxon.id; render(); });
      const rj = wrap.querySelector("#rjournal");
      if (rj) rj.addEventListener("click", async () => {
        if (!("indexedDB" in window)) return alert("Journal benötigt IndexedDB.");
        const db = await openDB();
        const herl = reise.reihenfolge.map(cid => { const c = CHARAKTERE.find(x => x.id === cid); return `${c.label}: ${(c.plain || {})[reise.antworten[cid]]?.titel || reise.antworten[cid]}`; }).join(" · ");
        await putObs(db, { id: Date.now(), datum: new Date().toISOString().slice(0, 10), ort: "", art: top[0].taxon.name,
          sicher: amp.stufe === "gruen" ? "grün – stimmig" : amp.stufe === "gelb" ? "gelb – wahrscheinlich" : "rot – kryptisch/offen",
          herleitung: `Visuelle Reise · ${herl}`, notiz: "", foto: sessionFoto.data });
        location.hash = "#/journal"; render();
      });
      wrap.querySelector("#rneu").addEventListener("click", () => {
        resetReise();
        const rc = board.querySelector("#recapSlot"); if (rc) { rc.innerHTML = ""; delete rc.dataset.fill; }
        wrap.innerHTML = ""; syncBoard(0); camera(0);
      });
      wrap.querySelector("#rexperte").addEventListener("click", () => { state.choices = Object.assign({}, reise.antworten); save(); location.hash = "#/filter"; render(); });
      /* Ring-Animation */
      syncBoard(REISEN_FOLGE.length);
      camera(REISEN_FOLGE.length);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const fg = wrap.querySelector("#ringfg");
        if (fg) { fg.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)"; fg.style.strokeDashoffset = String(umfang * (1 - Math.min(1, anteil))); }
      }));
    }

    syncBoard(0);
    camera(0, true);
    return v;
  }

  /* ================= View: BESTIMMEN ================= */
  function viewBestimmen() {
    const v = el("div", "view");
    v.innerHTML = `
      <section class="hero">
        <h1>Was beobachtest du gerade?</h1>
        <p class="lead">Der <b>Schnellpfad</b> stellt dir nur die jeweils trennschärfsten Fragen –
        als Bildkarten, nicht als Fachchinesisch. Optional: eigenes Foto im <b>Foto-Check</b> direkt
        gegen Museums-Belegfotos vergleichen. Alles darunter: der freie Lebend-Filter.</p>
      </section>
      <section class="panel kontextkompakt">
        <div class="row">
          <label>Land
            <select id="land">
              ${Object.entries(LAENDER).map(([k, l]) => `<option value="${k}">${esc(l.label)}</option>`).join("")}
            </select>
          </label>
          <label>Monat
            <select id="monat">
              <option value="">– egal –</option>
              ${MONATE.map((m, i) => `<option value="${i}">${m}</option>`).join("")}
            </select>
          </label>
          <label id="regwrap">Region
            <select id="region">
              <option value="">– unbekannt –</option>
              ${Object.entries(BUNDESLAENDER).map(([k]) => `<option value="${k}">${k}</option>`).join("")}
            </select>
          </label>
          <div class="chips" id="habchips">
            ${Object.entries(HABITATE).map(([id, h]) => `<button class="chip ${state.habitate.includes(id) ? "an" : ""}" data-h="${id}">${h.icon} ${esc(h.label)}</button>`).join("")}
          </div>
        </div>
      </section>
      <section class="panel" id="qp"></section>
      <section class="panel" id="fotocheck">
        <h2>📷 Foto-Check <span class="hint">– dein Bild vs. Belegfoto, synchron zoombar</span></h2>
        <div id="fotoinner"></div>
      </section>
      <details class="panel details" id="allemerkmale">
        <summary>🎛️ Alle Merkmale auf einmal (freier Lebend-Filter)</summary>
        <div id="chars"></div>
      </details>
      <section class="panel" id="ergebnis">
        <div class="row spacebetween">
          <h2>Ergebnis</h2>
          <button class="btn winzig" id="resetall">♻️ neu starten</button>
        </div>
        <div id="ampelbox"></div>
        <div id="ranking" class="ranking"></div>
      </section>`;

    const ctx = () => ({
      land: state.land || "DE",
      monat: state.monat,
      region: state.land === "DE" && state.region ? BUNDESLAENDER[state.region] || state.region : null,
      habitate: state.habitate, choices: state.choices
    });

    /* ---- Kontext ---- */
    const sel = v.querySelector("#region");
    sel.value = state.region || "";
    sel.addEventListener("change", () => { state.region = sel.value || null; save(); update(); });
    const landSel = v.querySelector("#land"), monatSel = v.querySelector("#monat");
    landSel.value = state.land || "DE";
    monatSel.value = state.monat === null || state.monat === "" ? "" : String(state.monat);
    function regSichtbar() { v.querySelector("#regwrap").style.display = (state.land || "DE") === "DE" ? "" : "none"; }
    regSichtbar();
    landSel.addEventListener("change", () => { state.land = landSel.value; if (state.land !== "DE") state.region = null, sel.value = ""; save(); regSichtbar(); update(); });
    monatSel.addEventListener("change", () => { state.monat = monatSel.value === "" ? null : +monatSel.value; save(); update(); });
    v.querySelector("#habchips").addEventListener("click", e => {
      const ch = e.target.closest(".chip"); if (!ch) return;
      const id = ch.dataset.h;
      state.habitate = state.habitate.includes(id) ? state.habitate.filter(x => x !== id) : [...state.habitate, id];
      save(); update();
    });

    /* ---- Schnellpfad ---- */
    v.querySelector("#qp").addEventListener("click", e => {
      if (e.target.closest("#qpende")) { state.qpEnde = true; save(); update(); return; }
      if (e.target.closest("#qprestart")) { state.qpEnde = false; state.choices = {}; save(); update(); return; }
      const b = e.target.closest(".chip.vis"); if (!b) return;
      const { c, s } = b.dataset;
      state.choices[c] = s; state.qpEnde = false; save(); update();
    });

    /* ---- Foto-Check ---- */
    const fi = v.querySelector("#fotoinner");
    function renderFoto() {
      if (!sessionFoto.data) {
        fi.innerHTML = `<div class="dropzone" id="drop">
          <div>📷 <b>Foto hier ablegen</b> oder tippen<br><span class="hint">Makro/Seitenansicht funktioniert am besten · bleibt nur in dieser Sitzung</span></div>
          <input type="file" id="finput" accept="image/*" hidden></div>`;
        const dz = fi.querySelector("#drop"), inp = fi.querySelector("#finput");
        dz.addEventListener("click", () => inp.click());
        dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("hover"); });
        dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
        dz.addEventListener("drop", e => { e.preventDefault(); dz.classList.remove("hover"); if (e.dataTransfer.files[0]) lade(e.dataTransfer.files[0]); });
        inp.addEventListener("change", e => { if (e.target.files[0]) lade(e.target.files[0]); });
        return;
      }
      const ranking = Engine.bewerte(ctx()).filter(r => r.score > 0).slice(0, 8);
      if (sessionFoto.refId && !ranking.some(r => r.taxon.id === sessionFoto.refId)) sessionFoto.refId = null;
      fi.innerHTML = `
        <div class="chips" id="viewchips">
          ${["profil", "kopf", "dorsal"].map(vw => `<button class="chip ${sessionFoto.view === vw ? "an" : ""}" data-v="${vw}">${vw === "profil" ? "Seitenansicht" : vw === "kopf" ? "Kopf frontal" : "Dorsal"}</button>`).join("")}
          <button class="btn winzig" id="fotoweg">✕ Foto entfernen</button>
        </div>
        <div class="row"><label>Vergleich mit
          <select id="refsel">${ranking.map(r => `<option value="${r.taxon.id}">${esc(r.taxon.name)}</option>`).join("")}</select></label>
          <span class="hint">Zoom/Pan & Buttons wirken auf beide Bilder gleichzeitig · Doppelklick = Reset</span></div>
        <div class="duell-grid">
          <div class="syncbox fotobox"><div class="syncinner"><img src="${sessionFoto.data}" alt="Dein Foto"></div></div>
          <div class="syncbox fotobox" id="refbox"><div class="syncinner"></div></div>
        </div>
        <div id="syncbar"></div>`;
      const boxes = [...fi.querySelectorAll(".syncbox")];
      const sync = attachSync(boxes);
      fi.querySelector("#syncbar").appendChild(sync.bar);
      function setRef(id) {
        const t = taxon(id); const b = refBild(t, sessionFoto.view);
        const rb = fi.querySelector("#refbox .syncinner");
        rb.innerHTML = b ? `<img src="assets/img/${b.file}" alt="${esc(t.name)}"><button class="shield" title="Provenienz">🛡️</button>`
          : Morph.profilSVG(t.morphParams, { uid: "ref" + id });
        const sh = rb.querySelector(".shield");
        if (sh && b) sh.addEventListener("click", e => { e.stopPropagation(); provenanzPopover(sh, b, t); });
        const cap = fi.querySelector("#refcap"); if (cap) cap.remove();
        const c = el("div", "hint refcap", b ? `Referenz: ${esc(t.name)} · ${esc(b.view)} · ${esc(b.specimen || "")}` : `Referenz: ${esc(t.name)} · Zeichnung (kein Belegbild dieser Ansicht)`);
        fi.querySelector("#refbox").appendChild(c);
      }
      const selR = fi.querySelector("#refsel");
      const initial = sessionFoto.refId || (ranking[0] ? ranking[0].taxon.id : TAXA[0].id);
      selR.value = initial;
      setRef(initial);
      selR.addEventListener("change", e => { sessionFoto.refId = e.target.value; setRef(e.target.value); });
      fi.querySelectorAll("#viewchips .chip").forEach(ch => ch.addEventListener("click", () => {
        sessionFoto.view = ch.dataset.v; renderFoto();
      }));
      fi.querySelector("#fotoweg").addEventListener("click", () => { sessionFoto = { data: null, view: "profil" }; renderFoto(); update(); });
    }
    function lade(f) {
      const r = new FileReader();
      r.onload = () => { sessionFoto.data = r.result; renderFoto(); };
      r.readAsDataURL(f);
    }
    renderFoto();

    /* ---- Freier Filter ---- */
    v.querySelector("#chars").addEventListener("click", e => {
      const rs = e.target.closest(".mini-reset");
      if (rs) { delete state.choices[rs.dataset.c]; save(); update(); return; }
      const ch = e.target.closest(".chip.vis"); if (!ch) return;
      const { c, s } = ch.dataset;
      if (state.choices[c] === s) delete state.choices[c]; else state.choices[c] = s;
      save(); update();
    });

    v.querySelector("#resetall").addEventListener("click", () => {
      state.choices = {}; state.habitate = []; state.region = null; state.qpEnde = false;
      state.land = "DE"; state.monat = new Date().getMonth();
      save(); sel.value = ""; landSel.value = "DE"; monatSel.value = String(state.monat); regSichtbar();
      v.querySelectorAll("#habchips .chip").forEach(x => x.classList.remove("an")); update();
    });

    /* ---- Ergebnis-ins-Journal ---- */
    v.addEventListener("click", e => {
      if (!e.target.closest("#jquick")) return;
      const top = Engine.bewerte(ctx())[0];
      if (!("indexedDB" in window)) { alert("Journal benötigt IndexedDB – hier nicht verfügbar."); return; }
      const herleitung = Object.entries(c.choices).map(([cid, sid]) => {
        const ch2 = CHARAKTERE.find(x => x.id === cid);
        return `${ch2.label}: ${ch2.states[sid]}`;
      }).join(" · ") || "nur Fundkontext";
      openDB().then(db => putObs(db, { id: Date.now(), datum: new Date().toISOString().slice(0, 10),
        ort: "", art: top.taxon.name, sicher: "grün – stimmig",
        herleitung: `Land ${(LAENDER[c.land] || {}).label || c.land}, Monat ${c.monat === null || c.monat === "" ? "–" : MONATE[+c.monat]} · ${herleitung}`,
        notiz: "Übernommen aus Bestimmen (Schnellpfad/Filter)", foto: sessionFoto.data }))
        .then(() => { location.hash = "#/journal"; render(); });
    });

    /* ---- Update-Logik ---- */
    function update() {
      const c = ctx();
      const ranking = Engine.bewerte(c);
      const amp = Engine.ampel(ranking, c);

      /* Schnellpfad */
      const qp = v.querySelector("#qp");
      const beantwortet = Object.keys(state.choices).length;
      const fertig = amp.stufe === "gruen" || ranking[0].anteil >= 0.55;
      if (state.qpEnde) {
        qp.innerHTML = `<h2>🧭 Schnellpfad</h2><p class="hint">Pausiert – du filterst frei. <button class="btn winzig" id="qprestart">Schnellpfad neu starten</button></p>`;
      } else if (fertig && beantwortet > 0) {
        qp.innerHTML = `<h2>🧭 Schnellpfad – geschafft!</h2>
          <div class="ampel ampel-${amp.stufe}"><span class="licht"></span><div>${esc(amp.text)}</div></div>
          <div class="row"><button class="btn klein" id="qpdossier">Dossier öffnen</button>
          <button class="btn winzig" id="qprestart">von vorn</button>
          <button class="btn winzig" id="qpende">frei filtern</button></div>`;
        qp.querySelector("#qpdossier").addEventListener("click", () => location.hash = "#/art/" + ranking[0].taxon.id);
      } else {
        const nf = Engine.naechsteFrage(c, 4, ["c_ant"]) || Engine.naechsteFrage(c, 4);
        if (!nf) {
          qp.innerHTML = `<h2>🧭 Schnellpfad</h2><p class="hint">Keine trennende Frage übrig – nutze den freien Filter oder den Foto-Check.</p>`;
        } else {
          qp.innerHTML = `<h2>🧭 Schnellpfad · Frage ${beantwortet + 1}</h2>
            <div class="qpfrage">${nf.char.icon} <b>${esc(nf.char.label)}</b>
              <div class="hint">${esc(nf.char.erklaerung || "")}</div></div>
            <div class="chips qpchips">${Object.keys(nf.char.states).map(s => stateChip(nf.char, s, false)).join("")}</div>
            ${beantwortet ? `<div class="hint">Beantwortet: ${Object.entries(state.choices).map(([cid, s]) => {
              const ch2 = CHARAKTERE.find(x => x.id === cid); return `${esc(ch2.label)}: <b>${esc(ch2.states[s])}</b> <button class="btn winzig qpx" data-c="${cid}">✕</button>`;
            }).join(" · ")}</div>` : ""}
            <div class="row"><button class="btn winzig" id="qpende">Schnellpfad beenden & frei filtern</button></div>`;
          qp.querySelectorAll(".qpx").forEach(b => b.addEventListener("click", e => {
            e.stopPropagation(); delete state.choices[b.dataset.c]; save(); update();
          }));
        }
      }

      /* Freier Filter rendern */
      const cl = v.querySelector("#chars");
      cl.innerHTML = CHARAKTERE.map(c2 => `
        <div class="chargruppe">
          <div class="charlabel">${c2.icon} ${esc(c2.label)}
            ${state.choices[c2.id] ? `<button class="mini-reset" data-c="${c2.id}">✕</button>` : ""}</div>
          <div class="hint">${esc(c2.erklaerung || "")}</div>
          <div class="chips">${Object.keys(c2.states).map(s => stateChip(c2, s, state.choices[c2.id] === s)).join("")}</div>
        </div>`).join("");

      /* Ampel + Ranking */
      const ab = v.querySelector("#ampelbox");
      ab.innerHTML = `<div class="ampel ampel-${amp.stufe}"><span class="licht"></span><div>${esc(amp.text)}
        ${amp.stufe === "gruen" ? `<div class="row"><button class="btn klein" id="jquick">📓 Ins Journal übernehmen</button></div>` : ""}</div></div>`;
      const rk = v.querySelector("#ranking");
      rk.innerHTML = "";
      const sicht = ranking.filter(r => r.score > 0).slice(0, 8);
      sicht.forEach(r => {
        const k = artKarte(r.taxon, r.anteil);
        const gruende = Object.entries(c.choices).map(([cid, s]) => {
          const ch2 = CHARAKTERE.find(x => x.id === cid);
          const w = (r.taxon.chars[cid] || {})[s] ?? 0;
          return `<li>${w >= 0.8 ? "✅" : w >= 0.3 ? "🟧" : "⛔"} ${esc(ch2.label)}: „${esc(ch2.states[s])}“</li>`;
        }).join("");
        if (gruende) {
          const btn = el("button", "btn winzig", "Warum?");
          k.querySelector(".artkarte-body").appendChild(btn);
          btn.addEventListener("click", e => {
            e.stopPropagation();
            k.querySelectorAll(".gruende").forEach(g => g.remove());
            const d = el("div", "gruende", `<ul>${gruende}</ul>`);
            k.appendChild(d);
            setTimeout(() => document.addEventListener("click", () => d.remove(), { once: true }), 0);
          });
        }
        rk.appendChild(k);
      });
      if (!sicht.length) rk.innerHTML = `<p class="hint">Keine Art passt zu dieser Merkmalskombination – bitte Auswahl prüfen (✕ zum Zurücksetzen).</p>`;
      /* Hinweis: die Vergleichsreferenz bleibt stabil, bis bewusst gewechselt wird */
    }
    update();
    return v;
  }

  /* ================= View: ARTEN ================= */
  function viewArten() {
    const v = el("div", "view");
    v.innerHTML = `<section class="hero"><h1>Arten-Dossiers</h1>
      <p class="lead">Belegfotos mit Herkunftssiegel, verhältnistreue Zeichnungen, Feld-Tipp & Morphometrie.</p></section>
      <div class="filterrow"><button class="chip an" data-f="alle">alle</button>
        <button class="chip" data-f="heimisch">heimisch in DE</button>
        <button class="chip" data-f="moeglich">möglich/unwahrscheinlich</button>
        <button class="chip" data-f="lookalike">Lookalike-Gattungen</button></div>
      <div id="artgrid" class="artgrid"></div>`;
    const grid = v.querySelector("#artgrid");
    function fill(f) {
      grid.innerHTML = "";
      TAXA.filter(t => f === "alle" ||
        (f === "heimisch" && t.statusDE === "heimisch") ||
        (f === "moeglich" && ["moeglich", "unwahrscheinlich", "fremd"].includes(t.statusDE)) ||
        (f === "lookalike" && !t.id.startsWith("t_")))
        .forEach(t => grid.appendChild(artKarte(t)));
    }
    v.querySelectorAll(".filterrow .chip").forEach(ch => ch.addEventListener("click", () => {
      v.querySelectorAll(".filterrow .chip").forEach(x => x.classList.remove("an"));
      ch.classList.add("an"); fill(ch.dataset.f);
    }));
    fill("alle");
    return v;
  }

  /* ================= View: DOSSIER ================= */
  function viewDossier(id) {
    const t = taxon(id);
    if (!t) return viewArten();
    const v = el("div", "view dossier");
    const morphRatios = Object.entries(MORPH_RANGES).filter(([k, cfg]) => cfg.werte[t.id]);
    const visProfil = CHARAKTERE.map(c => {
      const typ = Object.entries(t.chars[c.id] || {}).filter(([, w]) => w >= 0.8).map(([s]) => s);
      return typ.length ? `<div class="visrow">${Morph.stateVis(c.id, typ[0])}<div><b>${esc(c.label)}</b><div class="hint">${typ.map(s => esc(c.states[s])).join(", ")}</div></div></div>` : "";
    }).join("");
    v.innerHTML = `
      <button class="btn klein" onclick="history.back()">← zurück</button>
      <header class="doss-head">
        <h1><i>${esc(t.name)}</i> <span class="autor">${esc(t.autor)}</span></h1>
        <div class="doss-deutsch">${esc(t.deutsch)} · ${esc(t.gruppe)}</div>
        <div class="badges">${statusBadge(t)}${t.kryptisch ? `<span class="badge badge-krypt">kryptisches Geschwisterpaar</span>` : ""}</div>
      </header>
      ${t.feldTip ? `<div class="feldtip">🌿 <b>Feld-Tipp:</b> ${esc(t.feldTip)}</div>` : ""}
      <div class="doss-grid">
        <section class="panel">
          <h2>Belegfotos <span class="hint">(🛡️ = Herkunft & Prüfung · Profil = Leitansicht)</span></h2>
          <div class="galerie">
            ${t.bilder.map((b, i) => [b, i]).sort((p, q) => rangAnsicht(p[0].view) - rangAnsicht(q[0].view))
              .map(([b, i]) => `<figure class="galitem">
              <img src="assets/img/${b.file}" alt="${esc(t.name)} ${esc(b.view)}">
              <div class="mklay">${mkDots(b.view)}</div>
              <button class="shield" data-i="${i}">🛡️</button>
              <figcaption>${esc(b.view)} · ${esc(b.specimen || "")}</figcaption></figure>`).join("") || '<p class="hint">Bewusst kein Bild: keine verifizierte Quelle gefunden.</p>'}
          </div>
          <button class="btn winzig" id="mktoggle">🎯 Merkmals-Punkte einblenden</button>
        </section>
        <section class="panel">
          <h2>Verhältnistreue Zeichnung</h2>
          <p class="hint">Parametrisch aus publizierten Winkeln & Verhältnissen – alle Arten gleich orientiert, CS-normiert.</p>
          ${Morph.profilSVG(t.morphParams, { uid: "p" + t.id, scalebar: true })}
          ${Morph.kopfSVG(t.morphParams, { uid: "k" + t.id })}
        </section>
        <section class="panel">
          <h2>Steckbrief</h2>
          <table class="steck">
            <tr><td>Größe Arbeiterin</td><td>${esc(t.groesse)}</td></tr>
            <tr><td>Kolonie</td><td>${esc(t.kolonie)}</td></tr>
            <tr><td>Nest</td><td>${esc(t.nist)}</td></tr>
            <tr><td>Aktivität</td><td>${esc(t.aktiv)}</td></tr>
            <tr><td>DE-Status</td><td>${esc(t.statusText)}</td></tr>
          </table>
          <h3>Biologie</h3><p>${esc(t.biologie)}</p>
          <h3>Jahresaktivität</h3>
          ${Morph.aktivitaetsSVG(t.aktivitaet, state.monat)}
          <p class="hint">Balken = relative Sichtbarkeit von Arbeiterinnen je Monat${state.monat !== null && state.monat !== "" ? " · gelb = dein gewählter Monat" : ""}.</p>
          <h3>Ländergewichte</h3>
          <div class="regbars">${Object.entries(t.land || {}).map(([l, w]) =>
            `<div class="regbar"><span>${(LAENDER[l] || {}).label || l}</span><div class="bar"><div style="width:${w * 100}%"></div></div><span class="num">${w.toFixed(1)}</span></div>`).join("")}</div>
          ${(state.land || "DE") === "DE" ? `<h3>Regionen (DE)</h3>
          <div class="regbars">${Object.entries(t.region).map(([r, w]) =>
            `<div class="regbar"><span>${REGIONEN[r].label.split(" ")[0]}</span><div class="bar"><div style="width:${w * 100}%"></div></div><span class="num">${w.toFixed(1)}</span></div>`).join("")}</div>` : ""}
        </section>
        <section class="panel">
          <h2>Merkmalsprofil <span class="hint">(${istLabor() ? "Labor" : "Feld"}-Modus)</span></h2>
          <div class="visprofil">${visProfil}</div>
          ${istLabor() ? `<table class="steck lab-only">
            ${CHARAKTERE.map(c => {
              const typ = Object.entries(t.chars[c.id] || {}).filter(([, w]) => w >= 0.8).map(([s]) => c.states[s]);
              return typ.length ? `<tr><td>${c.icon} ${esc(c.label)}</td><td>${typ.map(esc).join(", ")}</td></tr>` : "";
            }).join("")}
          </table>` : ""}
          ${istLabor() && morphRatios.length ? `<h3>Publizierte Morphometrie</h3>
            ${morphRatios.map(([k, cfg]) => Morph.rangePlotSVG(k, null)).join("")}
            <p class="hint">${esc(morphRatios[0][1].quelle)}</p>` : ""}
          ${!istLabor() ? `<p class="hint">💡 Im 🔬 Labor-Modus (oben rechts) siehst du hier Messwerte & Tabellen.</p>` : ""}
        </section>
        <section class="panel">
          <h2>Verwechslungen</h2>
          <div class="chips">${(t.lookalikes || []).map(l => {
            const d = DUELLE.findIndex(d => (d.a === t.id && d.b === l) || (d.b === t.id && d.a === l));
            return d >= 0 ? `<button class="chip" data-duell="${d}">⚔️ ${esc(Engine.kurz(taxon(l).name))}</button>` : "";
          }).join('') || '<p class="hint">Keine Duelle hinterlegt.</p>'}</div>
          <h3>Direkt vergleichen</h3>
          <button class="btn" id="mitmerkmalen">Merkmale dieser Art in den Lebend-Filter laden</button>
        </section>
      </div>`;
    v.querySelectorAll(".shield").forEach(sh => sh.addEventListener("click", e => {
      e.stopPropagation(); provenanzPopover(sh, t.bilder[+sh.dataset.i], t);
    }));
    const mkt = v.querySelector("#mktoggle");
    if (mkt) mkt.addEventListener("click", () => {
      const gal = v.querySelector(".galerie");
      const an = gal.classList.toggle("mk-an");
      mkt.classList.toggle("an", an);
      mkt.textContent = an ? "🎯 Merkmals-Punkte ausblenden" : "🎯 Merkmals-Punkte einblenden";
    });
    v.querySelectorAll("[data-duell]").forEach(b => b.addEventListener("click", () => location.hash = "#/duell/" + b.dataset.duell));
    v.querySelector("#mitmerkmalen").addEventListener("click", () => {
      state.choices = {};
      for (const c of CHARAKTERE) {
        const typ = Object.entries(t.chars[c.id] || {}).filter(([, w]) => w >= 0.8).map(([s]) => s);
        if (typ.length === 1) state.choices[c.id] = typ[0];
      }
      save(); location.hash = "#/bestimmen"; render();
    });
    return v;
  }

  /* ================= View: DUELL ================= */
  function duellViews(A, B) {
    const vs = ["profil", "kopf", "dorsal"].filter(vw => refBild(A, vw) && refBild(B, vw));
    return vs.length ? vs : ["profil"];
  }
  function duellPane(t, vw, i) {
    const b = refBild(t, vw) || t.bilder[0];
    return `<section class="panel duell-pane" data-t="${t.id}">
      <h2><i>${esc(t.name)}</i></h2>
      <div class="syncbox"><div class="syncinner">
        ${b ? `<img src="assets/img/${b.file}" alt="${esc(t.name)}" draggable="false"><button class="shield" title="Provenienz">🛡️</button>` : Morph.profilSVG(t.morphParams, { uid: "d" + t.id })}
      </div><div class="mklay">${b ? mkDots(b.view) : ""}</div></div>
      <div class="duell-mini">${Morph.profilSVG(t.morphParams, { uid: "dm" + t.id + i, w: 300, h: 190 })}</div>
      <div class="hint duellcap">${b ? `${esc(b.view)} · ${esc(b.specimen || "")}` : "Zeichnung (kein Belegbild)"}</div>
      <div class="badges">${statusBadge(t)}</div>
    </section>`;
  }
  function viewDuell(idx) {
    const i = idx === undefined || isNaN(+idx) ? 0 : +idx;
    const d = DUELLE[i] || DUELLE[0];
    const A = taxon(d.a), B = taxon(d.b);
    const v = el("div", "view");
    const farbe = d.trennbar === "ja" ? "gruen" : d.trennbar === "teilweise" ? "gelb" : "rot";
    v.innerHTML = `
      <section class="hero"><h1>Verwechslungs-Duell</h1>
        <p class="lead">Beide Bilder synchron zoomen (Rad/Buttons) & verschieben (Ziehen) – gleicher Ausschnitt, gleicher Maßstab. Doppelklick = Reset.</p>
        <div class="chips">${DUELLE.map((dd, j) => `<button class="chip ${j === i ? "an" : ""}" data-j="${j}">${esc(Engine.kurz(taxon(dd.a).name))} vs ${esc(Engine.kurz(taxon(dd.b).name))}</button>`).join("")}</div>
      </section>
      <div class="ampel ampel-${farbe}"><span class="licht"></span><div>
        ${d.trennbar === "nein" ? "🔴 Per Foto NICHT sicher trennbar – nur Morphometrie/Messung entscheidet." :
          d.trennbar === "teilweise" ? "🟡 Mit sehr gutem Makro tendenziell trennbar – Messung empfohlen." :
          "🟢 Mit gutem Foto/Makro trennbar."}</div></div>
      <div class="chips" id="dvchips">
        ${duellViews(A, B).map(vw => `<button class="chip ${vw === "profil" ? "an" : ""}" data-vw="${vw}">${vw === "profil" ? "Seitenansicht" : vw === "kopf" ? "Kopf frontal" : "Dorsal"}</button>`).join("")}
        <button class="chip" id="mkduell" title="Pulsierende Punkte zeigen, wo am Foto geschaut wird">🎯 Merkmale anzeigen</button>
      </div>
      <div class="duell-grid" id="duellgrid">
        ${[A, B].map(t => duellPane(t, "profil", i)).join("")}
      </div>
      <div id="duellsync"></div>
      <section class="panel">
        <h2>Form-Overlay (Zeichnungen)</h2>
        <p class="hint">Beide Seitenansichten deckungsgleich überblendet – Regler schiebt die Sichtbarkeit von B.</p>
        <div class="overlaywrap">
          <div class="ovl">${Morph.profilSVG(A.morphParams, { uid: "ovA" + i, w: 420, h: 260 })}</div>
          <div class="ovl ovlB">${Morph.profilSVG(B.morphParams, { uid: "ovB" + i, w: 420, h: 260 })}</div>
        </div>
        <input type="range" id="ovregler" min="0" max="100" value="50" class="range">
        <div class="hint"><span style="float:left">${esc(Engine.kurz(A.name))}</span><span style="float:right">${esc(Engine.kurz(B.name))}</span></div>
      </section>
      <section class="panel">
        <h2>Entscheidende Merkmale</h2>
        <ul class="merkmalsliste">${d.merkmale.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
        <p class="fazit"><b>Fazit:</b> ${esc(d.fazit)}</p>
        <div class="row"><button class="btn" id="zuA">Dossier ${esc(Engine.kurz(A.name))}</button>
        <button class="btn" id="zuB">Dossier ${esc(Engine.kurz(B.name))}</button></div>
      </section>`;
    function setupSync() {
      const bs = [...v.querySelectorAll("#duellgrid .syncbox")];
      const s = attachSync(bs);
      const alt = v.querySelector("#duellsync .syncbtns"); if (alt) alt.remove();
      v.querySelector("#duellsync").appendChild(s.bar);
      return s;
    }
    setupSync();
    function bindShields(vw) {
      v.querySelectorAll("#duellgrid .shield").forEach((sh, k) => sh.addEventListener("click", e => {
        e.stopPropagation(); const t = k === 0 ? A : B; const b = refBild(t, vw) || t.bilder[0];
        if (b) provenanzPopover(sh, b, t);
      }));
    }
    bindShields("profil");
    v.querySelectorAll("#dvchips [data-vw]").forEach(ch => ch.addEventListener("click", () => {
      const vw = ch.dataset.vw;
      v.querySelectorAll("#dvchips [data-vw]").forEach(x => x.classList.toggle("an", x === ch));
      const grid = v.querySelector("#duellgrid");
      grid.innerHTML = [A, B].map(t => duellPane(t, vw, i)).join("");
      grid.classList.toggle("mk-an", v.querySelector("#mkduell").classList.contains("an"));
      bindShields(vw);
      setupSync();
    }));
    v.querySelector("#mkduell").addEventListener("click", e => {
      const an = e.currentTarget.classList.toggle("an");
      e.currentTarget.textContent = an ? "🎯 Merkmale ausblenden" : "🎯 Merkmale anzeigen";
      v.querySelector("#duellgrid").classList.toggle("mk-an", an);
    });
    v.querySelectorAll("[data-j]").forEach(ch => ch.addEventListener("click", () => location.hash = "#/duell/" + ch.dataset.j));
    v.querySelector("#zuA").addEventListener("click", () => location.hash = "#/art/" + A.id);
    v.querySelector("#zuB").addEventListener("click", () => location.hash = "#/art/" + B.id);
    const ovl = v.querySelector(".ovlB");
    v.querySelector("#ovregler").addEventListener("input", e => ovl.style.opacity = e.target.value / 100);
    ovl.style.opacity = 0.5;
    return v;
  }

  /* ================= View: MESS-BANK ================= */
  function viewMessbank() {
    const v = el("div", "view");
    v.innerHTML = `
      <section class="hero"><h1>Mess-Bank (Präzisionsmodus)</h1>
        <p class="lead">Für Binokular- oder Makrofotos mit Maßstab: kalibrieren, Messstrecken setzen,
        Ratios gegen publizierte Spannen prüfen. ${istLabor() ? "" : "💡 Dies ist der Labor-Teil – im Feld-Modus reicht meist der Schnellpfad."}</p></section>
      <div class="doss-grid">
        <section class="panel">
          <h2>1 · Foto & Kalibration</h2>
          <input type="file" id="foto" accept="image/*" class="btn">
          <div class="syncbox bankbox" id="bankbox"><div class="syncinner"><div class="hint zentriert">Foto laden → Modus wählen → Punkte setzen</div></div></div>
          <div class="chips">
            <button class="chip an" data-mode="kalib">📏 Kalibrieren</button>
            <button class="chip" data-mode="mess">📐 Strecke messen</button>
            <button class="chip" data-mode="reset">♻️ Punkte löschen</button>
          </div>
          <div class="row"><label>Kalibrierte Distanz (µm)<input id="kalibum" type="number" value="500" step="any"></label>
            <span class="hint" id="kalibinfo">Noch nicht kalibriert.</span></div>
          <p class="hint">Tipp: Maßstabsbalken der Belegfotos (z. B. 0,5 mm = 500 µm) oder Objektmikrometer kalibrieren.</p>
        </section>
        <section class="panel">
          <h2>2 · Messwerte (µm)</h2>
          <div class="messgrid" id="messgrid">
            ${["CL", "CWb", "SPST", "PEH", "PL", "SL", "SPL", "SPWI"].map(k =>
              `<label>${k}<input type="number" step="any" data-m="${k}" placeholder="µm"></label>`).join("")}
          </div>
          <p class="hint">CL Kopflänge · CWb Kopfbreite · SPST Dornenlänge · PEH Knotenhöhe · PL Petioluslänge · SL/SPL/SPWI für D4.</p>
          <div class="row"><button class="btn" id="berechnen">Berechnen</button></div>
          <div id="ratioout"></div>
        </section>
        <section class="panel">
          <h2>3 · Diskriminanz D4</h2>
          <p class="hint">${esc(DISCRIMINANT_D4.quelle)}</p>
          <div id="d4out" class="d4box">–</div>
          <p class="hint">⚠️ ${esc(DISCRIMINANT_D4.hinweis)}</p>
        </section>
      </div>`;
    let mode = "kalib", kalib = null, punkte = [], linien = [];
    const box = v.querySelector("#bankbox");
    const inn = () => box.querySelector(".syncinner");
    attachSync([box]);
    v.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
      if (b.dataset.mode === "reset") { punkte = []; linien = []; drawOverlay(); return; }
      mode = b.dataset.mode;
      v.querySelectorAll("[data-mode]").forEach(x => x.classList.toggle("an", x === b));
    }));
    function drawOverlay() {
      let ov = box.querySelector("svg.ov");
      if (!ov) { ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "ov"); box.appendChild(ov); }
      ov.innerHTML = linien.map(l => `<line x1="${l[0].x}" y1="${l[0].y}" x2="${l[1].x}" y2="${l[1].y}" stroke="#e8b04b" stroke-width="2"/>`).join("") +
        punkte.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#e8b04b"/>`).join("") +
        linien.map(l => `<text x="${(l[0].x + l[1].x) / 2 + 6}" y="${(l[0].y + l[1].y) / 2 - 6}" fill="#e8b04b" font-size="12" font-family="monospace">${l.um ? l.um.toFixed(0) + " µm" : (l.px ? l.px.toFixed(0) + " px" : "")}</text>`).join("");
    }
    v.querySelector("#foto").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { inn().innerHTML = `<img src="${r.result}" alt="Eigenes Foto">`; drawOverlay(); };
      r.readAsDataURL(f);
    });
    box.addEventListener("click", e => {
      if (!inn().querySelector("img")) return;
      const rect = box.getBoundingClientRect();
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      punkte.push(p);
      if (punkte.length === 2) {
        const px = Math.hypot(punkte[0].x - punkte[1].x, punkte[0].y - punkte[1].y);
        if (mode === "kalib") {
          const um = +v.querySelector("#kalibum").value || 0;
          kalib = um / px;
          v.querySelector("#kalibinfo").textContent = `Kalibriert: 1 px = ${kalib.toFixed(2)} µm`;
          linien.push([punkte[0], punkte[1], { um }]);
        } else {
          const um = kalib ? px * kalib : null;
          linien.push([punkte[0], punkte[1], { px, um }]);
          if (um) {
            const frei = [...v.querySelectorAll("#messgrid input")].find(i => !i.value);
            if (frei) frei.value = um.toFixed(1);
          }
        }
        punkte = [];
      }
      drawOverlay();
    });
    v.querySelector("#berechnen").addEventListener("click", () => {
      const m = {};
      v.querySelectorAll("#messgrid input").forEach(i => m[i.dataset.m] = +i.value || 0);
      const ratios = Engine.berechneRatios(m);
      let html = `<table class="steck">`;
      for (const [k, val] of Object.entries(ratios)) {
        if (k === "CS") { html += `<tr><td>CS (Kopfgröße)</td><td>${val.toFixed(1)} µm</td></tr>`; continue; }
        const treffer = Engine.ratioTreffer(k, val);
        html += `<tr><td>${k}</td><td>${val.toFixed(3)} ${treffer.length ? "→ passt zu: " + treffer.map(t => Engine.kurz(taxon(t).name)).join(", ") : "→ außerhalb publizierter Spannen"}</td></tr>`;
      }
      html += `</table>`;
      for (const k of Object.keys(MORPH_RANGES)) if (ratios[k] !== undefined) html += Morph.rangePlotSVG(k, ratios[k]);
      v.querySelector("#ratioout").innerHTML = html;
      const d = Engine.d4(m);
      v.querySelector("#d4out").innerHTML = d === null ? "SL, SPST, SPWI, SPL benötigt." :
        `D4 = <b>${d.toFixed(3)}</b> <span class="hint">(Interpretation siehe Originalpublikat)</span>`;
    });
    return v;
  }

  /* ================= View: JOURNAL ================= */
  function openDB() { return new Promise((res, rej) => {
    const rq = indexedDB.open("temnothek", 1);
    rq.onupgradeneeded = e => e.target.result.createObjectStore("obs", { keyPath: "id" });
    rq.onsuccess = e => res(e.target.result);
    rq.onerror = () => rej(rq.error);
  }); }
  function putObs(db, o) { return new Promise(res => { const tx = db.transaction("obs", "readwrite"); tx.objectStore("obs").put(o); tx.oncomplete = res; }); }
  function allObs(db) { return new Promise(res => { const tx = db.transaction("obs").objectStore("obs").getAll(); tx.onsuccess = () => res(tx.result); }); }
  function delObs(db, id) { return new Promise(res => { const tx = db.transaction("obs", "readwrite"); tx.objectStore("obs").delete(id); tx.oncomplete = res; }); }

  function viewJournal() {
    const v = el("div", "view");
    if (!("indexedDB" in window)) {
      v.innerHTML = `<section class="hero"><h1>Fund-Journal</h1>
        <div class="ampel ampel-gelb"><span class="licht"></span><div>Diese Browser-Umgebung stellt keine IndexedDB bereit.
        Die übrige App funktioniert vollständig – Funde können hier nur nicht dauerhaft gespeichert werden.</div></div></section>`;
      return v;
    }
    v.innerHTML = `
      <section class="hero"><h1>Fund-Journal</h1>
        <p class="lead">Deine Beobachtungen bleiben lokal auf deinem Gerät – inkl. Foto, Ort und Bestimmungsstand.</p></section>
      <section class="panel">
        <h2>Neue Beobachtung</h2>
        <div class="formgrid">
          <label>Datum<input type="date" id="jdatum" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label>Ort<input id="jort" placeholder="z. B. Leipzig, Auwald"></label>
          <label>Art / Ergebnis<input id="jart" list="artliste" placeholder="z. B. Temnothorax crassispinus">
            <datalist id="artliste">${TAXA.map(t => `<option value="${esc(t.name)}">`).join("")}</datalist></label>
          <label>Sicherheit<select id="jsicher"><option>grün – stimmig</option><option>gelb – wahrscheinlich</option><option>rot – kryptisch/offen</option></select></label>
          <label class="wide">Notiz<textarea id="jnotiz" rows="2" placeholder="Nestfund, Substrat, Verhalten …"></textarea></label>
          <label>Foto<input type="file" id="jfoto" accept="image/*"></label>
          <div class="row"><button class="btn klein" id="jgeo">📍 GPS</button>
          <button class="btn" id="jsave">Speichern</button>
          <button class="btn klein" id="jexport">⬇ Export</button></div>
        </div>
      </section>
      <section class="panel"><h2>Deine Funde</h2><div id="jliste" class="jliste"></div></section>`;
    let geo = null, fotoData = null;
    v.querySelector("#jgeo").addEventListener("click", () => {
      if (!navigator.geolocation) return alert("Geolocation nicht verfügbar.");
      navigator.geolocation.getCurrentPosition(p => {
        geo = [p.coords.latitude.toFixed(5), p.coords.longitude.toFixed(5)];
        v.querySelector("#jort").value += (v.querySelector("#jort").value ? " " : "") + `(@${geo.join(",")})`;
      }, () => alert("Ortung abgelehnt."));
    });
    v.querySelector("#jfoto").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const s = Math.min(1, 900 / img.width);
        c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        fotoData = c.toDataURL("image/jpeg", 0.75);
      };
      img.src = URL.createObjectURL(f);
    });
    v.querySelector("#jsave").addEventListener("click", async () => {
      const db = await openDB();
      await putObs(db, { id: Date.now(), datum: v.querySelector("#jdatum").value, ort: v.querySelector("#jort").value,
        art: v.querySelector("#jart").value, sicher: v.querySelector("#jsicher").value,
        notiz: v.querySelector("#jnotiz").value, foto: fotoData });
      liste();
    });
    v.querySelector("#jexport").addEventListener("click", async () => {
      const db = await openDB();
      const alle = await allObs(db);
      const blob = new Blob([JSON.stringify(alle, null, 2)], { type: "application/json" });
      Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "temnothek-journal.json" }).click();
    });
    async function liste() {
      const db = await openDB();
      const alle = (await allObs(db)).sort((a, b) => b.id - a.id);
      const l = v.querySelector("#jliste");
      l.innerHTML = alle.length ? "" : `<p class="hint">Noch keine Funde erfasst.</p>`;
      for (const o of alle) {
        const k = el("div", "jkarte");
        k.innerHTML = `${o.foto ? `<img src="${o.foto}" alt="Fundfoto">` : ""}
          <div><div class="jdatum">${esc(o.datum)} · ${esc(o.ort || "–")}</div>
          <div class="jart"><i>${esc(o.art || "unbestimmt")}</i> <span class="badge ${o.sicher.startsWith("grün") ? "badge-heimisch" : o.sicher.startsWith("gelb") ? "badge-moeglich" : "badge-krypt"}">${esc(o.sicher)}</span></div>
          <div class="hint">${esc(o.notiz || "")}</div>
          ${o.herleitung ? `<div class="hint herleitung">🧭 ${esc(o.herleitung)}</div>` : ""}</div>
          <button class="btn winzig jdel">löschen</button>`;
        k.querySelector(".jdel").addEventListener("click", async () => { const db2 = await openDB(); await delObs(db2, o.id); liste(); });
        l.appendChild(k);
      }
    }
    liste();
    return v;
  }

  /* ================= View: WISSEN (+ Morph-Lab) ================= */
  function viewWissen() {
    const v = el("div", "view");
    v.innerHTML = `
      <section class="hero"><h1>Wissen & Transparenz</h1>
        <p class="lead">Anatomie zum Anfassen, das Morph-Lab zum Experimentieren, und das ehrliche Limit der App.</p></section>
      <div class="doss-grid">
        <section class="panel">
          <h2>🧪 Morph-Lab</h2>
          <p class="hint">Schiebe die diagnostischen Werte – die Zeichnung morpht live und die App zeigt,
          welche Arten in diesem Formfenster liegen. Lernen durch Spielen statt Pauken.</p>
          <div id="labsvg"></div>
          <div class="sliderow"><label>Dornenwinkel <output id="o1"></output></label><input type="range" id="s1" min="15" max="50" value="36" class="range"></div>
          <div class="sliderow"><label>Dornenlänge SPST/CS <output id="o2"></output></label><input type="range" id="s2" min="0.12" max="0.45" step="0.005" value="0.28" class="range"></div>
          <div class="sliderow"><label>Knotenwinkel <output id="o3"></output></label><input type="range" id="s3" min="70" max="125" value="107" class="range"></div>
          <div class="sliderow"><label>Knotenhöhe PEH/CS <output id="o4"></output></label><input type="range" id="s4" min="0.30" max="0.48" step="0.005" value="0.385" class="range"></div>
          <div id="labmatch" class="chips"></div>
          <p class="hint">Publizierte Anker: Dornenwinkel 32–42° (crassispinus) vs. 20–25° (laconicus/lichtensteini, nicht in DE) ·
          Knotenwinkel 100–115° (crassispinus) vs. 72–82° (angulinodis, nicht in DE) · Q1.</p>
        </section>
        <section class="panel">
          <h2>Interaktive Anatomie</h2>
          ${Morph.anatomieSVG()}
          <div id="anatxt" class="anatxt">Tippe auf ein Körperteil …</div>
        </section>
        <section class="panel">
          <h2>Glossar</h2>
          <table class="steck">${Object.entries(GLOSSAR).map(([k, t]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(t)}</td></tr>`).join("")}</table>
        </section>
        <section class="panel">
          <h2>Quellen & Bild-Sicherheit</h2>
          <p>Jedes Foto ist ein <b>Museumsbeleg</b> (AntWeb/CAS, CASENT-Nummer, CC-BY 4.0, via AntWiki/Commons)
          und wurde zusätzlich visuell gegengeprüft. Community-Fotos ohne Belegkette werden bewusst nicht verwendet.</p>
          <ol class="quellen">${QUELLEN.map(q => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.text)}</a></li>`).join("")}</ol>
          <h3>Was diese App NICHT kann</h3>
          <ul class="merkmalsliste">
            <li>Kryptische Paare (z. B. <i>crassispinus</i> ↔ <i>crasecundus</i>) per Foto unterscheiden.</li>
            <li>Eine Blackbox-Bilderkennung ersetzen – du entscheidest, die App gewichtet transparent.</li>
          </ul>
          <p class="hint">${esc(APP_META.name)} v${esc(APP_META.version)} · Stand ${esc(APP_META.stand)}</p>
        </section>
      </div>`;
    /* Morph-Lab */
    const p = { spineAngle: 36, spineLen: 0.28, nodeAngle: 107, nodeHeight: 0.385, headRatio: 1.13, sculpt: "areoMatt" };
    const lab = v.querySelector("#labsvg");
    function labUpdate() {
      lab.innerHTML = Morph.profilSVG(p, { uid: "lab", scalebar: true });
      v.querySelector("#o1").textContent = p.spineAngle + "°";
      v.querySelector("#o2").textContent = p.spineLen.toFixed(3);
      v.querySelector("#o3").textContent = p.nodeAngle + "°";
      v.querySelector("#o4").textContent = p.nodeHeight.toFixed(3);
      const tol = { spineAngle: 6, spineLen: 0.04, nodeAngle: 8, nodeHeight: 0.03 };
      const match = TAXA.filter(t => Object.keys(tol).every(k => Math.abs(t.morphParams[k] - p[k]) <= tol[k]));
      v.querySelector("#labmatch").innerHTML = match.length
        ? match.map(t => `<span class="chip an" style="cursor:default">${esc(Engine.kurz(t.name))}</span>`).join("")
        : `<span class="hint">Keine Art liegt exakt in diesem Fenster – du bist zwischen den Diagnoseräumen.</span>`;
    }
    [["s1", "spineAngle", 1], ["s2", "spineLen", 3], ["s3", "nodeAngle", 1], ["s4", "nodeHeight", 3]].forEach(([id, key, dig]) => {
      v.querySelector("#" + id).addEventListener("input", e => { p[key] = +e.target.value; labUpdate(); });
    });
    labUpdate();
    v.querySelectorAll(".anatomie [data-g]").forEach(node => {
      node.style.cursor = "pointer";
      node.addEventListener("click", () => {
        const key = node.getAttribute("data-g");
        v.querySelector("#anatxt").innerHTML = `<b>${esc(key)}</b> – ${esc(GLOSSAR[key] || "")}`;
        v.querySelectorAll(".anatomie [data-g]").forEach(n => n.style.opacity = n === node ? 1 : 0.55);
      });
    });
    return v;
  }

  /* ---------------- Onboarding ---------------- */
  function onboarding() {
    const ov = el("div", "overlay");
    ov.innerHTML = `<div class="overlay-card">
      <div class="logo-big">🐜</div>
      <h1>TEMNOTHEK</h1>
      <p class="lead">Interaktive Bestimmung von <i>Temnothorax</i> & Lookalikes – Deutschland & Nachbarraum.</p>
      <div class="onb-steps">
        <div><b>1 · Visuelle Reise:</b> Szene für Szene zeigt dir die App in Animationen, <i>worauf</i> du schauen sollst – du tippst Bilder an, keine Fachbegriffe.</div>
        <div><b>2 · Verhalten zählt:</b> Tandemlaufen, Einrollen, Brutraub – einzigartige Szenen bestimmen mit.</div>
        <div><b>3 · Ehrliches Ende:</b> Animierter Stimmigkeits-Ring + Ampel: Grün = stimmig · Gelb = wahrscheinlich · Rot = per Foto nicht trennbar.</div>
        <div><b>Danach:</b> Foto-Check, Duell, Dossier, Journal – und für Profis der 🎛️ Experten-Filter.</div>
      </div>
      <button class="btn gross" id="onbstart">Los geht's</button>
      <p class="hint">Privates Projekt · keine Konten · Fotos & Funde bleiben lokal</p>
    </div>`;
    ov.querySelector("#onbstart").addEventListener("click", () => { state.onboarded = true; save(); ov.remove(); });
    document.body.appendChild(ov);
  }

  /* ---------------- Router & Shell ---------------- */
  const NAV = [
    ["#/reise", "🧭", "Reise"],
    ["#/filter", "🎛️", "Filter"],
    ["#/arten", "📚", "Arten"],
    ["#/duell", "⚔️", "Duell"],
    ["#/messbank", "🔬", "Mess-Bank"],
    ["#/journal", "📓", "Journal"],
    ["#/wissen", "🧭", "Wissen"]
  ];
  let lastHash = null;

  function render() {
    const hash = location.hash || "#/bestimmen";
    const main = $("#main");
    main.innerHTML = "";
    let view;
    if (hash.startsWith("#/art/")) view = viewDossier(hash.slice(6));
    else if (hash.startsWith("#/duell/")) view = viewDuell(hash.slice(8));
    else if (hash.startsWith("#/arten")) view = viewArten();
    else if (hash.startsWith("#/duell")) view = viewDuell(0);
    else if (hash.startsWith("#/messbank")) view = viewMessbank();
    else if (hash.startsWith("#/journal")) view = viewJournal();
    else if (hash.startsWith("#/wissen")) view = viewWissen();
    else if (hash.startsWith("#/filter")) view = viewBestimmen();
    else view = viewReise();
    main.appendChild(view);
    document.querySelectorAll("nav.tabs a").forEach(a => {
      const base = a.getAttribute("href").split("/").slice(0, 2).join("/");
      a.classList.toggle("aktiv", hash.startsWith(base) || (base === "#/arten" && hash.startsWith("#/art/")));
    });
    if (hash !== lastHash) window.scrollTo(0, 0);
    lastHash = hash;
  }

  function init() {
    document.documentElement.dataset.theme = state.theme;
    document.body.innerHTML = `
      <header class="top">
        <div class="logo">🐜 <b>TEMNO</b>THEK <span class="v">v${APP_META.version}</span></div>
        <div class="top-actions">
          <button class="iconbtn modebtn" id="mode" title="Modus wechseln">${state.mode === "feld" ? "🌿 Feld" : "🔬 Labor"}</button>
          <button class="iconbtn" id="theme" title="Hell/Dunkel">${state.theme === "dark" ? "☀️" : "🌙"}</button>
        </div>
      </header>
      <main id="main"></main>
      <nav class="tabs">${NAV.map(([h, i, l]) => `<a href="${h}"><span>${i}</span><em>${l}</em></a>`).join("")}</nav>`;
    $("#theme").addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = state.theme;
      $("#theme").textContent = state.theme === "dark" ? "☀️" : "🌙";
      save();
    });
    $("#mode").addEventListener("click", () => {
      state.mode = state.mode === "feld" ? "labor" : "feld";
      $("#mode").textContent = state.mode === "feld" ? "🌿 Feld" : "🔬 Labor";
      save(); render();
    });
    window.addEventListener("hashchange", render);
    render();
    if (!state.onboarded) onboarding();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", UI.init);

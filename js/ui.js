/* =========================================================================
   TEMNOTHEK v4 – FOKUS
   Reine Foto-Bestimmungsapp: verifizierte Museums-Belegfotos, optimal
   präsentiert (Leitansicht Profil, Merkmals-Punkte, Lightbox mit Sync-Zoom),
   Vergleichswerkzeuge (Duell, Foto-Check), Mess-Bank für Profis. Sonst nichts.
   ========================================================================= */
"use strict";

const UI = (function () {

  /* ---------------- State ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ok */ } }
  };
  const state = Object.assign({
    theme: "dark", mode: "feld", onboarded: false
  }, JSON.parse(store.get("temnothek_state") || "{}"));
  function save() { store.set("temnothek_state", JSON.stringify(state)); }

  /* Sitzungs-Foto (bewusst nicht persistent) */
  let sessionFoto = { data: null, view: "profil" };

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const taxon = id => TAXA.find(t => t.id === id);
  const istLabor = () => state.mode === "labor";

  function refBild(t, view) {
    const m = { profil: /profil/i, kopf: /kopf/i, dorsal: /dorsal/i }[view];
    return (m && t.bilder.find(b => m.test(b.view))) || t.bilder[0] || null;
  }
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

  /* ---------------- Synchron-Zoom/Pan ---------------- */
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

  function fotoKarte(t) {
    const b = refBild(t, "profil") || t.bilder[0];
    const k = el("div", "fkarte");
    k.innerHTML = `<figure>
        ${b ? `<img src="assets/img/${b.file}" alt="${esc(t.name)}, ${esc(b.view)}" loading="lazy">
               <div class="mklay">${mkDots(b.view)}</div>
               <button class="shield" title="Bild-Provenienz anzeigen">🛡️</button>`
          : `<div class="keinbild">kein verifiziertes<br>Belegbild</div>`}
      </figure>
      <div class="fw-name">
        <div class="fw-latein"><i>${esc(t.name)}</i> <span class="autor">${esc(t.autor)}</span></div>
        <div class="fw-deutsch">${esc(t.deutsch)}</div>
        <div class="badges">${statusBadge(t)}${t.kryptisch ? `<span class="badge badge-krypt">kryptisch</span>` : ""}</div>
      </div>`;
    k.addEventListener("click", () => location.hash = "#/art/" + t.id);
    const sh = k.querySelector(".shield");
    if (sh && b) sh.addEventListener("click", e => { e.stopPropagation(); provenanzPopover(sh, b, t); });
    return k;
  }

  /* ================= View: FOTO-WAND (Start) ================= */
  function viewFotos() {
    const v = el("div", "view");
    v.innerHTML = `<section class="hero">
        <h1>Belegfoto-Wand</h1>
        <p class="lead">Jedes Foto ist ein Museumsbeleg (CASENT-Nummer oder Revisionstafel, CC-BY 4.0) und wurde
        visuell gegengeprüft – keine Community-Ratebilder. <b>Profil = Leitansicht</b>, damit alle Arten gleich
        orientiert vergleichbar sind. 🎯 blendet die diagnostischen Punkte ein, Klick auf eine Karte öffnet das Dossier.</p>
        <div class="row">
          <div class="filterrow">
            <button class="chip an" data-f="alle">alle</button>
            <button class="chip" data-f="heimisch">heimisch in DE</button>
            <button class="chip" data-f="moeglich">möglich / unwahrscheinlich</button>
            <button class="chip" data-f="lookalike">Lookalike-Gattungen</button>
          </div>
          <button class="chip" id="mkwall" title="Pulsierende Punkte zeigen die diagnostischen Regionen">🎯 Merkmals-Punkte</button>
        </div>
      </section>
      <div class="fotowall" id="wall"></div>`;
    const wall = v.querySelector("#wall");
    function fill(f) {
      wall.innerHTML = "";
      const liste = TAXA.filter(t => f === "alle" ||
        (f === "heimisch" && t.statusDE === "heimisch") ||
        (f === "moeglich" && ["moeglich", "unwahrscheinlich", "fremd"].includes(t.statusDE)) ||
        (f === "lookalike" && !t.id.startsWith("t_")))
        .sort((a, b) => rangStatus(a) - rangStatus(b) || a.name.localeCompare(b.name));
      liste.forEach(t => wall.appendChild(fotoKarte(t)));
      if (mkAn) wall.classList.add("mk-an");
    }
    const rangStatus = t => ({ heimisch: 0, moeglich: 1, unwahrscheinlich: 2, fremd: 3 }[t.statusDE] ?? 4);
    let mkAn = false;
    v.querySelectorAll(".filterrow .chip").forEach(ch => ch.addEventListener("click", () => {
      v.querySelectorAll(".filterrow .chip").forEach(x => x.classList.remove("an"));
      ch.classList.add("an"); fill(ch.dataset.f);
    }));
    v.querySelector("#mkwall").addEventListener("click", e => {
      mkAn = !mkAn;
      e.currentTarget.classList.toggle("an", mkAn);
      wall.classList.toggle("mk-an", mkAn);
    });
    fill("alle");
    return v;
  }

  /* ================= Lightbox: Foto groß, zoombar, mit Markern ================= */
  function lightbox(t, b) {
    const ov = el("div", "lightbox");
    ov.innerHTML = `<div class="lb-card">
      <div class="row spacebetween">
        <h2><i>${esc(t.name)}</i> · ${esc(b.view)}</h2>
        <button class="btn winzig" id="lbx">✕ schließen</button>
      </div>
      <div class="syncbox lb-box" id="lbbox">
        <div class="syncinner"><img src="assets/img/${b.file}" alt="${esc(t.name)} ${esc(b.view)}" draggable="false"></div>
        <div class="mklay" id="lbmklay">${mkDots(b.view)}</div>
      </div>
      <div id="lbbar"></div>
      <div class="lb-cap">
        <span class="hint">Beleg: ${esc(b.specimen || "–")} · <a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.quelle)}</a> · CC-BY 4.0 (AntWeb/CAS) · Rad/Buttons = Zoom, Ziehen = Pan, Doppelklick = Reset</span>
        <button class="btn winzig an" id="lbmk">🎯 Merkmals-Punkte</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const lay = ov.querySelector("#lbmklay");
    lay.style.opacity = mkDots(b.view) ? 1 : 0;
    const sync = attachSync([ov.querySelector("#lbbox")]);
    ov.querySelector("#lbbar").appendChild(sync.bar);
    ov.querySelector("#lbmk").addEventListener("click", e => {
      const an = lay.style.opacity === "0";
      lay.style.opacity = an ? 1 : 0;
      e.currentTarget.classList.toggle("an", an);
    });
    ov.querySelector("#lbx").addEventListener("click", () => ov.remove());
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
  }

  /* ================= View: DOSSIER ================= */
  function viewDossier(id) {
    const t = taxon(id);
    if (!t) return viewFotos();
    const v = el("div", "view dossier");
    const morphRatios = Object.entries(MORPH_RANGES).filter(([k, cfg]) => cfg.werte[t.id]);
    v.innerHTML = `
      <button class="btn klein" onclick="history.back()">← zurück</button>
      <header class="doss-head">
        <h1><i>${esc(t.name)}</i> <span class="autor">${esc(t.autor)}</span></h1>
        <div class="doss-deutsch">${esc(t.deutsch)} · ${esc(t.gruppe)}</div>
        <div class="badges">${statusBadge(t)}${t.kryptisch ? `<span class="badge badge-krypt">kryptisches Geschwisterpaar – per Foto nicht trennbar</span>` : ""}</div>
      </header>
      ${t.feldTip ? `<div class="feldtip">🌿 <b>Feld-Tipp:</b> ${esc(t.feldTip)}</div>` : ""}
      <div class="doss-grid">
        <section class="panel panel-fotos">
          <h2>Belegfotos <span class="hint">– Klick = Lightbox · 🛡️ = Herkunft</span></h2>
          <div class="galerie">
            ${t.bilder.map((b, i) => [b, i]).sort((p, q) => rangAnsicht(p[0].view) - rangAnsicht(q[0].view))
              .map(([b, i]) => `<figure class="galitem" data-i="${i}">
              <img src="assets/img/${b.file}" alt="${esc(t.name)} ${esc(b.view)}">
              <div class="mklay">${mkDots(b.view)}</div>
              <button class="shield" data-i="${i}">🛡️</button>
              <figcaption>${esc(b.view)} · ${esc(b.specimen || "")}</figcaption></figure>`).join("")
              || '<p class="hint">Bewusst kein Bild: keine verifizierte Quelle gefunden.</p>'}
          </div>
          <div class="row">
            <button class="btn winzig" id="mktoggle">🎯 Merkmals-Punkte einblenden</button>
            <span class="hint">Punkte = diagnostische Regionen dieser Ansicht</span>
          </div>
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
          ${Morph.aktivitaetsSVG(t.aktivitaet, new Date().getMonth())}
        </section>
        ${istLabor() && morphRatios.length ? `<section class="panel">
          <h2>Publizierte Morphometrie</h2>
          ${morphRatios.map(([k, cfg]) => Morph.rangePlotSVG(k, null)).join("")}
          <p class="hint">${esc(morphRatios[0][1].quelle)}</p>
        </section>` : ""}
        <section class="panel">
          <h2>Verwechslungen</h2>
          <div class="chips">${(t.lookalikes || []).map(l => {
            const d = DUELLE.findIndex(d => (d.a === t.id && d.b === l) || (d.b === t.id && d.a === l));
            return d >= 0 ? `<button class="chip" data-duell="${d}">⚔️ gegen ${esc(Engine.kurz(taxon(l).name))}</button>` : "";
          }).join("") || '<p class="hint">Keine Duelle hinterlegt.</p>'}</div>
        </section>
      </div>`;
    v.querySelectorAll(".shield").forEach(sh => sh.addEventListener("click", e => {
      e.stopPropagation(); provenanzPopover(sh, t.bilder[+sh.dataset.i], t);
    }));
    v.querySelectorAll(".galitem").forEach(fig => fig.addEventListener("click", e => {
      if (e.target.closest(".shield")) return;
      lightbox(t, t.bilder[+fig.dataset.i]);
    }));
    const mkt = v.querySelector("#mktoggle");
    if (mkt) mkt.addEventListener("click", () => {
      const gal = v.querySelector(".galerie");
      const an = gal.classList.toggle("mk-an");
      mkt.classList.toggle("an", an);
      mkt.textContent = an ? "🎯 Merkmals-Punkte ausblenden" : "🎯 Merkmals-Punkte einblenden";
    });
    v.querySelectorAll("[data-duell]").forEach(b => b.addEventListener("click", () => location.hash = "#/duell/" + b.dataset.duell));
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
        <p class="lead">Beide Belegfotos synchron zoomen (Rad/Buttons) & verschieben (Ziehen) – gleicher Ausschnitt,
        gleicher Maßstab. Doppelklick = Reset. 🎯 zeigt die entscheidenden Punkte an beiden Fotos.</p>
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

  /* ================= View: FOTO-CHECK ================= */
  function viewFoto() {
    const v = el("div", "view");
    v.innerHTML = `<section class="hero"><h1>Foto-Check</h1>
      <p class="lead">Dein Makro gegen das verifizierte Belegfoto – synchron zoombar, gleiche Ansicht, gleicher
      Ausschnitt. Das Foto bleibt nur in dieser Sitzung und verlässt dein Gerät nicht.</p></section>
      <section class="panel"><div id="fotoinner"></div></section>`;
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
      const mitBild = TAXA.filter(t => t.bilder.length);
      fi.innerHTML = `
        <div class="chips" id="viewchips">
          ${["profil", "kopf", "dorsal"].map(vw => `<button class="chip ${sessionFoto.view === vw ? "an" : ""}" data-v="${vw}">${vw === "profil" ? "Seitenansicht" : vw === "kopf" ? "Kopf frontal" : "Dorsal"}</button>`).join("")}
          <button class="btn winzig" id="fotoweg">✕ Foto entfernen</button>
        </div>
        <div class="row"><label>Vergleich mit
          <select id="refsel">${mitBild.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
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
        let mk = fi.querySelector("#refbox .mklay"); if (mk) mk.remove();
        mk = el("div", "mklay mk-an-fix", b ? mkDots(b.view) : "");
        mk.style.opacity = 1;
        fi.querySelector("#refbox").appendChild(mk);
        const cap = fi.querySelector("#refcap"); if (cap) cap.remove();
        const c = el("div", "hint refcap", b ? `Referenz: ${esc(t.name)} · ${esc(b.view)} · ${esc(b.specimen || "")}` : `Referenz: ${esc(t.name)} · Zeichnung (kein Belegbild dieser Ansicht)`);
        fi.querySelector("#refbox").appendChild(c);
      }
      const selR = fi.querySelector("#refsel");
      const initial = sessionFoto.refId && taxon(sessionFoto.refId) ? sessionFoto.refId : (mitBild[0] ? mitBild[0].id : TAXA[0].id);
      selR.value = initial;
      setRef(initial);
      selR.addEventListener("change", e => { sessionFoto.refId = e.target.value; setRef(e.target.value); });
      fi.querySelectorAll("#viewchips .chip").forEach(ch => ch.addEventListener("click", () => {
        sessionFoto.view = ch.dataset.v; renderFoto();
      }));
      fi.querySelector("#fotoweg").addEventListener("click", () => { sessionFoto = { data: null, view: "profil" }; renderFoto(); });
    }
    function lade(f) {
      const r = new FileReader();
      r.onload = () => { sessionFoto.data = r.result; renderFoto(); };
      r.readAsDataURL(f);
    }
    renderFoto();
    return v;
  }

  /* ================= View: MESS-BANK ================= */
  function viewMessbank() {
    const v = el("div", "view");
    v.innerHTML = `
      <section class="hero"><h1>Mess-Bank (Präzisionsmodus)</h1>
        <p class="lead">Für Binokular- oder Makrofotos mit Maßstab: kalibrieren, Messstrecken setzen,
        Ratios gegen publizierte Spannen prüfen – dort, wo Fotos nicht trennen (z. B. kryptische Paare).</p></section>
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

  /* ---------------- Onboarding ---------------- */
  function onboarding() {
    const ov = el("div", "overlay");
    ov.innerHTML = `<div class="overlay-card">
      <div class="logo-big">🐜</div>
      <h1>TEMNOTHEK</h1>
      <p class="lead">Bestimmen mit <b>verifizierten Belegfotos</b> – Museumsbelege statt Ratebilder.</p>
      <div class="onb-steps">
        <div><b>1 · Foto-Wand:</b> alle Arten in Leitansicht Profil, 🎯 zeigt die diagnostischen Punkte.</div>
        <div><b>2 · Vergleichen:</b> Lightbox mit Zoom, Duell mit synchronem Zoom, Foto-Check für dein eigenes Makro.</div>
        <div><b>3 · Ehrlich:</b> kryptische Paare bleiben rot markiert – die Mess-Bank misst nach, wo Fotos nicht trennen.</div>
      </div>
      <button class="btn gross" id="onbstart">Los geht's</button>
      <p class="hint">Privates Projekt · keine Konten · Fotos & Funde bleiben lokal</p>
    </div>`;
    ov.querySelector("#onbstart").addEventListener("click", () => { state.onboarded = true; save(); ov.remove(); });
    document.body.appendChild(ov);
  }

  /* ---------------- Router & Shell ---------------- */
  const NAV = [
    ["#/fotos", "📷", "Fotos"],
    ["#/duell", "⚔️", "Duell"],
    ["#/foto", "🔍", "Foto-Check"],
    ["#/messbank", "🔬", "Mess-Bank"]
  ];
  let lastHash = null;

  function render() {
    const hash = location.hash || "#/fotos";
    const main = $("#main");
    main.innerHTML = "";
    let view;
    if (hash.startsWith("#/art/")) view = viewDossier(hash.slice(6));
    else if (hash.startsWith("#/duell/")) view = viewDuell(hash.slice(8));
    else if (hash.startsWith("#/duell")) view = viewDuell(0);
    else if (hash.startsWith("#/foto") && !hash.startsWith("#/fotos")) view = viewFoto();
    else if (hash.startsWith("#/messbank")) view = viewMessbank();
    else view = viewFotos();
    main.appendChild(view);
    document.querySelectorAll("nav.tabs a").forEach(a => {
      const base = a.getAttribute("href");
      a.classList.toggle("aktiv", hash === base || hash.startsWith(base + "/") || (base === "#/fotos" && hash.startsWith("#/art/")));
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

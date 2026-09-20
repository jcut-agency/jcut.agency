(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var body = document.body;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  var Liquid = function () { return window.JLiquid || { setPalette: function () {}, ripple: function () {}, setHue: function () {}, setBoost: function () {} }; };

  /* ---------------- load-in ---------------- */
  var loaded = false;
  function onLoaded() {
    if (loaded) return;
    loaded = true;
    body.classList.remove("is-loading");
  }
  window.addEventListener("load", onLoaded);
  setTimeout(onLoaded, 2500);

  /* ---------------- text scramble (dot-matrix glyph shuffle) ---------------- */
  var GLYPHS = "0123456789#@*+=<>/?$%&ABCDEFGHJKLMNPRSTUVWXYZ";
  function scramble(el, finalText, dur) {
    if (reduceMotion) { el.textContent = finalText; return; }
    dur = dur || 800;
    cancelAnimationFrame(el._sc);
    var t0 = performance.now();
    var n = finalText.length;
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var out = "";
      for (var i = 0; i < n; i++) {
        var ch = finalText.charAt(i);
        if (ch === " " || i / n < p * 1.15 - 0.05) out += ch;
        else out += GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
      }
      el.textContent = out;
      if (p < 1) el._sc = requestAnimationFrame(tick);
      else el.textContent = finalText;
    })(t0);
  }

  /* dot-matrix numbers scramble in when revealed, and again on hover of their card */
  var dotEls = $$(".dot-text").filter(function (el) {
    return !el.classList.contains("stat-number") && !el.closest(".hero-dots");
  });
  dotEls.forEach(function (el) {
    var txt = el.textContent;
    var host = el.closest(".glass") || el.parentNode;
    host.addEventListener("pointerenter", function () { scramble(el, txt, 600); });
  });

  /* client names in the marquee re-shuffle on hover */
  $$(".mq").forEach(function (el) {
    var txt = el.textContent;
    el.addEventListener("pointerenter", function () { scramble(el, txt, 520); });
  });

  /* ---------------- smooth anchor scrolling ---------------- */
  var scrollAnim = null;
  function stopScrollAnim() { if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = null; } }
  function smoothScrollTo(y) {
    stopScrollAnim();
    var start = window.scrollY, dist = y - start;
    if (Math.abs(dist) < 2) return;
    if (reduceMotion) { window.scrollTo(0, y); return; }
    var dur = clamp(Math.abs(dist) * 0.42, 550, 1400), t0 = performance.now();
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;      // ease in-out
      window.scrollTo(0, start + dist * e);
      if (p < 1) scrollAnim = requestAnimationFrame(step); else scrollAnim = null;
    })(t0);
  }
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
    window.addEventListener(ev, stopScrollAnim, { passive: true });          // the user takes over
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY);
    if (history.pushState) history.pushState(null, "", id);
  });

  /* ---------------- scroll reveal ---------------- */
  var revealEls = $$(".reveal");
  function revealNow(el) {
    el.classList.add("in-view");
    $$(".dot-text", el).forEach(function (d) {
      if (!d.classList.contains("stat-number")) scramble(d, d.textContent, 700);
    });
  }
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealNow(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }
  // section numbers live outside .reveal — scramble them when their section head appears
  if ("IntersectionObserver" in window && !reduceMotion) {
    var numIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { scramble(entry.target, entry.target.textContent, 700); numIo.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    $$(".section-number").forEach(function (el) { numIo.observe(el); });
  }

  /* ---------------- headline rotator ---------------- */
  var rotator = $("#rotator");
  if (rotator) {
    var words = $$(".rotator-word", rotator);
    if (words.length > 1) {
      var cur = 0;
      // The box always hugs the word being shown, so the line stays centred
      // under "We cut the noise." whichever word is up.
      var sizeRotator = function () {
        // measure the text itself (the word element is a block that fills the box)
        var range = document.createRange();
        range.selectNodeContents(words[cur]);
        rotator.style.width = Math.ceil(range.getBoundingClientRect().width) + 4 + "px";
      };
      rotator.style.transition = "none";
      sizeRotator();
      requestAnimationFrame(function () { rotator.style.transition = ""; });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeRotator);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", sizeRotator);
      window.addEventListener("load", sizeRotator);
      var rz;
      window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(sizeRotator, 150); });

      if (!reduceMotion) {
        setInterval(function () {
          var next = (cur + 1) % words.length;
          words[cur].classList.remove("is-current");
          words[cur].classList.add("is-exiting");
          words[next].classList.add("is-current");
          var prev = cur;
          cur = next;
          sizeRotator();
          setTimeout(function () { words[prev].classList.remove("is-exiting"); }, 500);
        }, 2600);
      }
    }
  }

  /* ---------------- orbiting service dots + words ---------------- */
  var orbitEl = $(".orbit");
  var orbit = { spin: 0, paused: false, last: performance.now(), R: 0, cx: 0, items: [], visible: true };
  var heroSection = $("#top");
  if (heroSection && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { orbit.visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(heroSection);
  }
  if (orbitEl) {
    $$(".orbit .arm").forEach(function (arm) {
      var dot = $("i", arm);
      var it = { arm: arm, em: $("em", dot), a: parseFloat(arm.getAttribute("data-a")) || 0, w: 0, h: 0 };
      orbit.items.push(it);
      function hold() { orbit.paused = true; }
      function release() { orbit.paused = false; }
      dot.addEventListener("pointerenter", hold);
      dot.addEventListener("pointerleave", release);
      dot.addEventListener("focus", hold);
      dot.addEventListener("blur", release);
    });
  }
  function measureOrbit() {
    if (!orbitEl) return;
    orbit.R = orbitEl.offsetWidth / 2;
    orbit.cx = orbitEl.getBoundingClientRect().left + orbit.R;
    orbit.items.forEach(function (it) { it.w = it.em.offsetWidth; it.h = it.em.offsetHeight; });
    updateOrbit(performance.now(), true);
  }
  function updateOrbit(now, force) {
    if (!orbitEl || (!orbit.visible && !force)) { orbit.last = now; return; }
    var dt = Math.min(0.1, (now - orbit.last) / 1000);
    orbit.last = now;
    if (!orbit.paused && !reduceMotion) orbit.spin += dt * 360 / 34;    // one lap every 34s
    var R = orbit.R, cxv = orbit.cx;
    orbit.items.forEach(function (it) {
      var th = (it.a + orbit.spin - 90) * Math.PI / 180;
      var ux = Math.cos(th), uy = Math.sin(th);
      it.arm.style.transform = "translate(" + (R + R * ux).toFixed(1) + "px," + (R + R * uy).toFixed(1) + "px)";
      // word sits just outside the ring, pushed along the radius, and is kept on screen
      var ox = ux * (16 + it.w / 2), oy = uy * (14 + it.h / 2);
      var half = it.w / 2 + 10, lx = cxv + R * ux + ox;
      ox += clamp(lx, half, window.innerWidth - half) - lx;
      it.em.style.transform = "translate(-50%,-50%) translate(" + ox.toFixed(1) + "px," + oy.toFixed(1) + "px)";
    });
  }

  /* ---------------- animated counters ---------------- */
  var counters = $$(".stat-number");
  function animateCounter(el, dur) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var t0 = null;
    dur = dur || 1400;
    el._counting = true;
    (function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(step); else el._counting = false;
    })(performance.now());
  }
  // hover a stat card and its number counts up again
  counters.forEach(function (el) {
    var card = el.closest(".stat");
    if (!card) return;
    card.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch" || el._counting || !el.classList.contains("counted")) return;
      animateCounter(el, 800);
    });
  });
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("counted"); animateCounter(entry.target); cio.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    } else counters.forEach(function (c) { c.classList.add("counted"); animateCounter(c); });
  }

  /* ---------------- statement: words light up as you scroll ---------------- */
  var statement = $("#statement-text");
  var stWords = [];
  if (statement) {
    (function splitWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = tok;
            stWords.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) splitWords(child);
      });
    })(statement);
  }

  /* ---------------- floating pill nav + sliding blob ---------------- */
  var pill = $("#pill");
  var pillBlob = $("#pill-blob");
  var pillLinks = $$(".pill-link", pill);
  var activePillLink = null;
  function movePillBlob(el) {
    if (!el || el.classList.contains("pill-cta")) { pillBlob.style.opacity = "0"; return; }
    pillBlob.style.opacity = "1";
    pillBlob.style.width = el.offsetWidth + "px";
    pillBlob.style.height = el.offsetHeight + "px";
    pillBlob.style.transform = "translate(" + el.offsetLeft + "px," + el.offsetTop + "px)";
  }
  pillLinks.forEach(function (a) {
    a.addEventListener("pointerenter", function () { movePillBlob(a); });
  });
  pill.addEventListener("pointerleave", function () { movePillBlob(activePillLink); });

  /* ---------------- per-frame loop: scroll-linked effects ---------------- */
  var sections = $$("[data-palette]");
  var marquee = $("#marquee");
  var processFill = $("#process-fill");
  var pHead = $("#process-head"), pBox = $("#process-pct-box"), pNum = $("#process-pct"), pStage = $("#process-stage");
  var pSteps = $$(".process-step");
  var STAGES = ["Kickoff", "Strategize", "Script", "Edit", "Publish"];
  var pVal = 0, pTarget = 0, pHold = false, pShown = -1, pRailW = 0, pBoxW = 0, pSettled = false;
  var lastY = window.scrollY, skew = 0, curPalette = "", curSection = null;

  function updateSection() {
    var mid = window.innerHeight * 0.45, found = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { found = sections[i]; break; }
    }
    if (!found) return;
    var pal = found.getAttribute("data-palette");
    if (pal !== curPalette) { curPalette = pal; Liquid().setPalette(pal); }
    if (found !== curSection) {
      curSection = found;
      var link = found.id ? $('.pill-link[data-target="' + found.id + '"]', pill) : null;
      pillLinks.forEach(function (a) { a.classList.toggle("is-active", a === link); });
      activePillLink = link;
      if (!pill.matches(":hover")) movePillBlob(link);
    }
  }

  /* ---------------- process: hover a step to scrub the project timeline (rests at 0%) ---------------- */
  var pIndex = -1;
  function setProcessStep(n) {                 // n = 1..4, or 0 to release
    pHold = n > 0;
    pSettled = false;
    pTarget = n * 25;                          // 0% whenever no step is hovered
    pSteps.forEach(function (el, i) { el.classList.toggle("is-active", n === i + 1); });
  }
  pSteps.forEach(function (el, i) {
    el.addEventListener("pointerenter", function () { setProcessStep(i + 1); });
    el.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") setProcessStep(0); });
    el.addEventListener("focus", function () { setProcessStep(i + 1); });
    el.addEventListener("blur", function () { setProcessStep(0); });
  });
  function updateProcess() {
    if (!processFill) return;
    if (!pHold) pTarget = 0;
    if (pSettled && pVal === pTarget) return;                // nothing to animate
    var k = reduceMotion ? 1 : 0.14;
    pVal += (pTarget - pVal) * k;
    if (Math.abs(pTarget - pVal) < 0.05) pVal = pTarget;

    processFill.style.transform = "scaleX(" + (pVal / 100).toFixed(4) + ")";

    // meter rides the leading edge, kept inside the rail
    if (!pRailW) { pRailW = pHead.parentNode.offsetWidth; pBoxW = pBox.offsetWidth; }
    var x = pRailW * pVal / 100;
    pHead.style.transform = "translateX(" + x.toFixed(1) + "px)";
    pSteps.forEach(function (el, i) { var d = pVal >= (i + 1) * 25 - 1; if (el.classList.contains("is-done") !== d) el.classList.toggle("is-done", d); });
    pBox.style.transform = "translateX(" + (-Math.min(pBoxW, Math.max(x, 0)) - 0).toFixed(1) + "px)";

    var shown = Math.round(pVal);
    if (shown !== pShown) { pShown = shown; pNum.textContent = shown; }

    // stage name + "reached" steps follow the bar (tolerance so 25/50/75/100 read as their own stage)
    pSettled = pVal === pTarget;
    var idx = Math.max(0, Math.min(4, Math.ceil(pVal / 25 - 0.04)));
    if (idx !== pIndex) {
      pIndex = idx;
      pStage.textContent = STAGES[idx];
      pBoxW = pBox.offsetWidth;
      pSteps.forEach(function (el, i) { el.classList.toggle("is-done", pVal >= (i + 1) * 25 - 1); });
    }
  }
  window.addEventListener("resize", function () { pRailW = 0; pSettled = false; statementDirty = true; });

  var statementLit = -1, statementDirty = true, lastSkew = "";
  function loop() {
    var y = window.scrollY, vh = window.innerHeight;
    var dy = y - lastY;
    lastY = y;

    // marquee skews with scroll velocity
    if (marquee && !reduceMotion && (dy !== 0 || skew !== 0)) {
      skew = lerp(skew, clamp(dy * 0.35, -9, 9), 0.12);
      if (Math.abs(skew) < 0.01) skew = 0;
      var sk = skew === 0 ? "" : "skewX(" + skew.toFixed(2) + "deg)";
      if (sk !== lastSkew) { lastSkew = sk; marquee.style.transform = sk; }
    }

    // statement words
    if (stWords.length && !reduceMotion && (dy !== 0 || statementDirty)) {
      statementDirty = false;
      var sr = statement.getBoundingClientRect();
      var p = clamp((vh * 0.88 - sr.top) / (vh * 0.5 + sr.height * 0.3), 0, 1);
      var lit = Math.round(p * (stWords.length + 2) * 100) / 100;
      if (lit !== statementLit) {
        statementLit = lit;
        stWords.forEach(function (w, i) {
          w.style.opacity = (0.16 + 0.84 * clamp(lit - i, 0, 1)).toFixed(2);
        });
      }
    }

    updateProcess();

    if (dy !== 0 || !curSection) updateSection();

    updateOrbit(performance.now());
    tickCursor();
    requestAnimationFrame(loop);
  }

  /* ---------------- gooey cursor ---------------- */
  var cursorEl = $("#cursor");
  var labelEl = $("#cursor-label");
  var trail = cursorEl ? $$(".c", cursorEl) : [];
  var px = -200, py = -200, cursorSeen = false, lastMove = performance.now(), sleeping = false;
  var pos = trail.map(function () { return { x: -200, y: -200 }; });

  function setCursorState(t) {
    if (!cursorEl || !t || !t.closest) return;
    var dc = t.closest("[data-cursor]");
    var isText = !!t.closest("input,textarea");
    // buttons and the status chip already say what they do, so the cursor stays a plain dot over them
    var isLink = !!t.closest("a,button,.filter-btn,[role=button],label") && !t.closest(".btn,.status-chip");
    // over an orange surface the orange cursor would vanish, so it turns white there
    cursorEl.classList.toggle("is-light", !!t.closest(".btn-primary, .filter-btn.is-active"));
    cursorEl.classList.toggle("is-big", !!dc);
    if (dc) labelEl.textContent = dc.getAttribute("data-cursor");
    labelEl.classList.toggle("is-on", !!dc);
    cursorEl.classList.toggle("is-link", !dc && isLink && !isText);
    cursorEl.classList.toggle("is-text", isText);
  }

  function wake(e) {
    lastMove = performance.now();
    if (sleeping) {
      sleeping = false;
      cursorEl.classList.remove("is-big");
      labelEl.classList.remove("is-on");
      setCursorState(e.target);
    }
  }

  if (!reduceMotion && cursorEl) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      px = e.clientX; py = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        root.classList.add("has-cursor");          // hide the system cursor only once a real mouse shows up
        pos.forEach(function (p) { p.x = px; p.y = py; });
        cursorEl.classList.add("is-on");
      }
      wake(e);
    }, { passive: true });
    document.addEventListener("mouseover", function (e) { if (!sleeping) setCursorState(e.target); });
    document.addEventListener("mouseleave", function () { cursorEl.classList.remove("is-on"); });
    document.addEventListener("mouseenter", function () { if (cursorSeen) cursorEl.classList.add("is-on"); });
    window.addEventListener("pointerdown", function () { cursorEl.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { cursorEl.classList.remove("is-down"); });
  }

  var cursorRest = false, lastPx = 0, lastPy = 0;
  function tickCursor() {
    if (!cursorSeen || !trail.length) return;
    var still = px === lastPx && py === lastPy;
    lastPx = px; lastPy = py;
    if (still && cursorRest) { checkSleep(); return; }
    cursorEl.style.transform = "translate(" + px + "px," + py + "px)";
    for (var i = 0; i < trail.length; i++) {
      var tx = i === 0 ? px : pos[i - 1].x;
      var ty = i === 0 ? py : pos[i - 1].y;
      var k = i === 0 ? 0.55 : 0.4;
      pos[i].x += (tx - pos[i].x) * k;
      pos[i].y += (ty - pos[i].y) * k;
      var ox = clamp(pos[i].x - px, -110, 110), oy = clamp(pos[i].y - py, -110, 110);
      trail[i].style.transform = "translate(" + ox.toFixed(1) + "px," + oy.toFixed(1) + "px)";
      if (Math.abs(tx - pos[i].x) > 0.25 || Math.abs(ty - pos[i].y) > 0.25) still = false;
    }
    cursorRest = still;
    labelEl.style.transform = "translate(" + pos[0].x.toFixed(1) + "px," + pos[0].y.toFixed(1) + "px) translate(-50%,-50%)";

    checkSleep();
  }

  // easter egg: idle for 20s and the cursor falls asleep
  function checkSleep() {
    if (!sleeping && performance.now() - lastMove > 20000) {
      sleeping = true;
      cursorEl.classList.add("is-big");
      cursorEl.classList.remove("is-link", "is-text");
      labelEl.textContent = "zZ";
      labelEl.classList.add("is-on");
    }
  }

  /* ---------------- glass specular highlight follows the cursor ---------------- */
  {
    var glassEv = null;
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var wasIdle = !glassEv;
      glassEv = e;
      if (wasIdle) requestAnimationFrame(function () {
        var ev = glassEv; glassEv = null;
        var g = ev.target.closest && ev.target.closest(".glass");
        if (!g) return;
        var r = g.getBoundingClientRect();
        g.style.setProperty("--mx", (ev.clientX - r.left) + "px");
        g.style.setProperty("--my", (ev.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  /* ---------------- 3D tilt ---------------- */
  if (!reduceMotion) {
    $$(".tilt").forEach(function (el) {
      var isCardLink = el.classList.contains("work-card-link");
      el.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "touch") return;
        el.style.transitionDelay = "0s";
        el.classList.add("is-tilting");
      });
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        var amt = isCardLink ? 7 : 9;
        el.style.setProperty("--ry", (x * amt).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-y * amt).toFixed(2) + "deg");
        el.style.setProperty("--sc", "1.025");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-tilting");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--sc", "1");
      });
    });

    /* magnetic buttons */
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.22).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- work filter (FLIP morph) + liquid indicator ---------------- */
  var filterBlob = $("#filter-blob");
  var filterBtns = $$(".filter-btn");
  var workCards = $$(".work-card");
  var workGrid = $("#work-grid");
  var LEAVE_MS = 260, MORPH_MS = 480, filterToken = 0;

  function moveFilterBlob() {
    var active = $(".filter-btn.is-active");
    if (!active) return;
    filterBlob.style.width = active.offsetWidth + "px";
    filterBlob.style.height = active.offsetHeight + "px";
    filterBlob.style.transform = "translate(" + active.offsetLeft + "px," + active.offsetTop + "px)";
  }
  moveFilterBlob();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveFilterBlob);
  window.addEventListener("resize", moveFilterBlob);
  window.addEventListener("load", moveFilterBlob);

  function cardMatches(card, filter) { return filter === "all" || card.getAttribute("data-category") === filter; }

  function applyWorkFilter(filter) {
    var myToken = ++filterToken;
    var cards = workCards;

    if (reduceMotion) {
      cards.forEach(function (card) { card.classList.toggle("is-hidden", !cardMatches(card, filter)); });
      workGrid.classList.toggle("is-filtered", filter !== "all");
      return;
    }

    var wasVisible = {}, firstRects = {};
    cards.forEach(function (card, i) {
      var visible = !card.classList.contains("is-hidden");
      wasVisible[i] = visible;
      if (visible) firstRects[i] = card.getBoundingClientRect();
    });

    cards.forEach(function (card, i) {
      if (wasVisible[i] && !cardMatches(card, filter)) {
        card.style.transform = "scale(.85)";
        card.style.opacity = "0";
      }
    });

    setTimeout(function () {
      if (myToken !== filterToken) return;

      cards.forEach(function (card) {
        var after = cardMatches(card, filter);
        card.classList.toggle("is-hidden", !after);
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = after ? "1" : "";
        if (after) card.classList.add("in-view");
      });
      workGrid.classList.toggle("is-filtered", filter !== "all");
      workGrid.offsetHeight; // reflow so the new layout is measurable

      cards.forEach(function (card, i) {
        if (card.classList.contains("is-hidden")) return;
        var last = card.getBoundingClientRect();
        if (wasVisible[i] && firstRects[i]) {
          var first = firstRects[i];
          card.style.transformOrigin = "top left";
          card.style.transform = "translate(" + (first.left - last.left) + "px," + (first.top - last.top) + "px) scale(" + (first.width / last.width) + "," + (first.height / last.height) + ")";
        } else {
          card.style.transform = "scale(.85)";
          card.style.opacity = "0";
        }
      });

      workGrid.offsetHeight;

      cards.forEach(function (card) {
        if (card.classList.contains("is-hidden")) return;
        card.style.transition = "transform " + MORPH_MS + "ms var(--ease), opacity " + MORPH_MS + "ms var(--ease)";
        card.style.transform = "";
        card.style.opacity = "1";
      });

      setTimeout(function () {
        if (myToken !== filterToken) return;
        cards.forEach(function (card) {
          card.style.transition = ""; card.style.transform = ""; card.style.opacity = "";
          card.style.transformOrigin = "";
        });
      }, MORPH_MS + 40);
    }, LEAVE_MS);
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      moveFilterBlob();
      applyWorkFilter(btn.getAttribute("data-filter"));
    });
  });

  /* ---------------- dot wordmark (assembles itself, scatters from the cursor) ---------------- */
  function initDotWord(canvas, text, opts) {
    if (!canvas || !canvas.getContext) return;
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var pts = [], w = 0, h = 0, m = { x: -999, y: -999 }, visible = false, running = false, built = false;

    function build(intro) {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var off = document.createElement("canvas");
      off.width = Math.round(w); off.height = Math.round(h);
      var o = off.getContext("2d");
      var fs = Math.min(h * 1.02, w / 3.1);
      o.fillStyle = "#fff";
      o.textAlign = "center"; o.textBaseline = "middle";
      o.font = "800 " + fs + "px 'Bricolage Grotesque', 'Arial Black', sans-serif";
      o.fillText(text, w / 2, h * 0.53);
      var data = o.getImageData(0, 0, off.width, off.height).data;

      var gap = clamp(Math.round(w / 75), 3, 7);
      pts = [];
      for (var y = gap / 2; y < off.height; y += gap) {
        for (var x = gap / 2; x < off.width; x += gap) {
          if (data[((y | 0) * off.width + (x | 0)) * 4 + 3] > 140) {
            var p = { hx: x, hy: y, x: x, y: y, vx: 0, vy: 0, r: gap * 0.33 };
            if (intro && !reduceMotion) {
              // start scattered, then spring home
              p.x = Math.random() * w; p.y = Math.random() * h * 1.4 - h * 0.2;
              p.vx = (Math.random() - 0.5) * 6; p.vy = (Math.random() - 0.5) * 6;
            }
            pts.push(p);
          }
        }
      }
      built = true;
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // two passes (settled dots, then displaced ones in orange) without building any arrays
      for (var pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? "#ff4b2b" : "rgba(245,241,234,.92)";
        ctx.beginPath();
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          if ((Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy) > 5) !== !!pass) continue;
          ctx.moveTo(p.x + p.r, p.y);
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        }
        ctx.fill();
      }
    }

    function step() {
      var R = clamp(w * 0.22, 46, 95), moving = false;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 1;
          var f = Math.pow(1 - d / R, 2) * 5.5;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx += (p.hx - p.x) * 0.045; p.vy += (p.hy - p.y) * 0.045;
        p.vx *= 0.84; p.vy *= 0.84;
        p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) > 0.02 || Math.abs(p.vy) > 0.02 || Math.abs(p.x - p.hx) > 0.05 || Math.abs(p.y - p.hy) > 0.05) moving = true;
      }
      draw();
      return moving;
    }

    // the cursor is close enough to disturb the dots
    function mouseNear() {
      var R = clamp(w * 0.22, 46, 95);
      return m.x > -R && m.x < w + R && m.y > -R && m.y < h + R;
    }

    function run() {
      if (running || reduceMotion) return;
      running = true;
      (function frame() {
        if (!visible) { running = false; return; }
        var moving = step();
        if (!moving && !mouseNear()) { running = false; return; }      // settled: stop drawing until something touches it
        requestAnimationFrame(frame);
      })();
    }

    // pointer is tracked on the window so overlapping hero layers never block it
    window.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      m.x = e.clientX - r.left; m.y = e.clientY - r.top;
      if (built && visible && !running && mouseNear()) run();               // wake up
    }, { passive: true });
    document.addEventListener("mouseleave", function () { m.x = -999; m.y = -999; });
    window.addEventListener("pointerdown", function (e) {
      var r = canvas.getBoundingClientRect();
      var cx = e.clientX - r.left, cy = e.clientY - r.top;
      if (cx < -40 || cy < -40 || cx > r.width + 40 || cy > r.height + 40) return;
      pts.forEach(function (p) {
        var dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = 28 / (1 + d / 60);
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      });
      run();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { if (!built) return; run(); }
      }, { threshold: 0.02 }).observe(canvas);
    } else visible = true;

    var rz;
    window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { build(false); }, 200); });

    // wait for the display font so the shape is right the first time
    var fontReady = (document.fonts && document.fonts.load)
      ? Promise.race([document.fonts.load("800 100px 'Bricolage Grotesque'"), new Promise(function (r) { setTimeout(r, 1800); })])
      : Promise.resolve();
    fontReady.then(function () {
      build(!!opts.intro);
      visible = true;
      run();
    });
  }
  initDotWord($("#hero-canvas"), "J CUT", { intro: true });

  /* glass orb drifts toward the cursor */
  var heroBlob = $(".hero-blob");
  if (heroBlob && !reduceMotion) {
    heroBlob.style.transition = "opacity .6s, transform .9s cubic-bezier(.22,1,.36,1)";
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      heroBlob.style.transform = "translate(" + (nx * 16).toFixed(1) + "px," + (ny * 12).toFixed(1) + "px)";
    }, { passive: true });
  }

  /* ---------------- today's date in the top chip ---------------- */
  var todayEl = $("#today");
  if (todayEl) {
    var now = new Date();
    var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    todayEl.textContent = now.getDate() + " " + MONTHS[now.getMonth()] + " " + now.getFullYear();
    todayEl.setAttribute("datetime", now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()));
  }

  /* ---------------- footer year ---------------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- contact form -> Web3Forms ---------------- */
  var form = $("#contact-form");
  if (form) {
    var statusEl = $("#form-status");
    var submitBtn = $('button[type="submit"]', form);
    var btnLabel = submitBtn ? $(".btn-label", submitBtn) : null;
    var setStatus = function (text, kind) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = "form-status" + (kind ? " is-" + kind : "");
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", "");
      submitBtn.disabled = true;
      var originalLabel = btnLabel ? btnLabel.textContent : "";
      if (btnLabel) btnLabel.textContent = "Sending…";
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = originalLabel;
          if (data.success) {
            form.reset();
            setStatus("Thanks — your message is on its way. We'll get back to you within one business day.", "success");
            Liquid().ripple(window.innerWidth / 2, window.innerHeight / 2);
          } else setStatus("Something went wrong. Please email us directly at jcut.agency@gmail.com.", "error");
        })
        .catch(function () {
          submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = originalLabel;
          setStatus("Something went wrong. Please email us directly at jcut.agency@gmail.com.", "error");
        });
    });
  }

  /* =========================================================
     EASTER EGGS  (all quiet — nothing announces them)
     ========================================================= */
  var toast = $("#toast");
  var toastTimer;
  function showToast(msg, ms) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, ms || 3200);
  }

  var splice = $("#splice");
  var splicing = false;
  function doSplice(msg) {
    if (splicing || reduceMotion) { if (msg) showToast(msg); return; }
    splicing = true;
    splice.classList.add("is-on");
    setTimeout(function () { if (msg) showToast(msg, 3600); }, 700);
    setTimeout(function () { splice.classList.remove("is-on"); splicing = false; }, 1350);
  }

  // 1. click the logo five times, fast
  var logoClicks = 0, logoTimer;
  $$(".logo").forEach(function (l) {
    l.addEventListener("click", function () {
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1800);
      if (logoClicks >= 5) { logoClicks = 0; doSplice("You found the cut ✂  —  say hi: jcut.agency@gmail.com"); }
    });
  });

  // 2. type "cut" anywhere (outside form fields)
  var keyBuf = "";
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var kPos = 0;
  window.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;

    // konami
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[kPos]) {
      kPos++;
      if (kPos === KONAMI.length) { kPos = 0; directorsCut(); }
    } else kPos = key === KONAMI[0] ? 1 : 0;

    if (e.key.length === 1) {
      keyBuf = (keyBuf + e.key.toLowerCase()).slice(-3);
      if (keyBuf === "cut") { keyBuf = ""; Liquid().ripple(window.innerWidth / 2, window.innerHeight / 2); doSplice("snip."); }
    }
  });

  // 3. konami code → director's cut: the whole palette rotates
  var dcOn = false;
  function directorsCut() {
    if (dcOn) return;
    dcOn = true;
    showToast("Director's cut unlocked ✦", 4200);
    var h = 0, n = 0;
    Liquid().setBoost(0.25);
    var iv = setInterval(function () {
      h += 0.09; n++;
      Liquid().setHue(h);
      if (n > 260) {
        clearInterval(iv);
        Liquid().setBoost(0);
        Liquid().setHue(Math.ceil(h / 6.2832) * 6.2832);
        setTimeout(function () { Liquid().setHue(0); dcOn = false; }, 1500);
      }
    }, 30);
  }

  // 4. every click on the page sends a ripple through the liquid
  window.addEventListener("pointerdown", function (e) { Liquid().ripple(e.clientX, e.clientY); });

  // 5. click the © year: it's a clapperboard
  var takes = 1;
  if (yearEl) {
    var bump = function () {
      takes++;
      var lines = ["Take " + takes + ".", "Take " + takes + " — still rolling.", "Take " + takes + ". That one was the one.", "Cut! Print it."];
      showToast(lines[Math.min(takes - 2, lines.length - 1)], 2400);
    };
    yearEl.addEventListener("click", bump);
    yearEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bump(); } });
  }

  // 6. click the hero blob: it squishes
  if (heroBlob) {
    heroBlob.addEventListener("click", function () {
      heroBlob.animate([
        { transform: "scale(1)" }, { transform: "scale(.86,1.1)" }, { transform: "scale(1.12,.9)" }, { transform: "scale(.96,1.03)" }, { transform: "scale(1)" }
      ], { duration: 700, easing: "cubic-bezier(.34,1.56,.64,1)" });
    });
  }

  // 7. leave the tab and it notices
  var realTitle = document.title;
  document.addEventListener("visibilitychange", function () {
    document.title = document.hidden ? "✂ Come back — we're mid-edit" : realTitle;
  });

  // 8. a note for anyone who opens the console
  if (window.console && console.log) {
    console.log("%c✂  J CUT", "font:700 22px system-ui;color:#ff4b2b");
    console.log("%cCurious how it's made? So are we. jcut.agency@gmail.com", "color:#999");
  }

  /* ---------------- kick off ---------------- */
  measureOrbit();
  window.addEventListener("load", measureOrbit);
  window.addEventListener("resize", measureOrbit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureOrbit);
  requestAnimationFrame(loop);
  window.addEventListener("resize", function () { curSection = null; });
})();

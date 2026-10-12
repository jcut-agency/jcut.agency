/* J Cut v3 */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  // real viewport width without the scrollbar, so fixed frame lines line up with the content
  var setVw = function () { root.style.setProperty("--vw", root.clientWidth + "px"); };
  setVw();
  addEventListener("resize", setVw);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n, l) { n = String(n); while (n.length < l) n = "0" + n; return n; };

  /* ---------------- content ---------------- */
  // page order: three wide, the four shorts in one row, three wide, then the invite across the full row
  var WORK = [
    { id: "ZoOMuQ95bJ0", url: "https://youtu.be/ZoOMuQ95bJ0", cat: "documentary", tag: "Documentary & Travel", t: "Nadir On The Go", d: "Cinematic travel-documentary storytelling in English and Bangla, for a multi-million-follower audience." },
    { id: "zyeqZQZGgHg", url: "https://youtu.be/zyeqZQZGgHg", cat: "education", tag: "Education", t: "Oana Labes", d: "Social content for a finance educator, turning complex financial topics into approachable video." },
    { id: "JJa0xWixd-E", url: "https://youtu.be/JJa0xWixd-E", cat: "government", tag: "Government & Civic", t: "Mayor Ella Winnall", d: "Civic communications and social content for the mayoral office of Berri Barmera Council, South Australia." },
    { id: "xbktF6TNylM", url: "https://youtube.com/shorts/xbktF6TNylM", cat: "retail", tag: "Retail & Lifestyle", t: "The Fifth Design", d: "Personalised wedding gifts and homewares. Product-led social content for an Australian lifestyle brand." },
    { id: "z-ZN2UTyHwQ", url: "https://youtube.com/shorts/z-ZN2UTyHwQ", cat: "professional", tag: "Professional Services", t: "Marley Jaxx", d: "Personal branding and content strategy for founders, built to turn industry recognition into revenue." },
    { id: "HXGepJP7idI", url: "https://youtube.com/shorts/HXGepJP7idI", cat: "education", tag: "Education", t: "ALOHA", d: "A nationally recognised mental-arithmetic and kids' brain-development brand. Social content that speaks to parents." },
    { id: "4Duj7L-xuYA", url: "https://youtube.com/shorts/4Duj7L-xuYA", cat: "hospitality", tag: "Hospitality", t: "Sandy Land", d: "Social content built to drive direct bookings for a hospitality brand." },
    { id: "U_49C1i4OsQ", url: "https://youtu.be/U_49C1i4OsQ", cat: "professional", tag: "Professional Services", t: "Marco", d: "Personal-branding content for a senior marketing professional, built to stand out in a competitive job market." },
    { id: "tjKMuzdjyxE", url: "https://youtu.be/tjKMuzdjyxE", cat: "tech", tag: "Tech & SaaS", t: "CWS Platform", d: "Social content for a digital coupons and discounts platform, helping retailers sell more online." },
    { id: "NYoEq-wbPs8", url: "https://youtu.be/NYoEq-wbPs8", cat: "partner", tag: "Agency Partner", t: "FullStackRush", d: "Video editing delivered as an extension of their in-house team. An agency partnership, not a one-off gig.", q: "sddefault" }
  ];
  var CLIENTS = ["Nadir On The Go", "ALOHA", "iinteca", "Sandy Land Hotel & Resort", "CWS Platform", "The Fifth Design", "Marley Jaxx", "Marco", "FullStackRush", "Oana Labes", "Mayor Ella Winnall", "Parish Patience", "ESI Global", "Btax", "GRS Learning", "Globeye", "The Luggage Zing", "Faith & Freedom", "Ari Teman", "Jiovani", "Anderson"];
  // thumbnails: YouTube's full 1280px WebP (sharp, about half the weight of the JPEG);
  // if a clip has none (YouTube answers with a 120px grey placeholder), the 640px WebP, and last the 480px JPEG
  var thumb = function (w) { return "https://i.ytimg.com/vi_webp/" + w.id + "/maxresdefault.webp"; };
  var thumbFallback = function (w) { return "if(this.src.indexOf('maxresdefault')>0){this.src='https://i.ytimg.com/vi_webp/" + w.id + "/sddefault.webp'}else{this.onerror=null;this.src='https://i.ytimg.com/vi/" + w.id + "/hqdefault.jpg'}"; };
  var isShort = function (w) { return /shorts/.test(w.url); };
  // a short's thumbnail is a vertical frame pillarboxed in a wide image; crop to just the frame
  // (works for both thumbnail shapes YouTube serves: 16:9 maxres, and 4:3 hq with bars top and bottom)
  window.frameCut = function (img) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    var contentH = Math.min(nh, nw * 9 / 16);              // the 16:9 picture inside the thumbnail
    var frameW = contentH * 9 / 16;                         // the vertical frame inside that
    img.style.setProperty("--cut", ((1 - frameW / nw) / 2 * 100).toFixed(2) + "%");
    img.style.setProperty("--fw", (nw / frameW).toFixed(4)); // scale that makes the frame fill the box width
  };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };

  /* ---------------- render work + clients ---------------- */
  var grid = $("#work-grid");
  grid.innerHTML = WORK.map(function (w, i) {
    return '<a class="cell work reveal' + (isShort(w) ? " work-short" : "") + '" href="' + w.url + '" target="_blank" rel="noopener noreferrer" data-cat="' + w.cat + '" data-cursor="Play" aria-label="Watch ' + esc(w.t) + ' on YouTube (opens in new tab)">' +
      '<div class="cell-head"><span>' + esc(w.tag) + '</span><span>' + pad(i + 1, 2) + '</span></div>' +
      (isShort(w) ? '<div class="media is-short"><img class="fg" src="' + thumb(w) + '" alt="" loading="lazy" decoding="async" onerror="' + thumbFallback(w) + '" onload="if(this.naturalWidth<=120)this.onerror();else frameCut(this)">' : '<div class="media"><img src="' + thumb(w) + '" alt="" loading="lazy" decoding="async" onerror="' + thumbFallback(w) + '" onload="if(this.naturalWidth<=120)this.onerror()">') +
      '<p class="work-desc">' + esc(w.d) + '</p></div>' +
      '<div class="work-body"><h3>' + esc(w.t) + '</h3><span class="work-link">Watch ↗</span></div></a>';
  }).join("") +
    '<a class="cell work work-next reveal" href="#contact" data-cat="all"><span class="box">↗</span><b>Your brand, next.</b><span>' + pad(WORK.length + 1, 2) + ' / Book a meeting</span></a>';


  /* ---------------- client roll (from v2): names drift by, re-shuffle on hover ---------------- */
  var rollTrack = $("#roll-track"), roll = $("#roll");
  var rollSet = CLIENTS.map(function (c) { return '<span class="rq">' + esc(c) + '</span><i aria-hidden="true">/</i>'; }).join("");

  /* both scrolling strips loop seamlessly at any screen width: one half is the item set repeated
     until it's at least as wide as the strip, the second half is an exact copy, and the track
     slides by one half (CSS keyframe "tick"). Duration follows the width so the speed stays constant. */
  function loopStrip(track, unitHTML, pxPerSec) {
    function build() {
      track.innerHTML = '<div class="loop-half">' + unitHTML + "</div>";
      var unitW = track.firstChild.scrollWidth || 1, viewW = track.parentElement.clientWidth || innerWidth;
      var k = Math.max(1, Math.ceil(viewW / unitW));
      var half = new Array(k + 1).join(unitHTML);
      track.innerHTML = '<div class="loop-half">' + half + '</div><div class="loop-half" aria-hidden="true">' + half + "</div>";
      track.style.animationDuration = (unitW * k / pxPerSec).toFixed(1) + "s";
    }
    build();
    var w = innerWidth, t;
    addEventListener("resize", function () { if (innerWidth === w) return; w = innerWidth; clearTimeout(t); t = setTimeout(build, 200); });
    if (document.fonts) document.fonts.ready.then(build);       // widths change once the fonts arrive
  }
  loopStrip(rollTrack, rollSet, 28);
  var tickerTrack = $(".ticker-track");
  if (tickerTrack) {
    var tickItems = $$("span", tickerTrack);
    loopStrip(tickerTrack, tickItems.slice(0, tickItems.length / 2).map(function (e) { return e.outerHTML; }).join(""), 32);
  }

  // client names re-shuffle on hover (delegated, so it survives the strips being rebuilt)
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*/";
  rollTrack.addEventListener("pointerover", function (e) {
    var el = e.target.closest && e.target.closest(".rq");
    if (!el || el.dataset.busy || reduceMotion) return;
    el.dataset.busy = "1";
    var txt = el.textContent, t0 = performance.now(), dur = 520;
    el.style.minWidth = el.offsetWidth + "px";
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1), done = Math.floor(k * txt.length);
      el.textContent = txt.split("").map(function (ch, i) { return i < done || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }).join("");
      if (k < 1) requestAnimationFrame(step); else { el.textContent = txt; el.style.minWidth = ""; delete el.dataset.busy; }
    })(t0);
  });
  // the roll leans with scroll speed
  var rollSkew = 0, rollLastY = scrollY;
  function tickRoll() {
    var dy = scrollY - rollLastY; rollLastY = scrollY;
    if (reduceMotion || (dy === 0 && rollSkew === 0)) return;
    rollSkew += (clamp(dy * .35, -9, 9) - rollSkew) * .12;
    if (Math.abs(rollSkew) < .01) rollSkew = 0;
    roll.style.transform = rollSkew ? "skewX(" + rollSkew.toFixed(2) + "deg)" : "";
  }

  /* ---------------- reveal + counters ---------------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach(function (el) {
    var sibs = $$(".reveal", el.parentElement);
    el.style.transitionDelay = (Math.min(sibs.indexOf(el), 5) * 70) + "ms";
    io.observe(el);
  });
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, t0 = performance.now();
      if (reduceMotion) { el.textContent = to; return; }
      (function step(now) {
        var k = clamp((now - t0) / 1600, 0, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------------- hero: the spiral galaxy of thumbnails lives in galaxy.js (three.js) ---------------- */
  window.JCUT_WIDE_IDS = WORK.filter(function (w) { return !isShort(w); }).map(function (w) { return w.id; });

  /* =========================================================
     SIDE RULER + FLYING SECTION NAMES
     Every section name lives in one of four places:
       waiting  - small, dim, stacked bottom-right
       ruler    - written up the ruler at that section's mark, riding with the scroll
       active   - when the needle reaches it, the letters lift off one by one,
                  turn upright and land big at the top-right
       past     - shrinks into the small stack at the top when the next name lands
     The hero wordmark is the first name: it flies from the hero to the top.
     ========================================================= */
  var mainEl = $("main");
  var NAV = 50, SMALL = .36, RULE = .5, BASE = 34, ROW = 16, RW = 52;
  var rulerEl = $("#ruler"), strip = $("#ruler-strip"), band = $("#ruler-band");
  var needle = $("#needle"), odo = $("#odo"), flyEl = $("#fly"), wordmark = $(".wordmark");
  var navLinks = $$(".nav-links a");
  var gutterRoom = function () { return root.clientWidth - mainEl.getBoundingClientRect().right - RW - 26; };
  var flyOn = matchMedia("(min-width: 981px)").matches && !reduceMotion;
  var stripH = 0, H = 0, vh = innerHeight, vw = root.clientWidth, p = 0;

  function docH() { var f = $(".foot"); return f.getBoundingClientRect().bottom + scrollY; }

  // odometer: three rolling digit columns
  odo.innerHTML = [0, 1, 2].map(function () { return '<span class="col">' + "0123456789".split("").map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</span>"; }).join("") + "<b>%</b>";
  var odoCols = $$(".col", odo);

  // the names, in page order
  var SECS = [{ id: "top", name: "J Cut", el: $("#top") }].concat($$("section[id]").filter(function (s) { return s.id !== "top"; }).map(function (s) { return { id: s.id, name: s.dataset.name, el: s }; }));

  var mainRight = 0;
  function buildRuler() {
    vh = innerHeight; vw = root.clientWidth;
    mainRight = mainEl.getBoundingClientRect().right;
    H = docH();
    stripH = H;                                        // the ruler is the page, 1:1
    var html = "";
    for (var i = 0; i <= 500; i++) {
      var y = (i / 500) * stripH, big = i % 25 === 0, mid = i % 5 === 0;
      html += '<i class="t' + (big ? " big" : mid ? " mid" : "") + '" style="top:' + y.toFixed(1) + 'px"></i>';
      if (big) html += '<span class="n" style="top:' + y.toFixed(1) + 'px">' + (i / 5) + "</span>";
    }
    strip.innerHTML = html;
    strip.style.height = stripH + "px";
    band.style.height = Math.max(24, vh * vh / H) + "px";
    SECS.forEach(function (s) {
      s.top = s.el.getBoundingClientRect().top + scrollY;
    });
    measureLetters();
  }

  // build one span per letter; widths are measured at the base size
  var letters = [];
  if (flyOn) {
    root.classList.add("fly-on");
    var html = "";
    SECS.forEach(function (s, si) {
      s.letters = [];
      s.name.toUpperCase().split("").forEach(function (ch) {
        if (ch === " ") { s.letters.push({ space: true }); return; }
        html += '<span data-s="' + si + '">' + ch + "</span>";
      });
    });
    flyEl.innerHTML = html;
    var spans = $$("span", flyEl), k = 0;
    SECS.forEach(function (s) {
      s.letters.length = 0;
      s.name.toUpperCase().split("").forEach(function (ch) {
        if (ch === " ") { s.letters.push({ space: true }); return; }
        var L = { el: spans[k++], x: vw - RW / 2, y: vh, r: 0, sc: SMALL, c: 35 };
        s.letters.push(L); letters.push(L);
      });
    });
  }

  var heroGlyphs = [];
  function measureLetters() {
    if (!flyOn) return;
    var fs = parseFloat(getComputedStyle(wordmark).fontSize);
    SECS.forEach(function (s) {
      s.w = 0;
      s.letters.forEach(function (L) {
        if (L.space) { L.w = BASE * .32; } else if (s.id === "top") { L.el.style.fontSize = fs + "px"; L.w = L.el.offsetWidth * BASE / fs; L.big = BASE / fs; } else { L.el.style.fontSize = BASE + "px"; L.w = L.el.offsetWidth; }
        L.cx = s.w + L.w / 2; s.w += L.w;
      });
    });
    // the hero wordmark's letters, in page coordinates, to start the first name from
    heroGlyphs = [];
    var walker = document.createTreeWalker(wordmark, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      for (var i = 0; i < node.length; i++) {
        if (!node.data[i].trim()) continue;
        var rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1);
        var r = rg.getBoundingClientRect();
        heroGlyphs.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY, s: fs / BASE });
      }
    }
  }

  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  // per-letter stagger: letter k of n starts a little after letter k-1
  var stag = function (t, k, n) { return clamp(t * 1.4 - (k / Math.max(1, n - 1)) * .4, 0, 1); };

  // without the flying names (narrow screens), still track the current section for the nav
  function activeByScroll() {
    var a = 0;
    SECS.forEach(function (s, i) { if (s.top !== undefined && s.top - scrollY <= NAV + 72) a = i; });
    return a;
  }

  function targets() {
    var needleY = NAV + p * (vh - NAV - 2);
    var stripY = NAV - scrollY;                        // tick 0 rides with the top of the page
    if (!flyOn) return { needleY: needleY, stripY: stripY, active: activeByScroll() };
    // the names live in the empty space between the frame and the ruler, never over the design
    var stackR = vw - RW - 12;
    var avail = Math.max(10, stackR - (mainRight + 14));
    var rulerX = vw - RW / 2;

    // how far each name has popped (0 on the ruler / waiting, 1 landed at the top)
    var pop = SECS.map(function (s, i) {
      if (i === 0) return clamp(scrollY / (vh * .45), 0, 1);
      var y = s.top - scrollY;                         // the section's top edge on screen = its mark on the ruler
      return clamp(1 - (y - (NAV + 40)) / 80, 0, 1);
    });
    var active = 0;
    pop.forEach(function (v, i) { if (v >= .5) active = i; });
    var past = 0, waiting = 0;
    SECS.forEach(function (s, i) { if (i < active) past++; else if (i > active) waiting++; });

    var wi = 0;
    SECS.forEach(function (s, i) {
      var n = s.letters.length;
      var big = Math.min(1, avail / s.w);                 // active size, shrunk to fit the gutter
      var sm = Math.min(SMALL, avail / s.w);
      var mark = s.top - scrollY;
      // slots
      var pastSlot = NAV + 32 + Math.min(i, past) * ROW;
      var activeSlot = NAV + 32 + past * ROW + 6 + BASE * big / 2;
      var waitSlot = vh - 30 - (waiting - 1 - (i > active ? wi : 0)) * ROW;
      if (i > active) wi++;
      // how close the name is to the ruler (enters from below the fold)
      var onRuler = i === 0 ? 0 : clamp((vh + 60 - (mark + s.w * RULE)) / 160, 0, 1);
      // Work's section starts inside the first screen, so at the very top it would sit half-lifted;
      // keep it waiting until the page starts to move, then let it rise onto the ruler
      if (i === 1) onRuler = Math.min(onRuler, clamp(scrollY / (vh * .18), 0, 1));
      var landed = pop[i];
      var demote = i < SECS.length - 1 ? clamp((pop[i + 1] - .5) * 2, 0, 1) : 0;
      if (i < active) demote = 1;

      var gi = 0;
      s.letters.forEach(function (L, k) {
        if (L.space) return;
        var g0 = gi++;
        var tl = ease(stag(landed, k, n));
        // waiting / past: small and horizontal, right-aligned
        var smallX = stackR - s.w * sm + L.cx * sm;
        // ruler: rotated, reading bottom to top, top of the word on the mark
        var rx = rulerX, ry = mark + (s.w - L.cx) * RULE;
        // active: big, right-aligned
        var bigX = stackR - (s.w - L.cx) * big;
        var x, y, r, sc, c;
        if (i === 0) {
          var g = heroGlyphs[g0] || { x: bigX, y: activeSlot + scrollY, s: 1 };
          x = lerp(g.x, bigX, tl); y = lerp(g.y - scrollY, activeSlot, tl);
          r = Math.sin(tl * Math.PI) * -18; sc = lerp(g.s, big, tl); c = 100;
        } else {
          var tr = ease(stag(onRuler, n - 1 - k, n));
          x = lerp(smallX, rx, tr); y = lerp(waitSlot, ry, tr); r = lerp(0, -90, tr); sc = lerp(sm, RULE, tr); c = lerp(35, 55, tr);
          x = lerp(x, bigX, tl); y = lerp(y, activeSlot, tl); r = lerp(r, 0, tl); sc = lerp(sc, big, tl); c = lerp(c, 100, tl);
        }
        if (demote > 0) {
          var td = ease(stag(demote, k, n));
          x = lerp(x, smallX, td); y = lerp(y, pastSlot, td); sc = lerp(sc, sm, td); c = lerp(c, 35, td); r = lerp(r, 0, td);
        }
        L.tx = x; L.ty = y; L.tr = r; L.ts = sc; L.tc = c;
      });
    });
    return { needleY: needleY, stripY: stripY, active: active };
  }

  var lastActive = -1;
  function renderRuler() {
    H = H || docH();
    p = clamp(scrollY / Math.max(1, H - vh), 0, 1);
    var t = targets();
    strip.style.transform = "translate3d(0," + t.stripY.toFixed(1) + "px,0)";
    band.style.transform = "translate3d(0," + t.needleY.toFixed(1) + "px,0)";
    needle.style.transform = "translate3d(0," + t.needleY.toFixed(1) + "px,0)";
    needle.style.opacity = p < .003 ? 0 : 1;
    var pct = pad(Math.round(p * 100), 3);
    odoCols.forEach(function (c, i) { c.style.transform = "translateY(" + (-(+pct[i])) + "em)"; });
    rulerEl.setAttribute("aria-valuenow", Math.round(p * 100));
    if (t.active !== lastActive) {
      lastActive = t.active;
      var id = SECS[t.active].id;
      navLinks.forEach(function (a) { a.classList.toggle("is-active", a.dataset.sec === id); });
    }
  }

  // letters ease towards their targets every frame (so slot changes glide)
  function tickLetters() {
    if (!flyOn) return;
    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      if (L.tx === undefined) continue;
      if (L.init) {
        L.x += (L.tx - L.x) * .22; L.y += (L.ty - L.y) * .22; L.r += (L.tr - L.r) * .22; L.sc += (L.ts - L.sc) * .22; L.c += (L.tc - L.c) * .22;
      } else { L.x = L.tx; L.y = L.ty; L.r = L.tr; L.sc = L.ts; L.c = L.tc; L.init = true; }
      // only touch the DOM when something visibly changed, so idle frames cost nothing
      var tf = "translate3d(" + L.x.toFixed(1) + "px," + L.y.toFixed(1) + "px,0) translate(-50%,-50%) rotate(" + L.r.toFixed(1) + "deg) scale(" + (L.sc * (L.big || 1)).toFixed(3) + ")";
      if (tf !== L.tfS) { L.tfS = tf; L.el.style.transform = tf; }
      var c = L.c.toFixed(0);
      if (c !== L.cS) { L.cS = c; L.el.style.color = "color-mix(in srgb, var(--ink) " + c + "%, var(--bg))"; }
    }
    var dot = (1 - clamp(scrollY / (vh * .25), 0, 1)).toFixed(2);
    if (wordmark && dot !== lastDot) { lastDot = dot; wordmark.style.setProperty("--dot", dot); }
  }
  var lastDot = "";

  // click or drag on the ruler to move through the page
  var dragging = false;
  function seek(e) {
    var q = clamp((e.clientY - NAV) / (vh - NAV), 0, 1);
    scrollTo({ top: q * (H - vh), behavior: dragging ? "auto" : "smooth" });
  }
  rulerEl.addEventListener("pointerdown", function (e) { dragging = true; rulerEl.setPointerCapture(e.pointerId); seek(e); });
  rulerEl.addEventListener("pointermove", function (e) { if (dragging) seek(e); });
  rulerEl.addEventListener("pointerup", function () { dragging = false; });

  var scrollQueued = false;
  addEventListener("scroll", function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () { scrollQueued = false; renderRuler(); });
  }, { passive: true });
  addEventListener("resize", function () { buildRuler(); renderRuler(); });
  addEventListener("load", function () { buildRuler(); renderRuler(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { buildRuler(); renderRuler(); }).observe($("main"));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { buildRuler(); renderRuler(); });
  buildRuler(); renderRuler();

  /* ---------------- smooth anchor scroll ---------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    var t = id === "#top" ? null : $(id);
    if (id !== "#top" && !t) return;
    e.preventDefault();
    setMenu(false);
    var y = t ? t.getBoundingClientRect().top + scrollY - 50 : 0;
    scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------- menu + theme ---------------- */
  var sheet = $("#sheet"), menuBtn = $("#menu-btn");
  function setMenu(open) { sheet.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); }
  menuBtn.addEventListener("click", function () { setMenu(sheet.hidden); });
  $("#theme").addEventListener("click", function () {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    var tc = $("meta[name=theme-color]"); if (tc) tc.content = next === "light" ? "#f2f1ee" : "#0c0c0e";
    try { localStorage.setItem("jcut-theme", next); } catch (e) {}
  });

  /* ---------------- date ---------------- */
  var todayEl = $("#today");
  function clock() {
    var now = new Date();
    todayEl.textContent = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(now).replace(/,/g, "");
  }
  clock(); setInterval(clock, 30000);

  /* ---------------- process meter ---------------- */
  var steps = $$(".step"), meter = $("#meter"), fill = $("#meter-fill"), pctEls = $$(".m-pct"), stageEls = $$(".m-stage");
  var shownPct = 0, pctRaf = 0;
  function setMeter(pct, stage, el) {
    fill.style.width = pct + "%";
    meter.style.setProperty("--p", pct + "%");
    stageEls.forEach(function (e) { e.textContent = stage; });
    steps.forEach(function (s) { s.classList.toggle("is-on", s === el); });
    cancelAnimationFrame(pctRaf);
    var from = shownPct, t0 = performance.now();
    (function step(now) {
      var k = clamp((now - t0) / 600, 0, 1);
      shownPct = Math.round(from + (pct - from) * (1 - Math.pow(1 - k, 3)));
      pctEls.forEach(function (e) { e.textContent = pad(shownPct, 3); });
      if (k < 1) pctRaf = requestAnimationFrame(step);
    })(t0);
  }
  steps.forEach(function (s) {
    s.addEventListener("mouseenter", function () { setMeter(+s.dataset.pct, s.dataset.stage, s); });
    s.addEventListener("focus", function () { setMeter(+s.dataset.pct, s.dataset.stage, s); });
  });
  $("#steps").addEventListener("mouseleave", function () { setMeter(0, "Standing by", null); });

  /* ---------------- dotted cursor (white) ---------------- */
  var cursorEl = $("#cursor"), labelEl = $("#cursor-label");
  var trail = $$(".c", cursorEl);
  var px = -200, py = -200, cursorSeen = false, lastMove = performance.now(), sleeping = false;
  var pos = trail.map(function () { return { x: -200, y: -200 }; });
  function setCursorState(t) {
    if (!t || !t.closest) return;
    var dc = t.closest("[data-cursor]");
    var isText = !!t.closest("input,textarea");
    var isLink = !!t.closest("a,button,[role=button],label,.step") && !t.closest(".btn");
    cursorEl.classList.toggle("is-big", !!dc);
    if (dc) labelEl.textContent = dc.getAttribute("data-cursor");
    labelEl.classList.toggle("is-on", !!dc);
    cursorEl.classList.toggle("is-link", !dc && isLink && !isText);
    cursorEl.classList.toggle("is-text", isText);
  }
  if (!reduceMotion) {
    addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      px = e.clientX; py = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        root.classList.add("has-cursor");
        pos.forEach(function (p) { p.x = px; p.y = py; });
        cursorEl.classList.add("is-on");
      }
      lastMove = performance.now();
      if (sleeping) { sleeping = false; cursorEl.classList.remove("is-big"); labelEl.classList.remove("is-on"); setCursorState(e.target); }
    }, { passive: true });
    document.addEventListener("mouseover", function (e) { if (!sleeping) setCursorState(e.target); });
    document.addEventListener("mouseleave", function () { cursorEl.classList.remove("is-on"); });
    document.addEventListener("mouseenter", function () { if (cursorSeen) cursorEl.classList.add("is-on"); });
    addEventListener("pointerdown", function () { cursorEl.classList.add("is-down"); });
    addEventListener("pointerup", function () { cursorEl.classList.remove("is-down"); });
  }
  var cursorRest = false, lastPx = 0, lastPy = 0;
  function tickCursor() {
    if (!cursorSeen) return;
    var still = px === lastPx && py === lastPy;
    lastPx = px; lastPy = py;
    if (still && cursorRest) { checkSleep(); return; }
    cursorEl.style.transform = "translate(" + px + "px," + py + "px)";
    for (var i = 0; i < trail.length; i++) {
      var tx = i === 0 ? px : pos[i - 1].x, ty = i === 0 ? py : pos[i - 1].y, k = i === 0 ? .55 : .4;
      pos[i].x += (tx - pos[i].x) * k; pos[i].y += (ty - pos[i].y) * k;
      var ox = clamp(pos[i].x - px, -110, 110), oy = clamp(pos[i].y - py, -110, 110);
      trail[i].style.transform = "translate(" + ox.toFixed(1) + "px," + oy.toFixed(1) + "px)";
      if (Math.abs(tx - pos[i].x) > .25 || Math.abs(ty - pos[i].y) > .25) still = false;
    }
    cursorRest = still;
    labelEl.style.transform = "translate(" + pos[0].x.toFixed(1) + "px," + pos[0].y.toFixed(1) + "px) translate(-50%,-50%)";
    checkSleep();
  }
  // easter egg: leave the mouse alone for 20s and the cursor dozes off
  function checkSleep() {
    if (!sleeping && performance.now() - lastMove > 20000) {
      sleeping = true;
      cursorEl.classList.add("is-big"); cursorEl.classList.remove("is-link", "is-text");
      labelEl.textContent = "zZ"; labelEl.classList.add("is-on");
    }
  }

  /* ---------------- the wordmark, drawn in dots (as on the previous site) ----------------
     The hero word is a field of dots copied from the real letters (same font, size, place).
     Dots near the cursor scatter, turn orange while they're away, and spring home.
     On desktop the dots belong to the flying letters: when the page scrolls, each letter's
     dots travel, turn and shrink with it, and only near the end of the flight, once the
     letter is small, do they hand over to the solid name in the corner. */
  var dotWord = (function () {
    if (!wordmark || reduceMotion) return { tick: function () {} };
    var cv = document.createElement("canvas");
    cv.className = "wm-dots"; cv.setAttribute("aria-hidden", "true");
    var ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    var fly = flyOn;                        // desktop: dots follow the flying letters
    var R = 90, gap = 4, pts = [], built = false, asleep = false, lastSig = "";
    var cw = 0, ch = 0, ox0 = 0, oy0 = 0;   // canvas size; page position of its top-left (smaller screens)
    var wmBox = { l: 0, r: 0, t: 0, b: 0 }, heroL = [], m = { x: -9999, y: -9999 }, ink = "#fff", accent = "#ff4b2b";

    var stretchKw = function (v) { v = parseFloat(v) || 100; return v >= 150 ? "ultra-expanded" : v >= 125 ? "expanded" : v >= 112.5 ? "semi-expanded" : "normal"; };
    function readColors() {
      var cs = getComputedStyle(root);
      ink = cs.getPropertyValue("--ink").trim() || ink;
      accent = cs.getPropertyValue("--accent").trim() || accent;
    }

    // the letters to copy, as boxes in page coordinates: on desktop the flying letters at
    // rest (centred on the hero glyphs), on smaller screens the heading itself
    function readGlyphs() {
      var out = [], fs = parseFloat(getComputedStyle(wordmark).fontSize);
      if (fly) {
        heroL = SECS[0].letters.filter(function (L) { return !L.space; });
        heroL.forEach(function (L, k) {
          var g = heroGlyphs[k], cs = getComputedStyle(L.el);
          if (!g) return;
          out.push({ ch: L.el.textContent, cx: g.x, cy: g.y, h: fs, font: cs.fontWeight + " " + fs + "px " + cs.fontFamily, stretch: stretchKw(cs.fontStretch) });
        });
        return out;
      }
      var cs = getComputedStyle(wordmark);
      var walker = document.createTreeWalker(wordmark, NodeFilter.SHOW_TEXT), node;
      while ((node = walker.nextNode())) {
        for (var i = 0; i < node.length; i++) {
          if (!node.data[i].trim()) continue;
          var rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1);
          var r = rg.getBoundingClientRect();
          out.push({ ch: node.data[i], cx: r.left + r.width / 2, cy: r.top + r.height / 2 + scrollY, h: r.height, font: cs.fontWeight + " " + fs + "px " + cs.fontFamily, stretch: stretchKw(cs.fontStretch) });
        }
      }
      return out;
    }

    function build() {
      var glyphs = readGlyphs();
      if (!glyphs.length) return;
      var fs = parseFloat(getComputedStyle(wordmark).fontSize);
      R = clamp(fs * .55, 50, 115);
      gap = clamp(Math.round(fs / 46), 3, 6);
      // sample the letters (drawn like a line-height:1 box centred on each glyph) into a dot grid
      var wr = wordmark.getBoundingClientRect(), pad = Math.round(fs * .3);
      wmBox = { l: wr.left, r: wr.right, t: wr.top + scrollY, b: wr.bottom + scrollY };
      var sx = Math.floor(wr.left - pad), sy = Math.floor(wr.top + scrollY - pad);
      var sw = Math.ceil(wr.width + pad * 2), sh = Math.ceil(wr.height + pad * 2);
      var off = document.createElement("canvas"); off.width = sw; off.height = sh;
      var o = off.getContext("2d");
      o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "alphabetic";
      glyphs.forEach(function (g) {
        o.font = g.font;
        if ("fontStretch" in o) o.fontStretch = g.stretch;
        var mt = o.measureText(g.ch), asc = mt.fontBoundingBoxAscent, desc = mt.fontBoundingBoxDescent;
        o.fillText(g.ch, g.cx - sx, g.cy - sy - g.h / 2 + (g.h - (asc + desc)) / 2 + asc);
      });
      var data = o.getImageData(0, 0, sw, sh).data;
      pts = [];
      for (var y = gap / 2; y < sh; y += gap) {
        for (var x = gap / 2; x < sw; x += gap) {
          if (data[((y | 0) * sw + (x | 0)) * 4 + 3] <= 140) continue;
          // home in page coordinates, and which letter it belongs to (nearest centre)
          var hx = sx + x, hy = sy + y, li = 0, best = 1e9;
          for (var k = 0; k < glyphs.length; k++) { var d = Math.abs(glyphs[k].cx - hx); if (d < best) { best = d; li = k; } }
          pts.push({ hx: hx, hy: hy, x: hx, y: hy, vx: 0, vy: 0, li: li, gx: glyphs[li].cx, gy: glyphs[li].cy });
        }
      }
      // where the canvas lives: over the whole screen in the flying-letters layer (desktop),
      // or just around the heading (smaller screens)
      if (fly) {
        if (cv.parentNode !== flyEl) flyEl.appendChild(cv);
        cw = root.clientWidth; ch = innerHeight;
        cv.style.left = cv.style.top = "0px";
      } else {
        if (cv.parentNode !== wordmark) wordmark.appendChild(cv);
        ox0 = sx; oy0 = sy; cw = sw; ch = sh;
        cv.style.left = (sx - wr.left) + "px"; cv.style.top = (sy - (wr.top + scrollY)) + "px";
      }
      cv.style.width = cw + "px"; cv.style.height = ch + "px";
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readColors();
      built = true; asleep = false; lastSig = "";
      root.classList.add("wm-dots-on");
    }

    // how "dotted" a flying letter still is: full dots while it's big, handing over to
    // the solid letter as it shrinks into the corner
    function dotAmount(k) { return clamp((k - .32) / .26, 0, 1); }

    function draw() {
      ctx.clearRect(0, 0, cw, ch);
      var r0 = gap * .4, frames = [];
      if (fly) {
        for (var i = 0; i < heroL.length; i++) {
          var L = heroL[i], k = L.sc * (L.big || 1), a = L.r * Math.PI / 180, amt = dotAmount(k);
          L.el.style.opacity = (1 - amt).toFixed(3);          // the solid letter fades in as its dots go
          frames.push({ x: L.x, y: L.y, k: k, c: Math.cos(a), s: Math.sin(a), amt: amt });
        }
      }
      var groups = fly ? frames.length : 1;
      for (var pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass ? accent : ink;
        // one group per letter on desktop (each has its own opacity), one in total otherwise
        for (var gi = 0; gi < groups; gi++) {
          var F = fly ? frames[gi] : null;
          if (F && F.amt <= 0) continue;
          ctx.globalAlpha = F ? F.amt : 1;
          ctx.beginPath();
          for (var j = 0; j < pts.length; j++) {
            var p = pts[j];
            if (F && p.li !== gi) continue;
            if ((Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy) > 5) !== !!pass) continue;
            var X, Y, r = r0;
            if (F) {
              var rx = p.x - p.gx, ry = p.y - p.gy;
              X = F.x + (F.c * rx - F.s * ry) * F.k; Y = F.y + (F.s * rx + F.c * ry) * F.k; r = Math.max(.5, r0 * F.k);
            } else { X = p.x - ox0; Y = p.y - oy0; }
            ctx.moveTo(X + r, Y); ctx.arc(X, Y, r, 0, 6.2832);
          }
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // the cursor, in the same page coordinates as the dots' homes
    addEventListener("pointermove", function (e) {
      m.x = e.clientX; m.y = e.clientY + scrollY;
      asleep = false;
    }, { passive: true });
    document.addEventListener("mouseleave", function () { m.x = m.y = -9999; });
    // a click near the word blows it apart
    addEventListener("pointerdown", function (e) {
      if (!built || (fly && scrollY > 8)) return;
      var cx = e.clientX, cy = e.clientY + scrollY, b = wordmark.getBoundingClientRect();
      if (cx < b.left - 40 || cx > b.right + 40 || cy < b.top + scrollY - 40 || cy > b.bottom + scrollY + 40) return;
      pts.forEach(function (p) {
        var dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = 28 / (1 + d / 60);
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      });
      asleep = false;
    });
    new MutationObserver(function () { readColors(); lastSig = ""; asleep = false; }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    var rz;
    function rebuild() { clearTimeout(rz); rz = setTimeout(build, 180); }
    addEventListener("resize", rebuild);
    addEventListener("load", rebuild);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(rebuild);

    return {
      tick: function () {
        if (!built) return;
        // redraw when the flying letters moved (scroll) or the dots are still settling
        var sig = "";
        if (fly) for (var i = 0; i < heroL.length; i++) sig += heroL[i].x.toFixed(1) + "," + heroL[i].y.toFixed(1) + "," + heroL[i].sc.toFixed(3) + "," + heroL[i].r.toFixed(1) + ";";
        if (asleep && sig === lastSig) return;
        lastSig = sig;
        // the cursor only pushes dots while the word sits at home
        var push = !fly || scrollY <= 8, moving = false, R2 = R * R;
        for (var j = 0; j < pts.length; j++) {
          var p = pts[j];
          if (push) {
            var dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              var d = Math.sqrt(d2) || 1, f = Math.pow(1 - d / R, 2) * 5.5;
              p.vx += (dx / d) * f; p.vy += (dy / d) * f;
            }
          }
          p.vx += (p.hx - p.x) * .045; p.vy += (p.hy - p.y) * .045;
          p.vx *= .84; p.vy *= .84;
          p.x += p.vx; p.y += p.vy;
          if (!moving && (Math.abs(p.vx) > .02 || Math.abs(p.vy) > .02 || Math.abs(p.x - p.hx) > .05 || Math.abs(p.y - p.hy) > .05)) moving = true;
        }
        draw();
        var near = false;
        if (push && m.x > -1e4) {
          var b = wmBox, e = R + 40;
          near = m.x > b.l - e && m.x < b.r + e && m.y > b.t - e && m.y < b.b + e;
        }
        if (!moving && !near) asleep = true;
      }
    };
  })();

  /* ---------------- one loop drives the orbit and the cursor ---------------- */
  (function loop(now) {
    tickLetters();
    dotWord.tick();
    tickRoll();
    tickCursor();
    requestAnimationFrame(loop);
  })(performance.now());

  /* ---------------- contact form (Web3Forms) ---------------- */
  var form = $("#contact-form");
  if (form) {
    var statusEl = $("#form-status"), btn = $('button[type="submit"]', form), lbl = $(".btn-label", btn), lblText = lbl.textContent;
    var setStatus = function (t, k) { statusEl.textContent = t; statusEl.className = "form-status" + (k ? " is-" + k : ""); };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", ""); btn.disabled = true; lbl.textContent = "Sending…";
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          btn.disabled = false; lbl.textContent = lblText;
          if (d.success) { form.reset(); setStatus("Thanks. Your request is in; we'll reply within one business day to set a time.", "success"); }
          else setStatus("Something went wrong. Please email us at jcut.agency@gmail.com.", "error");
        })
        .catch(function () { btn.disabled = false; lbl.textContent = lblText; setStatus("Something went wrong. Please email us at jcut.agency@gmail.com.", "error"); });
    });
  }

  /* =========================================================
     EASTER EGGS (nothing announces them)
     ========================================================= */
  var toast = $("#toast"), toastT;
  function showToast(m, ms) { toast.textContent = m; toast.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("is-on"); }, ms || 3200); }

  // email links: a mailto does nothing on machines with no mail app set up (webmail users),
  // so every click also copies the address and says so
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    var addr = a.getAttribute("href").slice(7).split("?")[0];
    var done = function () { showToast("Copied " + addr + " to your clipboard", 3600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, function () { showToast("Email us at " + addr, 4200); });
    else showToast("Email us at " + addr, 4200);
  });
  var splice = $("#splice"), splicing = false;
  function doSplice(msg) {
    if (splicing || reduceMotion) { if (msg) showToast(msg); return; }
    splicing = true; splice.classList.add("is-on");
    setTimeout(function () { if (msg) showToast(msg, 3600); }, 650);
    setTimeout(function () { splice.classList.remove("is-on"); splicing = false; }, 1350);
  }

  // 1. click the logo five times
  var logoClicks = 0, logoT;
  $("#logo").addEventListener("click", function () {
    logoClicks++; clearTimeout(logoT);
    logoT = setTimeout(function () { logoClicks = 0; }, 1800);
    if (logoClicks >= 5) { logoClicks = 0; doSplice("You found the cut ✂  Say hi: jcut.agency@gmail.com"); }
  });

  // 2. type "cut"   3. Konami code: director's cut turns the colour on
  var keyBuf = "", kPos = 0;
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[kPos]) { kPos++; if (kPos === KONAMI.length) { kPos = 0; directorsCut(); } }
    else kPos = key === KONAMI[0] ? 1 : 0;
    if (e.key.length === 1) {
      keyBuf = (keyBuf + key).slice(-3);
      if (keyBuf === "cut") { keyBuf = ""; doSplice("snip."); }
    }
  });
  function directorsCut() {
    var on = root.classList.toggle("full-color");
    showToast(on ? "Director's cut: colour on ✦" : "Back to black & white", 3200);
  }

  // 4. click the © year: it's a clapperboard
  var takes = 1, yearEl = $("#year");
  yearEl.textContent = new Date().getFullYear();
  yearEl.addEventListener("click", function () {
    takes++;
    var lines = ["Take " + takes + ".", "Take " + takes + ", still rolling.", "Take " + takes + ". That one was the one.", "Cut! Print it."];
    showToast(lines[Math.min(takes - 2, lines.length - 1)], 2400);
  });

  // 5. leave the tab and it notices
  var realTitle = document.title;
  document.addEventListener("visibilitychange", function () { document.title = document.hidden ? "✂ Come back, we're mid-edit" : realTitle; });

  // 6. a note for anyone who opens the console
  console.log("%c✂  J CUT", "font:900 22px Archivo, system-ui;letter-spacing:-1px");
  console.log("%cCurious how it's made? So are we. jcut.agency@gmail.com", "color:#999");
})();

/* =========================================================
   HERO GALAXY — a port of ArtCraft's hero spiral (three.js)
   Cards ride six Archimedean spiral arms like a conveyor: born small and
   blurred at the centre, they travel outward, grow into 16:9 cards and leave
   past the edge. Scrolling scrubs the conveyor, the whole system spins slowly,
   guide ribbons with travelling colour pulses sit underneath. The pointer
   pulls nearby cards, holds the card under it (the spiral brakes around it),
   a click punches a ripple through the field and boosts the held card.
   Card art: the client thumbnails, shown in grey like the rest of the site.
   ========================================================= */
// three.js r170, trimmed to just the classes used below (~120KB gzipped instead of ~170KB).
// If you use another THREE.* class here, rebuild the vendor file to include it.
import * as THREE from "../vendor/three.galaxy.min.js";

const host = document.getElementById("orbit");
const hero = document.querySelector(".hero");
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webgl() {
  try { const c = document.createElement("canvas"); return !!(window.WebGL2RenderingContext && c.getContext("webgl2")); } catch (e) { return false; }
}

if (host && hero && !reduceMotion && webgl()) start();

function start() {
  /* ---------- tuning (ArtCraft's defaults) ---------- */
  const LAYOUT = { arms: 6, turns: 1.05, rMaxFrac: .7, birthFrac: .08, cardN: 64, tunedMpx: 1.65, cardHFrac: .25, armJitter: .76, ticksPerArm: 16, circFrac: .56, guideX: 1, dedupPx: 300 };
  const MOBILE = { mobMpx: .6, mobArms: 3, mobTurns: .7, mobCardN: 14, mobRMax: .8, mobCardH: .3, mobBirth: .08, mobDensityX: 1.15 };
  const MOTION = { idleSpeed: .57, scrub: .2, spinDeg: -50, wobbleAmp: 6, wobbleFreq: .25, introDur: 4, rollChunk: .12, burstX: 3, burstDur: 2.5, waveBand: 220, waveAber: .2, waveLag: .4 };
  const POINTER = { fieldPx: 320, tiltDeg: 0, tugPx: 8, mouseWarp: 200, flareAdd: .032, flareDecay: 3, holdTau: .15, restTau: 1, holdWobble: 1.2, targetTau: .25, rippleSpeed: 900, rippleWidth: 140, rippleAmp: .016, rippleWarp: 22, rippleLife: 1.8, clickAmp: 20, clickDur: .75, clickWidth: .14, boostScale: 3, boostTau: .18 };
  // pulses: brand orange; hue spread 0 keeps every arm orange (ArtCraft spreads 0.4 across the wheel)
  const LOOK = { density: .82, cornerPx: 10, innerCap: .45, aspectEnd: .3, blurMax: .12, blurEnd: .18, fadeBand: .15, aberration: .019, curvePx: 32, frameAlpha: .22, lineAlpha: .15, tickAlpha: .3, lineW: 2, pulseAlpha: .72, pulseSpeed: .19, pulseWidth: .05, pulseW: 3.5, pulseCount: 3, pulseHue: 0, pulseDark: .62 };
  const INTRO = { cardsAt: .25, instrAt: .6 };

  /* ---------- the clips: wide client thumbnails ---------- */
  const IDS = (window.JCUT_WIDE_IDS || []).slice();
  if (!IDS.length) return;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const fract = (x) => ((x % 1) + 1) % 1;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const smooth = (a, b, x) => { const r = clamp01((x - a) / (b - a)); return r * r * (3 - 2 * r); };

  /* ---------- renderer / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "galaxy";
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
  const group = new THREE.Group();
  scene.add(group);
  let W = 0, H = 0;

  /* ---------- textures (cover-fit window computed per clip, letterbox bars cropped) ---------- */
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  // textures: the quick 640px JPEG first, then the sharp 1280px one once the page has settled
  // (WebGL needs YouTube's JPEGs: only they carry the cross-origin header)
  const clips = IDS.map((id) => {
    const c = { aspect: 16 / 9, base: { x: 0, y: 0, w: 1, h: 1 }, ready: 0, tex: null, used: 0, sharp: false };
    const apply = (t, q) => {
      const img = t.image, nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
      if (nw <= 120) { t.dispose(); if (q !== "hqdefault" && !c.tex) load("hqdefault"); return; }   // YouTube's grey placeholder
      // 4:3 thumbnails carry the 16:9 picture between black bars: crop to it
      const contentH = Math.min(nh, nw * 9 / 16);
      c.base = { x: 0, y: (1 - contentH / nh) / 2, w: 1, h: contentH / nh };
      c.aspect = nw / contentH;
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
      t.anisotropy = 4;
      const old = c.tex;
      c.tex = t; c.ready = 1;
      const ci = clips.indexOf(c);
      mats.forEach((m, i) => { if (cards[i].clip === ci) m.uniforms.uMap.value = t; });
      if (old) old.dispose();
    };
    const load = (q) => loader.load("https://i.ytimg.com/vi/" + id + "/" + q + ".jpg", (t) => apply(t, q), undefined, () => { if (q === "sddefault") load("hqdefault"); });
    c.upgrade = () => { if (c.sharp) return; c.sharp = true; loader.load("https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg", (t) => apply(t, "maxresdefault"), undefined, () => {}); };
    load("sddefault");
    return c;
  });
  // swap in the sharp versions once the intro has played and the page is idle
  const upgradeAll = () => clips.forEach((c, i) => setTimeout(c.upgrade, i * 250));
  setTimeout(() => { if ("requestIdleCallback" in window) requestIdleCallback(upgradeAll, { timeout: 3000 }); else upgradeAll(); }, 4500);
  const blank = new THREE.DataTexture(new Uint8Array([25, 25, 29, 255]), 1, 1);
  blank.needsUpdate = true;

  /* ---------- shaders ---------- */
  const cardVert = `
    uniform float uCurve; uniform float uWarp; uniform vec2 uMouse; uniform vec2 uSize;
    out vec2 vUv;
    void main() {
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      float d2 = dot(position.xy, position.xy);
      world.z += uCurve * (0.25 - d2) * 2.0;                 // bow toward the camera
      vec2 dpx = (position.xy - uMouse) * uSize;
      float rr = max(uSize.x, uSize.y) * 0.6;
      world.z += uWarp * exp(-dot(dpx, dpx) / (rr * rr));    // the cursor's local bulge
      gl_Position = projectionMatrix * viewMatrix * world;
    }`;
  const cardFrag = `
    uniform sampler2D uMap; uniform vec2 uRepeat; uniform vec2 uOffset; uniform vec3 uBg;
    uniform float uBlur; uniform float uTexA; uniform float uAlpha; uniform float uAber;
    uniform vec2 uSize; uniform float uRadius; uniform vec3 uFrameCol; uniform float uFrameA;
    uniform vec4 uClick[4]; uniform float uClickW; uniform float uGray;
    in vec2 vUv; out vec4 outColor;
    const vec3 LUMA = vec3(0.299, 0.587, 0.114);
    const vec2 TAPS[12] = vec2[12](
      vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
      vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
      vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
      vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598));
    void main() {
      vec2 uvL = vUv;
      for (int k = 0; k < 4; k++) {
        if (uClick[k].w > 0.001) {
          vec2 q = (vUv - uClick[k].xy) * uSize;
          float dq = length(q);
          float ring = (dq - uClick[k].z) / max(1.0, uClickW);
          uvL += (q / max(1.0, dq)) * (uClick[k].w * exp(-ring * ring)) / uSize;
        }
      }
      vec2 uv = uvL * uRepeat + uOffset; vec2 lo = uOffset; vec2 hi = uOffset + uRepeat;
      vec3 col;
      if (uBlur > 0.0008) {
        float a = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.545) * 6.2832;
        mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
        vec3 acc = texture(uMap, clamp(uv, lo, hi)).rgb;
        for (int i = 0; i < 12; i++) acc += texture(uMap, clamp(uv + rot * TAPS[i] * uBlur, lo, hi)).rgb;
        col = acc / 13.0;
        col = mix(col, vec3(dot(col, LUMA)), uGray);
      } else {
        vec2 d = vUv - 0.5;
        vec2 shift = d * dot(d, d) * 4.0 * uAber;
        vec3 sr = texture(uMap, clamp(uv + shift, lo, hi)).rgb, sg = texture(uMap, clamp(uv, lo, hi)).rgb, sb = texture(uMap, clamp(uv - shift, lo, hi)).rgb;
        // the site is black & white: each channel reads the grey of its own shifted sample,
        // so the picture is grey and only the dispersion fringe at the edges shows colour
        col = mix(vec3(sr.r, sg.g, sb.b), vec3(dot(sr, LUMA), dot(sg, LUMA), dot(sb, LUMA)), uGray);
      }
      col = mix(uBg, col, uTexA);
      vec2 q = abs((vUv - 0.5) * uSize) - (0.5 * uSize - vec2(uRadius));
      float dEdge = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - uRadius;
      float frameBand = 1.0 - smoothstep(0.5, 1.5, abs(dEdge + 1.0));
      col = mix(col, uFrameCol, frameBand * uFrameA);
      float aa = 1.0 - smoothstep(-0.75, 0.75, dEdge);
      outColor = vec4(col, uAlpha * aa);
    }`;

  const ribbonMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uColor: { value: new THREE.Color("#888888") }, uAlpha: { value: 0 },
      uPulseColor: { value: new THREE.Color("#ff4b2b") }, uPulseAlpha: { value: 0 }, uSpeed: { value: .22 },
      uWidth: { value: .035 }, uCount: { value: 2 }, uHue: { value: 0 }, uBaseW: { value: 1.2 },
      uPulseW: { value: 3.5 }, uWaveR: { value: 1e6 }, uWaveBand: { value: 220 }
    },
    vertexShader: `
      attribute vec2 aN; attribute float aSide; attribute float aT; attribute float aArm;
      uniform float uTime; uniform float uSpeed; uniform float uWidth; uniform float uCount;
      uniform float uBaseW; uniform float uPulseW; uniform float uWaveR; uniform float uWaveBand;
      varying float vG; varying float vSide; varying float vArm;
      void main() {
        float d = fract(aT * uCount - uTime * uSpeed + aArm * 0.618);
        float s = d - 0.5;
        float sig = uWidth * (s < 0.0 ? 1.7 : 0.55);
        float g = exp(-0.5 * (s / sig) * (s / sig));
        g *= smoothstep(0.04, 0.14, aT);
        g *= clamp((uWaveR - length(position.xy)) / uWaveBand, 0.0, 1.0);
        vG = g; vSide = aSide; vArm = aArm;
        float w = uBaseW + uPulseW * g;
        vec3 p = position;
        p.xy += aN * aSide * w * 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColor; uniform float uAlpha; uniform vec3 uPulseColor; uniform float uPulseAlpha; uniform float uHue;
      varying float vG; varying float vSide; varying float vArm;
      vec3 hueRotate(vec3 color, float a) {
        const mat3 toYIQ = mat3(0.299, 0.587, 0.114, 0.596, -0.274, -0.322, 0.211, -0.523, 0.312);
        const mat3 toRGB = mat3(1.0, 0.956, 0.621, 1.0, -0.272, -0.647, 1.0, -1.106, 1.703);
        vec3 yiq = color * toYIQ;
        float h = atan(yiq.z, yiq.y) + a;
        float c = length(yiq.yz);
        return clamp(vec3(yiq.x, c * cos(h), c * sin(h)) * toRGB, 0.0, 1.0);
      }
      void main() {
        float edge = 1.0 - smoothstep(0.45, 1.0, abs(vSide));
        float g = clamp(vG, 0.0, 1.0);
        vec3 pulseCol = hueRotate(uPulseColor, vArm * uHue * 6.28318);
        vec3 col = mix(uColor, pulseCol, g);
        gl_FragColor = vec4(col, (uAlpha + uPulseAlpha * vG) * edge);
      }`
  });
  const circMat = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
  const tickMat = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });

  /* ---------- theme colours ---------- */
  const col = { bg: new THREE.Vector3(), frame: new THREE.Vector3(), line: new THREE.Color(), accent: new THREE.Color(), ink: new THREE.Color(), light: 0, pulse: new THREE.Color(), init: false,
    tBg: new THREE.Vector3(), tFrame: new THREE.Vector3(), tLine: new THREE.Color(), tAccent: new THREE.Color(), tInk: new THREE.Color(), tLight: 0 };
  const hex3 = (h) => { const t = parseInt(h.replace("#", "").slice(0, 6), 16); return new THREE.Vector3((t >> 16 & 255) / 255, (t >> 8 & 255) / 255, (t & 255) / 255); };
  function readTheme() {
    const cs = getComputedStyle(root);
    const bg = hex3(cs.getPropertyValue("--bg").trim() || "#0c0c0e"), ink = hex3(cs.getPropertyValue("--ink").trim() || "#f2f1ee");
    const strong = bg.clone().lerp(ink, .3);                    // the site's --line-2 over the background
    col.tBg.copy(bg); col.tFrame.copy(strong); col.tLine.setRGB(strong.x, strong.y, strong.z);
    col.tAccent.set(cs.getPropertyValue("--accent").trim() || "#ff4b2b"); col.tInk.setRGB(ink.x, ink.y, ink.z);
    col.tLight = +(.2126 * bg.x + .7152 * bg.y + .0722 * bg.z > .5);
    if (!col.init) { col.init = true; col.bg.copy(col.tBg); col.frame.copy(col.tFrame); col.line.copy(col.tLine); col.accent.copy(col.tAccent); col.ink.copy(col.tInk); col.light = col.tLight; }
  }
  readTheme();
  new MutationObserver(readTheme).observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });

  /* ---------- layout (rebuilt on resize) ---------- */
  let D = null, cards = [], mats = [], meshes = [], order = [], rank = null, underlay = [];
  let K, J_, U, flare, Xt, Jh, Yoff, tiltX, tiltY, prevJ, lru;
  const plane = new THREE.PlaneGeometry(1, 1, 12, 12);

  function layout() {
    const a = W * H / 1e6, mob = MOBILE.mobMpx > 0 && a < MOBILE.mobMpx;
    const arms = Math.max(1, Math.round(mob ? MOBILE.mobArms : LAYOUT.arms));
    const cardN = mob ? Math.max(4, Math.round(MOBILE.mobCardN)) : Math.max(6, Math.min(Math.round(LAYOUT.cardN), Math.round(LAYOUT.cardN * a / LAYOUT.tunedMpx)));
    const halfDiag = Math.hypot(W, H) / 2, rMax = (mob ? MOBILE.mobRMax : LAYOUT.rMaxFrac) * halfDiag;
    const thetaMax = (mob ? MOBILE.mobTurns : LAYOUT.turns) * Math.PI * 2, b = rMax / thetaMax;
    const cardHCap = Math.min(340, Math.max(70, H * (mob ? MOBILE.mobCardH : LAYOUT.cardHFrac)));
    const slotsPerArm = Math.max(1, Math.ceil(cardN / arms));
    const thetaBirth = (mob ? MOBILE.mobBirth : LAYOUT.birthFrac) * thetaMax, thetaExit = (halfDiag + 1.5 * cardHCap) / b;
    // arm guide ribbons
    underlay.forEach((o) => { group.remove(o); o.geometry.dispose(); });
    underlay = [];
    const guides = arms * (mob ? 1 : Math.max(1, Math.round(LAYOUT.guideX)));
    for (let e = 0; e < guides; e++) {
      const off = e * Math.PI * 2 / guides, P = [], N = [], S = [], T = [], A = [], idx = [];
      for (let o = 0; o <= 200; o++) {
        const u = .3 * thetaBirth + o / 200 * (thetaExit - .3 * thetaBirth), d = b * u, h = u + off;
        const x = d * Math.cos(h), y = d * Math.sin(h);
        const tx = b * Math.cos(h) - d * Math.sin(h), ty = b * Math.sin(h) + d * Math.cos(h), tl = Math.hypot(tx, ty) || 1;
        for (const side of [-1, 1]) { P.push(x, y, -2); N.push(-ty / tl, tx / tl); S.push(side); T.push(o / 200); A.push(e); }
        if (o < 200) { const k = 2 * o; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute("aN", new THREE.Float32BufferAttribute(N, 2));
      g.setAttribute("aSide", new THREE.Float32BufferAttribute(S, 1));
      g.setAttribute("aT", new THREE.Float32BufferAttribute(T, 1));
      g.setAttribute("aArm", new THREE.Float32BufferAttribute(A, 1));
      g.setIndex(idx);
      underlay.push(new THREE.Mesh(g, ribbonMat));
    }
    // ticks straddling each arm's outer half
    const ticks = [], tpa = Math.round(LAYOUT.ticksPerArm);
    for (let e = 0; e < arms; e++) {
      const off = e * Math.PI * 2 / arms;
      for (let k = 0; k < tpa; k++) {
        const th = thetaMax * (.45 + .55 * (k + .5) / tpa), r = b * th, ang = th + off, c = Math.cos(ang), s = Math.sin(ang);
        ticks.push((r - 6) * c, (r - 6) * s, -2, (r + 6) * c, (r + 6) * s, -2);
      }
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
    underlay.push(new THREE.LineSegments(tg, tickMat));
    // dashed construction circle
    const circ = [], R0 = LAYOUT.circFrac * rMax, C = Math.max(8, Math.round(Math.PI * R0 / 14));
    for (let e = 0; e < C; e++) { const t0 = e / C * Math.PI * 2, t1 = t0 + Math.PI / C; circ.push(R0 * Math.cos(t0), R0 * Math.sin(t0), -2, R0 * Math.cos(t1), R0 * Math.sin(t1), -2); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(circ, 3));
    underlay.push(new THREE.LineSegments(cg, circMat));
    underlay.forEach((o) => group.add(o));

    D = { arms, cardN, rMax, thetaMax, thetaBirth, thetaExit, b, cardHCap, slotsPerArm, mobile: mob };

    // cards (only rebuilt when the count changes)
    if (cards.length !== cardN) {
      meshes.forEach((m) => group.remove(m)); mats.forEach((m) => m.dispose());
      cards = Array.from({ length: cardN }, (_, t) => ({ clip: t % clips.length, arm: t % arms, slot: Math.floor(t / arms) }));
      order = cards.map((_, t) => t).sort((x, y) => (.618034 * x) % 1 - (.618034 * y) % 1);
      rank = new Int32Array(cards.length); order.forEach((t, i) => { rank[t] = i; });
      mats = cards.map((c) => new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: cardVert, fragmentShader: cardFrag, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          uMap: { value: clips[c.clip].tex || blank }, uRepeat: { value: new THREE.Vector2(1, 1) }, uOffset: { value: new THREE.Vector2(0, 0) },
          uBg: { value: new THREE.Vector3(.05, .05, .05) }, uBlur: { value: 0 }, uTexA: { value: 0 }, uAlpha: { value: 0 }, uAber: { value: 0 },
          uCurve: { value: 0 }, uSize: { value: new THREE.Vector2(160, 90) }, uMouse: { value: new THREE.Vector2(0, 0) }, uWarp: { value: 0 },
          uClick: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, uClickW: { value: 20 },
          uRadius: { value: 0 }, uFrameCol: { value: new THREE.Vector3(.5, .5, .5) }, uFrameA: { value: 0 }, uGray: { value: 1 }
        }
      }));
      meshes = mats.map((m) => { const me = new THREE.Mesh(plane, m); group.add(me); return me; });
      const n = cards.length;
      K = new Float32Array(2 * n); J_ = new Float32Array(n); U = new Float32Array(n); flare = new Float32Array(n);
      Xt = new Float32Array(n); Jh = new Float32Array(n); Yoff = new Float32Array(n); tiltX = new Float32Array(n); tiltY = new Float32Array(n);
      prevJ = new Float32Array(n).fill(NaN);
      lru = new Float32Array(clips.length); for (let t = 0; t < lru.length; t++) lru[t] = t;
    } else {
      cards.forEach((c, t) => { c.arm = t % arms; c.slot = Math.floor(t / arms); });
    }
  }

  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = W + "px"; renderer.domElement.style.height = H + "px";
    const z = H / 2 / Math.tan(THREE.MathUtils.degToRad(15));
    camera.fov = 30; camera.aspect = W / H; camera.position.set(0, 0, z);
    camera.near = Math.max(1, z - 1200); camera.far = z + 1200; camera.updateProjectionMatrix();
    layout();
  }

  /* ---------- pointer ---------- */
  const ptr = { x: 0, y: 0, active: false, clicks: 0 };
  const ripples = [], punches = [];
  const setPtr = (e) => { const r = hero.getBoundingClientRect(); ptr.x = e.clientX - r.left - r.width / 2; ptr.y = -(e.clientY - r.top - r.height / 2); };
  hero.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; setPtr(e); ptr.active = true; });
  hero.addEventListener("pointerleave", () => { ptr.active = false; });
  hero.addEventListener("pointercancel", () => { ptr.active = false; });
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a,button")) return;
    setPtr(e); ptr.clicks++;
    ripples.push({ x: ptr.x, y: ptr.y, start: -1 }); if (ripples.length > 8) ripples.shift();
  });

  /* ---------- state ---------- */
  const st = { frameEma: 1 / 60, perfScale: 1, lowRes: false, time: 0, idleP: 0, spin: 0, lastP: 0, holdTarget: 0, holdRest: 0, fieldK: 1, targetI: -1, useCounter: 1e4, lastClicks: 0, boostOn: false, boostK: 0, boostCard: -1, clock: 0 };
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { rootMargin: "200px 0px" }).observe(hero);

  function frame(dtRaw) {
    const a = Math.min(dtRaw, .05);
    st.time += a; st.clock += a;
    const f = st.time, l = MOTION, i = LOOK, n = POINTER;
    const b = clamp01((st.clock - INTRO.cardsAt) / Math.max(.1, l.introDur)), v = easeOut(b);
    const x = clamp01((st.clock - INTRO.cardsAt - l.waveLag) / Math.max(.1, l.introDur)), w = easeOut(x);
    const S = clamp01((st.clock - INTRO.cardsAt) / Math.max(.1, l.burstDur)), B = 1 + (l.burstX - 1) * (1 - easeOut(S));
    st.idleP += a * l.idleSpeed * B / 60;
    st.spin += a * THREE.MathUtils.degToRad(l.spinDeg) / 60 * (1 - st.holdRest);
    const R = st.idleP + window.scrollY * l.scrub / 1e3;
    group.rotation.z = st.spin;
    const G = R - st.lastP; st.lastP = R;
    const V = st.targetI >= 0;
    st.holdTarget += (+V - st.holdTarget) * (1 - Math.exp(-a / Math.max(.01, n.holdTau)));
    st.holdRest += (+V - st.holdRest) * (1 - Math.exp(-a / Math.max(.01, n.restTau)));
    st.fieldK += (+!V - st.fieldK) * (1 - Math.exp(-a / .12));

    // theme colours glide
    const es = 1 - Math.exp(-a / .13);
    col.bg.lerp(col.tBg, es); col.frame.lerp(col.tFrame, es); col.line.lerp(col.tLine, es); col.accent.lerp(col.tAccent, es); col.ink.lerp(col.tInk, es); col.light += (col.tLight - col.light) * es;
    circMat.color.copy(col.line); tickMat.color.copy(col.line); ribbonMat.uniforms.uColor.value.copy(col.line);
    col.pulse.setRGB(col.bg.x + (col.ink.r - col.bg.x) * i.pulseDark, col.bg.y + (col.ink.g - col.bg.y) * i.pulseDark, col.bg.z + (col.ink.b - col.bg.z) * i.pulseDark);
    // ArtCraft greys the pulses in light mode; J Cut keeps them orange in both themes
    ribbonMat.uniforms.uPulseColor.value.copy(col.accent);
    ribbonMat.uniforms.uHue.value = i.pulseHue * (1 - col.light);
    const gray = root.classList.contains("full-color") ? 0 : 1;

    const eu = Math.max(6, Math.min(cards.length, Math.round(cards.length * st.perfScale))), ec = Math.cos(st.spin), ed = Math.sin(st.spin), ef = -l.rollChunk * (1 - v);
    // conveyor positions
    for (let e = 0; e < eu; e++) {
      const t = order[e], c = cards[t];
      Yoff[t] -= G * (t === st.targetI ? Math.max(st.holdTarget, st.holdRest) : st.holdRest);
      const jj = Math.max(0, fract((c.slot + .5 + c.arm * LAYOUT.armJitter) / D.slotsPerArm + R + Yoff[t]) + ef);
      J_[t] = jj;
      // a card that wrapped around (left the edge, reborn at the centre) takes the least recently used clip
      if (b >= 1 && !Number.isNaN(prevJ[t]) && Math.abs(jj - prevJ[t]) > .5) {
        let best = 0; for (let k = 1; k < lru.length; k++) if (lru[k] < lru[best]) best = k;
        c.clip = best; lru[best] = ++st.useCounter; mats[t].uniforms.uMap.value = clips[best].tex || blank;
      }
      prevJ[t] = jj;
      const th = D.thetaBirth + jj * (D.thetaExit - D.thetaBirth), rad = D.b * th, ang = th + c.arm * Math.PI * 2 / D.arms;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const wob = l.wobbleAmp * (1 + (n.holdWobble - 1) * st.holdRest) * (1 - Xt[t]);
      const m1 = Math.sin(f * l.wobbleFreq * Math.PI * 2 + 2.399 * t), p1 = Math.cos(f * l.wobbleFreq * Math.PI * 1.4 + 1.713 * t);
      K[2 * t] = rad * ca + wob * (-(m1 * sa) + .6 * p1 * ca);
      K[2 * t + 1] = rad * sa + wob * (m1 * ca + .6 * p1 * sa);
      if (ptr.active && n.tugPx > 0 && st.fieldK > .001) {
        const sx = ec * K[2 * t] - ed * K[2 * t + 1], sy = ed * K[2 * t] + ec * K[2 * t + 1];
        const dx = ptr.x - sx, dy = ptr.y - sy, d2 = dx * dx + dy * dy;
        const s = n.tugPx * Math.exp(-d2 / (n.fieldPx * n.fieldPx)) * st.fieldK * (1 - Xt[t]) / Math.max(1, Math.sqrt(d2));
        K[2 * t] += (ec * dx + ed * dy) * s; K[2 * t + 1] += (-ed * dx + ec * dy) * s;
      }
    }

    // which card is under the pointer (held)
    let em = -1, ep = -1;
    const eg = 1 + (n.boostScale - 1) * st.boostK;
    if (ptr.active) {
      const e = st.targetI, slack = n.tugPx + 8;
      let inside = false, insideBoost = false;
      if (e >= 0 && U[e] >= 8) {
        const sx = ec * K[2 * e] - ed * K[2 * e + 1], sy = ed * K[2 * e] + ec * K[2 * e + 1];
        const dx = Math.abs(ptr.x - sx), dy = Math.abs(ptr.y - sy), u = U[e];
        inside = dx <= 8 * u / 9 + slack && dy <= u / 2 + slack;
        const cu = u * (e === st.boostCard ? eg : 1);
        insideBoost = dx <= 8 * cu / 9 + slack && dy <= cu / 2 + slack;
      }
      if (inside) em = e;
      else {
        for (let k = 0; k < eu; k++) {
          const t = order[k]; if (t === e) continue;
          const r = J_[t]; if (r < .04 || r <= ep) continue;
          const u = U[t]; if (u < 8) continue;
          const sx = ec * K[2 * t] - ed * K[2 * t + 1], sy = ed * K[2 * t] + ec * K[2 * t + 1];
          if (Math.abs(ptr.x - sx) <= 8 * u / 9 && Math.abs(ptr.y - sy) <= u / 2) { ep = r; em = t; }
        }
        if (em < 0 && insideBoost) em = e;
      }
    }
    st.targetI = em;
    if (ptr.clicks !== st.lastClicks) {
      st.lastClicks = ptr.clicks;
      if (st.targetI >= 0) {
        const e = st.targetI, sx = ec * K[2 * e] - ed * K[2 * e + 1], sy = ed * K[2 * e] + ec * K[2 * e + 1];
        const h = Math.max(1, U[e] * (e === st.boostCard ? eg : 1)), asp = 1 + (16 / 9 - 1) * smooth(0, i.aspectEnd, J_[e]);
        punches.push({ card: e, u: .5 + (ptr.x - sx) / (h * asp), v: .5 + (ptr.y - sy) / h, start: f }); if (punches.length > 8) punches.shift();
        if (st.boostCard === st.targetI) st.boostOn = !st.boostOn; else { st.boostCard = st.targetI; st.boostOn = true; }
      }
    }
    if (st.boostOn && st.targetI !== st.boostCard) st.boostOn = false;
    st.boostK += (+st.boostOn - st.boostK) * (1 - Math.exp(-a / Math.max(.01, n.boostTau)));
    if (!st.boostOn && st.boostK < .001) st.boostCard = -1;
    for (let e = ripples.length - 1; e >= 0; e--) { if (ripples[e].start < 0) ripples[e].start = f; if (f - ripples[e].start > n.rippleLife) ripples.splice(e, 1); }
    for (let e = punches.length - 1; e >= 0; e--) if (f - punches[e].start > n.clickDur) punches.splice(e, 1);

    const tilt = n.tiltDeg * Math.PI / 180;
    for (let e = 0; e < cards.length; e++) {
      const me = meshes[e];
      if (rank[e] >= eu) { me.visible = false; continue; }      // shed by the frame-rate governor
      if (!me.visible) { me.visible = true; U[e] = 0; }
      const c = cards[e], s = J_[e], u = K[2 * e], cc = K[2 * e + 1];
      const d = Xt[e] += ((e === st.targetI) - Xt[e]) * (1 - Math.exp(-a / Math.max(.01, n.targetTau)));
      const h = Jh[e] += ((e === st.targetI) - Jh[e]) * (1 - Math.exp(-a / .12));
      // size: as big as the gap to the nearest neighbour allows (collision-free), capped, smaller near the centre
      let mGap = Infinity, pGap = Infinity;
      for (let k = 0; k < eu; k++) {
        const t = order[k]; if (t === e) continue;
        const gap = Math.max(9 * Math.abs(K[2 * t] - u) / 16, Math.abs(K[2 * t + 1] - cc));
        if (t === st.targetI && Xt[t] > .3) { const q = .98 * Math.max(0, 2 * gap - U[t]); if (q < pGap) pGap = q; }
        else if (gap < mGap) mGap = gap;
      }
      const g = Math.min(D.cardHCap * (i.innerCap + (1 - i.innerCap) * s), i.density * (D.mobile ? MOBILE.mobDensityX : 1) * mGap, pGap);
      if (d > .3) U[e] += (g - U[e]) * (1 - Math.exp(-6 * a));
      else U[e] = g < U[e] ? g : U[e] + (g - U[e]) * (1 - Math.exp(-3 * a));
      const y = Math.max(.001, U[e]) * (e === st.boostCard ? eg : 1), k = 1 + (16 / 9 - 1) * smooth(0, i.aspectEnd, s), A = y * k;
      const S2 = ec * u - ed * cc, E2 = ed * u + ec * cc;
      let F = 0, Bt = 0, Rt = 0;
      if (ptr.active && st.fieldK > .001) {
        const dx = ptr.x - S2, dy = ptr.y - E2, d2 = dx * dx + dy * dy;
        F = Math.exp(-d2 / (n.fieldPx * n.fieldPx)) * st.fieldK;
        const il = 1 / Math.max(1, Math.sqrt(d2));
        Rt = tilt * dx * il * F; Bt = tilt * dy * il * F;
      }
      const O = 1 - Math.exp(-10 * a);
      tiltX[e] += (Bt * (1 - h) - tiltX[e]) * O; tiltY[e] += (Rt * (1 - h) - tiltY[e]) * O;
      flare[e] = Math.max(flare[e] * Math.exp(-n.flareDecay * a), n.flareAdd * F);
      let N = 0;
      for (let r = 0; r < ripples.length; r++) {
        const t = f - ripples[r].start, q = (Math.hypot(S2 - ripples[r].x, E2 - ripples[r].y) - t * n.rippleSpeed) / n.rippleWidth;
        N += n.rippleAmp * Math.exp(-q * q) * (1 - t / n.rippleLife);
      }
      me.position.set(u, cc, 0); me.rotation.set(tiltX[e], tiltY[e], -st.spin); me.scale.set(A, y, 1);
      me.renderOrder = 10 + Math.round(100 * s) + Math.round(500 * d);
      // intro: a reveal wave rolls outward from the logo, a dispersion flare trailing it
      const j = clamp01(s / i.fadeBand);
      let q = 1, Gw = 0;
      if (b < 1 || (x > 0 && x < 1)) {
        const rr = D.b * (D.thetaBirth + s * (D.thetaExit - D.thetaBirth)), band = Math.max(1, l.waveBand);
        if (b < 1) q = clamp01((v * D.b * D.thetaExit - rr) / band);
        if (x > 0 && x < 1) { const z = (rr - w * D.b * D.thetaExit) / band; Gw = Math.exp(-z * z); }
      }
      const clip = clips[c.clip], un = mats[e].uniforms;
      un.uBg.value.copy(col.bg); un.uFrameCol.value.copy(col.frame); un.uGray.value = gray;
      if (un.uMap.value === blank && clip.tex) un.uMap.value = clip.tex;
      // cover-fit inside the clip's picture area
      const et = clip.aspect, bs = clip.base;
      if (et > k) { un.uRepeat.value.set(bs.w * k / et, bs.h); un.uOffset.value.set(bs.x + bs.w * (1 - k / et) / 2, bs.y); }
      else { un.uRepeat.value.set(bs.w, bs.h * et / k); un.uOffset.value.set(bs.x, bs.y + bs.h * (1 - et / k) / 2); }
      // three's TextureLoader flips Y: uv.y=0 is the image bottom, so flip the window
      un.uOffset.value.y = 1 - un.uOffset.value.y - un.uRepeat.value.y;
      const ready = clip.ready;
      un.uBlur.value = Math.max(i.blurMax * (1 - smooth(0, i.blurEnd, s)) * (1 - h), (1 - ready) * i.blurMax, (1 - q) * i.blurMax);
      un.uTexA.value = ready;
      un.uAber.value = (i.aberration + flare[e] + N + l.waveAber * Gw) * (1 - h);
      const eo = Math.min(2, N / Math.max(.002, n.rippleAmp));
      un.uCurve.value = (i.curvePx + n.rippleWarp * eo) * (1 - h);
      un.uMouse.value.set((ptr.x - S2) / Math.max(1, A), (ptr.y - E2) / Math.max(1, y));
      un.uWarp.value = n.mouseWarp * F * (1 - h);
      un.uSize.value.set(A, y);
      const slots = un.uClick.value; let used = 0;
      for (let t = 0; t < punches.length && used < 4; t++) {
        const p = punches[t]; if (p.card !== e) continue;
        const r = (f - p.start) / Math.max(.05, n.clickDur);
        if (r < 1) slots[used++].set(p.u, p.v, .85 * r * Math.max(A, y), n.clickAmp * (1 - r));
      }
      for (; used < 4; used++) slots[used].w = 0;
      un.uClickW.value = n.clickWidth * Math.max(A, y);
      un.uRadius.value = Math.min(i.cornerPx, .49 * y);
      un.uFrameA.value = i.frameAlpha;
      un.uAlpha.value = j * q;
    }
    // two visible cards showing the same clip close together: swap the blurrier one
    if (LAYOUT.dedupPx > 0 && b >= 1 && (st.dedup = (st.dedup || 0) - a) <= 0) {
      st.dedup = .25;
      const t2 = LAYOUT.dedupPx * LAYOUT.dedupPx;
      for (let e = 0; e < eu; e++) {
        const p = order[e]; if (mats[p].uniforms.uAlpha.value < .3) continue;
        for (let k = e + 1; k < eu; k++) {
          const o = order[k];
          if (cards[p].clip !== cards[o].clip || mats[o].uniforms.uAlpha.value < .3) continue;
          const dx = K[2 * p] - K[2 * o], dy = K[2 * p + 1] - K[2 * o + 1]; if (dx * dx + dy * dy > t2) continue;
          const nn = J_[p] < J_[o] ? p : o, sx = K[2 * nn], sy = K[2 * nn + 1];
          let best = -1, bestD = -Infinity;
          for (let cl = 0; cl < clips.length; cl++) {
            if (cl === cards[nn].clip) continue;
            let near = Infinity;
            for (let q2 = 0; q2 < eu; q2++) {
              const r = order[q2]; if (r === nn || cards[r].clip !== cl || mats[r].uniforms.uAlpha.value < .15) continue;
              const ddx = K[2 * r] - sx, ddy = K[2 * r + 1] - sy, dd = ddx * ddx + ddy * ddy; if (dd < near) near = dd;
            }
            const score = Math.min(near, 4 * t2) - 1e-4 * lru[cl];
            if (score > bestD) { bestD = score; best = cl; }
          }
          if (best >= 0) { cards[nn].clip = best; lru[best] = ++st.useCounter; mats[nn].uniforms.uMap.value = clips[best].tex || blank; }
        }
      }
    }
    const lines = smooth(0, 1, clamp01((st.clock - INTRO.instrAt) / 1.2));
    circMat.opacity = i.lineAlpha * lines; tickMat.opacity = i.tickAlpha * lines;
    const ru = ribbonMat.uniforms;
    ru.uTime.value = st.time; ru.uAlpha.value = i.lineAlpha * lines; ru.uPulseAlpha.value = i.pulseAlpha * lines;
    ru.uSpeed.value = i.pulseSpeed; ru.uWidth.value = i.pulseWidth; ru.uCount.value = Math.round(i.pulseCount);
    ru.uBaseW.value = i.lineW; ru.uPulseW.value = i.pulseW; ru.uWaveR.value = v * D.b * D.thetaExit; ru.uWaveBand.value = Math.max(1, l.waveBand);
  }

  resize();
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(resize, 120); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(resize, 120); }).observe(hero);
  root.classList.add("has-galaxy");

  const FLOOR = 30;
  function govern(dt) {
    st.frameEma += (Math.min(dt, .25) - st.frameEma) * .05;
    if (st.time < 4) return;                                   // let the intro settle first
    if (st.frameEma > 1 / FLOOR) {
      if (!st.lowRes && renderer.getPixelRatio() > 1) { st.lowRes = true; renderer.setPixelRatio(1); renderer.setSize(W, H, false); st.frameEma = 1 / 60; return; }
      st.perfScale = Math.max(.35, st.perfScale - .3 * dt);
    } else if (st.frameEma < .7 / FLOOR) st.perfScale = Math.min(1, st.perfScale + .05 * dt);
    root.classList.toggle("galaxy-lite", st.perfScale < .85);   // also drops the blur behind the hero text
  }

  let last = performance.now();
  (function loop(now) {
    const dt = (now - last) / 1000; last = now;
    if (onScreen && !document.hidden) {
      govern(dt);
      frame(dt); renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  })(last);
}

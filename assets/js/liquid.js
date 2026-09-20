/* Liquid background — a single full-screen WebGL fragment shader.
   Soft metaball blobs drift, react to the cursor, stretch with scroll speed,
   ripple on click, and blend between per-section colour palettes.
   No libraries. Falls back to a CSS gradient if WebGL is unavailable. */
(function () {
  "use strict";

  var canvas = document.getElementById("liquid");
  if (!canvas) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hex(h) {
    return [
      parseInt(h.slice(1, 3), 16) / 255,
      parseInt(h.slice(3, 5), 16) / 255,
      parseInt(h.slice(5, 7), 16) / 255
    ];
  }

  // Three colours per palette: two blob groups + the cursor blob.
  var PALETTES = {
    hero:      { c: [hex("#ff4b2b"), hex("#6a1b9a"), hex("#c9825a")], i: 0.44 },
    services:  { c: [hex("#ff4b2b"), hex("#1f3fbf"), hex("#3ec6b3")], i: 0.42 },
    work:      { c: [hex("#5b3df5"), hex("#ff4b2b"), hex("#ff7ab6")], i: 0.40 },
    process:   { c: [hex("#ff6a2b"), hex("#b3123f"), hex("#ffc26b")], i: 0.44 },
    statement: { c: [hex("#ff4b2b"), hex("#ffb703"), hex("#ffffff")], i: 0.5 },
    team:      { c: [hex("#3ec6b3"), hex("#2a49d6"), hex("#ff4b2b")], i: 0.42 },
    contact:   { c: [hex("#ff4b2b"), hex("#ff9a3c"), hex("#6a1b9a")], i: 0.5 },
    footer:    { c: [hex("#ff4b2b"), hex("#3a0f5e"), hex("#ffb37a")], i: 0.36 }
  };

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }) ||
         canvas.getContext("experimental-webgl");
  } catch (e) { gl = null; }

  if (!gl) {
    document.documentElement.classList.add("no-gl");
    window.JLiquid = { setPalette: function () {}, ripple: function () {}, setHue: function () {}, setBoost: function () {} };
    return;
  }

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;uniform float uTime,uScroll,uVel,uInt,uHue;",
    "uniform vec2 uMouse;uniform vec3 uC1,uC2,uC3;uniform vec3 uRip[4];",
    "vec3 hue(vec3 c,float h){const vec3 k=vec3(.57735);float ca=cos(h);return c*ca+cross(k,c)*sin(h)+k*dot(k,c)*(1.-ca);}",
    "float wrapY(float y){return mod(y+.45,1.9)-.45;}",
    "void main(){",
    "  float asp=uRes.x/uRes.y;",
    "  vec2 uv=gl_FragCoord.xy/uRes;",
    "  vec2 st=vec2(uv.x*asp,uv.y);",
    "  float t=uTime*.11;",
    /* click ripples bend the sampling coords */
    "  for(int i=0;i<4;i++){",
    "    vec3 r=uRip[i];float age=r.z;",
    "    if(age>=0.&&age<4.){",
    "      vec2 d=st-vec2(r.x*asp,r.y);float l=length(d);",
    "      float w=sin(l*34.-age*9.)*exp(-l*2.4)*exp(-age*1.25);",
    "      st+=d/(l+1e-4)*w*.035;",
    "    }",
    "  }",
    /* slow domain warp: makes the blobs feel like fluid, not circles */
    "  st+=.04*vec2(sin(st.y*4.5+t*3.1),cos(st.x*4.5+t*2.5));",
    "  float sc=uScroll*.00028;",
    "  float sy=1.+uVel*.9;",
    "  float rs=clamp(asp*1.35,.5,1.);",                       /* stretch vertically with scroll speed */
    "  float fA=0.,fB=0.,fM=0.;",
    "  for(int i=0;i<3;i++){",
    "    float fi=float(i);",
    "    vec2 pa=vec2(asp*(.2+.3*fi)+.30*sin(t*(1.1+fi*.37)+fi*2.1),",
    "                 wrapY(.5+.32*cos(t*(.9+fi*.29)+fi)-sc*(.55+fi*.22)));",
    "    vec2 da=(st-pa)*vec2(1.,1./sy);",
    "    fA+=rs*rs*(.17+.03*fi)*(.17+.03*fi)/(dot(da,da)+.004);",
    "    vec2 pb=vec2(asp*(.85-.28*fi)+.26*cos(t*(.8+fi*.41)+fi*1.7),",
    "                 wrapY(.35+.34*sin(t*(1.0+fi*.33)+fi*2.6)-sc*(.8+fi*.18)));",
    "    vec2 db=(st-pb)*vec2(1.,1./sy);",
    "    fB+=rs*rs*(.16+.03*fi)*(.16+.03*fi)/(dot(db,db)+.004);",
    "  }",
    /* cursor blob + a lagging satellite */
    "  vec2 m=vec2(uMouse.x*asp,uMouse.y);",
    "  vec2 dm=st-m;",
    "  fM+=rs*rs*.17*.17/(dot(dm,dm)+.003);",
    "  vec2 ms=m+.16*vec2(sin(t*9.),cos(t*7.));",
    "  vec2 ds=st-ms;",
    "  fM+=rs*rs*.09*.09/(dot(ds,ds)+.003);",
    "  vec3 bg=vec3(.043,.035,.031);",
    "  vec3 col=bg;",
    "  col+=uC1*smoothstep(.12,3.2,fA)*.95;",
    "  col+=uC2*smoothstep(.12,3.2,fB)*.85;",
    "  col+=uC3*smoothstep(.10,2.6,fM)*.5;",
    /* thin liquid contour on the blob surface */
    "  float rim=(1.-smoothstep(0.,.09,abs(fA-1.7)))+(1.-smoothstep(0.,.09,abs(fB-1.7)))+(1.-smoothstep(0.,.09,abs(fM-1.5)));",
    "  col+=rim*.025;",
    "  col=1.-exp(-col*1.35);",
    "  col=mix(bg,col,uInt);",
    "  col=hue(col,uHue);",
    "  col*=1.-.42*pow(length(uv-.5)*1.15,2.);",
    "  gl_FragColor=vec4(col,1.);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn("liquid shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  var prog = gl.createProgram();
  if (!vs || !fs) {
    document.documentElement.classList.add("no-gl");
    window.JLiquid = { setPalette: function () {}, ripple: function () {}, setHue: function () {}, setBoost: function () {} };
    return;
  }
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["uRes", "uTime", "uScroll", "uVel", "uInt", "uHue", "uMouse", "uC1", "uC2", "uC3", "uRip"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  /* state */
  // Render at reduced resolution (the look is soft anyway). Phones get fewer pixels and a 30fps cap.
  var LOW = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 800;
  var SCALE = LOW ? 0.3 : 0.42;
  var FRAME_MS = LOW ? 32 : 0;
  var lastDraw = 0, prevNow = 0, slowFrames = 0;
  var cur = { c1: PALETTES.hero.c[0].slice(), c2: PALETTES.hero.c[1].slice(), c3: PALETTES.hero.c[2].slice(), i: 0.44 };
  var target = PALETTES.hero;
  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var scrollY = 0, vel = 0, hue = 0, hueTarget = 0, boost = 0;
  var ripples = [{ x: 0, y: 0, t0: -100 }, { x: 0, y: 0, t0: -100 }, { x: 0, y: 0, t0: -100 }, { x: 0, y: 0, t0: -100 }];
  var ripIdx = 0;
  var ripBuf = new Float32Array(12);
  var start = performance.now();
  var lastScrollY = window.scrollY, lastTs = start;

  function resize() {
    var w = Math.max(2, Math.round(window.innerWidth * SCALE));
    var h = Math.max(2, Math.round(window.innerHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  var hasMouse = false;
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    hasMouse = true;
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  function lerp(a, b, k) { return a + (b - a) * k; }

  function frame(now) {
    if (FRAME_MS && now - lastDraw < FRAME_MS - 3) { requestAnimationFrame(frame); return; }
    lastDraw = now;
    // safety net: if frames keep arriving slowly, quietly drop the resolution
    var gap = now - prevNow; prevNow = now;
    if (gap > 48 && gap < 500) {
      if (++slowFrames > 24 && SCALE > 0.2) { SCALE = Math.max(0.2, SCALE * 0.8); slowFrames = 0; resize(); }
    } else if (slowFrames > 0) slowFrames--;
    var dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;

    var y = window.scrollY;
    var v = (y - lastScrollY) / Math.max(dt, 0.001);      // px per second
    lastScrollY = y;
    vel = lerp(vel, Math.max(-1, Math.min(1, v / 3500)), 0.08);
    scrollY = y;

    if (!hasMouse) {
      var ts = (now - start) / 1000;
      mouse.tx = 0.5 + 0.32 * Math.sin(ts * 0.31);
      mouse.ty = 0.5 + 0.28 * Math.cos(ts * 0.23);
    }
    mouse.x = lerp(mouse.x, mouse.tx, 0.07);
    mouse.y = lerp(mouse.y, mouse.ty, 0.07);

    var k = 0.045;
    for (var i = 0; i < 3; i++) {
      cur.c1[i] = lerp(cur.c1[i], target.c[0][i], k);
      cur.c2[i] = lerp(cur.c2[i], target.c[1][i], k);
      cur.c3[i] = lerp(cur.c3[i], target.c[2][i], k);
    }
    var portrait = window.innerWidth < window.innerHeight ? 0.72 : 1;
    cur.i = lerp(cur.i, (target.i + boost) * portrait, k);
    hue = lerp(hue, hueTarget, 0.05);

    var time = reduceMotion ? 3.0 : (now - start) / 1000;

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uScroll, scrollY);
    gl.uniform1f(U.uVel, Math.abs(vel));
    gl.uniform1f(U.uInt, cur.i);
    gl.uniform1f(U.uHue, hue);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform3fv(U.uC1, cur.c1);
    gl.uniform3fv(U.uC2, cur.c2);
    gl.uniform3fv(U.uC3, cur.c3);

    var nowS = (now - start) / 1000;
    for (var r = 0; r < 4; r++) {
      var age = nowS - ripples[r].t0;
      ripBuf[r * 3] = ripples[r].x;
      ripBuf[r * 3 + 1] = ripples[r].y;
      ripBuf[r * 3 + 2] = age < 4 ? age : -1;
    }
    gl.uniform3fv(U.uRip, ripBuf);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.JLiquid = {
    setPalette: function (name) { if (PALETTES[name]) target = PALETTES[name]; },
    ripple: function (clientX, clientY) {
      var r = ripples[ripIdx++ % 4];
      r.x = clientX / window.innerWidth;
      r.y = 1 - clientY / window.innerHeight;
      r.t0 = (performance.now() - start) / 1000;
    },
    setHue: function (h) { hueTarget = h; },
    setBoost: function (b) { boost = b; }
  };
})();

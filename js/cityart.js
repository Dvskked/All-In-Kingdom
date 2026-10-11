/* ==========================================================================
 * ALL-IN KINGDOM  ·  cityart.js
 * Ilustraciones SVG de cada ciudad (skyline + monumento) generadas en local,
 * sin ficheros externos. Se usan como imagenes de fondo en el mapa y casino.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});
  const W = 640, H = 360, GROUND = 326;

  function rng(seed) {
    let s = (seed * 2654435761) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function building(x, w, h, i, accent, rand) {
    const y = GROUND - h;
    let win = "";
    const cols = Math.max(1, Math.floor(w / 14));
    const rows = Math.max(1, Math.floor(h / 18));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < 0.55) continue;
        win += '<rect x="' + (x + 5 + c * ((w - 10) / cols)) + '" y="' + (y + 6 + r * ((h - 10) / rows)) +
          '" width="4" height="6" fill="' + accent + '" opacity="' + (0.25 + rand() * 0.5).toFixed(2) + '"/>';
      }
    }
    const roof = (i % 3 === 0) ? '<polygon points="' + x + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w / 2) + ',' + (y - 14) + '" fill="#0b0d16" opacity=".95"/>' : "";
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#b' + i + ')" stroke="rgba(0,0,0,.35)"/>' + win + roof;
  }

  function skyline(seed, accent, dark) {
    const rand = rng(seed + 7);
    let out = "";
    let x = -20;
    let i = 0;
    while (x < W + 20) {
      const w = 26 + Math.floor(rand() * 46);
      const h = 40 + Math.floor(rand() * 176);
      out += building(x, w, h, (seed * 31 + i) % 5, accent, rand);
      x += w + 4 + Math.floor(rand() * 12);
      i++;
    }
    /* Capa lejana mas oscura */
    let far = "";
    let fx = -10;
    const rand2 = rng(seed + 91);
    while (fx < W + 10) {
      const w = 20 + Math.floor(rand2() * 40);
      const h = 24 + Math.floor(rand2() * 90);
      far += '<rect x="' + fx + '" y="' + (GROUND - h) + '" width="' + w + '" height="' + h + '" fill="' + dark + '" opacity=".45"/>';
      fx += w + 3;
    }
    return far + out;
  }

  /* --- Monumentos ------------------------------------------------ */
  function landmark(id, accent) {
    const a = accent;
    switch (id) {
      case "villa":
        return '<g fill="#0b0d16"><rect x="250" y="250" width="140" height="76" rx="4"/><polygon points="240,250 400,250 320,208"/></g>' +
          '<rect x="300" y="286" width="40" height="40" fill="' + a + '" opacity=".55"/>' +
          '<circle cx="440" cy="250" r="30" fill="none" stroke="#0b0d16" stroke-width="6"/>' +
          '<g stroke="#0b0d16" stroke-width="4"><line x1="440" y1="220" x2="440" y2="180"/><line x1="440" y1="280" x2="440" y2="320"/><line x1="410" y1="250" x2="440" y2="250"/></g>';
      case "puerto":
        return '<g fill="#0b0d16"><polygon points="120,326 150,326 142,210 128,210"/><rect x="122" y="196" width="26" height="18"/><polygon points="135,196 135,176 150,196"/></g>' +
          '<rect x="128" y="214" width="14" height="10" fill="' + a + '" opacity=".8"/>' +
          '<polygon points="120,206 92,214 120,222" fill="' + a + '" opacity=".35"/><polygon points="150,206 178,214 150,222" fill="' + a + '" opacity=".35"/>' +
          '<g stroke="#0b0d16" stroke-width="3" fill="none" opacity=".8"><path d="M380 300 q20 -12 40 0 t40 0 t40 0"/><path d="M360 320 q20 -12 40 0 t40 0 t40 0"/></g>';
      case "madrid":
        return '<g fill="#0b0d16"><path d="M230 326 V230 q0 -18 18 -18 h8 q18 0 18 18 v96 h-14 v-70 q0 -12 -12 -12 t-12 12 v70 Z"/>' +
          '<path d="M300 326 V214 q0 -18 18 -18 h10 q18 0 18 18 v112 h-14 v-86 q0 -12 -13 -12 t-13 12 v86 Z"/>' +
          '<path d="M382 326 V230 q0 -18 18 -18 h8 q18 0 18 18 v96 h-14 v-70 q0 -12 -12 -12 t-12 12 v70 Z"/></g>' +
          '<polygon points="222,196 410,196 316,150" fill="#0b0d16"/>' +
          '<circle cx="316" cy="170" r="6" fill="' + a + '" opacity=".8"/>';
      case "cartagena":
        return '<g fill="#0b0d16"><rect x="250" y="248" width="150" height="78"/><rect x="300" y="210" width="46" height="46"/><rect x="300" y="184" width="46" height="30" rx="15"/></g>' +
          '<polygon points="345,184 345,150 372,184" fill="#0b0d16"/>' +
          '<circle cx="358" cy="170" r="5" fill="' + a + '" opacity=".8"/>' +
          '<rect x="288" y="300" width="34" height="26" rx="4" fill="' + a + '" opacity=".5"/>' +
          '<g stroke="#0b0d16" stroke-width="5" opacity=".85"><polyline points="180,326 210,300 240,306 270,290 300,300"/></g>';
      case "monaco":
        return '<g fill="#0b0d16"><path d="M150 326 q40 -60 130 -60 t210 60 Z"/><rect x="250" y="220" width="140" height="46" rx="4"/><rect x="266" y="196" width="14" height="26"/><rect x="360" y="192" width="16" height="30"/></g>' +
          '<circle cx="330" cy="206" r="4" fill="' + a + '" opacity=".8"/>' +
          '<polygon points="430,250 430,180 470,250" fill="#fff" opacity=".18"/><g stroke="#0b0d16" stroke-width="2" fill="none"><line x1="452" y1="180" x2="452" y2="250"/><path d="M430 250 h44"/></g>';
      case "tokio":
        return '<g fill="#0b0d16"><rect x="278" y="210" width="84" height="116" rx="4"/><polygon points="266,212 374,212 320,182"/><polygon points="276,182 364,182 320,158"/><line x1="320" y1="158" x2="320" y2="120" stroke="#0b0d16" stroke-width="5"/></g>' +
          '<rect x="304" y="248" width="32" height="40" fill="' + a + '" opacity=".55"/>' +
          '<g fill="' + a + '" opacity=".9"><rect x="176" y="196" width="10" height="130"/><rect x="226" y="196" width="10" height="130"/><rect x="168" y="196" width="76" height="12" rx="3"/><rect x="162" y="222" width="88" height="10" rx="3"/></g>';
      case "moscu":
        return dn("270", "r") + dn("330", "a") + dn("392", "g");
      case "dubai":
        return '<g fill="#0b0d16"><polygon points="300,326 300,120 316,90 332,120 336,326"/><polygon points="308,326 308,150 316,110 324,150 328,326"/></g>' +
          '<rect x="312" y="128" width="8" height="180" fill="' + a + '" opacity=".35"/>';
      case "newyork":
        return '<g fill="#0b0d16"><rect x="140" y="150" width="54" height="176"/><rect x="200" y="196" width="40" height="130"/><polygon points="140,150 167,120 194,150"/></g>' +
          '<g fill="#0b0d16"><rect x="420" y="210" width="120" height="116"/><rect x="452" y="176" width="56" height="40"/><rect x="470" y="150" width="20" height="30"/></g>' +
          '<g fill="' + a + '" opacity=".7"><rect x="470" y="150" width="6" height="6"/><rect x="470" y="166" width="6" height="6"/><rect x="484" y="150" width="6" height="6"/></g>';
      case "vancouver":
        return '<polygon points="60,326 200,120 300,326" fill="#0b0d16"/><polygon points="220,326 380,150 520,326" fill="#0b0d16" opacity=".9"/>' +
          '<polygon points="250,200 290,150 330,200 320,200 290,168 260,200" fill="#fff" opacity=".22"/>' +
          '<g stroke="#0b0d16" stroke-width="5" fill="none"><path d="M120 300 h420"/><path d="M120 300 v-40"/><path d="M540 300 v-40"/><path d="M120 268 q90 -60 210 -60 t210 60"/></g>' +
          '<g fill="#0b0d16"><polygon points="360,326 384,326 372,286 352,286"/><polygon points="410,326 434,326 422,290 402,290"/></g>';
      case "macao":
        return '<g fill="#0b0d16"><rect x="286" y="200" width="68" height="126" rx="6"/><polygon points="290,200 350,200 320,150"/></g>' +
          '<g fill="' + a + '" opacity=".8"><circle cx="320" cy="176" r="7"/></g>' +
          '<g fill="#0b0d16"><path d="M240 326 q0 -70 80 -70 q80 0 80 70 Z"/></g>' +
          '<g stroke="' + a + '" stroke-width="2" opacity=".5"><path d="M240 326 q0 -70 80 -70"/><path d="M400 326 q0 -70 -80 -70"/></g>';
      case "vegas":
        return '<polygon points="150,326 250,326 240,160" fill="#0b0d16"/><line x1="240" y1="160" x2="238" y2="120" stroke="#0b0d16" stroke-width="5"/>' +
          '<circle cx="238" cy="116" r="7" fill="' + a + '" opacity=".9"/>' +
          '<g stroke="#0b0d16" stroke-width="4" fill="none"><circle cx="430" cy="240" r="58"/><circle cx="430" cy="240" r="10" fill="#0b0d16"/></g>' +
          '<g stroke="' + a + '" stroke-width="2.5" opacity=".7"><line x1="430" y1="182" x2="430" y2="298"/><line x1="372" y1="240" x2="488" y2="240"/><line x1="389" y1="199" x2="471" y2="281"/><line x1="471" y1="199" x2="389" y2="281"/></g>';
      default:
        return "";
    }

    function dn(x, c) {
      return '<g fill="#0b0d16"><rect x="' + x + '" y="270" width="40" height="56"/></g>' +
        '<ellipse cx="' + (+x + 20) + '" cy="258" rx="22" ry="28" fill="#0b0d16"/>' +
        '<rect x="' + (+x + 17) + '" y="226" width="6" height="14" fill="' + a + '" opacity=".8"/>';
    }
  }

  function svg(city) {
    const id = city.id;
    const sky = city.sky || ["#1b1c22", "#0c0d10", "#050506"];
    const accent = city.accent || "#f5c542";
    const ground = city.ground || "#1a1a28";
    const dark = "#0b0d16";
    const seed = (city.index != null ? city.index : 1) + 3;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs>' +
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + sky[0] + '"/>' +
          '<stop offset="55%" stop-color="' + sky[1] + '"/>' +
          '<stop offset="100%" stop-color="' + sky[2] + '"/>' +
        '</linearGradient>' +
        '<radialGradient id="sun" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="#fffbe6"/><stop offset="55%" stop-color="' + accent + '"/><stop offset="100%" stop-color="' + accent + '" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="b0" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#20222e"/><stop offset="100%" stop-color="#0b0d16"/></linearGradient>' +
        '<linearGradient id="b1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#181a24"/><stop offset="100%" stop-color="#0b0d16"/></linearGradient>' +
        '<linearGradient id="b2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#24273a"/><stop offset="100%" stop-color="#0b0d16"/></linearGradient>' +
        '<linearGradient id="b3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1c1f2c"/><stop offset="100%" stop-color="#0b0d16"/></linearGradient>' +
        '<linearGradient id="b4" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2a2d3f"/><stop offset="100%" stop-color="#0b0d16"/></linearGradient>' +
      '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#sky)"/>' +
      '<circle cx="' + (seed % 2 ? 150 : 500) + '" cy="96" r="90" fill="url(#sun)" opacity=".85"/>' +
      skyline(seed, accent, dark) +
      landmark(id, accent) +
      '<rect x="0" y="' + GROUND + '" width="' + W + '" height="' + (H - GROUND) + '" fill="' + ground + '"/>' +
      '<rect x="0" y="' + GROUND + '" width="' + W + '" height="6" fill="rgba(0,0,0,.4)"/>' +
    '</svg>';
  }

  const cache = {};
  function rawSVG(cityId) {
    if (cache[cityId]) return cache[cityId];
    let city = null;
    if (AK.cityById) city = AK.cityById(cityId);
    if (!city) return "";
    cache[cityId] = svg(city);
    return cache[cityId];
  }

  function uri(cityId) {
    const s = rawSVG(cityId);
    if (!s) return "";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }

  AK.CityArt = { svg: rawSVG, uri: uri };
})(window);

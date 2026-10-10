/* ==========================================================================
 * ALL-IN KINGDOM  ·  characters.js
 * Personajes animados (CSS 3D) con CARAS DIBUJADAS (SVG) de muchas
 * tonalidades y peinados: apostar, ganar, perder, farolear.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});
  const Characters = (AK.Characters = {});

  /* Paletas -------------------------------------------------------------- */
  const SKINS = [
    "#f9e3d2", "#f6d8bc", "#f3cfa6", "#ecc398", "#e3b184", "#d9a273",
    "#cf8f5f", "#c08248", "#ad7138", "#985a2c", "#7e4821", "#693a1b", "#542d15", "#3f2210"
  ];
  const HAIR_COLORS = [
    "#17140f", "#221a11", "#332317", "#3a2415", "#4a2c18", "#5a341d",
    "#6e3d1f", "#82491f", "#965524", "#a86a2e", "#bd7f33", "#cf9238",
    "#e0aa3e", "#e8c14b", "#d98a2c", "#c1512b", "#a84424", "#8a3620",
    "#7a4a35", "#c88a6a", "#d8d2c8", "#b9b4ad", "#8f8f96", "#5d5d66",
    "#51415e", "#2c3e50", "#1e6e8c", "#7a2c3a", "#5a2e8c", "#b23a48",
    "#20a0d8", "#3fae5a"
  ];
  const HAIR_STYLES = ["bald", "buzz", "short", "curly", "afro", "long", "ponytail", "bun", "mohawk", "fade", "headwrap", "beanie", "bob", "crown"];
  const EYE_COLORS = ["#241a12", "#3a2416", "#4a2e18", "#5a3a1c", "#6b4620", "#2c3a5a", "#3a548a", "#2a5a3a", "#4a7228", "#8a5a1a", "#1c1c22"];
  const MOUTHS = ["smile", "grin", "serious", "smirk", "poker", "laugh", "pout", "o"];
  const BROWS = ["flat", "angled", "soft", "worried", "high"];
  const FACIALS = ["none", "stubble", "mustache", "goatee", "beard", "soulpatch"];
  const ACCS = ["none", "glasses", "shades", "earring", "headband", "headphones", "eyepatch", "crown"];
  const ACCENT_COLORS = ["#8d99a4", "#e0568b", "#e8c15a", "#4e7fa8", "#7cab56", "#f5c542", "#b06fce", "#e76f51", "#3f7d8c", "#2f9d7a"];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const DEFAULT_FACE = { skin: "#e3b184", hair: "short", hairColor: "#3a2415", eyes: "#4a2e18", mouth: "smile", brow: "flat", facial: "none", acc: "none" };

  const FACE_PALETTES = {
    skins: SKINS, hairColors: HAIR_COLORS, styles: HAIR_STYLES,
    eyes: EYE_COLORS, mouths: MOUTHS, brows: BROWS, facials: FACIALS, accs: ACCS, accents: ACCENT_COLORS
  };

  function defaultFace() {
    return { skin: DEFAULT_FACE.skin, hair: DEFAULT_FACE.hair, hairColor: DEFAULT_FACE.hairColor, eyes: DEFAULT_FACE.eyes, mouth: DEFAULT_FACE.mouth, brow: DEFAULT_FACE.brow, facial: DEFAULT_FACE.facial, acc: DEFAULT_FACE.acc };
  }

  Characters.randomFace = function () {
    return {
      skin: pick(SKINS), hair: pick(HAIR_STYLES), hairColor: pick(HAIR_COLORS),
      eyes: pick(EYE_COLORS), mouth: pick(MOUTHS), brow: pick(BROWS),
      facial: pick(FACIALS), acc: pick(ACCS)
    };
  };

  Characters.FACE_PALETTES = FACE_PALETTES;
  Characters.DEFAULT_FACE = defaultFace;

  /* ================================================================== *
   *  CONSTRUCCION DEL ROSTRO (SVG)                                     *
   * ================================================================== */

  /* Pelo de detrás (cubre parte alta/nuca) según el peinado */
  function hairBack(f) {
    const h = f.hairColor;
    switch (f.hair) {
      case "bald":
      case "crown":
        return "";
      case "buzz":
        return '<path d="M26 42 Q22 20 50 20 Q78 20 74 42 Q70 50 62 50 L38 50 Q30 50 26 42 Z" fill="' + h + '"/>';
      case "fade":
        return '<path d="M25 38 Q22 16 50 16 Q78 16 75 38 Q72 46 64 46 L36 46 Q28 46 25 38 Z" fill="' + h + '"/>' +
               '<path d="M26 44 L74 44 Q70 56 30 56 Z" fill="' + h + '" opacity="0.75"/>';
      case "short":
        return '<path d="M24 44 Q20 10 50 10 Q80 10 76 44 Q72 52 64 50 L36 50 Q28 52 24 44 Z" fill="' + h + '"/>';
      case "curly":
        return '<path d="M22 44 Q18 12 50 12 Q82 12 78 44 Q74 52 66 50 L34 50 Q26 52 22 44 Z" fill="' + h + '"/>' +
          '<circle cx="32" cy="28" r="9" fill="' + h + '"/><circle cx="50" cy="18" r="10" fill="' + h + '"/>' +
          '<circle cx="68" cy="28" r="9" fill="' + h + '"/><circle cx="24" cy="38" r="8" fill="' + h + '"/>' +
          '<circle cx="76" cy="38" r="8" fill="' + h + '"/>';
      case "afro":
        return '<circle cx="28" cy="34" r="12" fill="' + h + '"/><circle cx="50" cy="20" r="14" fill="' + h + '"/>' +
          '<circle cx="72" cy="34" r="12" fill="' + h + '"/><circle cx="38" cy="22" r="11" fill="' + h + '"/>' +
          '<circle cx="62" cy="22" r="11" fill="' + h + '"/><circle cx="20" cy="46" r="9" fill="' + h + '"/>' +
          '<circle cx="80" cy="46" r="9" fill="' + h + '"/><circle cx="50" cy="30" r="12" fill="' + h + '"/>';
      case "long":
        return '<path d="M24 44 Q20 8 50 8 Q80 8 76 44 Q74 54 66 52 L34 52 Q26 54 24 44 Z" fill="' + h + '"/>' +
          '<rect x="26" y="30" width="13" height="58" rx="7" fill="' + h + '"/>' +
          '<rect x="61" y="30" width="13" height="58" rx="7" fill="' + h + '"/>';
      case "ponytail":
        return '<path d="M24 44 Q20 10 50 10 Q80 10 76 44 Q72 52 64 50 L36 50 Q28 52 24 44 Z" fill="' + h + '"/>' +
          '<path d="M74 34 Q86 40 84 76 Q82 88 74 84 Q78 60 72 48 Z" fill="' + h + '"/>' +
          '<rect x="70" y="40" width="16" height="7" rx="3" fill="#e0568b"/>';
      case "bun":
        return '<path d="M24 44 Q20 10 50 10 Q80 10 76 44 Q72 52 64 50 L36 50 Q28 52 24 44 Z" fill="' + h + '"/>' +
          '<circle cx="58" cy="12" r="10" fill="' + h + '"/>' +
          '<rect x="48" y="16" width="14" height="6" rx="3" fill="#e0568b"/>';
      case "mohawk":
        return '<path d="M46 62 L50 8 L54 62 Z" fill="' + h + '"/>' +
          '<path d="M44 60 L56 60 L52 50 L48 50 Z" fill="' + h + '"/>';
      case "headwrap":
        return '<path d="M20 26 Q50 12 80 26 Q82 46 78 56 L22 56 Q18 46 20 26 Z" fill="' + h + '"/>' +
          '<circle cx="50" cy="18" r="7" fill="' + h + '"/>';
      case "beanie":
        return '<path d="M20 40 Q18 20 50 16 Q82 20 80 40 Q78 48 72 48 L28 48 Q22 48 20 40 Z" fill="' + h + '"/>' +
          '<circle cx="50" cy="12" r="7" fill="' + h + '"/>' +
          '<rect x="20" y="44" width="60" height="9" rx="4.5" fill="#28425e"/>';
      case "bob":
        return '<path d="M24 40 Q20 10 50 10 Q80 10 76 40 Q74 50 66 50 L34 50 Q26 50 24 40 Z" fill="' + h + '"/>' +
          '<rect x="28" y="24" width="13" height="52" rx="6" fill="' + h + '"/>' +
          '<rect x="59" y="24" width="13" height="52" rx="6" fill="' + h + '"/>';
      default:
        return '<path d="M24 44 Q20 10 50 10 Q80 10 76 44 Q72 52 64 50 L36 50 Q28 52 24 44 Z" fill="' + h + '"/>';
    }
  }

  /* Flequillo / pelo delantero */
  function hairFront(f) {
    const h = f.hairColor;
    switch (f.hair) {
      case "bald":
      case "crown":
      case "fade":
      case "headwrap":
      case "beanie":
        return "";
      case "short":
        return '<path d="M40 40 Q50 30 60 40 L57 46 Q50 40 43 46 Z" fill="' + h + '"/>';
      case "curly":
        return '<circle cx="34" cy="42" r="7" fill="' + h + '"/><circle cx="43" cy="38" r="7" fill="' + h + '"/>' +
          '<circle cx="52" cy="40" r="7" fill="' + h + '"/><circle cx="61" cy="38" r="7" fill="' + h + '"/>' +
          '<circle cx="68" cy="43" r="7" fill="' + h + '"/>';
      case "afro":
        return '<circle cx="26" cy="48" r="9" fill="' + h + '"/><circle cx="38" cy="44" r="9" fill="' + h + '"/>' +
          '<circle cx="50" cy="42" r="9" fill="' + h + '"/><circle cx="62" cy="44" r="9" fill="' + h + '"/>' +
          '<circle cx="74" cy="48" r="9" fill="' + h + '"/>';
      case "long":
        return '<path d="M34 44 Q28 58 32 80 Q40 82 44 66 L43 46 Z" fill="' + h + '"/>' +
          '<path d="M66 44 Q72 58 68 80 Q60 82 56 66 L57 46 Z" fill="' + h + '"/>';
      case "ponytail":
        return '<path d="M40 44 Q48 38 58 44 L55 48 Q46 42 43 48 Z" fill="' + h + '"/>';
      case "mohawk":
        return "";
      case "bun":
        return '<path d="M40 40 Q50 30 60 40 L57 46 Q50 40 43 46 Z" fill="' + h + '"/>';
      case "bob":
        return '<rect x="31" y="36" width="38" height="13" rx="6.5" fill="' + h + '"/>';
      default:
        return "";
    }
  }

  function ears(f) {
    return '<ellipse cx="17" cy="56" rx="5" ry="8" fill="' + f.skin + '" stroke="rgba(0,0,0,.12)"/>' +
      '<ellipse cx="83" cy="56" rx="5" ry="8" fill="' + f.skin + '" stroke="rgba(0,0,0,.12)"/>';
  }

  function brows(f) {
    const c = f.hairColor;
    switch (f.brow) {
      case "high":
        return '<rect x="29" y="36" width="14" height="3" rx="1.5" fill="' + c + '"/><rect x="57" y="36" width="14" height="3" rx="1.5" fill="' + c + '"/>';
      case "angled":
        return '<path d="M29 45 L43 40 L43 43 L29 47 Z" fill="' + c + '"/><path d="M71 45 L57 40 L57 43 L71 47 Z" fill="' + c + '"/>';
      case "worried":
        return '<path d="M29 42 Q36 45 43 44" stroke="' + c + '" stroke-width="2.6" fill="none"/><path d="M71 42 Q64 45 57 44" stroke="' + c + '" stroke-width="2.6" fill="none"/>';
      case "soft":
        return '<path d="M29 44 Q36 40 43 43" stroke="' + c + '" stroke-width="2.6" fill="none"/><path d="M71 44 Q64 40 57 43" stroke="' + c + '" stroke-width="2.6" fill="none"/>';
      default:
        return '<rect x="29" y="43" width="14" height="3.4" rx="1.7" fill="' + c + '"/><rect x="57" y="43" width="14" height="3.4" rx="1.7" fill="' + c + '"/>';
    }
  }

  function eyes(f) {
    function one(x) {
      return '<ellipse cx="' + x + '" cy="52" rx="5.2" ry="6.4" fill="#fff" stroke="rgba(0,0,0,.22)"/>' +
        '<circle cx="' + x + '" cy="52" r="2.9" fill="' + f.eyes + '"/>' +
        '<circle cx="' + (x - 1.2) + '" cy="50.2" r="1" fill="#fff"/>' +
        '<path d="M' + (x - 5.4) + ' 47 Q' + x + ' 44 ' + (x + 5.4) + ' 47" stroke="rgba(30,20,10,.7)" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    }
    return one(37) + one(63);
  }

  function nose(f) {
    return '<path d="M50 56 q7 7 -1 11" stroke="rgba(60,35,15,.35)" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
  }

  function mouth(f) {
    switch (f.mouth) {
      case "grin":
        return '<path d="M38 70 Q50 84 62 70 Z" fill="#7a2d22"/>' +
          '<path d="M42 71 Q50 74 58 71 L58 77 Q50 80 42 77 Z" fill="#fff"/>';
      case "serious":
        return '<path d="M40 74 L60 74" stroke="#8a4a32" stroke-width="2.7" stroke-linecap="round"/>';
      case "smirk":
        return '<path d="M40 72 Q50 75 61 77" stroke="#8a4a32" stroke-width="2.7" fill="none" stroke-linecap="round"/>';
      case "poker":
        return '<path d="M42 72 Q50 70 58 72" stroke="#8a4a32" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
      case "laugh":
        return '<ellipse cx="50" cy="76" rx="10" ry="8" fill="#5a2420"/>' +
          '<path d="M42 77 Q50 80 58 77 L58 80 Q50 83 42 80 Z" fill="#fff"/>';
      case "pout":
        return '<path d="M40 73 Q50 68 60 73" stroke="#8a4a32" stroke-width="2.7" fill="none" stroke-linecap="round"/>';
      case "o":
        return '<circle cx="50" cy="75" r="4.6" fill="#6b2a22"/>';
      default:
        return '<path d="M38 72 Q50 83 62 72" stroke="#8a4a32" stroke-width="2.7" fill="none" stroke-linecap="round"/>';
    }
  }

  function facialHair(f) {
    const h = f.hairColor;
    switch (f.facial) {
      case "stubble":
        return '<path d="M32 68 Q50 90 68 68 L64 76 Q50 92 36 76 Z" fill="' + h + '" opacity="0.18"/>';
      case "mustache":
        return '<path d="M38 73 Q50 78 62 73 Q58 69 50 71 Q42 69 38 73 Z" fill="' + h + '"/>';
      case "goatee":
        return '<ellipse cx="50" cy="84" rx="7.5" ry="5.5" fill="' + h + '"/>' +
          '<path d="M50 76 L53 82 L50 86 L47 82 Z" fill="' + h + '"/>';
      case "beard":
        return '<path d="M34 68 Q64 68 66 70 Q64 80 58 86 Q50 92 42 86 Q36 80 34 68 Z" fill="' + h + '"/>';
      case "soulpatch":
        return '<ellipse cx="50" cy="82" rx="3.2" ry="2.8" fill="' + h + '"/>';
      default:
        return "";
    }
  }

  function accessory(f) {
    switch (f.acc) {
      case "glasses":
        return '<circle cx="37" cy="52" r="7.5" fill="none" stroke="#2a2a30" stroke-width="2"/>' +
          '<circle cx="63" cy="52" r="7.5" fill="none" stroke="#2a2a30" stroke-width="2"/>' +
          '<path d="M44.5 52 L55.5 52" stroke="#2a2a30" stroke-width="2"/>' +
          '<path d="M29.5 51 L20 48" stroke="#2a2a30" stroke-width="2"/>' +
          '<path d="M70.5 51 L80 48" stroke="#2a2a30" stroke-width="2"/>';
      case "shades":
        return '<rect x="28" y="47" width="18" height="11" rx="4.5" fill="#181a22"/>' +
          '<rect x="54" y="47" width="18" height="11" rx="4.5" fill="#181a22"/>' +
          '<path d="M46 51 L54 51" stroke="#181a22" stroke-width="2.5"/>';
      case "earring":
        return '<circle cx="17" cy="62" r="2.4" fill="#f5c542"/>' + '<circle cx="83" cy="62" r="2.4" fill="#f5c542"/>';
      case "headband":
        return '<path d="M21 32 Q50 20 79 32 Q79 36 74 37 L26 37 Q21 36 21 32 Z" fill="' + f.hairColor + '"/>' +
          '<path d="M40 26 Q50 18 60 26 Q58 30 50 30 Q42 30 40 26 Z" fill="#e0568b"/>';
      case "headphones":
        return '<path d="M27 34 Q50 12 73 34" stroke="#23242c" stroke-width="6" fill="none" stroke-linecap="round"/>' +
          '<rect x="21" y="34" width="12" height="16" rx="5" fill="#23242c"/>' +
          '<rect x="67" y="34" width="12" height="16" rx="5" fill="#23242c"/>';
      case "eyepatch":
        return '<path d="M36 42 L78 68" stroke="#1c1d24" stroke-width="2"/>' +
          '<rect x="42" y="49" width="15" height="12" rx="3" fill="#1c1d24"/>';
      case "crown":
        return '<path d="M30 22 L34 10 L44 24 L50 9 L56 24 L66 10 L70 22 Z" fill="#f5c542" stroke="#8a6210" stroke-width="1.4" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="18" r="1.6" fill="#fff"/><circle cx="50" cy="14" r="1.6" fill="#fff"/><circle cx="68" cy="18" r="1.6" fill="#fff"/>';
      default:
        return "";
    }
  }

  /* Rostro completo en SVG. También se usa para el HUD (pequeño). */
  function headSVG(face) {
    const f = face;
    return '<svg class="char-face" viewBox="0 0 100 100" aria-hidden="true">' +
      hairBack(f) +
      '<ellipse cx="50" cy="54" rx="33" ry="34" fill="' + f.skin + '" stroke="rgba(0,0,0,.16)" stroke-width="1"/>' +
      '<ellipse cx="68" cy="60" rx="11" ry="20" fill="rgba(0,0,0,.10)"/>' +
      '<path d="M30 38 Q22 84 44 92 Q20 84 30 38 Z" fill="rgba(255,255,255,.16)"/>' +
      ears(f) +
      '<ellipse cx="32" cy="66" rx="4" ry="2.6" fill="rgba(214,120,110,.4)"/>' +
      '<ellipse cx="68" cy="66" rx="4" ry="2.6" fill="rgba(214,120,110,.4)"/>' +
      hairFront(f) +
      brows(f) +
      eyes(f) +
      nose(f) +
      mouth(f) +
      facialHair(f) +
      '<rect x="41" y="86" width="18" height="14" rx="7" fill="' + f.skin + '"/>' +
      accessory(f) +
      "</svg>";
  }

  Characters.headHTML = function (face) { return headSVG(face || defaultFace()); };

  /* ================================================================== *
   *  PERSONAJE COMPLETO                                                *
   * ================================================================== */
  const REACTIONS = ["is-bet", "is-allin", "is-call", "is-win", "is-lose", "is-fold", "is-thinking", "is-sad", "is-happy"];

  /**
   * Crea un personaje.
   * @param {object} spec { face(claves de rasgos), color, skin, size }
   */
  Characters.create = function (spec) {
    spec = spec || {};
    const face = {};
    const base = spec.face && typeof spec.face === "object" ? spec.face : defaultFace();
    Object.keys(DEFAULT_FACE).forEach(function (k) { face[k] = base[k]; });
    const el = document.createElement("div");
    el.className = "character";
    const accent1 = spec.color || pick(ACCENT_COLORS);
    let accent2 = pick(ACCENT_COLORS);
    if (accent2 === accent1) accent2 = "#f5c542";
    el.style.setProperty("--accent", accent1);
    el.style.setProperty("--accent-2", accent2);
    el.style.setProperty("--skin", face.skin);

    const suit =
      '<svg class="char-suit" viewBox="0 0 40 42" aria-hidden="true">' +
        '<path d="M20 2 Q34 4 38 14 L38 20 L2 20 L2 14 Q6 4 20 2 Z" fill="rgba(255,255,255,.16)"/>' +
        '<path d="M20 2 Q34 4 38 14 L38 22 Q30 15 20 15 Q10 15 2 22 L2 14 Q6 4 20 2 Z" fill="rgba(0,0,0,.28)"/>' +
        '<path d="M12 6 L20 21 L28 6 Q24 3 20 3 Q16 3 12 6 Z" fill="rgba(0,0,0,.45)"/>' +
        '<path d="M20 20 L17 13 L20 8 L23 13 Z" fill="var(--accent-2)"/>' +
        '<path d="M20 20 L18.4 15 L20 13 L21.6 15 Z" fill="rgba(0,0,0,.25)"/>' +
        '<circle cx="20" cy="25" r="1.3" fill="rgba(0,0,0,.45)"/>' +
        '<circle cx="20" cy="30.5" r="1.3" fill="rgba(0,0,0,.45)"/>' +
        '<circle cx="20" cy="36" r="1.3" fill="rgba(0,0,0,.45)"/>' +
      "</svg>";

    el.innerHTML =
      '<div class="char-bubble"></div>' +
      '<div class="char-rig">' +
        '<div class="char-arm left"></div>' +
        '<div class="char-arm right"></div>' +
        '<div class="char-body">' +
          '<div class="char-torso">' + suit + "</div>" +
        "</div>" +
        '<div class="char-head">' + headSVG(face) + "</div>" +
      "</div>" +
      '<div class="char-shadow"></div>';

    if (spec.size === "big") el.classList.add("char-big");
    if (spec.size === "small") el.classList.add("char-small");
    return el;
  };

  /** Aplica una reaccion con duracion. */
  Characters.react = function (el, type, ms) {
    if (!el) return;
    REACTIONS.forEach(function (r) { el.classList.remove(r); });
    void el.offsetWidth;
    const cls = "is-" + type;
    el.classList.add(cls);
    if (el._reactTimer) clearTimeout(el._reactTimer);
    el._reactTimer = setTimeout(function () {
      REACTIONS.forEach(function (r) { el.classList.remove(r); });
    }, ms || 1300);
  };

  /** Muestra un bocadillo de dialogo. */
  Characters.say = function (el, text, ms) {
    if (!el || !text) return;
    const b = el.querySelector(".char-bubble");
    if (!b) return;
    b.textContent = text;
    b.classList.add("show");
    if (el._bubbleTimer) clearTimeout(el._bubbleTimer);
    el._bubbleTimer = setTimeout(function () { b.classList.remove("show"); }, ms || 2400);
  };

  /** Marca al personaje como "en turno". */
  Characters.setActive = function (el, active) {
    if (!el) return;
    el.classList.toggle("is-active", !!active);
  };

  /** Elige una frase de un tipo dado. */
  Characters.quip = function (quips, type) {
    if (!quips) return "";
    const arr = quips[type];
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  };
})(window);
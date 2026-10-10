/* ==========================================================================
 * ALL-IN KINGDOM  ·  guard.js
 * Disuasores de trampa en cliente: bloqueo de recarga (F5, Ctrl+R, Ctrl+F5),
 * menú contextual, atajos de DevTools y deteccion de herramientas abiertas.
 * NOTA: en un navegador ninguna proteccion de cliente es infalible; esto
 * solo desanima al jugador casual de recargar o espiar el estado del juego.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});
  const doc = global.document;

  let overlay = null;
  let watchdog = null;

  function buildOverlay() {
    if (!doc || overlay) return;
    overlay = doc.createElement("div");
    overlay.id = "guard-overlay";
    overlay.className = "guard-overlay";
    overlay.innerHTML =
      '<div class="guard-box">' +
        '<div class="guard-icon">\u26A0\uFE0F</div>' +
        '<h2>Inspección no permitida</h2>' +
        '<p>Este juego ha detectado las herramientas de desarrollo abiertas.</p>' +
        '<p class="guard-sub">Cierra las DevTools para seguir jugando limpio. El progreso se pausa mientras estén abiertas.</p>' +
        '<button type="button" class="btn primary" id="guard-close">Ya las cerré</button>' +
      '</div>';
    doc.body.appendChild(overlay);
    const btn = doc.getElementById("guard-close");
    if (btn) btn.addEventListener("click", function () { if (!isOpen()) hide(); });
  }

  function isOpen() {
    if (!global.outerWidth) return false;
    const wDiff = global.outerWidth - global.innerWidth;
    const hDiff = global.outerHeight - global.innerHeight;
    return wDiff > 170 || hDiff > 200;
  }

  function show() { if (overlay) overlay.classList.add("open"); }
  function hide() { if (overlay) overlay.classList.remove("open"); }

  function startWatchdog() {
    if (watchdog) return;
    watchdog = global.setInterval(function () {
      if (isOpen()) show(); else hide();
    }, 900);
  }

  function blockKeys() {
    global.addEventListener("keydown", function (e) {
      const k = (e.key || "").toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      /* Recarga de pagina: F5, Ctrl+R, Ctrl+Shift+R, Ctrl+F5 */
      if (k === "f5" || (ctrl && k === "r")) { e.preventDefault(); e.stopPropagation(); return false; }

      /* Guardar / ver codigo fuente */
      if (ctrl && (k === "s" || k === "u" || k === "p")) { e.preventDefault(); e.stopPropagation(); return false; }

      /* DevTools: F12, Ctrl+Shift+I/J/C/K */
      if (k === "f12") { e.preventDefault(); e.stopPropagation(); return false; }
      if (ctrl && e.shiftKey && ["i", "j", "c", "k"].indexOf(k) >= 0) { e.preventDefault(); e.stopPropagation(); return false; }
      if (ctrl && k === "i") { e.preventDefault(); e.stopPropagation(); return false; }
    }, true);
  }

  function blockContext() {
    doc.addEventListener("contextmenu", function (e) { e.preventDefault(); return false; });
    /* Bloquea arrastrar elementos (evita arrastrar la baraja a la consola, etc.) */
    doc.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  function blockUnload() {
    global.addEventListener("beforeunload", function (e) {
      e.preventDefault();
      e.returnValue = "";
      return "";
    });
  }

  const Guard = {
    install: function () {
      if (!doc) return;
      blockKeys();
      blockContext();
      blockUnload();
      buildOverlay();
      startWatchdog();
    },
    isOpen: isOpen
  };

  AK.Guard = Guard;
})(window);

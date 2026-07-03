(function () {
  "use strict";

  /* =========================
     CONFIG
  ========================== */
  var FIRST_DELAY_MS = 30000;   // 30 sec
  var REPEAT_DELAY_MS = 30000;  // 30 sec

  var popupTimer = null;
  var isOpen = false;
  var started = false;

  function mountRoot() {
    return document.body || document.documentElement;
  }

  /* =========================
     PANEL (BUTTON INSTEAD OF IFRAME)
  ========================== */
  function panelMarkup() {
    return `
      <div class="grasp-popup-head">
        <h2>Lead Generation Form</h2>
        <button class="grasp-popup-close" id="graspPopupClose">&times;</button>
      </div>

      <div class="grasp-popup-body">
        <p>Click below to fill your details</p>

        <a href="http://72.60.218.193:8090/form-builder/bd8ca06a-6c3c-4230-8ce5-c75e46956392-1782972048" target="_blank">
          <button class="grasp-open-btn">Open Form</button>
        </a>
      </div>
    `;
  }

  /* =========================
     BUILD POPUP
  ========================== */
  function buildPopup() {
    if (document.getElementById("graspPopupOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "graspPopupOverlay";
    overlay.className = "grasp-popup-overlay";

    overlay.innerHTML = `
      <div class="grasp-popup">
        ${panelMarkup()}
      </div>
    `;

    mountRoot().appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePopup();
    });

    bindEvents();
  }

  /* =========================
     EVENTS
  ========================== */
  function bindEvents() {
    var closeBtn = document.getElementById("graspPopupClose");
    if (closeBtn) closeBtn.addEventListener("click", closePopup);
  }

  /* =========================
     OPEN POPUP
  ========================== */
  function openPopup() {
    if (isOpen) return;

    buildPopup();

    var overlay = document.getElementById("graspPopupOverlay");
    if (!overlay) return;

    isOpen = true;
    overlay.style.display = "flex";
  }

  /* =========================
     CLOSE POPUP
  ========================== */
  function closePopup() {
    var overlay = document.getElementById("graspPopupOverlay");
    if (!overlay) return;

    isOpen = false;
    overlay.style.display = "none";

    schedulePopup(REPEAT_DELAY_MS);
  }

  /* =========================
     TIMER
  ========================== */
  function schedulePopup(delay) {
    clearTimeout(popupTimer);

    popupTimer = setTimeout(function () {
      openPopup();
    }, delay);
  }

  function startPopupTimer() {
    if (started) return;
    started = true;

    schedulePopup(FIRST_DELAY_MS);
  }

  /* =========================
     INIT
  ========================== */
  if (document.readyState === "complete") {
    startPopupTimer();
  } else {
    window.addEventListener("load", startPopupTimer, { once: true });
  }

})();
(function () {
  "use strict";

  var GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxCctBV2U3RH3xPZ4fIFTo3GP4eUlr9hNp5MYxVALs2alyRPQ8jp6hbaZbKHwkZER0X/exec";
  var FIRST_DELAY_MS = 15 * 1000;
  var REPEAT_DELAY_MS = 2 * 60 * 1000;
  var popupTimer = null;
  var isOpen = false;
  var isSubmitting = false;
  var hasShownOnce = false;
  var started = false;

  function pageName() {
    var path = window.location.pathname || "index.html";
    var parts = path.split("/");
    var name = parts[parts.length - 1] || "index.html";
    return name || "index.html";
  }

  function mountRoot() {
    return document.body || document.documentElement;
  }

  function formMarkup() {
    return (
      '<form class="grasp-popup-form" id="graspPopupForm" novalidate>' +
        '<div class="grasp-form-field">' +
          '<label for="graspPopupName">Full Name</label>' +
          '<div class="grasp-input-wrap">' +
            '<i class="fa-solid fa-user grasp-input-icon" aria-hidden="true"></i>' +
            '<input type="text" id="graspPopupName" name="name" placeholder="Your name" required />' +
          '</div>' +
        '</div>' +
        '<div class="grasp-form-field">' +
          '<label for="graspPopupPhone">Phone Number</label>' +
          '<div class="grasp-input-wrap">' +
            '<i class="fa-solid fa-phone grasp-input-icon" aria-hidden="true"></i>' +
            '<input type="tel" id="graspPopupPhone" name="phone" placeholder="+91 " autocomplete="tel" required />' +
          '</div>' +
        '</div>' +
        '<div class="grasp-form-field">' +
          '<label for="graspPopupEmail">Email</label>' +
          '<div class="grasp-input-wrap">' +
            '<i class="fa-solid fa-envelope grasp-input-icon" aria-hidden="true"></i>' +
            '<input type="email" id="graspPopupEmail" name="email" placeholder="you@email.com" required />' +
          '</div>' +
        '</div>' +
        '<div class="grasp-form-field">' +
          '<label for="graspPopupInterest">I am interested in</label>' +
          '<div class="grasp-input-wrap">' +
            '<i class="fa-solid fa-building grasp-input-icon" aria-hidden="true"></i>' +
            '<select id="graspPopupInterest" name="interest">' +
              '<option value="">Select an option</option>' +
              '<option value="Buying a property">Buying a property</option>' +
              '<option value="Renting a property">Renting a property</option>' +
              '<option value="Selling my property">Selling my property</option>' +
              '<option value="Investment advisory">Investment advisory</option>' +
              '<option value="Commercial property">Commercial property</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="grasp-form-field">' +
          '<label for="graspPopupMessage">Message</label>' +
          '<div class="grasp-input-wrap grasp-input-wrap--textarea">' +
            '<i class="fa-solid fa-comment-dots grasp-input-icon" aria-hidden="true"></i>' +
            '<textarea id="graspPopupMessage" name="message" rows="3" placeholder="Tell us about your requirements..." required></textarea>' +
          '</div>' +
        '</div>' +
        '<button type="submit" class="grasp-popup-submit" id="graspPopupSubmit">' +
          '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Submit Enquiry' +
        '</button>' +
        '<p class="grasp-popup-note"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Your information is sent securely to GRASP Realtors.</p>' +
      '</form>'
    );
  }

  function panelMarkup() {
    return (
      '<div class="grasp-popup-head">' +
        '<div>' +
          '<h2 id="graspPopupTitle"><i class="fa-solid fa-house-chimney" aria-hidden="true"></i> Get Property Guidance</h2>' +
          '<p><i class="fa-regular fa-clock" aria-hidden="true"></i> Share your details and our team will contact you shortly.</p>' +
        '</div>' +
        '<button type="button" class="grasp-popup-close" id="graspPopupClose" aria-label="Close popup">&times;</button>' +
      '</div>' +
      formMarkup()
    );
  }

  function bindPopupEvents() {
    var closeBtn = document.getElementById("graspPopupClose");
    var form = document.getElementById("graspPopupForm");
    if (closeBtn) closeBtn.addEventListener("click", closePopup);
    if (form) form.addEventListener("submit", onSubmit);
  }

  function buildPopup() {
    if (document.getElementById("graspPopupOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "graspPopupOverlay";
    overlay.className = "grasp-popup-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "graspPopupTitle");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<div class="grasp-popup-panel">' + panelMarkup() + "</div>";

    mountRoot().appendChild(overlay);

    if (!document.getElementById("graspPopupSubmitFrame")) {
      var frame = document.createElement("iframe");
      frame.id = "graspPopupSubmitFrame";
      frame.name = "graspPopupSubmitFrame";
      frame.title = "Popup form submit";
      frame.setAttribute("aria-hidden", "true");
      frame.style.display = "none";
      mountRoot().appendChild(frame);
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePopup();
    });

    bindPopupEvents();

    if (!overlay.dataset.keybound) {
      overlay.dataset.keybound = "1";
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen) closePopup();
      });
    }
  }

  function resetPanelForm() {
    var panel = document.querySelector("#graspPopupOverlay .grasp-popup-panel");
    if (!panel) return;
    panel.innerHTML = panelMarkup();
    bindPopupEvents();
  }

  function canShowPopup() {
    return !isOpen && !isSubmitting && !document.hidden;
  }

  function openPopup() {
    if (!canShowPopup()) {
      schedulePopup(nextDelay());
      return;
    }

    buildPopup();
    var overlay = document.getElementById("graspPopupOverlay");
    if (!overlay) return;

    if (overlay.querySelector(".grasp-popup-success")) {
      resetPanelForm();
    }

    hasShownOnce = true;
    isOpen = true;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("grasp-popup-open");

    var first = document.getElementById("graspPopupName");
    if (first) {
      setTimeout(function () {
        first.focus();
      }, 120);
    }
  }

  function closePopup() {
    var overlay = document.getElementById("graspPopupOverlay");
    if (!overlay) return;
    isOpen = false;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("grasp-popup-open");
    schedulePopup(REPEAT_DELAY_MS);
  }

  function showSuccess() {
    var panel = document.querySelector("#graspPopupOverlay .grasp-popup-panel");
    if (!panel) return;
    panel.innerHTML =
      '<div class="grasp-popup-head">' +
        '<div><h2 id="graspPopupTitle">Thank You!</h2></div>' +
        '<button type="button" class="grasp-popup-close" id="graspPopupClose" aria-label="Close popup">&times;</button>' +
      '</div>' +
      '<div class="grasp-popup-success">' +
        '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
        '<h3>Successfully Submitted</h3>' +
        '<p>We received your enquiry. Our team will contact you soon.</p>' +
      '</div>';
    document.getElementById("graspPopupClose").addEventListener("click", closePopup);
    setTimeout(closePopup, 2800);
  }

  function sendToGoogleSheet(payload) {
    return new Promise(function (resolve, reject) {
      var frame = document.getElementById("graspPopupSubmitFrame");
      if (!frame) {
        reject(new Error("Submit frame missing"));
        return;
      }

      var tempForm = document.createElement("form");
      tempForm.method = "POST";
      tempForm.action = GOOGLE_SCRIPT_URL;
      tempForm.target = "graspPopupSubmitFrame";
      tempForm.acceptCharset = "UTF-8";
      tempForm.style.display = "none";

      Object.keys(payload).forEach(function (key) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = payload[key];
        tempForm.appendChild(input);
      });

      var finished = false;
      function finish(ok) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        frame.onload = null;
        if (tempForm.parentNode) tempForm.parentNode.removeChild(tempForm);
        ok ? resolve() : reject(new Error("Submission failed"));
      }

      frame.onload = function () {
        finish(true);
      };

      var timer = setTimeout(function () {
        finish(true);
      }, 5000);

      mountRoot().appendChild(tempForm);
      tempForm.submit();
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    var form = document.getElementById("graspPopupForm");
    if (!form || !form.checkValidity()) {
      if (form) form.reportValidity();
      return;
    }

    var payload = {
      name: String(form.elements.name.value || "").trim(),
      phone: String(form.elements.phone.value || "").trim(),
      email: String(form.elements.email.value || "").trim(),
      interest: String(form.elements.interest.value || "").trim(),
      message: String(form.elements.message.value || "").trim(),
      sourcePage: "popup:" + pageName()
    };

    if (!payload.name || !payload.phone || !payload.email || !payload.message) return;

    isSubmitting = true;
    var btn = document.getElementById("graspPopupSubmit");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
    }

    sendToGoogleSheet(payload)
      .then(function () {
        isSubmitting = false;
        showSuccess();
      })
      .catch(function () {
        isSubmitting = false;
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Submit Enquiry';
        }
        alert("Could not submit. Please try again or call us directly.");
      });
  }

  function nextDelay() {
    return hasShownOnce ? REPEAT_DELAY_MS : FIRST_DELAY_MS;
  }

  function schedulePopup(delay) {
    clearTimeout(popupTimer);
    popupTimer = setTimeout(function () {
      popupTimer = null;
      openPopup();
    }, delay);
  }

  function startPopupTimer() {
    if (started) return;
    started = true;
    buildPopup();
    schedulePopup(FIRST_DELAY_MS);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden || isOpen || popupTimer) return;
    schedulePopup(nextDelay());
  });

  if (document.readyState === "complete") {
    startPopupTimer();
  } else {
    window.addEventListener("load", startPopupTimer, { once: true });
  }
})();

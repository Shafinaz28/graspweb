(function () {
  "use strict";

  var GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxCctBV2U3RH3xPZ4fIFTo3GP4eUlr9hNp5MYxVALs2alyRPQ8jp6hbaZbKHwkZER0X/exec";
  var INTERVAL_MS = 2 * 60 * 1000;
  var popupTimer = null;
  var isOpen = false;
  var isSubmitting = false;

  function pageName() {
    var path = window.location.pathname || "index.html";
    var parts = path.split("/");
    return parts[parts.length - 1] || "index.html";
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
    overlay.innerHTML =
      '<div class="grasp-popup-panel">' +
        '<div class="grasp-popup-head">' +
          '<div>' +
            '<h2 id="graspPopupTitle">Get Property Guidance</h2>' +
            '<p>Share your details and our team will contact you shortly.</p>' +
          '</div>' +
          '<button type="button" class="grasp-popup-close" id="graspPopupClose" aria-label="Close popup">&times;</button>' +
        '</div>' +
        '<form class="grasp-popup-form" id="graspPopupForm" novalidate>' +
          '<label for="graspPopupName">Full Name</label>' +
          '<input type="text" id="graspPopupName" name="name" placeholder="Your name" required />' +
          '<label for="graspPopupPhone">Phone Number</label>' +
          '<input type="tel" id="graspPopupPhone" name="phone" placeholder="+91 " autocomplete="tel" required />' +
          '<label for="graspPopupEmail">Email</label>' +
          '<input type="email" id="graspPopupEmail" name="email" placeholder="you@email.com" required />' +
          '<label for="graspPopupInterest">I am interested in</label>' +
          '<select id="graspPopupInterest" name="interest">' +
            '<option value="">Select an option</option>' +
            '<option value="Buying a property">Buying a property</option>' +
            '<option value="Renting a property">Renting a property</option>' +
            '<option value="Selling my property">Selling my property</option>' +
            '<option value="Investment advisory">Investment advisory</option>' +
            '<option value="Commercial property">Commercial property</option>' +
          '</select>' +
          '<label for="graspPopupMessage">Message</label>' +
          '<textarea id="graspPopupMessage" name="message" rows="3" placeholder="Tell us about your requirements..." required></textarea>' +
          '<button type="submit" class="grasp-popup-submit" id="graspPopupSubmit">Submit Enquiry</button>' +
          '<p class="grasp-popup-note">Your information is sent securely to GRASP Realtors.</p>' +
        '</form>' +
      '</div>';

    document.body.appendChild(overlay);

    if (!document.getElementById("graspPopupSubmitFrame")) {
      var frame = document.createElement("iframe");
      frame.id = "graspPopupSubmitFrame";
      frame.name = "graspPopupSubmitFrame";
      frame.title = "Popup form submit";
      frame.setAttribute("aria-hidden", "true");
      frame.style.display = "none";
      document.body.appendChild(frame);
    }

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePopup();
    });

    document.getElementById("graspPopupClose").addEventListener("click", closePopup);
    document.getElementById("graspPopupForm").addEventListener("submit", onSubmit);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) closePopup();
    });
  }

  function canShowPopup() {
    return !isOpen && !isSubmitting && !document.hidden;
  }

  function openPopup() {
    if (!canShowPopup()) {
      schedulePopup(INTERVAL_MS);
      return;
    }

    buildPopup();
    var overlay = document.getElementById("graspPopupOverlay");
    var panel = overlay.querySelector(".grasp-popup-panel");

    if (panel.querySelector(".grasp-popup-success")) {
      panel.innerHTML =
        '<div class="grasp-popup-head">' +
          '<div><h2 id="graspPopupTitle">Get Property Guidance</h2><p>Share your details and our team will contact you shortly.</p></div>' +
          '<button type="button" class="grasp-popup-close" id="graspPopupClose" aria-label="Close popup">&times;</button>' +
        '</div>' +
        '<form class="grasp-popup-form" id="graspPopupForm" novalidate>' +
          '<label for="graspPopupName">Full Name</label>' +
          '<input type="text" id="graspPopupName" name="name" placeholder="Your name" required />' +
          '<label for="graspPopupPhone">Phone Number</label>' +
          '<input type="tel" id="graspPopupPhone" name="phone" placeholder="+91 " autocomplete="tel" required />' +
          '<label for="graspPopupEmail">Email</label>' +
          '<input type="email" id="graspPopupEmail" name="email" placeholder="you@email.com" required />' +
          '<label for="graspPopupInterest">I am interested in</label>' +
          '<select id="graspPopupInterest" name="interest">' +
            '<option value="">Select an option</option>' +
            '<option value="Buying a property">Buying a property</option>' +
            '<option value="Renting a property">Renting a property</option>' +
            '<option value="Selling my property">Selling my property</option>' +
            '<option value="Investment advisory">Investment advisory</option>' +
            '<option value="Commercial property">Commercial property</option>' +
          '</select>' +
          '<label for="graspPopupMessage">Message</label>' +
          '<textarea id="graspPopupMessage" name="message" rows="3" placeholder="Tell us about your requirements..." required></textarea>' +
          '<button type="submit" class="grasp-popup-submit" id="graspPopupSubmit">Submit Enquiry</button>' +
          '<p class="grasp-popup-note">Your information is sent securely to GRASP Realtors.</p>' +
        '</form>';
      document.getElementById("graspPopupClose").addEventListener("click", closePopup);
      document.getElementById("graspPopupForm").addEventListener("submit", onSubmit);
    }

    isOpen = true;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("grasp-popup-open");
    var first = document.getElementById("graspPopupName");
    if (first) setTimeout(function () { first.focus(); }, 120);
  }

  function closePopup() {
    var overlay = document.getElementById("graspPopupOverlay");
    if (!overlay) return;
    isOpen = false;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("grasp-popup-open");
    schedulePopup(INTERVAL_MS);
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

      document.body.appendChild(tempForm);
      tempForm.submit();
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    var form = document.getElementById("graspPopupForm");
    if (!form.checkValidity()) {
      form.reportValidity();
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
      btn.textContent = "Sending...";
    }

    sendToGoogleSheet(payload)
      .then(function () {
        isSubmitting = false;
        showSuccess();
        schedulePopup(INTERVAL_MS);
      })
      .catch(function () {
        isSubmitting = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit Enquiry";
        }
        alert("Could not submit. Please try again or call us directly.");
      });
  }

  function schedulePopup(delay) {
    clearTimeout(popupTimer);
    popupTimer = setTimeout(function () {
      openPopup();
    }, delay);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && !isOpen && !popupTimer) {
      schedulePopup(INTERVAL_MS);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      schedulePopup(INTERVAL_MS);
    });
  } else {
    schedulePopup(INTERVAL_MS);
  }
})();

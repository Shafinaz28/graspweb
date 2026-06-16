(function () {
  "use strict";

  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function initPageLoader() {
    var loader = document.getElementById("pageLoader");
    if (!loader || document.body.dataset.videoLoader === "true") return;

    var minShowMs = 700;
    var maxWaitMs = 5000;
    var startedAt = Date.now();
    var done = false;

    function hideLoader() {
      if (done) return;
      done = true;
      var delay = Math.max(0, minShowMs - (Date.now() - startedAt));
      setTimeout(function () {
        document.body.classList.remove("is-loading");
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");
        document.dispatchEvent(new CustomEvent("grasp:loader-hidden"));
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 650);
      }, delay);
    }

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }
    setTimeout(hideLoader, maxWaitMs);
  }

  function initHeroAnimation() {
    if (isReducedMotion() || typeof gsap === "undefined") return;

    var hero = document.querySelector("[data-hero-animate]");
    if (!hero) return;

    var items = hero.querySelectorAll("[data-hero-animate-item]");
    if (!items.length) return;

    gsap.set(items, { y: 40, opacity: 0 });

    function run() {
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.05
        }
      );
    }

    if (document.body.classList.contains("is-loading")) {
      document.addEventListener("grasp:loader-hidden", run, { once: true });
    } else {
      run();
    }
  }

  function initScrollAnimations() {
    if (isReducedMotion()) return;

    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      var start = "top 82%";
      var toggleActions = "play none none none";
      var mobile = isMobile();

      gsap.utils.toArray(".scroll-reveal-text, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-up").forEach(function (el) {
        var fromX = 0;
        var fromY = 32;
        if (el.classList.contains("scroll-reveal-left")) fromX = mobile ? 0 : -72;
        if (el.classList.contains("scroll-reveal-right")) fromX = mobile ? 0 : 72;
        if (el.classList.contains("scroll-reveal-up")) fromY = 56;
        if (mobile && (el.classList.contains("scroll-reveal-left") || el.classList.contains("scroll-reveal-right"))) {
          fromY = 36;
        }

        gsap.fromTo(el, { x: fromX, y: fromY, opacity: 0 }, {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.88,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: start, toggleActions: toggleActions }
        });
      });

      gsap.utils.toArray(".scroll-reveal-img").forEach(function (el) {
        gsap.fromTo(
          el,
          mobile ? { y: 32, opacity: 0, scale: 0.98 } : { x: 72, opacity: 0, scale: 0.98 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: start, toggleActions: toggleActions }
          }
        );
      });

      gsap.utils.toArray(".scroll-reveal-stagger").forEach(function (wrap) {
        var items = wrap.querySelectorAll(".scroll-reveal-item");
        if (!items.length) return;
        gsap.fromTo(items, { y: 44, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.78,
          stagger: 0.11,
          ease: "power3.out",
          scrollTrigger: { trigger: wrap, start: start, toggleActions: toggleActions }
        });
      });

      ScrollTrigger.refresh();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(
      ".scroll-reveal-text, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-up, .scroll-reveal-img, .scroll-reveal-item"
    ).forEach(function (el) {
      el.classList.add("reveal-fallback");
      observer.observe(el);
    });
  }

  function onReady() {
    initPageLoader();
    initScrollAnimations();
    initHeroAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  window.addEventListener("load", function () {
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });

  window.addEventListener("resize", function () {
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });
})();

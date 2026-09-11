// Shared behavior for every Debetter prototype screen: theme toggle,
// mobile nav drawer, and generic modal open/close.
(function () {
  "use strict";

  var THEME_KEY = "debetter-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (toggle) {
      toggle.setAttribute("data-active", theme);
      sizeThumb(toggle);
    });
  }

  function sizeThumb(toggle) {
    var target = toggle.querySelector('[data-value="senate"]');
    if (target) {
      toggle.style.setProperty("--thumb-x", target.offsetLeft - 3 + "px");
    }
  }

  function initThemeToggles() {
    // Respect an explicit prior choice everywhere. Until the user picks one,
    // each page keeps whatever data-theme it was authored with (every real
    // screen defaults to classic; the index.html launcher defaults to senate).
    var stored = window.localStorage.getItem(THEME_KEY);
    var initial = stored || document.documentElement.getAttribute("data-theme") || "classic";
    applyTheme(initial);

    document.querySelectorAll("[data-theme-toggle]").forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme");
        var next = current === "senate" ? "classic" : "senate";
        window.localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("tabindex", "0");
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle.click();
        }
      });
    });

    window.addEventListener("resize", function () {
      document.querySelectorAll("[data-theme-toggle]").forEach(sizeThumb);
    });
  }

  function initNavDrawer() {
    var openBtns = document.querySelectorAll("[data-nav-open]");
    var drawer = document.querySelector("[data-nav-drawer]");
    if (!drawer) return;
    var closeBtn = drawer.querySelector("[data-nav-close]");
    var scrim = drawer.querySelector("[data-nav-scrim]");

    function open() {
      drawer.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      drawer.setAttribute("data-open", "false");
      document.body.style.overflow = "";
    }
    openBtns.forEach(function (btn) { btn.addEventListener("click", open); });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (scrim) scrim.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function initModals() {
    document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-modal-open");
        var modal = document.getElementById(id);
        if (modal) {
          modal.setAttribute("data-open", "true");
          document.body.style.overflow = "hidden";
        }
      });
    });
    document.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        var modal = el.closest(".modal-scrim");
        if (modal) {
          modal.setAttribute("data-open", "false");
          document.body.style.overflow = "";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggles();
    initNavDrawer();
    initModals();
  });
})();

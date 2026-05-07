function determineComputedTheme() {
  var t = document.documentElement.getAttribute("data-theme");
  if (t === "dark" || t === "light") return t;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

document.addEventListener("DOMContentLoaded", function () {
  var ninjaKeys = document.querySelector("ninja-keys");
  if (!ninjaKeys) return;

  var searchTheme = determineComputedTheme();
  if (searchTheme === "dark") {
    ninjaKeys.classList.add("dark");
  } else {
    ninjaKeys.classList.remove("dark");
  }

  var shortcut = document.querySelector(".search-shortcut");
  if (shortcut && typeof navigator !== "undefined" && navigator.platform && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)) {
    shortcut.textContent = "⌘K";
  }

  window.openSearchModal = function () {
    var $navbarNav = window.jQuery ? window.jQuery("#navbarNav") : null;
    if ($navbarNav && $navbarNav.hasClass("show")) {
      $navbarNav.collapse("hide");
    }
    ninjaKeys.open();
  };

  window.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      window.openSearchModal();
    }
  });

  var searchToggle = document.getElementById("search-toggle");
  if (searchToggle) {
    searchToggle.addEventListener("click", function (e) {
      e.preventDefault();
      window.openSearchModal();
    });
  }
});

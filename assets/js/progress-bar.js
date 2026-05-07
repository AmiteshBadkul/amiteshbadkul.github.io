/*
 * Adapted from al-folio / css-tricks reading position indicator.
 */
var progressBar = typeof jQuery !== "undefined" ? jQuery("#progress") : null;

window.addEventListener("load", function () {
  if (!progressBar || !progressBar.length) return;
  setTimeout(progressBarSetup, 50);
});

function progressBarSetup() {
  if (!progressBar || !progressBar.length) return;
  if ("max" in document.createElement("progress")) {
    initializeProgressElement();
    jQuery(document).on("scroll", function () {
      progressBar.attr({ value: getCurrentScrollPosition() });
    });
    jQuery(window).on("resize", initializeProgressElement);
  } else {
    resizeProgressBar();
    jQuery(document).on("scroll", resizeProgressBar);
    jQuery(window).on("resize", resizeProgressBar);
  }
}

function getCurrentScrollPosition() {
  return jQuery(window).scrollTop();
}

function initializeProgressElement() {
  var navbarHeight = jQuery("#navbar").outerHeight(true) || 56;
  progressBar.css({ top: navbarHeight });
  progressBar.attr({
    max: getDistanceToScroll(),
    value: getCurrentScrollPosition(),
  });
}

function getDistanceToScroll() {
  var d = jQuery(document).height() - jQuery(window).height();
  return d > 0 ? d : 1;
}

function resizeProgressBar() {
  progressBar.css({ width: getWidthPercentage() + "%" });
}

function getWidthPercentage() {
  var dist = getDistanceToScroll();
  if (dist <= 0) return 0;
  return (getCurrentScrollPosition() / dist) * 100;
}

---
layout: page
permalink: publications/
title: publications
description: publication list.
years: [2026, 2025, 2024, 2023, 2022]
nav: true
#nav_order: 1
---
<!-- _pages/publications.md-->

<div class="pub-search-wrapper" style="margin-bottom: 1.5rem;">
  <input
    type="text"
    id="pub-search-input"
    placeholder="Search by title, author, venue..."
    style="
      width: 100%;
      padding: 0.6rem 1rem;
      font-size: 0.95rem;
      border: 1px solid var(--global-divider-color, #ddd);
      border-radius: 8px;
      background: var(--global-bg-color, #fff);
      color: var(--global-text-color, #333);
      outline: none;
      box-sizing: border-box;
    "
  />
</div>

<div class="publications" id="publications-list">

{%- for y in page.years %}
  <h2 class="year" data-year="{{y}}">{{y}}</h2>
  {% bibliography -f papers -q @*[year={{y}}]* %}
{% endfor %}

</div>

<p id="pub-no-results" style="display:none; color: var(--global-text-color-light, #888); font-style: italic; text-align: center; padding: 2rem 0;">
  No publications match your search.
</p>

<script>
(function() {
  var input = document.getElementById('pub-search-input');
  if (!input) return;

  input.addEventListener('input', function() {
    var query = this.value.trim().toLowerCase();
    var list  = document.getElementById('publications-list');
    var rows  = list.querySelectorAll('.row');
    var years = list.querySelectorAll('h2.year');
    var anyVisible = false;

    rows.forEach(function(row) {
      var text = row.textContent.toLowerCase();
      var show = !query || text.indexOf(query) !== -1;
      row.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });

    years.forEach(function(heading) {
      var yr = heading.getAttribute('data-year');
      var hasVisible = false;
      rows.forEach(function(row) {
        if (row.style.display !== 'none') {
          var rowText = row.textContent;
          if (rowText.indexOf(yr) !== -1 || !query) hasVisible = true;
        }
      });
      if (!query) {
        heading.style.display = '';
      } else {
        var sibling = heading.nextElementSibling;
        var yearHasVisiblePub = false;
        while (sibling && !sibling.classList.contains('year')) {
          if (sibling.classList.contains('row') && sibling.style.display !== 'none') {
            yearHasVisiblePub = true;
          }
          sibling = sibling.nextElementSibling;
        }
        heading.style.display = yearHasVisiblePub ? '' : 'none';
      }
    });

    document.getElementById('pub-no-results').style.display = anyVisible || !query ? 'none' : 'block';
  });
})();
</script>
<!--
<p>You will be redirected to the main page within 3 seconds. If not redirected, please click <a href="{{ site.baseurl }}/">here</a>.</p>
-->

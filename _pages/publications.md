---
layout: page
permalink: publications/
title: publications
description: publication list.
years: [2023]
nav: true
#nav_order: 1
---
<!-- _pages/publications.md-->
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f papers -q @*[year={{y}}]* %}
{% endfor %}

</div>
<!--
<p>You will be redirected to the main page within 3 seconds. If not redirected, please click <a href="{{ site.baseurl }}/">here</a>.</p>
-->

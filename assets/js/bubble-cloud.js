document.addEventListener('DOMContentLoaded', function () {
  var container = document.getElementById('bubble-cloud-container');
  if (!container) return;

  function getCSSVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      if (v) {
        var s = v.trim();
        if (s) return s;
      }
    } catch (_) {}
    return fallback;
  }

  function setStatus(html) {
    var status = document.getElementById('bubble-cloud-status');
    if (status) status.innerHTML = html;
  }

  try {
    setStatus('<strong>Bubble cloud:</strong> initializing…');

    if (typeof window.d3 === 'undefined') {
      setStatus('<strong>Bubble cloud:</strong> failed (D3.js did not load).');
      return;
    }

  // ── Node data ──────────────────────────────────────────────────────────────
  var nodes = [
    { id: 'Drug Discovery',              group: 1, r: 38 },
    { id: 'Computational Biology',       group: 1, r: 34 },
    { id: 'Bioinformatics',              group: 1, r: 26 },
    { id: 'Cheminformatics',             group: 1, r: 24 },
    { id: 'Pharmacokinetics',            group: 1, r: 24 },
    { id: 'Proteomics',                  group: 1, r: 22 },
    { id: 'Binding Affinity',            group: 1, r: 22 },
    { id: 'Proteins',                    group: 1, r: 20 },
    { id: 'Chemicals',                   group: 1, r: 18 },
    { id: 'Genes',                       group: 1, r: 18 },
    { id: 'Post-Translational Mod.',     group: 1, r: 20 },
    { id: 'AI / ML',                     group: 2, r: 36 },
    { id: 'Deep Learning',               group: 2, r: 30 },
    { id: 'LLMs',                        group: 2, r: 30 },
    { id: 'Agentic AI',                  group: 2, r: 28 },
    { id: 'Multi-modal Learning',        group: 2, r: 26 },
    { id: 'Uncertainty Quantification',  group: 2, r: 24 },
    { id: 'OOD Generalization',          group: 2, r: 22 },
    { id: 'Molecular Dynamics',          group: 2, r: 20 },
    { id: 'CUNY Graduate Center',        group: 3, r: 26 },
    { id: 'BITS Pilani',                 group: 3, r: 22 },
    { id: 'Lei Xie Lab',                 group: 3, r: 20 },
    { id: 'Photography',                 group: 4, r: 18 },
    { id: 'Formula 1',                   group: 4, r: 18 },
    { id: 'Sports',                      group: 4, r: 16 },
  ];

  // Palette: slightly adjusted fills for label contrast; still matches your hex theme.
  var palette = {
    1: {
      fill: '#f5d4c4',
      stroke: '#c45a2c',
      label: '#2b1810',
      labelShadow: '0 0 2px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.8)',
    },
    2: {
      fill: '#3a9d9c',
      stroke: '#1b6c6b',
      label: '#ffffff',
      labelShadow: '0 0 2px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.4)',
    },
    3: {
      fill: '#edd078',
      stroke: '#a67c00',
      label: '#2e2408',
      labelShadow: '0 0 2px rgba(255,255,255,0.85), 0 1px 2px rgba(255,255,255,0.7)',
    },
    4: {
      fill: '#9b7ec4',
      stroke: '#5c3d8a',
      label: '#ffffff',
      labelShadow: '0 0 2px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.45)',
    },
  };

  var W = container.clientWidth || 760;
  var H = Math.max(400, Math.round(W * 0.58));

  var svg = d3.select('#bubble-cloud-container')
    .append('svg')
    .attr('width', W)
    .attr('height', H)
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('style', 'max-width:100%; height:auto; cursor: default;');

  var sim = d3.forceSimulation(nodes)
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('charge', d3.forceManyBody().strength(5))
    .force('collide', d3.forceCollide(function (d) { return d.r + 4; }).iterations(3));

  var focus = { hover: null, pinned: null };

  function activeNode() {
    return focus.hover || focus.pinned;
  }

  function updateStatusLine() {
    var a = activeNode();
    var base = '<strong>Bubble cloud:</strong> hover or click a topic.';
    if (a) {
      var pinNote = '';
      if (focus.pinned) {
        if (focus.hover && focus.hover.id !== focus.pinned.id) {
          pinNote = ' <em>(pinned: ' + focus.pinned.id + ')</em>';
        } else if (!focus.hover || focus.hover.id === focus.pinned.id) {
          pinNote = ' <em>(pinned — click bubble again or empty area to clear)</em>';
        }
      }
      base = '<strong>Topic:</strong> ' + a.id + pinNote;
    }
    setStatus(base);
  }

  // Soft glow for focused bubble
  var defs = svg.append('defs');
  defs.append('filter')
    .attr('id', 'bubble-glow')
    .attr('x', '-40%')
    .attr('y', '-40%')
    .attr('width', '180%')
    .attr('height', '180%')
    .append('feDropShadow')
    .attr('dx', 0)
    .attr('dy', 2)
    .attr('stdDeviation', 3)
    .attr('flood-color', '#000')
    .attr('flood-opacity', 0.25);

  var node = svg.append('g')
    .attr('class', 'bubble-nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(drag(sim));

  node.append('circle')
    .attr('r', function (d) { return d.r; })
    .attr('fill', function (d) { return palette[d.group].fill; })
    .attr('fill-opacity', 0.92)
    .attr('stroke', function (d) { return palette[d.group].stroke; })
    .attr('stroke-width', 1.5);

  var fontFamily = getCSSVar('--global-font-family', 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif');

  node.each(function (d) {
    var el = d3.select(this);
    var words = d.id.split(' ');
    var line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    var line2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : null;
    var fs = Math.max(9, Math.min(13, d.r * 0.52));
    var pal = palette[d.group];

    function styleText(sel) {
      sel
        .attr('class', 'bubble-label')
        .attr('font-family', fontFamily)
        .attr('fill', pal.label)
        .style('pointer-events', 'none')
        .style('text-shadow', pal.labelShadow);
    }

    if (line2 && words.length > 2) {
      styleText(el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.35em')
        .attr('font-size', fs + 'px')
        .text(line1));
      styleText(el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.85em')
        .attr('font-size', fs + 'px')
        .text(line2));
    } else {
      styleText(el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', fs + 'px')
        .text(d.id));
    }
  });

  node.append('title').text(function (d) { return d.id + ' — click to pin, drag to move'; });

  function updateTransforms() {
    var a = activeNode();
    node.attr('transform', function (d) {
      var isOn = a && d.id === a.id;
      var s = isOn ? 1.12 : 1;
      return 'translate(' + d.x + ',' + d.y + ') scale(' + s + ')';
    });
  }

  function applyFocus() {
    var a = activeNode();
    node.each(function (d) {
      var g = d3.select(this);
      var isOn = a && d.id === a.id;
      var dim = a && !isOn;

      g.select('circle')
        .attr('fill-opacity', dim ? 0.28 : 0.92)
        .attr('stroke-opacity', dim ? 0.35 : 1)
        .attr('stroke-width', isOn ? 3.5 : 1.5)
        .attr('stroke', isOn ? '#ffffff' : palette[d.group].stroke)
        .attr('filter', isOn ? 'url(#bubble-glow)' : null);

      g.selectAll('text.bubble-label')
        .attr('opacity', dim ? 0.22 : 1)
        .style('font-weight', isOn ? 600 : 400);
    });
    updateTransforms();
    updateStatusLine();
  }

  node
    .on('pointerenter', function (event, d) {
      focus.hover = d;
      applyFocus();
    })
    .on('pointerleave', function () {
      focus.hover = null;
      applyFocus();
    })
    .on('click', function (event, d) {
      event.stopPropagation();
      if (d._dragMoved) {
        d._dragMoved = false;
        return;
      }
      focus.pinned = focus.pinned && focus.pinned.id === d.id ? null : d;
      applyFocus();
    });

  svg.on('click', function () {
    focus.pinned = null;
    applyFocus();
  });

  sim.on('tick', function () {
    nodes.forEach(function (d) {
      d.x = Math.max(d.r + 2, Math.min(W - d.r - 2, d.x));
      d.y = Math.max(d.r + 2, Math.min(H - d.r - 2, d.y));
    });
    updateTransforms();
  });

  var legendData = [
    { label: 'Drug Discovery / Biology', group: 1 },
    { label: 'ML / CS',                  group: 2 },
    { label: 'Affiliation',              group: 3 },
    { label: 'Personal',                 group: 4 },
  ];

  var legend = svg.append('g')
    .attr('transform', 'translate(12,' + (H - 14 - legendData.length * 18) + ')');

  legendData.forEach(function (item, i) {
    var g = legend.append('g').attr('transform', 'translate(0,' + (i * 18) + ')');
    g.append('circle')
      .attr('r', 6)
      .attr('cx', 6)
      .attr('cy', 0)
      .attr('fill', palette[item.group].fill)
      .attr('stroke', palette[item.group].stroke)
      .attr('stroke-width', 1.2);
    g.append('text')
      .attr('x', 16)
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-family', fontFamily)
      .attr('fill', getCSSVar('--global-text-color', '#555'))
      .text(item.label);
  });

  function drag(simulation) {
    return d3.drag()
      .on('start', function (event, d) {
        d._dragMoved = false;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', function (event, d) {
        if (event.dx || event.dy) d._dragMoved = true;
        d.fx = event.x; d.fy = event.y;
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }

  applyFocus();
  } catch (err) {
    var msg = (err && (err.stack || err.message)) ? (err.stack || err.message) : String(err);
    setStatus('<strong>Bubble cloud:</strong> failed (runtime error).<br /><pre style="white-space: pre-wrap; margin: 0.5rem 0 0 0;">' + msg + '</pre>');
  }
});

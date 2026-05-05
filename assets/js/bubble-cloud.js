document.addEventListener('DOMContentLoaded', function () {
  var container = document.getElementById('bubble-cloud-container');
  if (!container) return;

  // ── Node data ──────────────────────────────────────────────────────────────
  // group 1 = Drug Discovery / Biology  (green)
  // group 2 = ML / CS                   (blue)
  // group 3 = Affiliation               (amber)
  // group 4 = Personal                  (pink)
  var nodes = [
    // Drug Discovery / Biology
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

    // ML / CS
    { id: 'AI / ML',                     group: 2, r: 36 },
    { id: 'Deep Learning',               group: 2, r: 30 },
    { id: 'LLMs',                        group: 2, r: 30 },
    { id: 'Agentic AI',                  group: 2, r: 28 },
    { id: 'Multi-modal Learning',        group: 2, r: 26 },
    { id: 'Uncertainty Quantification',  group: 2, r: 24 },
    { id: 'OOD Generalization',          group: 2, r: 22 },
    { id: 'Molecular Dynamics',          group: 2, r: 20 },

    // Affiliation
    { id: 'CUNY Graduate Center',        group: 3, r: 26 },
    { id: 'BITS Pilani',                 group: 3, r: 22 },
    { id: 'Lei Xie Lab',                 group: 3, r: 20 },

    // Personal
    { id: 'Photography',                 group: 4, r: 18 },
    { id: 'Formula 1',                   group: 4, r: 18 },
    { id: 'Sports',                      group: 4, r: 16 },
  ];

  // ── Colour scale ───────────────────────────────────────────────────────────
  var palette = {
    1: { fill: '#b7e4c7', stroke: '#52b788' },  // green
    2: { fill: '#a1c4fd', stroke: '#4a90d9' },  // blue
    3: { fill: '#ffecd2', stroke: '#f4a261' },  // amber
    4: { fill: '#ffc8dd', stroke: '#e06c94' },  // pink
  };

  // ── SVG setup ──────────────────────────────────────────────────────────────
  var W = container.clientWidth || 760;
  var H = Math.max(400, Math.round(W * 0.58));

  var svg = d3.select('#bubble-cloud-container')
    .append('svg')
    .attr('width', W)
    .attr('height', H)
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('style', 'max-width:100%; height:auto;');

  // ── Force simulation (no links — pure bubble packing) ─────────────────────
  var sim = d3.forceSimulation(nodes)
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('charge', d3.forceManyBody().strength(5))
    .force('collide', d3.forceCollide(function (d) { return d.r + 4; }).iterations(3));

  // ── Render nodes ──────────────────────────────────────────────────────────
  var node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .call(drag(sim));

  node.append('circle')
    .attr('r', function (d) { return d.r; })
    .attr('fill', function (d) { return palette[d.group].fill; })
    .attr('fill-opacity', 0.88)
    .attr('stroke', function (d) { return palette[d.group].stroke; })
    .attr('stroke-width', 1.5);

  // Label — split long text onto two lines if needed
  node.each(function (d) {
    var el = d3.select(this);
    var words = d.id.split(' ');
    var line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    var line2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : null;
    var fs = Math.max(9, Math.min(13, d.r * 0.52));

    if (line2 && words.length > 2) {
      el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.35em')
        .attr('font-size', fs + 'px')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#222')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 3px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.9)')
        .text(line1);
      el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.85em')
        .attr('font-size', fs + 'px')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#222')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 3px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.9)')
        .text(line2);
    } else {
      el.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', fs + 'px')
        .attr('font-family', 'Arial, sans-serif')
        .attr('fill', '#222')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 3px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.9)')
        .text(d.id);
    }
  });

  node.append('title').text(function (d) { return d.id; });

  // ── Tick — keep bubbles inside bounds ─────────────────────────────────────
  sim.on('tick', function () {
    nodes.forEach(function (d) {
      d.x = Math.max(d.r + 2, Math.min(W - d.r - 2, d.x));
      d.y = Math.max(d.r + 2, Math.min(H - d.r - 2, d.y));
    });
    node.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  });

  // ── Legend ─────────────────────────────────────────────────────────────────
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
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', 'var(--global-text-color, #555)')
      .text(item.label);
  });

  // ── Drag ──────────────────────────────────────────────────────────────────
  function drag(simulation) {
    return d3.drag()
      .on('start', function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', function (event, d) {
        d.fx = event.x; d.fy = event.y;
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }
});

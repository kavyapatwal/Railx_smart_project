// ═══════════════════════════════════════════════════════════
//  renderer.js — SVG graph building & animation updates
// ═══════════════════════════════════════════════════════════

// ── Build the static SVG map (nodes, edges, train dots, etc.) ──
function buildStaticGraph() {
  const svg = document.getElementById('map-svg');
  let html = `<defs>
    <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="mainGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f5a62320"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>`;

  // Background grid lines
  for (let x = 0; x <= 700; x += 70)
    html += `<line x1="${x}" y1="0" x2="${x}" y2="480" stroke="#0d1520" stroke-width="1"/>`;
  for (let y = 0; y <= 480; y += 48)
    html += `<line x1="0" y1="${y}" x2="700" y2="${y}" stroke="#0d1520" stroke-width="1"/>`;

  // Track edges — base line + conflict flash overlay + weight label
  const seen = new Set();
  EDGES.forEach(e => {
    const key = `${Math.min(e.u, e.v)}-${Math.max(e.u, e.v)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const n1 = NODES[e.u], n2 = NODES[e.v];
    html += `<line id="edge-${e.u}-${e.v}" x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
               stroke="#1a2535" stroke-width="2.5" stroke-linecap="round"/>`;
    html += `<line id="flash-${e.u}-${e.v}" x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}"
               stroke="#ff4545" stroke-width="5" stroke-linecap="round" opacity="0"/>`;
    const mx = (n1.x + n2.x) / 2 + 4, my = (n1.y + n2.y) / 2 - 4;
    html += `<text x="${mx}" y="${my}" fill="#2a3848" font-size="9" font-family="Share Tech Mono">${e.w}m</text>`;
  });

  // Faint colored route lines per train (dashed if rerouted)
  TRAINS_DATA.forEach((t, ti) => {
    for (let i = 0; i < t.route.length - 1; i++) {
      const u = t.route[i], v = t.route[i + 1];
      const n1 = NODES[u], n2 = NODES[v];
      const off = (ti - 2.5) * 2.5;
      html += `<line x1="${n1.x + off}" y1="${n1.y + off}" x2="${n2.x + off}" y2="${n2.y + off}"
                 stroke="${t.color}" stroke-width="1.5" opacity="0.25"
                 stroke-dasharray="${t.rerouted ? '4,4' : 'none'}"/>`;
    }
  });

  // Station nodes
  NODES.forEach(n => {
    const isMain = n.id === 0;
    const r = isMain ? 20 : 13;
    const sc = isMain ? '#f5a623' : '#2a3a52';
    const sw = isMain ? 2 : 1.5;
    if (isMain)
      html += `<circle cx="${n.x}" cy="${n.y}" r="35" fill="url(#mainGlow)"/>`;
    html += `<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="#0d1220" stroke="${sc}"
               stroke-width="${sw}" ${isMain ? 'filter="url(#glow)"' : ''}/>`;
    html += `<text x="${n.x}" y="${n.y + 4}" fill="${isMain ? '#f5a623' : '#8899bb'}"
               font-size="${isMain ? 11 : 9}" font-family="Share Tech Mono"
               text-anchor="middle">${n.id}</text>`;
    const words = n.name.split(' ');
    const ly = n.y + r + 14;
    html += `<text x="${n.x}" y="${ly}" fill="${isMain ? '#f5a623' : '#5a7090'}"
               font-size="${isMain ? 10 : 8}" font-family="Barlow Condensed"
               font-weight="${isMain ? 700 : 400}" letter-spacing="1"
               text-anchor="middle">${words[0]}</text>`;
    if (words.length > 1)
      html += `<text x="${n.x}" y="${ly + 11}" fill="${isMain ? '#c87010' : '#3a5070'}"
                 font-size="8" font-family="Barlow Condensed" letter-spacing="1"
                 text-anchor="middle">${words.slice(1).join(' ')}</text>`;
  });

  // Platform boxes beside Main Station
  for (let i = 0; i < 4; i++) {
    const px = NODES[0].x - 80, py = NODES[0].y - 30 + i * 20;
    html += `<rect x="${px}" y="${py}" width="50" height="16" rx="1"
               fill="#0d1825" stroke="#1a2a3a" stroke-width="1"/>
             <text x="${px + 25}" y="${py + 11}" fill="#2a4a6a" font-size="8"
               font-family="Share Tech Mono" text-anchor="middle">P${i + 1}</text>`;
  }
  html += `<text x="${NODES[0].x - 55}" y="${NODES[0].y - 38}" fill="#2a4a6a"
             font-size="8" font-family="Barlow Condensed" letter-spacing="1">PLATFORMS</text>`;

  // Train dots (glow + solid dot + label + wait bubble)
  TRAINS_DATA.forEach(t => {
    html += `<g id="train-${t.id}">
      <circle id="tc-${t.id}" cx="${NODES[t.source].x}" cy="${NODES[t.source].y}"
        r="7" fill="${t.color}" opacity="0.15" filter="url(#glow2)"/>
      <circle id="td-${t.id}" cx="${NODES[t.source].x}" cy="${NODES[t.source].y}"
        r="5" fill="${t.color}" stroke="#000" stroke-width="1"/>
      <text id="tl-${t.id}" x="${NODES[t.source].x}" y="${NODES[t.source].y - 10}"
        fill="${t.color}" font-size="9" font-family="Barlow Condensed" font-weight="700"
        text-anchor="middle">${t.id}</text>
      <g id="tw-${t.id}" opacity="0">
        <rect id="twb-${t.id}" x="0" y="0" width="80" height="20" rx="2"
          fill="#1a1200" stroke="#f5a623" stroke-width="1"/>
        <text id="twt-${t.id}" x="40" y="14" fill="#f5a623" font-size="9"
          font-family="Share Tech Mono" text-anchor="middle">WAIT 0.0m</text>
      </g>
    </g>`;
  });

  // Conflict warning icons on track midpoints
  CONFLICTS_DATA.forEach(c => {
    const n1 = NODES[c.edge.u], n2 = NODES[c.edge.v];
    const mx = (n1.x + n2.x) / 2, my = (n1.y + n2.y) / 2;
    html += `<g id="conf-${c.a}-${c.b}" opacity="0">
      <circle cx="${mx}" cy="${my}" r="18" fill="none" stroke="#ff4545"
        stroke-width="2" stroke-dasharray="4,4"/>
      <text x="${mx}" y="${my - 22}" fill="#ff4545" font-size="9"
        font-family="Barlow Condensed" font-weight="700" letter-spacing="1"
        text-anchor="middle">⚠ CONFLICT</text>
    </g>`;
  });

  // Legend (bottom-left)
  TRAINS_DATA.forEach((t, i) => {
    const ly = 460 - (TRAINS_DATA.length - i) * 16;
    html += `<circle cx="14" cy="${ly - 4}" r="4" fill="${t.color}" filter="url(#glow2)"/>
             <text x="24" y="${ly}" fill="${t.color}" font-size="9"
               font-family="Share Tech Mono">${t.id}:${t.name}${t.rerouted ? ' ↺' : ''}</text>`;
  });

  svg.innerHTML = html;
}

// ── Move train dots each frame ──
function updateTrains(simTime) {
  TRAINS_DATA.forEach(t => {
    const state = getTrainState(t, simTime);
    const dot  = document.getElementById(`td-${t.id}`);
    const glow = document.getElementById(`tc-${t.id}`);
    const lbl  = document.getElementById(`tl-${t.id}`);
    const wg   = document.getElementById(`tw-${t.id}`);
    const wb   = document.getElementById(`twb-${t.id}`);
    const wt   = document.getElementById(`twt-${t.id}`);
    if (!dot) return;

    if (state.status === 'pending') {
      dot.setAttribute('opacity', '0.15');
      glow.setAttribute('opacity', '0');
      lbl.setAttribute('opacity', '0.2');
      wg.setAttribute('opacity', '0');
    } else if (state.status === 'waiting') {
      dot.setAttribute('cx', state.x); dot.setAttribute('cy', state.y);
      glow.setAttribute('cx', state.x); glow.setAttribute('cy', state.y);
      lbl.setAttribute('x', state.x);  lbl.setAttribute('y', state.y - 10);
      dot.setAttribute('opacity', '1');
      glow.setAttribute('opacity', 0.3 + Math.sin(Date.now() / 300) * 0.3);
      glow.setAttribute('r', '12');
      lbl.setAttribute('opacity', '1');
      wg.setAttribute('opacity', '1');
      const bx = state.x - 40, by = state.y - 38;
      wb.setAttribute('x', bx); wb.setAttribute('y', by);
      wt.setAttribute('x', state.x); wt.setAttribute('y', by + 14);
      wt.textContent = `WAIT ${state.waitRemaining.toFixed(1)}m`;
    } else if (state.status === 'moving') {
      dot.setAttribute('cx', state.x); dot.setAttribute('cy', state.y);
      glow.setAttribute('cx', state.x); glow.setAttribute('cy', state.y);
      lbl.setAttribute('x', state.x);  lbl.setAttribute('y', state.y - 10);
      dot.setAttribute('opacity', '1');
      glow.setAttribute('opacity', '0.4');
      glow.setAttribute('r', '8');
      lbl.setAttribute('opacity', '1');
      wg.setAttribute('opacity', '0');
    } else if (state.status === 'arrived') {
      const px = NODES[0].x - 55, py = NODES[0].y - 22 + t.platform * 20;
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      glow.setAttribute('cx', px); glow.setAttribute('cy', py);
      lbl.setAttribute('x', px);  lbl.setAttribute('y', py - 8);
      dot.setAttribute('opacity', '0.7');
      glow.setAttribute('opacity', '0.2');
      glow.setAttribute('r', '8');
      lbl.setAttribute('opacity', '0.7');
      wg.setAttribute('opacity', '0');
    }
  });
}

// ── Flash conflict warning icons on active conflict edges ──
function updateConflictFlash(simTime) {
  CONFLICTS_DATA.forEach(c => {
    const active = simTime >= c.ts - 1 && simTime <= c.te + 1;
    const el  = document.getElementById(`conf-${c.a}-${c.b}`);
    const fe1 = document.getElementById(`flash-${c.edge.u}-${c.edge.v}`);
    const fe2 = document.getElementById(`flash-${c.edge.v}-${c.edge.u}`);
    if (!el) return;
    if (active) {
      const pulse = 0.4 + Math.sin(Date.now() / 200) * 0.4;
      el.setAttribute('opacity', pulse);
      if (fe1) fe1.setAttribute('opacity', pulse * 0.7);
      if (fe2) fe2.setAttribute('opacity', pulse * 0.7);
    } else {
      el.setAttribute('opacity', '0');
      if (fe1) fe1.setAttribute('opacity', '0');
      if (fe2) fe2.setAttribute('opacity', '0');
    }
  });
}

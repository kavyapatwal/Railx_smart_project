// ═══════════════════════════════════════════════════════════
//  simulation.js — Core simulation logic
// ═══════════════════════════════════════════════════════════

// Convert simulation minutes offset to a clock string like "6:42 AM"
function toClk(mins) {
  const t = BASE_H * 60 + BASE_M + Math.round(mins);
  const h = Math.floor(t / 60) % 24, m = t % 60;
  const per = h < 12 ? 'AM' : 'PM', dh = h % 12 || 12;
  return `${dh}:${m < 10 ? '0' : ''}${m} ${per}`;
}

// Return the weight (travel time in minutes) of an edge between two nodes
function getEdgeWeight(u, v) {
  for (const e of EDGES)
    if ((e.u === u && e.v === v) || (e.u === v && e.v === u)) return e.w;
  return 0;
}

// Calculate a train's current status and SVG position at a given simTime
function getTrainState(t, simTime) {
  // Before train appears on map
  if (simTime < (t.rerouted ? t.wait_start : t.depart_source) - 0.5) {
    return { status: 'pending', x: NODES[t.source].x, y: NODES[t.source].y };
  }

  // Waiting at source (conflict-delayed trains)
  if (t.rerouted && simTime >= t.wait_start && simTime < t.depart_source) {
    return {
      status: 'waiting',
      x: NODES[t.source].x,
      y: NODES[t.source].y,
      waitRemaining: t.depart_source - simTime,
      waitProgress: (simTime - t.wait_start) / t.wait_duration
    };
  }

  // Train has reached the Main Station
  if (simTime >= t.arrival_mins) {
    return { status: 'arrived', x: NODES[0].x, y: NODES[0].y };
  }

  // Train is moving — interpolate position along route edges
  let elapsed = simTime - t.depart_source;
  for (let i = 0; i < t.route.length - 1; i++) {
    const u = t.route[i], v = t.route[i + 1];
    const w = getEdgeWeight(u, v);
    if (elapsed <= w) {
      const progress = elapsed / w;
      const nx1 = NODES[u].x, ny1 = NODES[u].y;
      const nx2 = NODES[v].x, ny2 = NODES[v].y;
      return {
        status: 'moving',
        x: nx1 + (nx2 - nx1) * progress,
        y: ny1 + (ny2 - ny1) * progress,
        from: u, to: v, progress
      };
    }
    elapsed -= w;
  }

  return { status: 'arrived', x: NODES[0].x, y: NODES[0].y };
}

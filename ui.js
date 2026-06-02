// ═══════════════════════════════════════════════════════════
//  ui.js — Status cards, event log, timeline, time-saved panel
// ═══════════════════════════════════════════════════════════

// ── Event Log ──
const loggedEvents = new Set();
let resolvedCount = 0;

function logEvent(type, msg, timeStr, simTime) {
  const key = `${type}-${msg}`;
  if (loggedEvents.has(key)) return;
  loggedEvents.add(key);

  const el = document.createElement('div');
  el.className = `event ${type}`;
  el.innerHTML = `<span class="etime">${timeStr || toClk(simTime)}</span>${msg}`;
  document.getElementById('event-log').insertBefore(el, document.getElementById('event-log').firstChild);

  if (type === 'success') {
    resolvedCount++;
    document.getElementById('sh-saved').textContent = resolvedCount;
  }
}

function checkEvents(simTime) {
  const t = simTime;

  // Train departures
  TRAINS_DATA.forEach(tr => {
    if (t >= tr.depart_source && t < tr.depart_source + 0.5)
      logEvent('info', `<b style="color:${tr.color}">${tr.name}</b> departed from ${NODES[tr.source].name}`, null, simTime);
  });

  // Conflict detections
  CONFLICTS_DATA.forEach(c => {
    const ta = TRAINS_DATA.find(x => x.id === c.a);
    const tb = TRAINS_DATA.find(x => x.id === c.b);
    if (t >= c.ts && t < c.ts + 0.5)
      logEvent('danger',
        `⚠ CONFLICT detected on <b>${c.track}</b> — <span style="color:${ta.color}">${ta.name}</span> vs <span style="color:${tb.color}">${tb.name}</span>`,
        null, simTime);
  });

  // Wait starts
  TRAINS_DATA.filter(tr => tr.rerouted).forEach(tr => {
    if (t >= tr.wait_start && t < tr.wait_start + 0.5)
      logEvent('warn',
        `<span style="color:${tr.color}">${tr.name}</span> held at ${NODES[tr.source].name} — conflict resolution in progress`,
        null, simTime);
  });

  // Conflict resolved
  TRAINS_DATA.filter(tr => tr.rerouted).forEach(tr => {
    if (t >= tr.depart_source && t < tr.depart_source + 0.5)
      logEvent('success',
        `✓ Conflict resolved — <span style="color:${tr.color}">${tr.name}</span> cleared to depart (delay: ${tr.wait_duration} min)`,
        null, simTime);
  });

  // Arrivals
  TRAINS_DATA.forEach(tr => {
    if (t >= tr.arrival_mins && t < tr.arrival_mins + 0.5)
      logEvent('info',
        `<b style="color:${tr.color}">${tr.name}</b> arrived at Main Station → Platform-${tr.platform + 1} at <b>${tr.arrival_time}</b>`,
        null, simTime);
  });

  // Simulation phase events
  if (t >= 0   && t < 0.5)  logEvent('info', '🚂 Simulation started — monitoring 6 inbound trains', '6:00 AM', simTime);
  if (t >= 33  && t < 33.5) logEvent('warn', '⚡ RailFlow detected approaching conflict window on South corridor', null, simTime);
  if (t >= 35  && t < 35.5) logEvent('warn', '⚡ RailFlow detected approaching conflict window on North corridor', null, simTime);
  if (t >= 53  && t < 53.5) logEvent('success', '✓ All conflicts resolved — schedule optimized', null, simTime);
}

function resetLog() {
  loggedEvents.clear();
  resolvedCount = 0;
  document.getElementById('event-log').innerHTML = '';
  document.getElementById('sh-saved').textContent = '0';
}

// ── Train Status Cards ──
function buildStatusCards() {
  document.getElementById('status-row').innerHTML = TRAINS_DATA.map(t => `
    <div class="tcard" id="card-${t.id}">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${t.color}"></div>
      <div class="tc-name" style="color:${t.color}">${t.name}</div>
      <div class="tc-stat">PRIORITY</div>
      <div class="tc-val">${t.priority}</div>
      <div class="tc-stat">ETA / ARRIVAL</div>
      <div class="tc-val" style="color:var(--amber)">${t.arrival_time}</div>
      <div id="card-badge-${t.id}" class="tc-badge badge-pending">PENDING</div>
    </div>
  `).join('');
}

function updateStatusCards(simTime) {
  TRAINS_DATA.forEach(t => {
    const badge = document.getElementById(`card-badge-${t.id}`);
    if (!badge) return;
    const state = getTrainState(t, simTime);
    if (state.status === 'pending') {
      badge.className = 'tc-badge badge-pending'; badge.textContent = 'PENDING';
    } else if (state.status === 'waiting') {
      badge.className = 'tc-badge badge-waiting';
      badge.textContent = `WAIT ${state.waitRemaining.toFixed(0)}m`;
    } else if (state.status === 'moving') {
      badge.className = 'tc-badge badge-moving'; badge.textContent = 'EN ROUTE';
    } else if (state.status === 'arrived') {
      badge.className = 'tc-badge badge-arrived'; badge.textContent = 'ARRIVED';
    }
  });
}

// ── Platform Timeline ──
const TL_MIN = 25, TL_MAX = 80, TL_RANGE = TL_MAX - TL_MIN;

function buildTimeline() {
  const wrap = document.getElementById('tl-wrap');
  const tmap = {};
  TRAINS_DATA.forEach(t => tmap[t.id] = t);

  let html = `<div class="tl-hdr" style="position:relative">`;
  for (let tm = TL_MIN; tm <= TL_MAX; tm += 5) {
    const pct = ((tm - TL_MIN) / TL_RANGE * 100).toFixed(1);
    html += `<span style="position:absolute;left:${pct}%;transform:translateX(-50%)">${toClk(tm)}</span>`;
  }
  html += `</div>`;

  PLATFORMS_DATA.forEach(p => {
    html += `<div class="tl-row">
      <div class="tl-lbl">${p.name}</div>
      <div class="tl-track" id="tlt-${p.id}">
        <div class="tl-cursor" id="tlc-${p.id}" style="left:0%"></div>`;
    for (let tm = TL_MIN; tm <= TL_MAX; tm += 5) {
      const pct = ((tm - TL_MIN) / TL_RANGE * 100).toFixed(1);
      html += `<div class="tl-tick" style="left:${pct}%"></div>`;
    }
    p.trains.forEach(r => {
      const tr = tmap[r.tid];
      const left  = Math.max(0, ((r.arrive_mins - TL_MIN) / TL_RANGE * 100)).toFixed(1);
      const width = ((r.depart_mins - r.arrive_mins) / TL_RANGE * 100).toFixed(1);
      html += `<div class="tl-block" id="tlb-${p.id}-${r.tid}"
                 style="left:${left}%;width:${width}%;
                        background:${tr.color}22;border:1px solid ${tr.color}66;
                        color:${tr.color};opacity:0.3"
                 title="${tr.name}: ${r.arrive} – ${r.depart}">
                 ${tr.name}
               </div>`;
    });
    html += `</div></div>`;
  });

  wrap.innerHTML = html;
}

function updateTimeline(simTime) {
  const pct = Math.min(100, ((simTime - TL_MIN) / TL_RANGE * 100)).toFixed(1);
  PLATFORMS_DATA.forEach(p => {
    const cur = document.getElementById(`tlc-${p.id}`);
    if (cur) cur.style.left = `${Math.max(0, pct)}%`;
    p.trains.forEach(r => {
      const blk = document.getElementById(`tlb-${p.id}-${r.tid}`);
      if (!blk) return;
      if (simTime >= r.arrive_mins) blk.style.opacity = '1';
      else if (simTime >= r.arrive_mins - 1) blk.style.opacity = '0.6';
    });
  });
}

// ── Time Saved Panel ──
function buildTimeSaved() {
  const el = document.getElementById('tsaved');
  const maxDelay = Math.max(...TIME_SAVED.map(t => t.delay_without));

  let html = `
  <div class="ts-hero">
    <span class="ts-big" id="ts-hero-num">0</span>
    <div class="ts-label">Total Minutes Saved</div>
    <div style="font-size:10px;color:var(--muted);margin-top:6px;font-family:var(--sans)">
      vs estimated delay without RailFlow intervention
    </div>
  </div>`;

  TIME_SAVED.forEach(t => {
    html += `
    <div class="ts-row">
      <div>
        <div class="ts-name" style="color:${t.color}">${t.name}</div>
        <div style="font-size:9px;color:var(--muted)">
          Original ETA: ${t.orig} → Actual: ${t.actual}
        </div>
      </div>
      <div class="ts-nums">
        <div class="ts-del">+${t.delay_with}m actual</div>
        <div class="ts-sav">saved ${t.saved}m</div>
      </div>
    </div>`;
  });

  html += `<div class="ts-bar-wrap">`;
  TIME_SAVED.forEach(t => {
    const key = t.name.replace(/\W/g, '');
    html += `
    <div class="ts-bar-row">
      <div class="ts-bar-lbl"><span style="color:${t.color}">${t.name}</span><span></span></div>
      <div style="margin-bottom:3px">
        <div style="font-size:9px;color:var(--muted);margin-bottom:2px">Without RailFlow: ~${t.delay_without} min delay</div>
        <div class="ts-bar"><div class="ts-bar-fill" style="width:0%;background:var(--red)" id="bar-without-${key}"></div></div>
      </div>
      <div>
        <div style="font-size:9px;color:var(--muted);margin-bottom:2px">With RailFlow: ${t.delay_with} min delay</div>
        <div class="ts-bar"><div class="ts-bar-fill" style="width:0%;background:var(--green)" id="bar-with-${key}"></div></div>
      </div>
    </div>`;
  });

  html += `<div style="margin-top:12px;padding:10px;background:rgba(57,211,83,.06);
              border:1px solid rgba(57,211,83,.2);border-radius:2px">
    <div style="font-family:var(--sans);font-size:11px;color:var(--green);font-weight:700;letter-spacing:1px">HOW RAILFLOW SAVES TIME</div>
    <div style="font-size:10px;color:var(--muted);margin-top:6px;line-height:1.7">
      Without system: signal block → emergency brake → 15–20 min clearance delay<br>
      With RailFlow: conflict predicted 10+ min early → preventive 5–6 min delay<br>
      <span style="color:var(--green)">Net saving: ~13–15 min per affected train</span>
    </div>
  </div></div>`;

  el.innerHTML = html;
}

function updateTimeSaved(simTime) {
  const hero = document.getElementById('ts-hero-num');
  if (hero) hero.textContent = Math.max(0, Math.round(TOTAL_SAVED * Math.min(1, (simTime - 40) / 25)));

  const maxDelay = Math.max(...TIME_SAVED.map(x => x.delay_without));
  TIME_SAVED.forEach(t => {
    const key = t.name.replace(/\W/g, '');
    const bw = document.getElementById(`bar-without-${key}`);
    const bg = document.getElementById(`bar-with-${key}`);
    if (bw && simTime > 33) bw.style.width = (t.delay_without / maxDelay * 100) + '%';
    if (bg && simTime > 40) bg.style.width = (t.delay_with / maxDelay * 100) + '%';
  });
}

// ── Header / Progress ──
function updateHeader(simTime) {
  document.getElementById('sim-clock').textContent = toClk(simTime);

  const pct = (simTime / SIM_END * 100).toFixed(0);
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  const pb = document.getElementById('phase-badge');
  if (simTime < 26) {
    pb.style.cssText = 'background:rgba(74,158,255,.15);color:var(--blue);border:1px solid rgba(74,158,255,.3)';
    pb.textContent = 'MONITORING';
  } else if (simTime < 40) {
    pb.style.cssText = 'background:rgba(255,69,69,.15);color:var(--red);border:1px solid rgba(255,69,69,.3)';
    pb.textContent = '⚠ CONFLICT';
  } else if (simTime < 55) {
    pb.style.cssText = 'background:rgba(245,166,35,.15);color:var(--amber);border:1px solid rgba(245,166,35,.3)';
    pb.textContent = 'RESOLVING';
  } else {
    pb.style.cssText = 'background:rgba(57,211,83,.15);color:var(--green);border:1px solid rgba(57,211,83,.3)';
    pb.textContent = '✓ RESOLVED';
  }
}

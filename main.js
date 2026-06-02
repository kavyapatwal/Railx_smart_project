// ═══════════════════════════════════════════════════════════
//  main.js — Game loop, controls, and initialization
// ═══════════════════════════════════════════════════════════

let simTime = 0;
let playing = false;
let lastTs = null;
let speedMs = 800; // ms of real time per 1 sim minute (0.5× default)

const SPEEDS = { slow: 800, normal: 400, fast: 130, ultra: 50 };

// ── Master update — called every animation frame ──
function updateAll() {
  updateTrains(simTime);
  updateConflictFlash(simTime);
  updateStatusCards(simTime);
  updateHeader(simTime);
  updateTimeline(simTime);
  updateTimeSaved(simTime);
  checkEvents(simTime);
}

// ── Main animation loop ──
function tick(ts) {
  if (!playing) return;
  if (!lastTs) lastTs = ts;
  const dt = ts - lastTs; // real ms since last frame
  lastTs = ts;
  simTime += dt / speedMs; // convert real time → sim minutes

  if (simTime >= SIM_END) {
    simTime = SIM_END;
    playing = false;
    document.getElementById('btn-play').textContent = '▶ PLAY';
    document.getElementById('btn-play').classList.remove('active');
  }

  updateAll();
  if (playing) requestAnimationFrame(tick);
}

// ── Controls ──
function togglePlay() {
  playing = !playing;
  const btn = document.getElementById('btn-play');
  btn.textContent = playing ? '⏸ PAUSE' : '▶ PLAY';
  btn.classList.toggle('active', playing);
  if (playing) {
    lastTs = null; // reset timestamp so first frame doesn't jump
    requestAnimationFrame(tick);
  }
}

function resetSim() {
  playing = false;
  simTime = 0;
  lastTs = null;
  document.getElementById('btn-play').textContent = '▶ PLAY';
  document.getElementById('btn-play').classList.remove('active');
  resetLog();
  buildTimeline();
  buildTimeSaved();
  updateAll();
}

function setSpeed(s) {
  speedMs = SPEEDS[s];
  document.querySelectorAll('[id^="sp-"]').forEach(b => b.classList.remove('active'));
  document.getElementById(`sp-${s}`).classList.add('active');
}

// ── Initialization ──
window.addEventListener('load', () => {
  buildStaticGraph();
  buildStatusCards();
  buildTimeline();
  buildTimeSaved();
  updateAll();
  // Auto-start after a short delay so user sees initial state
  setTimeout(() => { togglePlay(); }, 600);
});

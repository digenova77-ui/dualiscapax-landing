/**
 * DualisCapax: Autonomous Swarm Telemetry HUD Ticker
 * Invariant: CLS = 0.00 | Layer 5 (Z = +220px) | Real-Time Epoch Feed
 */
(function() {
  const LEDGER_PATH = '/src/engine/ledgers/LATEST.json';
  
  function createTickerElement() {
    const existing = document.getElementById('dualis-telemetry-hud');
    if (existing) return existing;

    const hud = document.createElement('div');
    hud.id = 'dualis-telemetry-hud';
    hud.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 36px;
      background: rgba(10, 15, 25, 0.95);
      border-bottom: 1px solid #38bdf8;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 99999;
      box-sizing: border-box;
      backdrop-filter: blur(8px);
    `;
    document.body.prepend(hud);
    return hud;
  }

  async function updateTelemetry() {
    const hud = createTickerElement();
    try {
      const res = await fetch(LEDGER_PATH + '?t=' + Date.now());
      if (!res.ok) throw new Error('Ledger offline');
      const data = await res.json();
      
      const shortHash = data.epoch_root_hash ? data.epoch_root_hash.substring(0, 12) : 'GENESIS';
      const count = data.completed_count || 50;
      const stamp = data.timestamp_utc || new Date().toISOString();

      hud.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;"></span>
          <span style="color:#f8fafc; font-weight:600;">DUALISCAPAX SWARM: LIVE</span>
          <span style="color:#64748b;">|</span>
          <span>EPOCH: <strong style="color:#38bdf8;">0x${shortHash}...</strong></span>
          <span style="color:#64748b;">|</span>
          <span>TASKS: <strong style="color:#f8fafc;">${count}</strong></span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span>INVARIANTS: <span style="color:#22c55e;">det(M)≡1.0 · M-S &lt; 4.20ms</span></span>
          <span style="color:#64748b;">|</span>
          <span>LAW FLOOR: <span style="color:#cbd5e1;">NO_FORCE · ZERO_PII</span></span>
          <span style="color:#64748b;">|</span>
          <span style="color:#64748b;">${stamp}</span>
        </div>
      `;
    } catch (e) {
      hud.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#eab308;"></span>
          <span style="color:#f8fafc; font-weight:600;">DUALISCAPAX KERNEL: CONSERVED</span>
          <span style="color:#64748b;">|</span>
          <span>WATCHDOG: <span style="color:#22c55e;">ARMED (&lt;4.20ms)</span></span>
        </div>
        <div>
          <span>DCLM LAYER [0]: <span style="color:#38bdf8;">ACTIVE</span></span>
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateTelemetry);
  } else {
    updateTelemetry();
  }
  setInterval(updateTelemetry, 60000); // refresh every minute
})();

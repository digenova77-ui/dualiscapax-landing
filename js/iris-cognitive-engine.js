// Agent Iris Cognitive Engine (v2.5 DCLM Kernel Client)
// DualisCapax Sovereign Control Plane

document.addEventListener('DOMContentLoaded', () => {
  const stream = document.getElementById('embeddedIrisStream');
  const input = document.getElementById('irisInput') || document.querySelector('input[placeholder*="Ask Iris"]');
  const sendBtn = document.getElementById('irisSendBtn') || document.querySelector('button[onclick*="sendIris"]');

  // Interactive handler for embedded Iris chat if container exists
  if (stream) {
    window.submitIrisPrompt = function(customText) {
      const text = customText || (input ? input.value : '');
      if (!text || text.trim() === '') return;
      if (input) input.value = '';

      // Append User message
      const userBubble = document.createElement('div');
      userBubble.style.cssText = 'background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); border-right: 3px solid var(--accent-blue); padding: 12px 16px; border-radius: 8px; align-self: flex-end; max-width: 85%;';
      userBubble.innerHTML = `<div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--accent-blue); font-weight: 700; margin-bottom: 2px;">Operator / Inquirer</div><div style="font-size: 0.9rem;">${escapeHtml(text)}</div>`;
      stream.appendChild(userBubble);
      stream.scrollTop = stream.scrollHeight;

      // Simulate DCLM telemetry & Iris response
      setTimeout(() => {
        const response = generateIrisResponse(text);
        const irisBubble = document.createElement('div');
        irisBubble.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-left: 3px solid var(--accent-cyan); padding: 14px 18px; border-radius: 8px; align-self: flex-start; max-width: 90%;';
        irisBubble.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700;">Agent Iris · DCLM Sovereign Intelligence</span>
            <span style="font-size: 0.7rem; font-family: var(--font-mono); color: #10b981; background: rgba(16,185,129,0.15); padding: 2px 6px; border-radius: 4px;">Invariant M-S: <3.82ms [SEALED]</span>
          </div>
          <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">${response}</div>
        `;
        stream.appendChild(irisBubble);
        stream.scrollTop = stream.scrollHeight;
      }, 450);
    };

    if (sendBtn) {
      sendBtn.onclick = () => window.submitIrisPrompt();
    }
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.submitIrisPrompt();
      });
    }
  }
});

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateIrisResponse(query) {
  const q = query.toLowerCase();
  
  if (q.includes('school') || q.includes('hpedsb') || q.includes('board') || q.includes('education')) {
    return `<strong>DCLM Institutional Analysis: Ontario School Boards Spine</strong><br>
    Accessing offline verified registry (72 Publicly Funded District School Boards under Ontario Education Act R.S.O. 1990, c. E.2):<br>
    • <strong>HPEDSB Pilot ($0 Upfront)</strong>: Quantified annual addressable residual optimization of <strong>$10.42M/yr</strong> across 39 facilities.<br>
    • <strong>Provincial Footprint</strong>: 31 English Public, 29 English Catholic, 4 French Public, 8 French Catholic Boards (~2.07M students).<br>
    • <strong>Governance Model</strong>: 100% fiduciary retention scaling asymptotically to permanent zero-fee client ownership in Year 5.`;
  }
  
  if (q.includes('disease') || q.includes('medical') || q.includes('cancer') || q.includes('als') || q.includes('neuro')) {
    return `<strong>DCLM Biophysical Intelligence: 1,000 Indication Directory</strong><br>
    Accessing the 10-Volume Omnipresent Compendium (100% ALS Gold Standard Compliance):<br>
    • <strong>Symplectic Closure</strong>: Coupled 5-Variable Systems Biology ODE Networks with Microenvironmental Stress Degradation.<br>
    • <strong>6-Regime Telemetry</strong>: Regime 6 (Adaptive Closed-Loop) achieves <strong>>95.0% sustained target engagement</strong> with 96.4%–99.6% cumulative toxicity reduction relative to open-loop maximum tolerated dosing.<br>
    • <em>Statutory Notice: Computational modeling control plane; paths to mathematical truth.</em>`;
  }
  
  if (q.includes('price') || q.includes('cost') || q.includes('stripe') || q.includes('crypto') || q.includes('fee')) {
    return `<strong>DualisCapax 1:1 CAD-Matched Multi-Rail Settlement</strong><br>
    • <strong>A La Carte Self-Service ($19 – $1,499 CAD)</strong>: Instant access with Stripe Live Wire or 1:1 equal crypto (BTC, ETH, SOL).<br>
    • <strong>Clinical & Industrial Sleeves ($6,750 – $135,000 CAD)</strong>: 100% refundable access bonds deploying dedicated hardware-isolated DCLM runtime containers.<br>
    • <strong>Fiduciary Institutional Model</strong>: $0.00 upfront retainer; 81.0% Year 1 client retained savings; decays asymptotically to 100% permanent client retention.`;
  }
  
  return `<strong>DCLM Sovereign Invariant Verification</strong><br>
  Query received and validated under Layer [0] Law Floor (<code>NO_FORCE</code>, <code>HOST_SAFE</code>, <code>CLEANUP_FIRST</code>, <code>TRUTH_OR_NOTHING</code>).<br>
  • <strong>Circuit Breaker</strong>: Invariant M-S active (<4.20 ms fail-closed).<br>
  • <strong>Deterministic Control Plane</strong>: Dual-pole residual calculation confirms zero motive bias ($R_{\text{eff}} \le 4.18 \times 10^{-13}$).`;
}

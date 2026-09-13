// Iris cognitive stub — defers to IrisHandoff live rail. No canned DCLM essays.
document.addEventListener('DOMContentLoaded', () => {
  const stream = document.getElementById('embeddedIrisStream');
  const input = document.getElementById('irisInput') || document.querySelector('input[placeholder*="Ask Iris"]');
  const sendBtn = document.getElementById('irisSendBtn') || document.querySelector('button[onclick*="sendIris"]');
  if (!stream) return;

  window.submitIrisPrompt = async function(customText) {
    const text = customText || (input ? input.value : '');
    if (!text || !String(text).trim()) return;
    if (input) input.value = '';

    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); border-right: 3px solid var(--accent-blue); padding: 12px 16px; border-radius: 8px; align-self: flex-end; max-width: 85%;';
    userBubble.innerHTML = `<div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--accent-blue); font-weight: 700; margin-bottom: 2px;">You</div><div style="font-size: 0.9rem;">${escapeHtml(text)}</div>`;
    stream.appendChild(userBubble);
    stream.scrollTop = stream.scrollHeight;

    let answer = 'Connect Grok so I can answer for real.';
    let badge = '⚪ Connect Grok';
    try {
      if (window.IrisHandoff && IrisHandoff.ask) {
        const res = await IrisHandoff.ask(text, {});
        answer = res.answer || answer;
        badge = res.badge || badge;
      }
    } catch (e) {}

    const irisBubble = document.createElement('div');
    irisBubble.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-left: 3px solid var(--accent-cyan); padding: 14px 18px; border-radius: 8px; align-self: flex-start; max-width: 90%;';
    irisBubble.innerHTML = `
      <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">Iris · ${escapeHtml(badge)}</div>
      <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">${escapeHtml(answer)}</div>`;
    stream.appendChild(irisBubble);
    stream.scrollTop = stream.scrollHeight;
  };

  if (sendBtn) sendBtn.onclick = () => window.submitIrisPrompt();
  if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.submitIrisPrompt(); });
});

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

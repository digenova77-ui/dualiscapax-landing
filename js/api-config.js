/**
 * DualisCapax API client config — v2
 * Default origin is the live depth worker. Secret stays on the worker only.
 */
(function (g) {
  g.DC_API_VERSION = '2';
  // Public worker origin (no trailing slash). Key is NOT here.
  g.DC_API_BASE = g.DC_API_BASE || 'https://dualiscapax-depth.digenova77.workers.dev';
  try {
    var q = new URLSearchParams(location.search).get('api');
    if (q) g.DC_API_BASE = q.replace(/\/$/, '');
  } catch (e) {}

  /** POST /v2/chat */
  g.dcChatV2 = async function dcChatV2(messages, opts) {
    opts = opts || {};
    var base = (g.DC_API_BASE || '').replace(/\/$/, '');
    if (!base) throw new Error('DC_API_BASE not set');
    var fuelBal = opts.fuelBalance;
    if (typeof fuelBal !== 'number' && g.DCFuel) fuelBal = g.DCFuel.balance();
    var res = await fetch(base + '/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DC-Fuel': String(fuelBal != null ? fuelBal : ''),
      },
      body: JSON.stringify({
        api_version: '2',
        messages: messages,
        fuel: { balance: fuelBal, burn: opts.burn || 1 },
        session_id: opts.session_id || null,
        max_tokens: opts.max_tokens || 1024,
      }),
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var err = new Error(data.error || ('HTTP ' + res.status));
      err.code = data.code;
      err.data = data;
      throw err;
    }
    return data;
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * DualisCapax API client config
 * World 0 Ground Zero → API v1. World 1 One → API v2.
 * Secret stays on the worker only.
 */
(function (g) {
  var world = g.DC_WORLD === 1 ? 1 : 0;
  g.DC_WORLD = world;
  g.DC_WORLD_NAME = world === 1 ? 'ONE' : 'GROUND_ZERO';
  g.DC_API_VERSION = world === 1 ? '2' : '1';
  g.DC_API_PATH = world === 1 ? '/v2/chat' : '/v1/chat';
  g.DC_API_BASE = g.DC_API_BASE || 'https://dualiscapax-depth.digenova77.workers.dev';
  try {
    var q = new URLSearchParams(location.search).get('api');
    if (q) g.DC_API_BASE = q.replace(/\/$/, '');
    var wq = new URLSearchParams(location.search).get('world');
    if (wq === '1' || /^one$/i.test(wq)) {
      g.DC_WORLD = 1; g.DC_WORLD_NAME = 'ONE'; g.DC_API_VERSION = '2'; g.DC_API_PATH = '/v2/chat';
    }
    if (wq === '0' || /^zero$/i.test(wq)) {
      g.DC_WORLD = 0; g.DC_WORLD_NAME = 'GROUND_ZERO'; g.DC_API_VERSION = '1'; g.DC_API_PATH = '/v1/chat';
    }
  } catch (e) {}

  g.dcChatV2 = async function dcChatV2(messages, opts) {
    opts = opts || {};
    var base = (g.DC_API_BASE || '').replace(/\/$/, '');
    if (!base) throw new Error('DC_API_BASE not set');
    if (g.DCWorld && typeof g.DCWorld.chat === 'function') return g.DCWorld.chat(messages, opts);
    var fuelBal = opts.fuelBalance;
    if (typeof fuelBal !== 'number' && g.DCFuel) fuelBal = g.DCFuel.balance();
    var path = g.DC_API_PATH || '/v2/chat';
    var res = await fetch(base + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DC-Fuel': String(fuelBal != null ? fuelBal : ''),
        'X-DC-World': String(g.DC_WORLD || 0),
        'X-DC-API-Version': String(g.DC_API_VERSION || '1')
      },
      body: JSON.stringify({
        world: g.DC_WORLD || 0,
        api_version: String(g.DC_API_VERSION || '1'),
        messages: messages,
        fuel: { balance: fuelBal, burn: opts.burn || 1 },
        session_id: opts.session_id || null,
        max_tokens: opts.max_tokens || 1024
      })
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

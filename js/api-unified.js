/**
 * DualisCapax unified API client.
 * Current as of: 2026-08-30
 * Binds FE rollout jacket + both leftover chat helpers to one surface.
 * No secret keys. Access stays closed.
 */
(function (g) {
  var CIRCUIT_MS = 4.20;
  var RESIDUAL_FLOOR = 4.18e-13;

  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'dc-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function baseUrl() {
    var base = (g.DC_API_BASE || '').replace(/\/$/, '');
    try {
      var q = new URLSearchParams(location.search).get('api');
      if (q) base = q.replace(/\/$/, '');
    } catch (e) {}
    return base;
  }

  async function http(path, opts) {
    opts = opts || {};
    var base = baseUrl();
    if (!base) {
      return {
        ok: false,
        status: 'FAIL_CLOSED_NO_BASE',
        error: 'DC_API_BASE not set',
        code: 'NO_BASE',
        circuit_breaker_latency_ms: 0,
      };
    }
    var t0 = (g.performance && performance.now) ? performance.now() : Date.now();
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (g.DC_SESSION) headers['X-DC-Session'] = g.DC_SESSION;
    if (opts.fuelBalance != null) headers['X-DC-Fuel'] = String(opts.fuelBalance);
    var res = await fetch(base + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var ms = ((g.performance && performance.now) ? performance.now() : Date.now()) - t0;
    var data = await res.json().catch(function () {
      return { ok: false, error: 'Invalid response', code: 'BAD_JSON' };
    });
    data._http = res.status;
    data.circuit_breaker_latency_ms = Math.round(ms * 1000) / 1000;
    if (ms >= CIRCUIT_MS && data.status !== 'FAIL_CLOSED_CIRCUIT_TRIPPED') {
      data.circuit_note = 'client_observed_over_sla';
    }
    return data;
  }

  g.dcApi = {
    version: '2.40-unified',
    circuitMs: CIRCUIT_MS,
    residualFloor: RESIDUAL_FLOOR,

    capabilities: function () {
      return http('/v2/capabilities');
    },

    health: function () {
      return http('/health');
    },

    telemetry: function () {
      return http('/v2/dclm/telemetry/circuit-breaker');
    },

    attestBind: function (opts) {
      opts = opts || {};
      return http('/v2/dclm/attest/bind', {
        method: 'POST',
        body: {
          client_pubkey: opts.client_pubkey || ('web_' + uuid()),
          jurisdiction_code: opts.jurisdiction_code || 'CA-ON',
          nonce: opts.nonce || uuid().replace(/-/g, ''),
          mode: 'SANDBOX',
          tee_quote: opts.tee_quote || { sandbox: true, isv_prod_id: '0x2P5L_SIM_V1' },
        },
      }).then(function (data) {
        if (data.session_token) g.DC_SESSION = data.session_token;
        return data;
      });
    },

    wrap: function (opts) {
      opts = opts || {};
      return http('/v2/dclm/inference/wrap', {
        method: 'POST',
        fuelBalance: opts.fuelBalance,
        body: {
          provider: opts.provider || 'direct_dclm',
          model: opts.model,
          prompt_payload: { messages: opts.messages || [] },
          confinement_rules: {
            max_rate_of_advance: 1.0,
            target_residual_floor: RESIDUAL_FLOOR,
            fail_closed_on_drift: true,
          },
        },
      });
    },

    sandboxExecute: function (opts) {
      opts = opts || {};
      return http('/v2/dclm/sandbox/execute', {
        method: 'POST',
        body: {
          text: opts.text || '',
          voice: opts.voice || 'citizen',
          case_id: opts.case_id || 'web',
        },
      });
    },

    purge: function () {
      var token = g.DC_SESSION;
      return http('/v2/dclm/session/purge', {
        method: 'POST',
        body: { session_token: token || '' },
      }).then(function (data) {
        g.DC_SESSION = '';
        return data;
      });
    },

    chat: function (messages, opts) {
      opts = opts || {};
      var fuelBal = opts.fuelBalance;
      if (typeof fuelBal !== 'number' && g.DCFuel && typeof g.DCFuel.balance === 'function') {
        fuelBal = g.DCFuel.balance();
      }
      return http('/v2/chat', {
        method: 'POST',
        fuelBalance: fuelBal,
        body: {
          api_version: '2',
          v: 2,
          id: opts.id || uuid(),
          type: 'chat.completion',
          plane: 'dualiscapax',
          channel: opts.channel || 'depth',
          messages: messages || [],
          payload: { messages: messages || [], model: opts.model, max_tokens: opts.max_tokens || 1024 },
          fuel: { balance: fuelBal, burn: opts.burn || 1, intent: opts.channel === 'open' ? 'none' : 'burn', units: opts.fuelUnits || 1 },
          session_id: opts.session_id || g.DC_SESSION || null,
          max_tokens: opts.max_tokens || 1024,
        },
      });
    },
  };

  g.dcChatV2 = function (messages, opts) {
    return g.dcApi.chat(messages, opts);
  };

  g.dcApiV2Chat = function (opts) {
    opts = opts || {};
    return g.dcApi.chat(opts.messages || [], opts);
  };
})(typeof window !== 'undefined' ? window : globalThis);

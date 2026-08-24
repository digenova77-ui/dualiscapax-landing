/** DualisCapax API v2 client helper */
(function (g) {
  function uuid() {
    if (g.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'dc-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  /**
   * @param {object} opts
   * @param {string} opts.base - API origin (no trailing slash)
   * @param {array} opts.messages - {role, content}[]
   * @param {number} [opts.fuelBalance]
   * @param {string} [opts.channel] depth|open
   */
  g.dcApiV2Chat = async function dcApiV2Chat(opts) {
    var base = (opts.base || g.DC_API_BASE || '').replace(/\/$/, '');
    if (!base) throw new Error('DC_API_BASE not set');

    var body = {
      v: 2,
      id: opts.id || uuid(),
      type: 'chat.completion',
      plane: 'dualiscapax',
      channel: opts.channel || 'depth',
      payload: {
        messages: opts.messages || [],
        model: opts.model,
        max_tokens: opts.max_tokens || 1024,
        temperature: opts.temperature,
      },
      fuel: {
        intent: opts.channel === 'open' ? 'none' : 'burn',
        units: opts.fuelUnits || 1,
      },
      capabilities: {
        want: ['text'],
        have: ['text'],
      },
    };

    var headers = { 'Content-Type': 'application/json' };
    if (opts.fuelBalance != null) headers['X-DC-Fuel'] = String(opts.fuelBalance);
    if (opts.session) headers['X-DC-Session'] = opts.session;

    var res = await fetch(base + '/api/v2/chat', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    var data = await res.json().catch(function () {
      return { v: 2, ok: false, error: { code: 'BAD_JSON', message: 'Invalid response' } };
    });
    data._http = res.status;
    return data;
  };
})(typeof window !== 'undefined' ? window : globalThis);

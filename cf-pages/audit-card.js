// AUDIT CARD — Look door on the Base 3D globe
// Tap the card → open the audit stream (SSE endpoint, Father-seated)
// This file is a placeholder: the SSE endpoint does not exist yet.
// When Father seats the endpoint, this card connects to it.
//
// Dual-pipe: PIPE K designs the card; PIPE D gates what it may show.
// Talk stays off `/`. No login, no permission, no trust.
// Art. 2: guest taps, reads, leaves.

(function () {
  'use strict';

  // Placeholder station card — renders only when the globe's station system loads it.
  // Real behavior: fetch('/api/audit/stream') as EventSource, display latest
  // recorded result with timestamp. Freshness gap made visible, not hidden.

  var AUDIT_CARD = {
    id: 'audit-station-001',
    label: 'audit',
    kind: 'LOOK_DOOR', // not a power, not a gate
    stream: '/api/audit/stream', // Father-seated endpoint; placeholder until then
    rules: [
      'no login required',
      'no permission required',
      'timestamp on every result (freshness visible)',
      'serves last recorded measurement, not a live re-audit',
      'Talk stays off `/`'
    ]
  };

  // Export for the globe's station loader (when it exists).
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AUDIT_CARD;
  } else if (typeof window !== 'undefined') {
    window.DUALIS_AUDIT_CARD = AUDIT_CARD;
  }
})();

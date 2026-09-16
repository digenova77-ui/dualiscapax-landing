/* Unity bind — one seat, many doors.
   Phrase = DCVault (Ice words). Session = DC_UNITY. Number = UnityID.
   Ice / teacher / SIMA hatch off the same U1. No student names. Look $0. */
(function (g) {
  var KEY = 'dc.unity.seats';

  function ls(k) {
    try {
      var raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    return v;
  }

  function phraseOpen() {
    try { return !!(g.DCVault && DCVault.session && DCVault.session()); }
    catch (e) { return false; }
  }

  function session() {
    if (g.DC_UNITY && DC_UNITY.read) return DC_UNITY.read();
    return ls('dc.unity.session');
  }

  function ensureSession() {
    var s = session();
    if (s && s.unity_id) return s;
    if (g.DC_UNITY && DC_UNITY.mint) return DC_UNITY.mint({ jx: 'WORLD' });
    return null;
  }

  function rootNumber() {
    if (g.UnityID && UnityID.mintU1) return UnityID.mintU1();
    return { schema: 'unity.id.v1', human: 'U1', public: 'DC1-H1-0001', seat: 'operator_first' };
  }

  function readSeats() {
    return ls(KEY) || { schema: 'unity.seats.v1', doors: {}, at: null };
  }

  function hatch(kind, extra) {
    if (!phraseOpen()) return { ok: false, hole: 'awaiting_phrase' };
    var sess = ensureSession();
    if (!sess) return { ok: false, hole: 'awaiting_unity_session' };
    var parent = rootNumber();
    var book = readSeats();
    var idx = { ice: 1, teacher: 2, sima: 3, visitor: 4 }[kind] || 9;
    var child = (g.UnityID && UnityID.hatch) ? UnityID.hatch(parent, 1, idx) : {
      human: parent.human + '.' + String(idx).padStart(2, '0'),
      public: parent.public + '.' + String(idx).padStart(2, '0'),
      seat: kind
    };
    var door = {
      kind: kind,
      human: child.human,
      public: child.public,
      parent: parent.public,
      unity_id: sess.unity_id,
      confirmed: !!(extra && extra.confirmed),
      status: (extra && extra.status) || 'CLAIMED',
      board: (extra && extra.board) || null,
      school: (extra && extra.school) || null,
      grade: (extra && extra.grade) || null,
      at: new Date().toISOString()
    };
    book.unity_id = sess.unity_id;
    book.root = parent.public;
    book.human = parent.human;
    book.doors[kind] = door;
    book.at = door.at;
    save(KEY, book);
    return { ok: true, door: door, seats: book };
  }

  function attachTeacher() {
    var bind = ls('dc.teacher.bind') || ls('dc.teacher.seat');
    if (!bind) return { ok: false, hole: 'awaiting_teacher_bind' };
    if (!bind.confirmed) return { ok: false, hole: 'awaiting_teacher_confirm' };
    return hatch('teacher', {
      confirmed: true,
      status: 'CONFIRMED',
      board: bind.board || null,
      school: bind.school || null,
      grade: bind.grade || null
    });
  }

  function attachIce() {
    return hatch('ice', { confirmed: false, status: 'CLAIMED' });
  }

  function attachSima() {
    return hatch('sima', { confirmed: false, status: 'ARCHITECTURE' });
  }

  function snapshot() {
    return {
      phrase: phraseOpen(),
      session: session(),
      seats: readSeats(),
      teacher: ls('dc.teacher.bind') || ls('dc.teacher.seat'),
      vault: !!(g.DCVault && DCVault.hasVault && DCVault.hasVault())
    };
  }

  function paint(el) {
    if (!el) return;
    var snap = snapshot();
    var doors = (snap.seats && snap.seats.doors) || {};
    var lines = [];
    lines.push(snap.phrase ? 'Phrase open on this phone.' : 'Phrase locked. Same eight words as Ice.');
    lines.push(snap.session && snap.session.unity_id
      ? ('Unity ID ' + String(snap.session.unity_id).slice(0, 8))
      : 'Unity session awaiting_phrase');
    ['ice', 'teacher', 'sima'].forEach(function (k) {
      var d = doors[k];
      lines.push(d
        ? (k + ' · ' + d.human + ' · ' + d.status)
        : (k + ' · hole'));
    });
    if (snap.teacher && snap.teacher.confirmed) {
      lines.push('Room: ' + (snap.teacher.school || 'named') + ' / ' + (snap.teacher.grade || 'grade'));
    }
    el.textContent = lines.join('\n');
  }

  g.UnityBind = {
    phraseOpen: phraseOpen,
    session: session,
    hatch: hatch,
    attachTeacher: attachTeacher,
    attachIce: attachIce,
    attachSima: attachSima,
    snapshot: snapshot,
    seats: readSeats,
    paint: paint
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * TeamSnap OAuth (APIv3) — DualisCapax ice
 * Authorize in browser; code→token on worker (secret never on lander).
 * Tokens + schedule cache stay on-device under passkey session.
 */
(function (w) {
  "use strict";

  var AUTH = "https://auth.teamsnap.com/oauth/authorize";
  var API = "https://api.teamsnap.com/v3";
  var TOKEN_KEY = "dc.ice.teamsnap.token";
  var ME_KEY = "dc.ice.teamsnap.me";
  var EVENTS_KEY = "dc.ice.teamsnap.events";
  var CLIENT_KEY = "dc.teamsnap.client_id";
  var STATE_KEY = "dc.teamsnap.oauth_state";
  var SCOPE = "read";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsJson(k) {
    try { var r = lsGet(k); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function apiBase() {
    return (w.DC_API_BASE || "https://dualiscapax-depth.digenova77.workers.dev").replace(/\/$/, "");
  }
  function clientId() {
    return (w.DC_TEAMSNAP_CLIENT_ID || lsGet(CLIENT_KEY) || "").trim();
  }
  function setClientId(id) {
    id = String(id || "").trim();
    if (id) lsSet(CLIENT_KEY, id);
    return id;
  }
  function redirectUri() {
    /* Same-origin callback so oauth_state + pending_claim survive the round trip.
     * Force only when explicitly set (rare). Never default to a foreign apex. */
    if (w.DC_TEAMSNAP_REDIRECT_FORCE) return String(w.DC_TEAMSNAP_REDIRECT_FORCE);
    try {
      return location.origin + "/oauth/teamsnap.html";
    } catch (e) {
      return "https://dualiscapax-landing.pages.dev/oauth/teamsnap.html";
    }
  }
  function hasToken() {
    var t = lsJson(TOKEN_KEY);
    return !!(t && t.access_token);
  }
  function getToken() {
    var t = lsJson(TOKEN_KEY);
    return t && t.access_token ? t : null;
  }
  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ME_KEY);
      localStorage.removeItem(EVENTS_KEY);
    } catch (e) {}
  }

  function startAuth(opts) {
    opts = opts || {};
    var cid = setClientId(opts.clientId || clientId());
    if (!cid) {
      return { ok: false, reason: "NO_CLIENT_ID", message: "Set TeamSnap Client ID first." };
    }
    var state = btoa(String(Math.random())).replace(/=+/g, "").slice(0, 24);
    lsSet(STATE_KEY, JSON.stringify({
      state: state,
      at: Date.now(),
      returnTo: opts.returnTo || (location.origin + "/ice.html#seat")
    }));
    var url = AUTH +
      "?client_id=" + encodeURIComponent(cid) +
      "&redirect_uri=" + encodeURIComponent(redirectUri()) +
      "&response_type=code" +
      "&scope=" + encodeURIComponent(SCOPE) +
      "&state=" + encodeURIComponent(state);
    /* iOS Safari can drop localStorage writes if we navigate in the same tick */
    try { localStorage.setItem(STATE_KEY, lsGet(STATE_KEY) || ""); } catch (eFlush) {}
    setTimeout(function () { location.href = url; }, 180);
    return { ok: true };
  }

  async function exchangeCode(code, state) {
    var st = lsJson(STATE_KEY) || {};
    if (state && st.state && state !== st.state) {
      return { ok: false, reason: "STATE_MISMATCH" };
    }
    var cid = clientId();
    if (!cid) return { ok: false, reason: "NO_CLIENT_ID" };

    var res = await fetch(apiBase() + "/v2/oauth/teamsnap/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DC-Client": "ice-teamsnap-v1" },
      body: JSON.stringify({
        code: code,
        client_id: cid,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code"
      })
    });
    var body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    if (!res.ok || !body || !body.access_token) {
      return {
        ok: false,
        reason: "TOKEN_EXCHANGE",
        status: res.status,
        detail: body && (body.error || body.message) || ("HTTP " + res.status)
      };
    }
    var tok = {
      access_token: body.access_token,
      token_type: body.token_type || "bearer",
      created_at: body.created_at || Math.floor(Date.now() / 1000),
      scope: body.scope || SCOPE,
      at: new Date().toISOString()
    };
    tok.validated_at = new Date().toISOString();
    lsSet(TOKEN_KEY, JSON.stringify(tok));
    return { ok: true, token: tok, returnTo: st.returnTo || (location.origin + "/ice.html#seat") };
  }

  function collectionItems(json) {
    if (!json) return [];
    if (json.collection && Array.isArray(json.collection.items)) return json.collection.items;
    if (Array.isArray(json.items)) return json.items;
    return [];
  }
  function itemData(item) {
    var out = {};
    var data = (item && item.data) || [];
    for (var i = 0; i < data.length; i++) {
      if (data[i] && data[i].name) out[data[i].name] = data[i].value;
    }
    return out;
  }
  function itemHref(item, rel) {
    var links = (item && item.links) || [];
    for (var i = 0; i < links.length; i++) {
      if (links[i].rel === rel) return links[i].href;
    }
    return null;
  }

  async function apiGet(pathOrUrl) {
    var tok = getToken();
    if (!tok) throw new Error("NO_TOKEN");
    var url = pathOrUrl.indexOf("http") === 0 ? pathOrUrl : (API + pathOrUrl);
    var res = await fetch(url, {
      headers: {
        Authorization: "Bearer " + tok.access_token,
        Accept: "application/json"
      }
    });
    if (!res.ok) throw new Error("API_" + res.status);
    return res.json();
  }

  async function refreshMeAndSchedule() {
    var meJson = await apiGet("/me");
    var meItems = collectionItems(meJson);
    var me = meItems[0] ? itemData(meItems[0]) : {};
    var teamsHref = meItems[0] ? itemHref(meItems[0], "teams") : null;
    lsSet(ME_KEY, JSON.stringify({ me: me, at: new Date().toISOString() }));

    var events = [];
    if (teamsHref) {
      var teamsJson = await apiGet(teamsHref);
      var teams = collectionItems(teamsJson);
      for (var t = 0; t < teams.length; t++) {
        var td = itemData(teams[t]);
        var evHref = itemHref(teams[t], "events");
        if (!evHref) continue;
        try {
          var evJson = await apiGet(evHref);
          var items = collectionItems(evJson);
          for (var e = 0; e < items.length; e++) {
            var ed = itemData(items[e]);
            var notes = ed.notes || ed.notes_text || ed.note || ed.description || ed.details || "";
            var blob = [ed.name, ed.title, notes, ed.location_name, ed.location].join(" ");
            var urlMatches = String(blob).match(/https?:\/\/[^\s<>"']+/gi) || [];
            var streamPick = "";
            for (var ui = 0; ui < urlMatches.length; ui++) {
              if (/livebarn\.com/i.test(urlMatches[ui])) { streamPick = urlMatches[ui]; break; }
            }
            if (!streamPick && urlMatches.length) streamPick = urlMatches[0];
            events.push({
              team_id: td.id,
              team_name: td.name || td.team_name || "",
              id: ed.id,
              name: ed.name || ed.title || "",
              event_type: ed.event_type || ed.type || "",
              start: ed.start_date || ed.starts_at || ed.start || "",
              end: ed.end_date || ed.ends_at || ed.end || "",
              location: ed.location_name || ed.location || ed.address || "",
              opponent: ed.opponent_name || ed.opponent || "",
              notes: notes,
              stream_url: streamPick,
              is_home: (ed.is_home === true || ed.is_home === "true" || String(ed.home_or_away || "").toLowerCase() === "home"),
              is_away: (ed.is_away === true || ed.is_away === "true" || String(ed.home_or_away || "").toLowerCase() === "away")
            });
          }
        } catch (err) { /* skip team */ }
      }
    }

    events.sort(function (a, b) {
      return String(a.start).localeCompare(String(b.start));
    });
    lsSet(EVENTS_KEY, JSON.stringify({ events: events, at: new Date().toISOString() }));
    return { me: me, events: events };
  }

  function getCachedEvents() {
    var row = lsJson(EVENTS_KEY);
    return row && Array.isArray(row.events) ? row.events : [];
  }
  function getCachedMe() {
    var row = lsJson(ME_KEY);
    return row && row.me ? row.me : null;
  }

  function upcomingAndRecent(now) {
    now = now || new Date();
    var all = getCachedEvents();
    var upcoming = [];
    var recent = [];
    for (var i = 0; i < all.length; i++) {
      var d = all[i].start ? new Date(all[i].start) : null;
      if (!d || isNaN(d.getTime())) continue;
      if (d.getTime() >= now.getTime() - 60 * 60 * 1000) upcoming.push(all[i]);
      else if (now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000) recent.push(all[i]);
    }
    upcoming.sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); });
    recent.sort(function (a, b) { return String(b.start).localeCompare(String(a.start)); });
    return { upcoming: upcoming, recent: recent, next: upcoming[0] || null };
  }

  /** Label practice / game / tournament from event_type/name. Fundraiser/meeting/etc → null (face tiles only). */
  function classifyEvent(ev) {
    var k = calendarKind(ev);
    if (k === "home" || k === "away" || k === "game") return "game";
    if (k === "practice" || k === "tournament") return k;
    return null;
  }

  /**
   * Calendar color kinds (never invent events — only label what TeamSnap cached).
   * home | away | game | practice | tournament | office
   */
  function calendarKind(ev) {
    if (!ev) return null;
    var et = String(ev.event_type || ev.type || "").toLowerCase();
    var nm = String(ev.name || ev.title || "").toLowerCase();
    var blob = (et + " " + nm).replace(/[_\-]+/g, " ");
    function hit(re, s) { return re.test(s); }
    var tourneyRe = /\b(tournament|tourney|classic|invitational)\b/;
    var gameRe = /\b(game|match|scrimmage)\b/;
    var pracRe = /\b(practice|skate|on\s*ice|ice\s*time)\b/;
    var officeRe = /\b(meeting|fundraiser|dry\s*land|off\s*ice|team\s*party|photo|registration|volunte|banquet|social)\b/;
    if (hit(tourneyRe, et) || hit(tourneyRe, nm)) return "tournament";
    var isPrac = hit(pracRe, et) || hit(pracRe, nm);
    var isGame = hit(gameRe, et) || hit(gameRe, nm);
    if (isPrac && !isGame) return "practice";
    if (isGame && !isPrac) {
      if (ev.is_home === true) return "home";
      if (ev.is_away === true) return "away";
      /* Location heuristic only when TeamSnap did not flag home/away */
      var loc = String(ev.location || "").toLowerCase();
      if (loc && /belleville|quinte\s*caa|home\s*rink/.test(loc)) return "home";
      if (ev.opponent && loc) return "away";
      return "game";
    }
    if (hit(officeRe, et) || hit(officeRe, nm)) return "office";
    /* Named leftover still belongs on the calendar as off-ice — never invent rows */
    if (et || nm) return "office";
    return null;
  }

  /** Next upcoming practice + game + tournament from on-device cache (not a full list). */
  function nextPracticeAndGame(now) {
    var feed = upcomingAndRecent(now);
    var nextPractice = null;
    var nextGame = null;
    var nextTournament = null;
    var list = feed.upcoming || [];
    for (var i = 0; i < list.length; i++) {
      var kind = classifyEvent(list[i]);
      if (kind === "practice" && !nextPractice) nextPractice = list[i];
      if (kind === "game" && !nextGame) nextGame = list[i];
      if (kind === "tournament" && !nextTournament) nextTournament = list[i];
      if (nextPractice && nextGame && nextTournament) break;
    }
    return {
      practice: nextPractice,
      game: nextGame,
      tournament: nextTournament,
      upcoming: feed.upcoming,
      recent: feed.recent,
      hasCache: getCachedEvents().length > 0
    };
  }

  /** Alias — same helper; keeps practice + game + tournament. */
  function nextPracticeGameTournament(now) {
    return nextPracticeAndGame(now);
  }

  w.DCTeamSnap = {
    clientId: clientId,
    setClientId: setClientId,
    redirectUri: redirectUri,
    hasToken: hasToken,
    getToken: getToken,
    clearToken: clearToken,
    startAuth: startAuth,
    exchangeCode: exchangeCode,
    refreshMeAndSchedule: refreshMeAndSchedule,
    getCachedEvents: getCachedEvents,
    getCachedMe: getCachedMe,
    upcomingAndRecent: upcomingAndRecent,
    classifyEvent: classifyEvent,
    calendarKind: calendarKind,
    nextPracticeAndGame: nextPracticeAndGame,
    nextPracticeGameTournament: nextPracticeGameTournament,
    SCOPE: SCOPE,
    AUTH: AUTH,
    API: API
  };
})(window);

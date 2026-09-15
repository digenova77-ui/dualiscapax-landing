/**
 * Plücker coordinates for a 3D line.
 * L = (d, m) with d = B-A, m = A×B.
 * Reciprocal product R = d1·m2 + d2·m1.
 * R = 0 → incident (intersect or parallel). Sign(R) → side.
 * Not a visibility tree. Not Mesh2HRTF.
 */
(function (w) {
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function line(A, B) {
    var d = sub(B, A);
    return { d: d, m: cross(A, B) };
  }
  function reciprocal(L1, L2) {
    return dot(L1.d, L2.m) + dot(L2.d, L1.m);
  }
  function incident(L1, L2, eps) {
    eps = eps == null ? 1e-9 : eps;
    return Math.abs(reciprocal(L1, L2)) <= eps;
  }
  function side(L1, L2) {
    var r = reciprocal(L1, L2);
    return r > 0 ? 1 : r < 0 ? -1 : 0;
  }
  /** Ray P+tD against triangle ABC. Uses three edge lines + ray line. */
  function rayHitsTriangle(P, D, A, B, C, eps) {
    eps = eps == null ? 1e-9 : eps;
    var Q = add(P, D);
    var ray = line(P, Q);
    var e0 = line(A, B), e1 = line(B, C), e2 = line(C, A);
    var s0 = side(ray, e0), s1 = side(ray, e1), s2 = side(ray, e2);
    if (s0 === 0 || s1 === 0 || s2 === 0) return Math.abs(s0) + Math.abs(s1) + Math.abs(s2) <= 1;
    return s0 === s1 && s1 === s2;
  }
  w.Plucker = {
    line: line,
    reciprocal: reciprocal,
    incident: incident,
    side: side,
    rayHitsTriangle: rayHitsTriangle,
    _vec: { sub: sub, add: add, dot: dot, cross: cross }
  };
})(typeof window !== "undefined" ? window : globalThis);

/* Dualis geodesic — icosahedron as a real 3D object.
   No PHI. No till. Sound off until the human asks. */
(function (w) {
  var VERSION = "geodesic-3d-2026-09-15";

  function prefersReduced() {
    return w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function startAudio() {
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return { stop: function () {} };
    var ctx = new AC();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 110;
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 18;
    gain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    lfo.start();
    return {
      stop: function () {
        try { osc.stop(); lfo.stop(); ctx.close(); } catch (e) {}
      }
    };
  }

  function mount(canvas, opts) {
    opts = opts || {};
    if (!canvas || !w.THREE) return function () {};
    var THREE = w.THREE;
    var reduced = prefersReduced();

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(w.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 5.1;

    var root = new THREE.Group();
    scene.add(root);

    var wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.58
      })
    );
    root.add(wire);

    var shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.52, 2),
      new THREE.MeshBasicMaterial({
        color: 0x7aa2ff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    root.add(shell);

    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffb830,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      })
    );
    root.add(core);

    var count = reduced ? 80 : 360;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 2.1 + Math.random() * 4.2;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var dust = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.018,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    scene.add(dust);

    var mx = 0, my = 0, tx = 0, ty = 0, dragging = false;
    function size() {
      var wdt = canvas.clientWidth || w.innerWidth;
      var hgt = canvas.clientHeight || w.innerHeight;
      camera.aspect = wdt / Math.max(1, hgt);
      camera.updateProjectionMatrix();
      renderer.setSize(wdt, hgt, false);
    }
    size();

    function pointer(e) {
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      var y = e.touches ? e.touches[0].clientY : e.clientY;
      tx = (x / w.innerWidth - 0.5) * 2;
      ty = (y / w.innerHeight - 0.5) * 2;
    }
    canvas.addEventListener("pointermove", pointer, { passive: true });
    canvas.addEventListener("pointerdown", function () { dragging = true; }, { passive: true });
    w.addEventListener("pointerup", function () { dragging = false; }, { passive: true });
    w.addEventListener("resize", size);

    var clock = new THREE.Clock();
    var running = true;
    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      if (!reduced) {
        root.rotation.y = t * 0.22 + mx * 0.55;
        root.rotation.x = t * 0.08 + my * 0.32;
        core.rotation.y = -t * 0.55;
        core.rotation.z = t * 0.28;
        dust.rotation.y = t * 0.035;
      } else {
        root.rotation.y = mx * 0.4;
        root.rotation.x = my * 0.25;
      }
      if (dragging) root.rotation.y += mx * 0.01;
      renderer.render(scene, camera);
    }
    loop();

    return {
      version: VERSION,
      stop: function () {
        running = false;
        canvas.removeEventListener("pointermove", pointer);
        w.removeEventListener("resize", size);
        renderer.dispose();
      }
    };
  }

  w.DualisGeodesic = { version: VERSION, mount: mount, startAudio: startAudio };
})(window);

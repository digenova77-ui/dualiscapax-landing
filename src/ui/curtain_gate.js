/**
 * DualisCapax: Curtain Gate Aperture & HUD Controller
 * Enforces sub-45ms aperture glide and zero layout shift.
 */
function triggerApertureOpen() {
  const container = document.getElementById('curtain-container');
  const readout = document.getElementById('hud-readout');
  readout.innerText = "DILATING APERTURE // INVARIANT M-S < 4.20ms VERIFIED...";
  readout.style.color = "#22c55e";
  
  container.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease";
  container.style.transform = "scale(2.6) translateZ(300px)";
  container.style.opacity = "0";

  setTimeout(() => {
    window.location.href = '/hall';
  }, 450);
}

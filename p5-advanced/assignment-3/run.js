// run.js (assignment-3)
// sizes the mount div + starts the sketch in instance mode

(function () {
  const mountId = "sketch-consent-camera";
  const el = document.getElementById(mountId);
  if (!el) return;

  // container should be the positioning context for DOM UI (menu)
  el.style.position = "relative";
  el.style.overflow = "hidden";

  // match sketch layout math
  const targetAspect = 3420 / 1924; // 16:9-ish
  const bannerH = 56;
  const topPad = 14;
  const statusBoxH = 48;
  const captureZoneH = 110;

  function setMountHeight() {
    const w = Math.max(320, Math.floor(el.getBoundingClientRect().width));
    const frameH = w / targetAspect;
    const uiH = bannerH + topPad + statusBoxH + 12 + captureZoneH + topPad + 28;
    el.style.height = `${Math.floor(frameH + uiH)}px`;
  }

  setMountHeight();
  window.addEventListener("resize", setMountHeight);

  // start the sketch (instance mode)
  if (typeof window.makeConsentCameraSketch !== "function") {
    console.error("makeConsentCameraSketch is not defined. Check script order.");
    return;
  }

  new p5((p) => window.makeConsentCameraSketch(p, el), el);
})();
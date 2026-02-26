// run.js (clean)
// just booting the clean sketch in its own little bubble
// so it doesn’t fight the other sketches for setup()/draw()

(function () {
  const mountId = "sketch-clean";
  const mountEl = document.getElementById(mountId);
  if (!mountEl) return;

  // making a p5 instance so global vars in sketch.js don’t leak out
  new p5((p) => {
    // sketch.js gets loaded as a plain script, so it needs a hook.
    // easiest pattern: expose a function in sketch.js called `makeSketch(p)`
    if (typeof window.makeCleanSketch === "function") {
      window.makeCleanSketch(p);
    } else {
      // if nothing shows up, it means sketch.js hasn’t been adapted yet
      p.setup = () => {
        p.createCanvas(640, 420);
        p.background(20);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Clean sketch not wired yet", p.width / 2, p.height / 2);
      };
    }
  }, mountEl);
})();
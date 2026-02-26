// run.js (drift)

(function () {
  const mountId = "sketch-drift";
  const mountEl = document.getElementById(mountId);
  if (!mountEl) return;

  new p5((p) => {
    if (typeof window.makeDriftSketch === "function") {
      window.makeDriftSketch(p);
    } else {
      p.setup = () => {
        p.createCanvas(640, 420);
        p.background(20);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Drift sketch not wired yet", p.width / 2, p.height / 2);
      };
    }
  }, mountEl);
})();
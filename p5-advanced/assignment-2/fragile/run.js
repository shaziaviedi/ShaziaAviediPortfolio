// run.js (fragile)

(function () {
  const mountId = "sketch-fragile";
  const mountEl = document.getElementById(mountId);
  if (!mountEl) return;

  new p5((p) => {
    if (typeof window.makeFragileSketch === "function") {
      window.makeFragileSketch(p);
    } else {
      p.setup = () => {
        p.createCanvas(640, 420);
        p.background(20);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Fragile sketch not wired yet", p.width / 2, p.height / 2);
      };
    }
  }, mountEl);
})();
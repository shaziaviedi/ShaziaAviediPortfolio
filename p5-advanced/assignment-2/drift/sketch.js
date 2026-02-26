//(instance mode)

window.makeDriftSketch = (p) => {
  //VARIABLES

  //-dandelion center is cx, cy
  //-word anchor is wordX, wordY
  //change sizes:
  //-dandelion circle size is flowerR
  //change the drift speed:
  //-driftSpeed controls how fast touched points move toward the word

  let grotesk;
  const fontSize = 150;
  let sample = 0.2;

  let colour = ["#FFD54A", "#FFE37A", "#FFF0B0", "#FFF8DC", "#FFFFFF"];

  let circleSize = 5;

  //POSITION CONTROLS
  let cx, cy;//dandelion center (moves the flower placement)
  let flowerR = 80;//dandelion circle radius (flower size)
  let wordX, wordY;//moves the word placement

  //INTERACTION CONTROLS
  let hoverR = 110;//hover zone radius (controls the overall activation area)
  let touchR = 25;//touch radius per point (controls how many points get grabbed)
  let driftSpeed = 0.004;//drift speed toward the word (bigger = faster)
  let damping = 0.92;//motion damping (bigger = floatier, smaller = stickier)
  let maxStep = 1.2;//velocity cap (prevents snapping)

  //FINISH + RESET CONTROLS
  let doneDist = 3.5;//arrival distance threshold (counts as “arrived”)
  let doneRatio = 0.92;//required ratio of arrived points to trigger the next phase
  let driftRightSpeed = 1.1;//rightward drift speed after the word is done
  let driftWiggle = 0.35;//vertical wiggle amount during rightward drift

  //RESET TIMING CONTROLS
  let resetMinDelay = 10;//minimum stagger delay before reappearing
  let resetMaxDelay = 60;//maximum stagger delay before reappearing

  //STEM IMAGE CONTROLS
  let stemImg;//stem image
  let stemW = 50;//stem draw width
  let stemH = 220;//stem draw height
  let stemOffsetY = -25;//stem y offset relative to the flower head

  //POINT ARRAYS
  let wordPts = [];
  let flowerPts = [];
  let particles = [];

  //STATE
  let phase = "build";//build -> driftOut

  //PRELOAD
  p.preload = function () {
    grotesk = p.loadFont("../p5-advanced/assignment-2/drift/assets/font.otf");
    stemImg = p.loadImage("../p5-advanced/assignment-2/drift/assets/stem.png");
  };

  //SETUP
  p.setup = function () {
    p.createCanvas(600, 600);
    p.textFont(grotesk);
    p.textSize(fontSize);
    p.noStroke();

    cx = 120;
    cy = p.height / 2 + 30;

    wordX = 360;
    wordY = 190;

    wordPts = makeWordPoints("drift", wordX, wordY);
    flowerPts = makeDandelionPoints(wordPts.length, cx, cy, flowerR);

    for (let i = 0; i < wordPts.length; i++) {
      particles.push(new DriftPoint(flowerPts[i].x, flowerPts[i].y, wordPts[i].x, wordPts[i].y));
    }
  };

  p.draw = function () {
    p.background(0);

    drawStem();

    let inCircle = p.dist(p.mouseX, p.mouseY, cx, cy) < hoverR;

    if (phase === "build") {
      for (let i = 0; i < particles.length; i++) {
        particles[i].updateBuild(inCircle);
        particles[i].show();
      }

      if (isWordDone()) {
        phase = "driftOut";
        for (let i = 0; i < particles.length; i++) {
          particles[i].startDriftOut();
        }
      }
    } else if (phase === "driftOut") {
      let allReset = true;

      for (let i = 0; i < particles.length; i++) {
        particles[i].updateDriftOut();
        particles[i].show();
        if (!particles[i].wrappedOnce) allReset = false;
      }

      if (allReset) {
        phase = "build";
        for (let i = 0; i < particles.length; i++) {
          particles[i].resetForNext();
        }
      }
    }

    drawHintText();
  };

  //HINT TEXT
  //instruction text at the top
  function drawHintText() {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(35);
    p.fill(255, 170);
    p.text("hover over the dandelion", p.width / 2, 40);
    p.pop();
  }

  //STEM DRAW
  function drawStem() {
    if (!stemImg) return;

    p.push();
    p.imageMode(p.CENTER);

    let x = cx;
    let y = cy + flowerR * 0.55 + stemOffsetY + stemH / 2;

    p.image(stemImg, x, y, stemW, stemH);
    p.pop();
  }

  //WORD POINTS
  //centers the word around wordX,wordY and converts it to points
  function makeWordPoints(txt, xAnchor, yAnchor) {
    let b = grotesk.textBounds(txt, 0, 0, fontSize);
    let x = xAnchor - (b.x + b.w / 2);
    let y = yAnchor - (b.y + b.h / 2);

    return grotesk.textToPoints(txt, x, y, fontSize, {
      sampleFactor: sample,
      simplifyThreshold: 0,
    });
  }

  //DANDELION POINTS
  //makes points dense in the center and spaced out on the rim
  function makeDandelionPoints(n, x0, y0, R) {
    let pts = [];
    let outerPts = [];
    let tries = 0;

    while (pts.length < n && tries < n * 120) {
      tries++;

      let r = R * p.pow(p.random(), 2.4);
      let a = p.random(p.TWO_PI);

      let x = x0 + p.cos(a) * r;
      let y = y0 + p.sin(a) * r;

      if (r > R * 0.72) {
        let ok = true;
        for (let k = 0; k < outerPts.length; k++) {
          if (p.dist(x, y, outerPts[k].x, outerPts[k].y) < 11) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        outerPts.push({ x, y });
      }

      pts.push({ x, y });
    }

    while (pts.length < n) {
      let r = R * p.random();
      let a = p.random(p.TWO_PI);
      pts.push({ x: x0 + p.cos(a) * r, y: y0 + p.sin(a) * r });
    }

    return pts;
  }

  //WORD DONE CHECK
  //counts how many points are close enough to their word target
  function isWordDone() {
    let arrived = 0;
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].distToWord() < doneDist) arrived++;
    }
    return arrived / particles.length >= doneRatio;
  }

  //POINT CLASS
  //each point starts as the dandelion and moves toward the word when touched
  class DriftPoint {
    constructor(fx, fy, tx, ty) {
      this.fx = fx;
      this.fy = fy;

      this.tx = tx;
      this.ty = ty;

      this.x = fx;
      this.y = fy;

      this.vx = 0;
      this.vy = 0;

      this.col = colour[p.int(p.random(colour.length))];

      this.touched = false;
      this.wrappedOnce = false;

      this.offscreenOnce = false;
      this.resetTimer = 0;

      this.seed = p.random(1000);
    }

    updateBuild(inCircle) {
      if (inCircle && p.dist(p.mouseX, p.mouseY, this.x, this.y) < touchR) {
        this.touched = true;
      }

      if (this.touched) {
        let ax = (this.tx - this.x) * driftSpeed;
        let ay = (this.ty - this.y) * driftSpeed;

        this.vx += ax;
        this.vy += ay;

        this.vx = p.constrain(this.vx, -maxStep, maxStep);
        this.vy = p.constrain(this.vy, -maxStep, maxStep);

        this.vx *= damping;
        this.vy *= damping;

        this.x += this.vx;
        this.y += this.vy;
      }
    }

    startDriftOut() {
      this.wrappedOnce = false;
      this.offscreenOnce = false;

      this.resetTimer = 0;

      this.vx = driftRightSpeed + p.random(-0.25, 0.25);
      this.vy = p.random(-0.15, 0.15);
    }

    updateDriftOut() {
      if (!this.offscreenOnce) {
        this.vx = p.lerp(this.vx, driftRightSpeed, 0.02);
        this.vy += p.sin(p.frameCount * 0.03 + this.seed) * (driftWiggle * 0.02);

        this.x += this.vx;
        this.y += this.vy;

        if (this.x > p.width + 10) {
          this.offscreenOnce = true;
          this.resetTimer = p.int(p.random(resetMinDelay, resetMaxDelay));
        }
        return;
      }

      if (!this.wrappedOnce) {
        this.resetTimer--;

        if (this.resetTimer <= 0) {
          this.x = this.fx;
          this.y = this.fy;

          this.vx = 0;
          this.vy = 0;

          this.touched = false;

          this.wrappedOnce = true;
        }
      }
    }

    resetForNext() {
      this.touched = false;
      this.wrappedOnce = false;
      this.offscreenOnce = false;
      this.resetTimer = 0;
    }

    distToWord() {
      return p.dist(this.x, this.y, this.tx, this.ty);
    }

    show() {
      p.fill(this.col);
      p.circle(this.x, this.y, circleSize);
    }
  }
};
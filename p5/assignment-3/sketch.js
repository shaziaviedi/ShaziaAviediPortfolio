// metamorph clock — dashed rings that highlight as butterflies pass
// 6 chrysalises: one new butterfly every 20s

const TOTAL = 120, INTERVAL = 20, PHASE = 10, N = 6;

let startTime;
let cocoons = [];   // x positions; y is computed from the arc + per-cocoon offset
let radii   = [];   // ring radii, outer → inner
let rings   = [];   // precalculated dashed ring segments for each radius

// orbit layout
const ORBIT_OUTER = 275;    // outer ring radius
const ORBIT_SPACING = 45;   // gap between rings

// angles
const BASE_PHASE = -Math.PI / 2;      // puts 0° at the top (12 o'clock)
const PER_BFLY_PHASE = Math.PI / 3;  // 60° spacing between butterflies

// dashed ring appearance
const DASH_PX = 8;          // dash length in pixels along the circle
const GAP_PX  = 7;          // gap length in pixels
const BASE_DASH_ALPHA = 0;  // faint base ring alpha (0–255). 0 if you only want highlights
const HIGHLIGHT_MAX   = 150; // how dark the highlight gets right under the butterfly
const TRAIL_SECONDS   = 5;   // how long the highlighted trail is (in seconds of the 20s lap)
const FADE_EXP        = 1.6; // >1 makes the highlight fade quicker behind the butterfly

// finale timing (lets #6 finish a lap, then disperse)
const FINAL_ORBIT_BUFFER = 20;                 // buffer after 120s so last one completes
const DISPERSAL_SECONDS  = 12;                 // drift + fade duration
const ORBIT_END          = N * INTERVAL + FINAL_ORBIT_BUFFER; // 140
const DURATION           = ORBIT_END + DISPERSAL_SECONDS;     // 152

// arc controls for cocoons (left and right are set from canvas in setup)
// lowest point is at the middle of the canvas
let ARC_LEFT = 0;
let ARC_RIGHT = 600;
const ARC_BASE_Y = 265;     // move the whole arc up/down
const ARC_AMPLITUDE = 60;   // how much the middle sags (bigger = more curve)

// placement & scaling (images)
const COCOON_LEFT  = 70;    // left-most x where cocoons can appear
const COCOON_RIGHT = 530;   // right-most x where cocoons can appear

const BRANCH_X = 0;         // top-left for the branch image
const BRANCH_Y = -10;

const SCALE_BRANCH    = 0.293; // all scales are uniform (keeps aspect ratio)
const SCALE_COCOON    = 0.15;
const SCALE_BUTTERFLY = 0.08;

// size gradient for butterflies: inner rings are smaller
const BFLY_SIZE_MIN = 0.4;  // smallest factor (multiplies SCALE_BUTTERFLY)
const BFLY_SIZE_MAX = 1.0;  // largest factor (outer ring)
const BFLY_SIZE_EXP = 1.0;  // >1 makes inner rings shrink faster

// per-cocoon little y nudges so they sit nicer on the branch
const COCOON_Y_OFFSETS = [27, 25, 13, 8, 12, 5];

// per-butterfly dispersal state used only in the finale
let disperse = Array.from({ length: N }, () => ({
  active: false, x: 0, y: 0, vx: 0, vy: 0, alpha: 255, startT: 0, spin: 0, size: 1
}));

// image assets
let imgBranch;
let imgCrysalisDefault, imgCrysalisCracked, imgCrysalisOpen;
let imgButterfly;

function preload() {
  // paths are **relative to project-3.html**
  imgBranch          = loadImage('../p5/assignment-3/assets/03_branch.png');
  imgCrysalisDefault = loadImage('../p5/assignment-3/assets/03_cocoon.png');
  imgCrysalisCracked = loadImage('../p5/assignment-3/assets/03_cracked.png');
  imgCrysalisOpen    = loadImage('../p5/assignment-3/assets/03_shell.png');
  imgButterfly       = loadImage('../p5/assignment-3/assets/03_butterfly.png');
}

function setup() {
  const canvas = createCanvas(600, 600);
  // mount into the project page container
  canvas.parent('sketch-container');
  pixelDensity(1);

  imageMode(CENTER);
  startTime = millis();

  // set arc domain from canvas size
  ARC_LEFT = 0;
  ARC_RIGHT = width;

  // even x spacing for cocoons
  cocoons = Array.from({ length: N }, (_, i) =>
    map(i, 0, N - 1, COCOON_LEFT, COCOON_RIGHT)
  );

  // radii for 6 rings (outer → inner)
  for (let i = 0; i < N; i++) radii[i] = ORBIT_OUTER - i * ORBIT_SPACING;

  // precompute dashed ring segments for each radius (centered at 300,300)
  const cx = 300, cy = 300;
  rings = radii.map(r => makeDashedRing(cx, cy, r, DASH_PX, GAP_PX));
}

function draw() {
  background(247, 228, 170);

  // draw the branch image (scaled, positioned)
  drawBranch();

  // keep time clamped so last phase can finish, then restart when done
  const elapsed = (millis() - startTime) / 1000;
  const t = Math.min(elapsed, DURATION);

  // draw all cocoons (their y follows the arc + per-cocoon offset)
  for (let i = 0; i < N; i++) {
    const st = chrysalisState(i, Math.min(t, TOTAL));
    const x = cocoons[i];
    const y = arcY(x) + (COCOON_Y_OFFSETS[i] || 0);
    drawCocoon(x, y, st);
  }

  // butterflies orbit first, then disperse
  const cx = 300, cy = 300;
  for (let i = 0; i < N; i++) {
    const rls = releaseTime(i); // 20, 40, ... 120

    if (t < ORBIT_END) {
      // still orbiting
      if (t >= rls) {
        const age   = t - rls;
        const angle = BASE_PHASE + i * PER_BFLY_PHASE
                    + TWO_PI * ((age % INTERVAL) / INTERVAL); // one lap per 20s
        const rad   = radii[i];
        const x = cx + rad * cos(angle);
        const y = cy + rad * sin(angle);

        // dashed ring base + the highlighted tail behind the butterfly
        drawDashedRing(rings[i], BASE_DASH_ALPHA);
        const trailArc = TWO_PI * (TRAIL_SECONDS / INTERVAL);
        drawHighlightOnRing(rings[i], angle, trailArc);

        // draw the butterfly with a size factor based on ring radius
        const s = sizeFactorForRadius(rad);
        drawButterflyImg(x, y, angle, s);
      } else {
        // before release: show only the faint ring
        drawDashedRing(rings[i], BASE_DASH_ALPHA);
      }

    } else {
      // dispersal (break off the ring and drift/fade)
      if (!disperse[i].active) {
        // figure out the break position on the ring
        const ageBreak = Math.max(0, ORBIT_END - rls);
        const rad      = radii[i];
        const angleBreak = BASE_PHASE + i * PER_BFLY_PHASE
                         + TWO_PI * ((ageBreak % INTERVAL) / INTERVAL);
        const bx = cx + rad * cos(angleBreak);
        const by = cy + rad * sin(angleBreak);

        // outward-ish velocity with a bit of randomness
        const launchSpeed = 2.2;
        const jitter = 0.9;
        const vx = launchSpeed * cos(angleBreak) + (Math.random() - 0.5) * jitter;
        const vy = launchSpeed * sin(angleBreak) + (Math.random() - 0.5) * jitter;

        // remember size so it matches its ring during the finale
        disperse[i] = {
          active: true, x: bx, y: by, vx, vy,
          alpha: 255, startT: t, spin: (Math.random()*0.06 - 0.03),
          size: sizeFactorForRadius(rad)
        };
      }

      // update drift + fade
      const d = disperse[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.993;
      d.vy *= 0.993; // tiny friction so they slow down a little
      const frac = Math.min(1, (t - d.startT) / DISPERSAL_SECONDS);
      d.alpha = 255 * (1 - frac);

      // draw drifting butterfly with alpha and a small spin
      drawButterflyImgAlpha(d.x, d.y, (t - d.startT) * d.spin * 120, d.alpha, d.size);
    }
  }

  // simple mm:ss clock in the bottom-right
  drawClock(Math.min(t, TOTAL));

  // restart the whole thing after the finale finishes
  if (t >= DURATION) resetAnimation();
}

/* arc helper
   lowest point at the middle, ends level.
   formula: y = base + amp * (1 - cos(2πu)) / 2, where u goes 0→1 across the canvas.
*/
function arcY(x){
  const u = constrain((x - ARC_LEFT) / (ARC_RIGHT - ARC_LEFT), 0, 1);
  return ARC_BASE_Y + ARC_AMPLITUDE * (1 - Math.cos(TWO_PI * u)) * 0.5;
}

/* size helper (radius → scale factor)
   maps radius to [0..1] relative to the outer ring, eases it, then blends
   between min and max size. inner rings end up smaller.
*/
function sizeFactorForRadius(r){
  const t = constrain(r / ORBIT_OUTER, 0, 1);
  const eased = pow(t, BFLY_SIZE_EXP);
  return lerp(BFLY_SIZE_MIN, BFLY_SIZE_MAX, eased);
}

/* timing helpers */
function releaseTime(i){ return (i + 1) * INTERVAL; }

function chrysalisState(i, t) {
  const r = releaseTime(i);
  const tt = (t === 0) ? TOTAL : t; // keeps the last one cracked for the final 10s
  if (tt < r - PHASE) return "default";
  if (tt < r)         return "cracked";
  return "open";
}

/* visuals — images + simple geometry */

// branch: draw scaled, positioned from top-left
function drawBranch(){
  if (imgBranch) {
    push();
    imageMode(CORNER);
    image(
      imgBranch,
      BRANCH_X,
      BRANCH_Y,
      imgBranch.width  * SCALE_BRANCH,
      imgBranch.height * SCALE_BRANCH
    );
    pop();
  } else {
    // fallback block if the image fails
    noStroke();
    fill(120, 80, 50);
    rect(BRANCH_X, BRANCH_Y, 600, 50, 9);
  }
}

// chrysalis: pick image by state, draw centered and scaled
function drawCocoon(x, y, state){
  let img = imgCrysalisDefault;
  if (state === "cracked") img = imgCrysalisCracked;
  if (state === "open")    img = imgCrysalisOpen;

  if (img) {
    image(img, x, y, img.width * SCALE_COCOON, img.height * SCALE_COCOON);
  } else {
    // fallback ellipse if the image fails
    noStroke();
    if (state === "default")      fill(180, 200, 210);
    else if (state === "cracked") fill(250, 205, 120);
    else                          fill(200, 255, 200);
    ellipse(x, y, 46, 76);
  }
}

// butterfly on the orbit: rotate to face the path, size by ring
function drawButterflyImg(x, y, angle, factor = 1){
  push();
  translate(x, y);
  rotate(angle + radians(150)); // tweak this if your sprite points a different way
  if (imgButterfly) {
    const s = SCALE_BUTTERFLY * factor;
    image(imgButterfly, 0, 0, imgButterfly.width * s, imgButterfly.height * s);
  } else {
    noStroke();
    fill(100, 80, 220);
    triangle(0, -10, -8, 8, 8, 8);
  }
  pop();
}

// butterfly during dispersal: same as above but with alpha and a little spin
function drawButterflyImgAlpha(x, y, angle, alpha, factor = 1){
  push();
  translate(x, y);
  rotate(angle + radians(150));
  if (imgButterfly) {
    const s = SCALE_BUTTERFLY * factor;
    tint(255, alpha);
    image(imgButterfly, 0, 0, imgButterfly.width * s, imgButterfly.height * s);
    noTint();
  } else {
    noStroke();
    fill(100, 80, 220, alpha);
    triangle(0, -10, -8, 8, 8, 8);
  }
  pop();
}

// tiny bottom-right clock (mm:ss)
function drawClock(t){
  const mm = floor(t / 60);
  const ss = floor(t % 60);
  const label = nf(mm, 2) + ":" + nf(ss, 2);
  push();
  fill(30);
  noStroke();
  textAlign(RIGHT, BOTTOM);
  textSize(20);
  // little margin from the edges so it isn't glued to the corner
  const x = width - 22;
  const y = height - 22;
  text(label, x, y);
  pop();
}

/* dashed ring builders + renderers */

// builds a ring as a bunch of dash segments (angle ranges)
// each segment is drawn as a polyline arc so dash ends look crisp
function makeDashedRing(cx, cy, radius, dashPx, gapPx){
  if (radius <= 0) return [];
  const dashAng = dashPx / radius;
  const gapAng  = gapPx  / radius;
  let a = 0;
  const segs = [];
  while (a < TWO_PI) {
    const a0 = a;
    const a1 = min(a + dashAng, TWO_PI);
    const amid = (a0 + a1) * 0.5;
    segs.push({ a0, a1, amid, cx, cy, r: radius });
    a = a1 + gapAng;
  }
  return segs;
}

// draws the faint base ring
function drawDashedRing(segments, baseAlpha){
  stroke(66, 55, 56, baseAlpha);
  strokeWeight(2);
  noFill();
  for (const s of segments) {
    drawArcSegmentPolyline(s.cx, s.cy, s.r, s.a0, s.a1);
  }
}

// overlays a darker highlight behind the butterfly head
function drawHighlightOnRing(segments, headAngle, trailArc){
  for (const s of segments) {
    // angular distance behind the head (wrap-safe)
    let diff = (headAngle - s.amid) % TWO_PI;
    if (diff < 0) diff += TWO_PI;

    if (diff <= trailArc) {
      // 0 at head (darkest), → 1 at trail end (faint)
      const frac = diff / trailArc;
      const alpha = HIGHLIGHT_MAX * pow(1 - frac, FADE_EXP);
      stroke(60, alpha);
      strokeWeight(2);
      noFill();
      drawArcSegmentPolyline(s.cx, s.cy, s.r, s.a0, s.a1);
    }
  }
}

// draws a small arc segment as a smooth polyline
function drawArcSegmentPolyline(cx, cy, r, a0, a1){
  const steps = max(3, int((a1 - a0) / 0.05)); // smaller number = chunkier, bigger = smoother
  beginShape();
  for (let i = 0; i <= steps; i++) {
    const a = lerp(a0, a1, i / steps);
    vertex(cx + r * cos(a), cy + r * sin(a));
  }
  endShape();
}

// reset everything to start a fresh cycle
function resetAnimation() {
  startTime = millis();
  disperse = Array.from({ length: N }, () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0, alpha: 255, startT: 0, spin: 0, size: 1
  }));
}

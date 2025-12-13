// cc lecture / lab | assignment 2 – face generator (cat)
// behavior: a new random cat on each mouse click; eyes track the cursor

let P = {}; // all parameters for this cat live here
const r = (a, b) => (a < b ? random(a, b) : random(b, a)); // min–max agnostic random

// --- color palettes ---
const IRIS_COLORS = [
  "#cc7025","#adaa51","#d3b32a","#cfb1e5","#adeaea","#cfb1e5"
];

const FUR_COLORS = [
  "#1d1b1e","#857983","#ebedec","#eed9c4","#bc8c76",
  "#9c5225","#4e433e","#b07039","#c9b0ac","#787580"
];

const NOSE_COLORS = ["#f1b3b3","#785b4d","#888189","#b6957e","#272727"];

// --- tiny helpers for randomness and selection ---
function pick(arr){ return arr[floor(random(arr.length))]; }
function pickDistinct(arr, avoid, tries=6){
  let c = pick(arr);
  for (let i=0; i<tries && c===avoid; i++) c = pick(arr);
  return c;
}

function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent('sketch-container'); // attach canvas into the div on the project page
  stroke(0);
  noFill();
  generateCat();
}



function draw() {
  background(BG_COLOR);
  drawOuterFrame();    // thick border

  // === cat head (base fill) ===
  // draw head outline first so edges are visible,
  // then clip ears/patterns to this shape, and finally re-stroke the head on top
  push();
  noStroke();
  fill(P.col.base);
  beginShape();
  vertex(P.head.v.x, P.head.v.y);
  for (let i = 0; i < P.head.seg.length; i++) {
    const s = P.head.seg[i];
    if (i === P.head.seg.length - 1) {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, P.head.v.x, P.head.v.y);
    } else {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    }
  }
  endShape();
  pop();

  // === clip ears and fur patterns to the head ===
  clipToPath(P.head, true, () => {
    // -- ears (left, right) --
    push();
    fill('#d99e96');
    beginShape();
    vertex(P.earL.v.x, P.earL.v.y);
    for (let s of P.earL.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    endShape();

    beginShape();
    vertex(P.earR.v.x, P.earR.v.y);
    for (let s of P.earR.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    endShape();
    pop();
    
    // -- fur patterns (center and surrounding patches) --
    push();
    fill(P.col.pattern);
    stroke(0);
    drawClosedBezier(P.furMid);

    drawClosedBezier(P.furTopR);
    drawClosedBezier(P.furTopL);

    drawClosedBezier(P.furOuterR);
    drawClosedBezier(P.furOuterL);

    drawClosedBezier(P.furBotR);
    drawClosedBezier(P.furBotL);
    pop();
  });

  // === eyes (whites, iris, pupils), clipped to head and eye shape ===
  clipToPath(P.head, true, () => {
    // -- eye whites first (each clipped to its eye) --
    clipToPath(P.eyeR, true, () => fillPath(P.eyeR, '#f2f2f2'));
    clipToPath(P.eyeL, true, () => fillPath(P.eyeL, '#f2f2f2'));

    // -- iris and pupil (still clipped to each eye) --
    const driftX = map(mouseX, 0, width, -4.5, 4.5);
    const driftY = map(mouseY, 0, height, -4.0, 4.0);
    
    // right eye contents
    clipToPath(P.eyeR, true, () => {
      // iris fill
      noStroke();
      fill(P.col.iris);
      ellipse(P.irisR.cx + driftX, P.irisR.cy + driftY, P.irisR.d, P.irisR.d);

      // iris outline 
      noFill();
      stroke(0);
      strokeWeight(1.25); // rim thickness
      ellipse(P.irisR.cx + driftX, P.irisR.cy + driftY, P.irisR.d, P.irisR.d);

      // pupil on top
      noStroke();
      fill(0);
      ellipse(P.pupilR.cx + driftX, P.pupilR.cy + driftY, P.pupilR.d, P.pupilR.d);
    });

    // left eye contents
    clipToPath(P.eyeL, true, () => {
      noStroke();
      fill(P.col.iris);
      ellipse(P.irisL.cx + driftX, P.irisL.cy + driftY, P.irisL.d, P.irisL.d);

      noFill();
      stroke(0);
      strokeWeight(1.25);
      ellipse(P.irisL.cx + driftX, P.irisL.cy + driftY, P.irisL.d, P.irisL.d);

      noStroke();
      fill(0);
      ellipse(P.pupilL.cx + driftX, P.pupilL.cy + driftY, P.pupilL.d, P.pupilL.d);
    });

    // -- chin / jaw curve --
    noFill(); 
    stroke(0);
    beginShape();
    vertex(P.chin.v.x, P.chin.v.y);
    for (let s of P.chin.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    endShape();
  });

  // === eye outlines on top ===
  push();                    
  stroke(0);
  strokeWeight(2.5);        
  strokeJoin(ROUND);
  strokeCap(ROUND);
  noFill();

  beginShape();
  vertex(P.eyeR.v.x, P.eyeR.v.y);
  for (let s of P.eyeR.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
  endShape();

  beginShape();
  vertex(P.eyeL.v.x, P.eyeL.v.y);
  for (let s of P.eyeL.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
  endShape();
  pop();                     
  
  // === nose and mouth ===
  // nose (closed)
  push();
  fill(P.col.nose);
  stroke(0);
  beginShape();
  vertex(P.nose.v.x, P.nose.v.y);
  for (let i = 0; i < P.nose.seg.length; i++) {
    const s = P.nose.seg[i];
    if (i === P.nose.seg.length - 1) {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, P.nose.v.x, P.nose.v.y);
    } else {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    }
  }
  endShape();
  pop();

  // mouth (open stroke)
  noFill();
  beginShape();
  vertex(P.mouth.v.x, P.mouth.v.y);
  for (let s of P.mouth.seg) bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
  endShape();

  // === redraw head outline on top of clipped items ===
  noFill();
  stroke(0);            
  strokeWeight(2.5);
  beginShape();
  vertex(P.head.v.x, P.head.v.y);
  for (let i = 0; i < P.head.seg.length; i++) {
    const s = P.head.seg[i];
    if (i === P.head.seg.length - 1) {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, P.head.v.x, P.head.v.y);
    } else {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    }
  }
  endShape();
  
  // === whiskers (white) ===
  push();
  stroke(255);
  for (let s of P.wR) bezier(s.x1, s.y1, s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2);
  for (let s of P.wL) bezier(s.x1, s.y1, s.cx1, s.cy1, s.cx2, s.cy2, s.x2, s.y2);
  pop();
}

function mousePressed() { generateCat(); }

// ======== helpers ========

// --- background color ---
const BG_COLOR = '#ffb5c1'; 

// --- thick outer frame/border ---
function drawOuterFrame() {
  push();
  noFill();
  stroke(255);
  strokeWeight(25);
  rect(10, 10, width - 20, height - 20);
  pop();
}

// --- draw smooth closed bezier shape from a path object ---
function drawClosedBezier(path) {
  beginShape();
  vertex(path.v.x, path.v.y);
  for (let i = 0; i < path.seg.length; i++) {
    const s = path.seg[i];
    if (i === path.seg.length - 1) {
      // close smoothly back to the start vertex
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, path.v.x, path.v.y);
    } else {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    }
  }
  endShape();
}

// --- generic clipping to any segment ---
// set closeToStart=true for filled regions for clipping
function clipToPath(path, closeToStart, drawInside) {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(path.v.x, path.v.y);
  for (let s of path.seg) ctx.bezierCurveTo(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
  if (closeToStart) ctx.closePath();
  ctx.clip();
  
  push();
  drawInside();
  pop();
  
  ctx.restore();
}

// --- build one bezier segment by sampling between its min/max bounds ---
function makeSeg(minArr, maxArr) {
  // array order: [cx1, cy1, cx2, cy2, x, y]
  return {
    cx1: r(minArr[0], maxArr[0]),
    cy1: r(minArr[1], maxArr[1]),
    cx2: r(minArr[2], maxArr[2]),
    cy2: r(minArr[3], maxArr[3]),
    x:   r(minArr[4], maxArr[4]),
    y:   r(minArr[5], maxArr[5]),
  };
}

// --- build a full path object: start vertex + an array of segments ---
function makePath(minStart, maxStart, minSegs, maxSegs) {
  const segs = [];
  for (let i = 0; i < minSegs.length; i++) segs.push(makeSeg(minSegs[i], maxSegs[i]));
  return { v: { x: r(minStart[0], maxStart[0]), y: r(minStart[1], maxStart[1]) }, seg: segs };
}

// --- cheek helpers ---
// get the approximate x center of the head (midpoint of min/max endpoint x values)
function computeHeadCenterX(path) {
  let minX = path.v.x, maxX = path.v.x;
  for (let s of path.seg) {
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
  }
  return (minX + maxX) * 0.5;
}

// start point for segment i (previous end, or the path start for i=0)
function segStart(path, i) {
  return (i === 0) ? { x: path.v.x, y: path.v.y } : { x: path.seg[i-1].x, y: path.seg[i-1].y };
}

// nudge the cheek bezier handles so the cheeks bulge outward
// side can be 'right' or 'left'
function enforceOutwardCheek(path, i, side, centerX, pad=10) {
  const s = path.seg[i];
  const st = segStart(path, i);
  const en = { x: s.x, y: s.y };
  if (side === 'right') {
    const baseX = Math.max(st.x, en.x, centerX + pad);
    s.cx1 = Math.max(s.cx1, baseX);
    s.cx2 = Math.max(s.cx2, baseX);
  } else { // 'left'
    const baseX = Math.min(st.x, en.x, centerX - pad);
    s.cx1 = Math.min(s.cx1, baseX);
    s.cx2 = Math.min(s.cx2, baseX);
  }
}

// --- fill a bezier path with a color ---
function fillPath(path, col) {
  noStroke();
  fill(col);
  beginShape();
  vertex(path.v.x, path.v.y);
  for (let i = 0; i < path.seg.length; i++) {
    const s = path.seg[i];
    if (i === path.seg.length - 1) {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, path.v.x, path.v.y);
    } else {
      bezierVertex(s.cx1, s.cy1, s.cx2, s.cy2, s.x, s.y);
    }
  }
  endShape();
}

// --- tidy up the left-side whiskers ---
function tidyLeftWhisker(s, centerX, anchorX) {
  //style parameters
  const margin      = 10;   // stay left of the head center by at least this much
  const alignOffset = 17;   // how far left of the nose the roots should sit
  const jitter      = 1.5;  // tiny randomness so the three roots aren’t identical
  const minSpan     = 22;   // minimum horizontal reach (whisker length)
  const bow         = 10;   // push handles outward
  const maxDyTip    = 18;   // limit vertical wiggle at the tip handle
  const rootDyBand  = 6;    // keep root handle roughly horizontal

  // 1) align the start x to a near-vertical line just left of the nose,
  //    but never to the right of the head’s center margin
  const targetX1 = Math.min(anchorX - alignOffset, centerX - margin);
  s.x1 = targetX1 + random(-jitter, jitter);

  // 2) force the end farther left than the start and left of head center
  s.x2 = Math.min(s.x2, s.x1 - minSpan, centerX - margin - 4);

  // 3) push both handles outward (more left) and keep the root handle
  //    nearly horizontal for a tidy launch
  const edgeX = Math.min(s.x1, s.x2) - bow;
  s.cx1 = Math.min(s.cx1, s.x1 - bow);     // root handle left of start
  s.cx2 = Math.min(s.cx2, edgeX);          // tip handle even further left

  // keep the root handle roughly horizontal (prevents messy spikes)
  s.cy1 = constrain(s.cy1, s.y1 - rootDyBand, s.y1 + rootDyBand);

  // 4) limit the tip handle’s vertical range so curves don’t go wild
  s.cy2 = constrain(s.cy2, s.y2 - maxDyTip, s.y2 + maxDyTip);

  // 5) gentle smoothing toward the line between endpoints
  const yAvg = (s.y1 + s.y2) * 0.5;
  s.cy1 = (s.cy1 * 0.8) + (yAvg * 0.2);
  s.cy2 = (s.cy2 * 0.85) + (yAvg * 0.15);

  return s;
}

// ======== cat generator ========
function generateCat() {
  // --- parameter bounds (min and max shapes) ---

  const MIN = {
    head: {
      v: [173.84, 108.89],
      seg: [
        [193.44,104.56, 211.42,104.72, 227.89,108.89],
        [247.38,84.86, 280.4,38.33, 302.92,38.33],
        [316.24,51.62, 313.3,97.93, 299.91,119.38],
        [304.27,131.92, 297.22,146.65, 287.91,158.41],
        [285.3,196.5, 283.4,219.94, 259.39,245.46],
        [274.4,263.47, 285.42,293.35, 296.91,326.51],
        [242.88,356.53, 166.33,359.53, 128.81,332.51],
        [131.82,299.49, 139.32,279.98, 152.82,254.46],
        [128.05,229.5, 112.3,189.92, 115.3,167.41],
        [104.8,147.9, 95.79,135.89, 98.79,116.38],
        [82.28,86.36, 86.78,39.83, 98.79,38.33],
        [112.1,36.39, 145.32,72.85, 173.84,108.89],
      ]
    },
    chin: {
      v: [157.33, 257.47],
      seg: [
        [175.44,274.43, 191.53,282.14, 202.35,281.48],
        [215.61,282.19, 233.34,269.83, 253.39,252.96],
      ]
    },
    earL: { v: [123.35,150.9], seg: [
      [137.75,143.48, 149.39,132.28, 157.33,116.0],
      [159.45,95.75, 140.27,71.36, 99.78,42.84],
    ]},
    earR: { v: [280.4,150.9], seg: [
      [264.64,142.38, 249.98,132.6, 241.38,117.88],
      [244.84,82.05, 274.14,63.63, 299.91,42.84],
    ]},
    // fur patterns
    furMid: { v: [202.35,164.41], seg: [
      [200.65,145.87, 198.87,128.17, 196.35,117.88],
      [196.1,113.86, 198.19,109.8, 202.35,105.7],
      [206.19,109.46, 208.66,113.44, 208.36,117.88],
      [205.34,128.58, 203.1,147.11, 202.35,164.41],
    ]},
    furTopR: { v: [221.87,134.39], seg: [
      [215.8,124.85, 215.11,115.78, 219.8,107.18],
      [223.98,111.44, 226.6,115.94, 226.86,120.79],
      [223.23,124.14, 222.0,128.94, 221.87,134.39],
    ]},
    furTopL: { v: [180.34,134.39], seg: [
      [186.83,128.8, 190.06,120.09, 188.19,106.48],
      [183.79,109.39, 180.21,112.96, 178.34,117.88],
      [180.26,122.57, 180.65,128.26, 180.34,134.39],
    ]},
    furOuterR: { v: [226.86,161.41], seg: [
      [223.02,159.54, 222.22,152.28, 223.37,141.54],
      [228.87,141.52, 232.37,144.14, 233.87,149.4],
      [234.49,155.27, 231.82,159.06, 226.86,161.41],
    ]},
    furOuterL: { v: [175.34,161.41], seg: [
      [178.64,157.91, 179.33,150.87, 178.34,141.54],
      [172.82,142.3, 169.17,145.37, 167.5,150.9],
      [168.33,156.95, 171.21,160.07, 175.34,161.41],
    ]},
    furBotR: { v: [208.34,162.91], seg: [
      [206.49,152.39, 208.81,138.32, 212.86,129.89],
      [216.17,133.86, 218.12,138.29, 215.75,144.15],
      [213.0,147.84, 209.78,157.42, 208.34,162.91],
    ]},
    furBotL: { v: [196.35,161.41], seg: [
      [196.44,149.56, 195.55,138.75, 192.84,129.89],
      [188.71,133.89, 186.67,138.17, 188.19,142.93],
      [192.12,147.76, 194.37,154.43, 196.35,161.41],
    ]},
    eyeR: { v: [223.37,198.93], seg: [
      [228.42,183.99, 244.17,175.6, 266.89,171.91],
      [263.54,183.32, 259.3,193.81, 249.97,198.93],
      [239.99,200.03, 230.84,200.31, 223.37,198.93],
    ]},
    eyeL: { v: [176.59,198.93], seg: [
      [167.3,185.39, 155.85,174.01, 135.03,171.91],
      [135.23,181.56, 138.3,190.33, 146.82,197.43],
      [155.99,200.03, 165.89,200.57, 176.59,198.93],
    ]},
    irisR: { cx: 244, cy: 182, dOuter: 35, dInner: 19 },
    irisL: { cx: 156, cy: 182, dOuter: 35, dInner: 19 },
    nose: { v: [201.71,252.05], seg: [
      [196.47,249.56, 193.06,246.17, 193.35,240.96],
      [190.96,238.03, 188.56,235.29, 184.34,233.45],
      [196.35,230.45, 206.86,230.45, 219.07,233.45],
      [210.48,236.72, 209.03,238.89, 208.36,240.96],
      [209.1,245.06, 206.06,248.65, 201.71,252.05],
    ]},
    mouth: { v: [170.84,263.47], seg: [
      [187.36,264.79, 199.43,262.45, 201.71,252.05],
      [200.65,261.67, 214.86,265.17, 233.87,263.47],
    ]},
    wR: [
      [223.37,234.61, 241.06,229.61, 260.21,230.51, 280.16,234.61],
      [220.06,241.62, 236.01,237.0, 252.96,238.67, 270.65,244.94],
      [219.07,249.44, 235.17,246.67, 250.35,250.68, 265.07,257.97],
    ],
    wL: [
      [127.41,235.41, 142.85,231.88, 159.34,232.25, 176.59,235.41],
      [135.03,246.53, 150.02,241.51, 165.32,239.99, 180.88,241.62],
      [142.32,255.97, 157.78,250.3, 171.09,248.44, 184.34,249.44],
    ],
  };

  const MAX = {
    head: { v: [153.97, 59.77], seg: [
      [173.6,55.45, 232.12,55.61, 248.62,59.77],
      [279.97,44.63, 312.26,48.85, 328.25,50.76],
      [335.0,54.0, 333.0,82.0, 329.76,100.34],
      [330.52,103.21, 332.2,119.0, 328.25,125.88],
      [350.18,154.77, 355.3,241.57, 314.73,276.12],
      [329.76,294.15, 331.21,309.71, 341.78,343.73],
      [287.69,373.78, 93.87,369.27, 56.31,342.23],
      [59.32,309.17, 68.33,297.16, 81.85,271.61],
      [43.46,239.16, 53.24,146.31, 74.34,128.88],
      [69.53,124.99, 69.24,107.21, 71.34,101.84],
      [70.78,84.4, 76.56,53.4, 83.36,49.25],
      [93.54,47.56, 121.25,40.29, 153.97,59.77],
    ]},
    chin: { v: [116.41,289.64], seg: [
      [134.54,306.62, 191.22,306.83, 202.05,306.17],
      [215.32,306.88, 269.13,303.52, 289.19,286.64],
    ]},
    earL: { v: [83.36,118.37], seg: [
      [97.78,110.94, 132.51,95.6, 140.45,79.3],
      [129.77,62.86, 103.12,53.06, 90.87,52.26],
    ]},
    earR: { v: [313.23,118.37], seg: [
      [297.45,109.83, 275.26,95.54, 266.65,80.8],
      [265.9,71.18, 298.06,52.89, 317.74,53.76],
    ]},
    // fur patterns
    furMid: { v: [202.05,124.38], seg: [
      [201.27,105.82, 200.18,79.09, 196.04,68.79],
      [195.79,64.76, 197.88,60.69, 202.05,56.59],
      [205.89,60.36, 208.36,64.34, 208.06,68.79],
      [203.68,79.51, 202.05,107.06, 202.05,124.38],
    ]},
    furTopR: { v: [220.08,109.35], seg: [
      [214.0,99.8, 228.34,66.68, 233.03,58.07],
      [237.22,62.34, 239.84,66.85, 240.1,71.69],
      [235.93,72.8, 219.7,101.73, 220.08,109.35],
    ]},
    furTopL: { v: [185.52,109.35], seg: [
      [192.01,103.76, 171.71,72.5, 169.84,58.87],
      [165.44,61.79, 161.85,65.36, 159.98,70.29],
      [161.19,74.2, 185.15,102.48, 185.52,109.35],
    ]},
    furOuterR: { v: [229.09,137.9], seg: [
      [225.25,136.03, 226.44,110.73, 227.59,99.98],
      [233.1,99.96, 236.61,102.58, 238.12,107.85],
      [233.06,112.61, 229.41,134.63, 229.09,137.9],
    ]},
    furOuterL: { v: [172.0,137.9], seg: [
      [175.31,134.4, 172.99,109.31, 172.0,99.98],
      [166.48,100.74, 162.82,103.81, 161.15,109.35],
      [166.03,113.84, 170.41,135.58, 172.0,137.9],
    ]},
    furBotR: { v: [211.06,124.38], seg: [
      [209.19,113.85, 208.51,89.24, 212.57,80.8],
      [215.88,84.78, 217.83,89.21, 215.46,95.08],
      [212.71,98.77, 212.49,118.88, 211.06,124.38],
    ]},
    furBotL: { v: [194.54,124.38], seg: [
      [194.62,112.51, 195.24,89.67, 192.52,80.8],
      [188.39,84.81, 186.34,89.1, 187.87,93.86],
      [191.8,98.69, 192.56,117.39, 194.54,124.38],
    ]},
    eyeR: { v: [230.6,196.49], seg: [
      [229.17,151.3, 269.99,130.84, 301.21,164.94],
      [304.4,178.46, 295.35,199.72, 278.67,202.5],
      [268.68,203.6, 238.07,197.87, 230.6,196.49],
    ]},
    eyeL: { v: [170.24,197.99], seg: [
      [169.76,156.55, 128.56,132.6, 96.88,166.44],
      [95.0,182.52, 108.53,204.17, 119.42,204.0],
      [128.59,206.61, 159.54,199.63, 170.24,197.99],
    ]},
    irisR: { cx: 265.15, cy: 175.46, dOuter: 52.59, dInner: 40.58 },
    irisL: { cx: 132.94, cy: 176.96, dOuter: 52.59, dInner: 40.58 },
    nose: { v: [199.04,237.06], seg: [
      [193.8,234.56, 188.23,227.25, 188.53,222.03],
      [183.17,221.74, 179.09,218.8, 178.01,214.52],
      [190.38,204.04, 209.64,205.44, 221.58,214.52],
      [217.71,221.13, 212.36,221.47, 209.56,222.03],
      [210.3,226.15, 203.4,233.65, 199.04,237.06],
    ]},
    mouth: { v: [140.45,277.62], seg: [
      [158.85,283.92, 199.9,255.85, 199.04,237.06],
      [197.04,254.48, 242.54,284.03, 262.15,277.62],
    ]},
    wR: [
      [223.08,229.21, 244.99,216.68, 328.52,240.07, 344.78,250.58],
      [219.77,236.22, 245.74,228.34, 307.23,250.58, 328.25,270.11],
      [218.78,244.05, 250.27,236.3, 313.92,297.43, 316.23,309.17],
    ],
    wL: [
      [176.25,230.0, 153.92,221.64, 66.29,242.12, 56.31,253.58],
      [180.55,236.22, 161.38,229.76, 81.85,261.1, 71.34,274.62],
      [184.02,244.05, 145.82,239.38, 92.8,298.29, 92.37,306.17],
    ],
  };

  // --- build the params for cat ---

  // head outline
  P.head = makePath(MIN.head.v, MAX.head.v, MIN.head.seg, MAX.head.seg);
  
  // nudge cheek segments so head is round
  // indices: 4 = right cheek, 8 = left cheek
  const headCX = computeHeadCenterX(P.head);
  enforceOutwardCheek(P.head, 4, 'right', headCX, 10);
  enforceOutwardCheek(P.head, 8, 'left',  headCX, 10);

  // chin / lower jaw curve
  P.chin = makePath(MIN.chin.v, MAX.chin.v, MIN.chin.seg, MAX.chin.seg);

  // ears
  P.earL = makePath(MIN.earL.v, MAX.earL.v, MIN.earL.seg, MAX.earL.seg);
  P.earR = makePath(MIN.earR.v, MAX.earR.v, MIN.earR.seg, MAX.earR.seg);

  // fur patterns
  P.furMid    = makePath(MIN.furMid.v,    MAX.furMid.v,    MIN.furMid.seg,    MAX.furMid.seg);
  P.furTopR   = makePath(MIN.furTopR.v,   MAX.furTopR.v,   MIN.furTopR.seg,   MAX.furTopR.seg);
  P.furTopL   = makePath(MIN.furTopL.v,   MAX.furTopL.v,   MIN.furTopL.seg,   MAX.furTopL.seg);
  P.furOuterR = makePath(MIN.furOuterR.v, MAX.furOuterR.v, MIN.furOuterR.seg, MAX.furOuterR.seg);
  P.furOuterL = makePath(MIN.furOuterL.v, MAX.furOuterL.v, MIN.furOuterL.seg, MAX.furOuterL.seg);
  P.furBotR   = makePath(MIN.furBotR.v,   MAX.furBotR.v,   MIN.furBotR.seg,   MAX.furBotR.seg);
  P.furBotL   = makePath(MIN.furBotL.v,   MAX.furBotL.v,   MIN.furBotL.seg,   MAX.furBotL.seg);

  // eyes
  P.eyeR = makePath(MIN.eyeR.v, MAX.eyeR.v, MIN.eyeR.seg, MAX.eyeR.seg);
  P.eyeL = makePath(MIN.eyeL.v, MAX.eyeL.v, MIN.eyeL.seg, MAX.eyeL.seg);

  // iris + pupil
  P.irisR  = { cx: r(MIN.irisR.cx, MAX.irisR.cx), cy: r(MIN.irisR.cy, MAX.irisR.cy), d: r(MIN.irisR.dOuter, MAX.irisR.dOuter) };
  P.irisL  = { cx: r(MIN.irisL.cx, MAX.irisL.cx), cy: r(MIN.irisL.cy, MAX.irisL.cy), d: r(MIN.irisL.dOuter, MAX.irisL.dOuter) };
  P.pupilR = { cx: P.irisR.cx, cy: P.irisR.cy, d: r(MIN.irisR.dInner, MAX.irisR.dInner) };
  P.pupilL = { cx: P.irisL.cx, cy: P.irisL.cy, d: r(MIN.irisL.dInner, MAX.irisL.dInner) };
  
  // make sure pupils are always smaller than their irises
  const ratio = 0.9; // pupils can be at most 90% of iris size
  P.pupilR.d = min(P.pupilR.d, P.irisR.d * ratio);
  P.pupilL.d = min(P.pupilL.d, P.irisL.d * ratio);

  // nose & mouth
  P.nose  = makePath(MIN.nose.v,  MAX.nose.v,  MIN.nose.seg,  MAX.nose.seg);
  P.mouth = makePath(MIN.mouth.v, MAX.mouth.v, MIN.mouth.seg, MAX.mouth.seg);
  
  // force the mouth center to meet the tip of the nose (a neat join)
  P.mouth.seg[0].x = P.nose.v.x;
  P.mouth.seg[0].y = P.nose.v.y;
  
  // --- choose colors of cat ---
  P.col = {};
  P.col.base    = pick(FUR_COLORS);                     // head / body fill
  P.col.pattern = pickDistinct(FUR_COLORS, P.col.base); // markings (ensure some contrast)
  P.col.iris    = pick(IRIS_COLORS);                    // eye color
  P.col.nose    = pick(NOSE_COLORS);                    // nose color

  // whiskers (3 per side)
  P.wR = [];
  P.wL = [];
  for (let i = 0; i < MIN.wR.length; i++) {
    const a = MIN.wR[i], b = MAX.wR[i];
    P.wR.push({ x1:r(a[0],b[0]), y1:r(a[1],b[1]), cx1:r(a[2],b[2]), cy1:r(a[3],b[3]), cx2:r(a[4],b[4]), cy2:r(a[5],b[5]), x2:r(a[6],b[6]), y2:r(a[7],b[7]) });
  }
  for (let i = 0; i < MIN.wL.length; i++) {
    const a = MIN.wL[i], b = MAX.wL[i];
    P.wL.push({ x1:r(a[0],b[0]), y1:r(a[1],b[1]), cx1:r(a[2],b[2]), cy1:r(a[3],b[3]), cx2:r(a[4],b[4]), cy2:r(a[5],b[5]), x2:r(a[6],b[6]), y2:r(a[7],b[7]) });
  }
  
  // tidy left whiskers
  const anchorX = P.nose.v.x;
  for (let i = 0; i < P.wL.length; i++) {
    P.wL[i] = tidyLeftWhisker(P.wL[i], headCX, anchorX);
  }
}


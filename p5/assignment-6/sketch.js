let t = 0;
let activeDay = 0; // 0..6 (Mon..Sun)
let dayLabels = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

// Data in Monday --> Sunday order
let waterData = [3, 5, 4, 5, 7, 6, 5];

// 2D HUD buffer
let hudG;

// Layout constants
const SAFE_FOOTER = 96; // reserved pixels for day selector (bottom band)

// Hover/lock state
let isLocked = false;
let lockedDay = 0;

// Color gradient
/**
 * rowIdx: 0..rows-1 (front/top → back/bottom)
 * depthT: 0..1 across sheet depth (near → far)
 */
function rowColor(rowIdx, rows, depthT = 0) {
  const fr = rows <= 1 ? 0 : rowIdx / (rows - 1);
  const H = 185 + 10 * fr;                                 // deep teal → cyan
  const S = constrain(78 + 16 * fr + 6 * depthT, 0, 100);  // saturation rises by row/depth
  const Brow = 34 + 46 * fr;                               
  const B = constrain(Brow + 4 * depthT, 0, 100);          // brightness rises by row/depth
  const A = 170 - 25 * depthT;                             // slight depth fade
  return color(H, S, B, A); // HSB (set in setup)
}

function setup() {
  // Parent the WEBGL canvas into the project sketch frame
  const cnv = createCanvas(600, 600, WEBGL);
  cnv.parent('sketch-container');
  pixelDensity(1);

  noStroke();
  colorMode(HSB, 360, 100, 100, 255);

  // 2D HUD
  hudG = createGraphics(600, 600);
  hudG.pixelDensity(1);
  hudG.textFont('monospace');
  hudG.textSize(12);
  hudG.textAlign(LEFT, TOP);
}

function draw() {
  background(0);

  // Update activeDay based on hover if not locked
  const hoverIdx = hoveredDayIndex();
  if (!isLocked && hoverIdx !== -1) {
    activeDay = hoverIdx;
  }
  // If locked, activeDay stays lockedDay
  if (isLocked) {
    activeDay = lockedDay;
  }

  // --- 3D scene (with orbit) ---
  push();
  orbitControl(2, 1, 0.1);

  // Subtle cool lighting
  ambientLight(40);
  directionalLight(180, 220, 255, 0.3, -0.4, -1);
  directionalLight(60, 80, 150, -0.6, 0.4, 0.2);

  // View base framing
  rotateX(-PI / 5.4);

  // Auto-fit: more rows -> lift scene slightly to protect footer
  let rows = waterData[activeDay];
  const rowsOver5 = max(0, rows - 5);
  const baseXShift = -width * 0.53;
  const baseYShift = -height * 0.28;
  const extraLiftPerRow = 10;              // px up per row beyond 5
  const yShift = baseYShift - rowsOver5 * extraLiftPerRow;

  translate(baseXShift, yShift, -195);

  drawWaveStack3D(rows);
  pop();

  // --- 2D HUD overlay (stationary) ---
  drawHUD2D(rows);

  // Blit HUD on top of WEBGL canvas
  resetMatrix();
  image(hudG, -width / 2, -height / 2);

  // Animate waves
  t += 0.01;
}

// 3D waves 
function drawWaveStack3D(rows) {
  const stripWidth = 700;   // wide waves
  const stripDepth = 80;    // depth
  const yAmpBase = 100;     // base wave height
  const rowYOffsetBase = 20;
  const yBase = 8;
  const cols = 100;         // horizontal resolution
  const segZ = 20;          // depth resolution
  const rowZOffset = stripDepth * 0.9;

  // row compaction for large stacks
  const rowsOver5 = max(0, rows - 5);
  const yAmp = yAmpBase * (1 - 0.05 * rowsOver5);         // up to -10% at 7 rows
  const rowYOffset = rowYOffsetBase * (1 - 0.04 * rowsOver5);

  // Noise scales
  const fx = 0.05;
  const fz = 0.10;
  const ts = 0.6;

  for (let r = 0; r < rows; r++) {
    push();
    translate(0, r * rowYOffset, r * rowZOffset);

    // Build surface as triangle strips along z, coloring by depth & row
    for (let zStep = 0; zStep < segZ; zStep++) {
      let z0 = map(zStep, 0, segZ, 0, stripDepth);
      let z1 = map(zStep + 1, 0, segZ, 0, stripDepth);

      // Depth factor (0 near -> 1 far)
      let depthT = (zStep + 0.5) / segZ;
      fill(rowColor(r, rows, depthT));

      beginShape(TRIANGLE_STRIP);
      for (let cStep = 0; cStep <= cols; cStep++) {
        let x = map(cStep, 0, cols, 0, stripWidth);

        let h0 = (noise(cStep * fx, zStep * fz, t * ts + r * 0.15) - 0.5) * (yAmp * 2);
        let h1 = (noise(cStep * fx + 99, (zStep + 1) * fz, t * ts + r * 0.15) - 0.5) * (yAmp * 2);

        let y0 = yBase - h0;
        let y1 = yBase - h1;

        vertex(x, y0, z0);
        vertex(x, y1, z1);
      }
      endShape();
    }
    pop();
  }
}

// --- Interaction helpers ---

function hoveredDayIndex() {
  const barY = height - SAFE_FOOTER;
  const w = width / 7;
  if (mouseY > barY + 10 && mouseY < barY + 66) {
    let i = floor(mouseX / w);
    if (i >= 0 && i < 7) return i;
  }
  return -1;
}

// Single click
function mousePressed() {
  const i = hoveredDayIndex();
  if (i !== -1 && isLocked) {
    isLocked = false; // unlock on single click
  }
}

// Double click
function doubleClicked() {
  const i = hoveredDayIndex();
  if (i !== -1) {
    lockedDay = i;
    activeDay = i;
    isLocked = true; // lock on double click
  }
}

// --- HUD ---

function drawHUD2D(rows) {
  hudG.clear();
  hudG.noStroke();
  hudG.fill(240);
  hudG.textAlign(LEFT, TOP);

  // Lock status indicator
  const lockTxt = isLocked ? "LOCKED" : "HOVER";
  hudG.text(`Selected: ${dayLabels[activeDay]}  |  Glasses: ${rows}  |  Mode: ${lockTxt}`, 16, 24);
  hudG.text("Hover to preview. Double-click a day to lock. Click once to unlock.", 16, 44);

  const barY = hudG.height - SAFE_FOOTER;
  const w = hudG.width / 7;

  // Opaque footer background 
  hudG.fill(0, 255);
  hudG.rect(0, barY, hudG.width, SAFE_FOOTER);

  for (let i = 0; i < 7; i++) {
    const hovered = (mouseX > i * w && mouseX < (i + 1) * w &&
                     mouseY > barY + 10 && mouseY < barY + 66);
    const isActive = (i === activeDay);

    hudG.stroke(242);
    hudG.strokeWeight(isActive ? 2 : 0.5);
    hudG.fill(hovered ? 25 : 12);
    hudG.rect(i * w, barY + 10, w, 56);

    hudG.noStroke();
    hudG.fill(242);
    hudG.textAlign(CENTER, CENTER);
    hudG.text(dayLabels[i], i * w + w / 2, barY + 10 + 28);
  }
}

/*  Indomie Run — styled intro + random packets + E grab
    Scenes:
      0 = Scene 0 — "The Room" (intro/tutorial, warm tint)
      1 = Scene 1 — "The Chase" (blue tint, ghost after reveal)
      2 = Scene 2 — "Escape Cut Scene" (win sequence)
*/



const SCENE_INTRO  = 0;
const SCENE_CHASE  = 1;
const SCENE_ESCAPE = 2;

let scene = SCENE_INTRO;
let sceneStartFrame = 0;

let player, ghost;
let collectibles = [];   // 10 items total; first 3 belong to scene 0
let obstacles = [];      // furniture blocks (invisible now)
let collectedCount = 0;

let isLosing = false;    // lose overlay flag (overlay, not a scene)
let showReplay = false;

let ghostRevealStart = -1;
const GHOST_REVEAL_DURATION = 30; // ~0.5s
let ghostActive = false;

let autoRun = false;     // brief dash to door before cutscene
let autoRunStart = 0;
const AUTO_RUN_DURATION = 45;  // ~0.75s
const DOOR = { x: 560, y: 340 };

const KEY_SPACE = 32;
const KEY_E     = 69;    // e key for grabbing packets on furniture
const PLAYER_RADIUS = 10; // single source of truth for player radius

// track lose time for jumpscare
let loseStartFrame = -1;

// scared animation before lose overlay
let scaredAnimActive = false;
let scaredAnimStartFrame = -1;
const SCARED_ANIM_DURATION = 45; // frames (~0.75s)

// intro timing + story sequence
const INTRO_TIME_LIMIT = 30 * 60;  // after this, chase starts if at least 1 packet is collected
const STORY1_START = 0;
const STORY1_END   = 180;          // "It’s midnight, I’m starving..."
const STORY2_START = 180;
const STORY2_END   = 360;          // "Where’s the Indomie?"

// uneasy + don't look back overlay timing (5 seconds each)
const UNEASY_DURATION        = 5 * 60;   // scene 0
const DONT_LOOK_DURATION     = 5 * 60;   // scene 1
let uneasyStartFrame   = -1;            // when "Something doesn't feel right..." starts
let dontLookStartFrame = -1;            // when "Don't look back." starts

// win-screen packet explosion
let escapePackets = [];

// background images
let imgBedroom, imgHallway;

// indomie packet image
let imgIndomie;

// girl character sprites
let imgGirlBack, imgGirlFront, imgGirlLeft, imgGirlRight;
let imgGirlScared1, imgGirlScared2, imgGirlScared3;

// pocong ghost sprites
let imgPocongBack, imgPocongFront;
let imgPocongLeft1, imgPocongRight1;
let imgPocongLeft2, imgPocongRight2;

// tiny popup dialogue system
let popups = [];
class Popup {
  constructor(msg, dur = 90) {
    this.msg = msg;
    this.birth = frameCount;
    this.dur = dur;
  }
  draw() {
    const t = frameCount - this.birth;
    if (t > this.dur) return false;
    const alpha = map(constrain(this.dur - t, 0, 20), 0, 20, 0, 200);
    push();
    noStroke();
    fill(0, alpha + 40);
    rect(width / 2 - 140, height - 70, 280, 40, 8);
    fill(255, alpha + 55);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.msg, width / 2, height - 50);
    pop();
    return true;
  }
}

// ---------- Assets ----------

const ASSET_BASE = '../p5/assignment-7/assets/';

function preload() {
  imgBedroom = loadImage(ASSET_BASE + 'bedroom.png');
  imgHallway = loadImage(ASSET_BASE + 'hallway.png');

  // indomie sprite
  imgIndomie = loadImage(ASSET_BASE + 'indomie_collectible.png');

  // girl character sprites
  imgGirlBack    = loadImage(ASSET_BASE + 'girl_back.png');
  imgGirlFront   = loadImage(ASSET_BASE + 'girl_front.png');
  imgGirlLeft    = loadImage(ASSET_BASE + 'girl_left.png');
  imgGirlRight   = loadImage(ASSET_BASE + 'girl_right.png');
  imgGirlScared1 = loadImage(ASSET_BASE + 'girl_scared_1.png');
  imgGirlScared2 = loadImage(ASSET_BASE + 'girl_scared_2.png');
  imgGirlScared3 = loadImage(ASSET_BASE + 'girl_scared_3.png');

  // pocong ghost sprites
  imgPocongBack   = loadImage(ASSET_BASE + 'pocong_back.png');
  imgPocongFront  = loadImage(ASSET_BASE + 'pocong_front.png');
  imgPocongLeft1  = loadImage(ASSET_BASE + 'pocong_left_1.png');
  imgPocongRight1 = loadImage(ASSET_BASE + 'pocong_right_1.png');
  imgPocongLeft2  = loadImage(ASSET_BASE + 'pocong_left_2.png');
  imgPocongRight2 = loadImage(ASSET_BASE + 'pocong_right_2.png');
}

// ---------------- Setup ----------------
function setup() {
  const cnv = createCanvas(600, 400);
  // attach the canvas to the div in project-7.html
  cnv.parent('sketch-container');

  initLevelLayout();        // sets obstacles, then spawns random packets
  resetGame();              // spawns player + ghost, goes to scene 0
}



// ---------------- Draw Loop ----------------
function draw() {
  background(22);
  drawFloorGrid(); // kept under images as backup

  // scene flow for assignment requirement
  switch (scene) {
    case SCENE_INTRO:  drawSceneIntro();  break;
    case SCENE_CHASE:  drawSceneChase();  break;
    case SCENE_ESCAPE: drawSceneEscape(); break;
  }

  // draws popups above scenes
  popups = popups.filter(p => p.draw());

  // scared animation timer before lose overlay
  if (scaredAnimActive && !isLosing) {
    const dt = frameCount - scaredAnimStartFrame;
    if (dt >= SCARED_ANIM_DURATION) {
      scaredAnimActive = false;
      startLose();  // then moves to overlay
    }
  }

  // lose overlay sits above all scenes and freezes visuals
  if (isLosing) {
    drawLoseOverlay();
    return;
  }

  // hud during gameplay scenes
  if (scene === SCENE_INTRO || scene === SCENE_CHASE) {
    drawHUD();
  }
}

// ---------------- Scene 0: "The Room" (Intro) ----------------
function drawSceneIntro() {
  // bedroom background
  if (imgBedroom) {
    image(imgBedroom, 0, 0, width, height);
  }

  // warm tint that stays full for 10s, then slowly fades over next 10s
  const introT = frameCount - sceneStartFrame;
  const warmDelay     = 10 * 60; // delay before fade starts
  const warmFadeDur   = 10 * 60; // fade duration
  let warmAlpha = 40;

  if (introT > warmDelay) {
    const fadeT = introT - warmDelay;
    const norm = constrain(fadeT / warmFadeDur, 0, 1);
    warmAlpha = lerp(40, 0, norm);
  }
  if (warmAlpha > 0.5) {
    drawTint(255, 170, 90, warmAlpha);
  }

  // vignette stays constant
  drawVignette(18);

  // intro packets (scene 0 only)
  for (const c of collectibles) {
    if (c.activeScene === 0 && !c.collected) c.display();
  }

  // player movement and wall collisions
  player.update();
  collidePlayerWithObstacles();

  // pickups in intro (e to grab when needed)
  const eDown = keyIsDown(KEY_E);
  for (const c of collectibles) {
    if (c.activeScene === 0 && !c.collected) {
      const d = dist(c.x, c.y, player.x, player.y);
      const floorInRange = !c.requiresGrab && d < player.r + c.r;
      const furnitureInRange = c.requiresGrab && d < 40;  // radius around furniture

      if (floorInRange || (furnitureInRange && eDown)) {
        c.collected = true;
        collectedCount++;
        // uneasy overlay starts when third intro packet is collected
        if (collectedCount === 3 && uneasyStartFrame < 0) {
          uneasyStartFrame = frameCount;
        }
      }
    }
  }

  // intro story and ui placement
  const t = frameCount - sceneStartFrame;
  drawIntroStory(t);
  drawIntroUI(t);

  // uneasy overlay text
  drawUneasyOverlay();

  // transition to chase:
  //  normal path → all 3 intro packets + uneasy overlay ends
  //  alternate path → at least 1 packet collected and timer runs out
  const gotAllThreeIntro = collectedCount >= 3;
  const uneasyFinished =
    uneasyStartFrame >= 0 && (frameCount - uneasyStartFrame) > UNEASY_DURATION;

  const timeExceeded = collectedCount >= 1 && t > INTRO_TIME_LIMIT;

  if ((gotAllThreeIntro && uneasyFinished) || timeExceeded) {
    goToScene(SCENE_CHASE);
  }
}

// ---------------- Scene 1: "The Chase" ----------------
function drawSceneChase() {
  // bedroom background again
  if (imgBedroom) {
    image(imgBedroom, 0, 0, width, height);
  }

  // cool-toned eerie lighting overlay
  push();
  blendMode(MULTIPLY);
  fill(80, 130, 255, 90);
  rect(0, 0, width, height);
  pop();

  // vignette to darken edges
  drawVignette(40);

  // ghost reveal flicker at start of scene 1
  if (ghostRevealStart < 0) {
    ghostRevealStart = frameCount;
    ghostActive = false;
    // "don't look back" overlay starts here
    dontLookStartFrame = frameCount;
  }
  const revealT = frameCount - ghostRevealStart;
  if (revealT < GHOST_REVEAL_DURATION) {
    if (revealT % 6 < 3) {
      // flicker additive cool light
      push();
      blendMode(ADD);
      fill(160, 200, 255, 100);
      rect(0, 0, width, height);
      pop();
    }
  } else {
    ghostActive = true;
  }

  // all remaining packets (intro ones stay if not collected)
  for (const c of collectibles) {
    if (!c.collected) c.display();
  }

  // control or auto-run when last packet is collected
  if (autoRun) {
    autoRunPlayerToDoor();
  } else {
    player.update();
  }
  collidePlayerWithObstacles();

  // ghost behaviour
  if (ghostActive) {
    ghost.update(player);
    ghost.display();
    if (!autoRun) checkGhostCatch();
  } else {
    // faint ghost during reveal
    ghost.display();
  }

  // pickups during chase
  if (!autoRun && !scaredAnimActive && !isLosing) {
    const eDown = keyIsDown(KEY_E);
    for (const c of collectibles) {
      if (!c.collected) {
        const d = dist(c.x, c.y, player.x, player.y);
        const floorInRange = !c.requiresGrab && d < player.r + c.r;
        const furnitureInRange = c.requiresGrab && d < 40;

        if (floorInRange || (furnitureInRange && eDown)) {
          c.collected = true;
          collectedCount++;
          if (collectedCount === 9) popups.push(new Popup("Just one more."));
        }
      }
    }
    // all collected → brief dash to door → scene 2
    if (collectedCount >= collectibles.length && !isLosing) {
      autoRun = true;
      autoRunStart = frameCount;
      popups.push(new Popup("Go!"));
    }
  }

  // "don't look back" overlay
  drawDontLookOverlay();
}

// ---------------- Scene 2: "Escape Cut Scene" (Win) ----------------
function drawSceneEscape() {
  const t = frameCount - sceneStartFrame;

  // hallway background
  if (imgHallway) {
    image(imgHallway, 0, 0, width, height);
  } else {
    fill(0);
    rect(0, 0, width, height);
  }

  // 0–120: run + indomie explosion overlay
  if (t < 120) {
    drawCutBeat2(t, 1.0);   // player running with "Run!"
    drawCutBeat1(t, 1.0);   // explosion on top
  } else {
    // keeps final frame of run + explosion, then fades them out
    const fadeT = t - 120;
    const fadeDur = 30;
    const fadeMult = constrain(map(fadeT, 0, fadeDur, 1, 0), 0, 1);

    // fading run and explosion in background
    drawCutBeat2(120, fadeMult);
    drawCutBeat1(120, fadeMult);

    // title + play again appear over faded background
    drawCutBeat3(fadeT);
  }
}

// ---------------- Lose Overlay (not a scene) ----------------
function drawLoseOverlay() {
  fill(0, 230);
  noStroke();
  rect(0, 0, width, height);

  // jumpscare pocong: small → huge
  let t = 0;
  if (loseStartFrame >= 0) {
    t = frameCount - loseStartFrame;
  }
  let sizeMul = map(t, 0, 30, 2, 18);
  sizeMul = constrain(sizeMul, 2, 18);

  // pocong in center using front sprite (shifted further down)
  push();
  translate(width / 2, height / 2 + 90);
  const a = map(sin(frameCount * 0.5), -1, 1, 220, 255);
  imageMode(CENTER);
  if (imgPocongFront) {
    const baseH = 90 * sizeMul;
    const aspect = imgPocongFront.width / imgPocongFront.height;
    const h = baseH;
    const w = h * aspect;
    tint(255, a);
    image(imgPocongFront, 0, 0, w, h);
    noTint();
  } else {
    // fallback to simple circle jumpscare
    ghost.drawCentered(a, 8 * sizeMul);
  }
  pop();

  // "you lose" styled like title but without pulsing
  drawShadowText("You Lose", width / 2, height / 2 + 10, 28, 255);
  drawShadowText("The ghost caught you", width / 2, height / 2 + 46, 16, 255);

  showReplay = true;
  drawReplayButton();

  fill(255);
  textSize(16);
  textAlign(CENTER, TOP);
  text("Press R to restart", width / 2, height / 2 + 125);
}

// ---------------- HUD (top-left text + top-right stamina) ----------------
function drawHUD() {
  // indomie counter on top-left
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text(`Indomie: ${collectedCount}/10`, 10, 10);

  // stamina bar on top-right
  const w = 200;
  const h = 10;
  const x = width - w - 20;
  const y = 14;

  fill(255, 40);
  rect(x, y, w, h, 3);
  fill(120, 220, 255);
  rect(x, y, map(player.stamina, 0, 100, 0, w), h, 3);
  noFill();
  stroke(255, 120);
  rect(x, y, w, h, 3);
}

// -------- Intro story & UI (spacing, fade in/out) --------
function storyAlpha(t, start, end) {
  if (t < start || t > end) return 0;
  const fade = 30;        // fade-in/out duration
  const inEnd = start + fade;
  const outStart = end - fade;
  if (t <= inEnd)   return map(t, start, inEnd, 0, 255);
  if (t >= outStart) return map(t, outStart, end, 255, 0);
  return 255;
}

// centered white text with soft dark shadow
function drawShadowText(msg, x, y, size, alpha = 255) {
  push();
  textAlign(CENTER, CENTER);
  textSize(size);

  // soft shadow with multiple offsets
  for (let r = 4; r >= 1; r--) {
    const a = alpha * 0.08 * r;
    fill(0, a);
    text(msg, x + r, y + r);
  }

  // main white text
  fill(255, alpha);
  text(msg, x, y);
  pop();
}

function drawIntroStory(t) {
  // line 1
  let a1 = storyAlpha(t, STORY1_START, STORY1_END);
  if (a1 > 0) {
    drawShadowText("It’s midnight, I’m starving...", width / 2, height / 2 - 10, 26, a1);
  }

  // line 2
  let a2 = storyAlpha(t, STORY2_START, STORY2_END);
  if (a2 > 0) {
    drawShadowText("Where’s the Indomie?", width / 2, height / 2 - 10, 26, a2);
  }
}

function drawIntroUI(t) {
  // after story ends, shows "find 10 packets" prompt and controls
  if (t > STORY2_END) {
    const uiT = t - STORY2_END;

    // "find 10 packets" text for 10 seconds with fade near the end
    if (uiT < 600) {
      let alpha = 255;
      if (uiT > 540) {
        alpha = map(uiT, 540, 600, 255, 0);
      }
      drawShadowText("Find 10 packets of Indomie.", width / 2, height - 20, 18, alpha);
    }

    // controls hint, same window as above text
    if (uiT < 600) {
      let alpha = 255;
      if (uiT > 540) {
        alpha = map(uiT, 540, 600, 255, 0);
      }

      const w = 200;
      const y = 14;
      const barBottomY = y + 10;

      fill(0, alpha * 0.4);
      noStroke();
      rect(width - (w + 32) - 16, barBottomY + 12, w + 40, 65, 8);

      fill(255, alpha);
      textAlign(RIGHT, TOP);
      textSize(14);
      text(
        "Move with arrows\nHold Space to sprint\nPress E to grab packets on furniture",
        width - 16,
        barBottomY + 18
      );
    }
  }
}

// -------- overlays for uneasy + don't look back --------
function drawUneasyOverlay() {
  if (uneasyStartFrame < 0) return;
  const t = frameCount - uneasyStartFrame;
  if (t > UNEASY_DURATION) return;

  const a = storyAlpha(t, 0, UNEASY_DURATION);
  if (a <= 0) return;

  drawShadowText("Something doesn’t feel right...", width / 2, height / 2 - 10, 22, a);
}

function drawDontLookOverlay() {
  if (dontLookStartFrame < 0) return;
  const t = frameCount - dontLookStartFrame;
  if (t > DONT_LOOK_DURATION) return;

  const a = storyAlpha(t, 0, DONT_LOOK_DURATION);
  if (a <= 0) return;

  drawShadowText("Don’t look back.", width / 2, height / 2 - 10, 22, a);
}

// ---------------- Cut-scene beats ----------------

// beat 1: indomie packets explode
function drawCutBeat1(t, alphaMult = 1) {
  if (alphaMult <= 0) return;

  const life = constrain(map(t, 0, 120, 255, 80), 80, 255) * alphaMult;

  noStroke();
  for (let i = 0; i < escapePackets.length; i++) {
    const p = escapePackets[i];
    const px = p.x + p.vx * t;
    const py = p.y + p.vy * t;
    const ang = p.angle + p.spin * t;

    push();
    translate(px, py);
    rotate(ang);

    if (imgIndomie) {
      imageMode(CENTER);
      const size = 34;
      tint(255, life);
      image(imgIndomie, 0, 0, size, size);
      noTint();
    } else {
      // fallback rectangle
      fill(255, 215, 0, life);
      rectMode(CENTER);
      rect(0, 0, 26, 16, 4);
      rectMode(CORNER);
    }

    pop();
  }
}

// beat 2: player runs left → right with "run!"
function drawCutBeat2(t, alphaMult = 1) {
  if (alphaMult <= 0) return;

  const progress = constrain(t / 120, 0, 1);
  const playerX = lerp(-40, width + 40, progress);

  // ground where feet and speed lines sit, moved upward
  const groundY = height / 2 + 20;

  // white motion streaks behind feet
  noFill();
  stroke(255, 180 * alphaMult);
  for (let i = 0; i < 5; i++) {
    const back = playerX - 12 - i * 12;
    line(back, groundY, back - 8, groundY);
  }

  // girl sprite slightly above ground so feet touch line
  const runSize = 80;
  const charY = groundY - runSize / 2 + 6;

  push();
  imageMode(CENTER);
  if (imgGirlRight) {
    image(imgGirlRight, playerX, charY, runSize, runSize);
  } else {
    // fallback silhouette
    noStroke();
    fill(180, 220, 255, 255 * alphaMult);
    circle(playerX, charY, PLAYER_RADIUS * 2.6);
  }
  pop();

  // "run!" styled like title but static alpha
  const runAlpha = 255 * alphaMult;
  drawShadowText("Run!", width / 2, height / 2 - 70, 36, runAlpha);
}

// beat 3: "indomie run" title + play again from center
function drawCutBeat3(t) {
  // pop out scale for first 30 frames
  const popDuration = 30;
  const norm = constrain(t / popDuration, 0, 1);
  const scaleFactor = lerp(0.1, 1.0, norm);

  // blinking title alpha stays here
  const flash = map(sin(frameCount * 0.3), -1, 1, 180, 255);

  push();
  translate(width / 2, height / 2);
  scale(scaleFactor);

  // title with shadow
  drawShadowText("Indomie Run", 0, -25, 32, flash);

  // play again button (visual)
  const btnW = 140;
  const btnH = 36;
  const btnY = 30;
  noStroke();
  fill(255);
  rectMode(CENTER);
  rect(0, btnY, btnW, btnH, 8);
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Play Again", 0, btnY + 1);

  // restart hint under button
  textSize(12);
  fill(255);
  text("Press R to restart", 0, btnY + btnH / 2 + 18);

  rectMode(CORNER);
  pop();

  // replay logic and hitbox aligned with drawn button
  showReplay = true;
  replayBtn.x = width / 2 - replayBtn.w / 2;
  replayBtn.y = height / 2 + 30 - replayBtn.h / 2;
}

// ---------------- Input ----------------
function keyIsHeld(code) { return keyIsDown(code); }

function keyPressed() {
  // debug scene switching (temporary)
  // 1 = reset to intro, 2 = chase, 3 = lose screen, 4 = win/escape cutscene
  if (key === '1') {
    resetGame();
  } else if (key === '2') {
    scene = SCENE_CHASE;
    sceneStartFrame = frameCount;
    isLosing = false;
    showReplay = false;
    ghostRevealStart = -1;
    ghostActive = false;
    autoRun = false;
    loseStartFrame = -1;
    scaredAnimActive = false;
    dontLookStartFrame = frameCount;
  } else if (key === '3') {
    scaredAnimActive = false;
    isLosing = true;
    showReplay = true;
    loseStartFrame = frameCount;
  } else if (key === '4') {
    isLosing = false;
    showReplay = false;
    autoRun = false;
    scaredAnimActive = false;
    goToScene(SCENE_ESCAPE);
  }

  // normal restart when replay is visible
  if (showReplay && (key === 'r' || key === 'R')) {
    resetGame();
  }
}

function mousePressed() {
  if (showReplay && overReplay(mouseX, mouseY)) resetGame();
}

// ---------------- Helpers ----------------
function goToScene(s) {
  scene = s;
  sceneStartFrame = frameCount;
  showReplay = false;

  if (scene === SCENE_CHASE) {
    ghostRevealStart = -1;
    ghostActive = false;
    autoRun = false;
    // dontLookStartFrame is set inside drawSceneChase
  }
  if (scene === SCENE_ESCAPE) {
    // clears flags so overlays do not interfere
    isLosing = false;
    autoRun = false;
    scaredAnimActive = false;
    initEscapeScene();
  }
}

function startLose() {
  isLosing = true;
  scaredAnimActive = false;
  showReplay = true;
  loseStartFrame = frameCount;
}

function resetGame() {
  // new random packet layout each run
  spawnCollectibles();
  collectedCount = 0;

  // reset player near the bed
  let bed = obstacles.find(o => o.label === "Bed") || obstacles[0];
  let spawnX = bed.x + bed.w / 2;
  let spawnY = bed.y + bed.h + 20;
  player = new Player(spawnX, spawnY);

  // ghost at top center
  ghost = new Ghost(width / 2, 40);

  // reset flags
  isLosing = false;
  showReplay = false;
  ghostRevealStart = -1;
  ghostActive = false;
  autoRun = false;
  loseStartFrame = -1;

  scaredAnimActive = false;
  scaredAnimStartFrame = -1;

  // reset overlay timers
  uneasyStartFrame   = -1;
  dontLookStartFrame = -1;

  popups = [];

  goToScene(SCENE_INTRO);
}

function autoRunPlayerToDoor() {
  const t = (frameCount - autoRunStart) / AUTO_RUN_DURATION;
  const tt = constrain(t, 0, 1);
  player.x = lerp(player.x, DOOR.x, 0.2);
  player.y = lerp(player.y, DOOR.y, 0.2);
  player.display();
  if (tt >= 1 || dist(player.x, player.y, DOOR.x, DOOR.y) < 6) {
    goToScene(SCENE_ESCAPE);
  }
}

// sets up the 10 packets for explosion
function initEscapeScene() {
  escapePackets = [];
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < 10; i++) {
    const ang = random(TWO_PI);
    const speed = random(1.5, 3.2);
    escapePackets.push({
      x: centerX,
      y: centerY,
      vx: cos(ang) * speed,
      vy: sin(ang) * speed,
      angle: random(TWO_PI),
      spin: random(-0.12, 0.12)
    });
  }
}

// ---------------- Drawing utils ----------------
function drawFloorGrid() {
  push();
  stroke(50);
  for (let x = 0; x < width; x += 20) line(x, 0, x, height);
  for (let y = 0; y < height; y += 20) line(0, y, width, y);
  pop();
}
function drawTint(r, g, b, a) {
  push();
  noStroke();
  fill(r, g, b, a);
  rect(0, 0, width, height);
  pop();
}
function drawVignette(alphaStep = 24) {
  push();
  noFill();
  stroke(0, alphaStep);
  const maxR = max(width, height) * 1.2;
  for (let r = maxR; r > 100; r -= 40) ellipse(width / 2, height / 2, r, r);
  pop();
}

// ---------------- Collision + UI ----------------
function collidePlayerWithObstacles() {
  // uses slightly smaller hitbox so player can fit through tight gaps
  const collisionRadius = player.r * 0.75;

  for (const o of obstacles) {
    if (o.hitsCircle(player.x, player.y, collisionRadius)) {
      player.revert();
      break;
    }
  }
}

function checkGhostCatch() {
  // avoids re-triggering while scared animation or lose overlay are active
  if (isLosing || scaredAnimActive) return;

  const d = dist(player.x, player.y, ghost.x, ghost.y);
  if (d < player.r + ghost.r) {
    scaredAnimActive = true;
    scaredAnimStartFrame = frameCount;
  }
}

const replayBtn = { w: 140, h: 36, x: 0, y: 0 };
function drawReplayButton() {
  replayBtn.x = width / 2 - replayBtn.w / 2;
  replayBtn.y = height / 2 + 70;
  noStroke();
  fill(255);
  rect(replayBtn.x, replayBtn.y, replayBtn.w, replayBtn.h, 8);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Play Again", replayBtn.x + replayBtn.w / 2, replayBtn.y + replayBtn.h / 2);
}
function overReplay(mx, my) {
  return mx > replayBtn.x && mx < replayBtn.x + replayBtn.w &&
         my > replayBtn.y && my < replayBtn.y + replayBtn.h;
}

// ---------------- Classes ----------------
class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;      // previous position for collision resolve
    this.baseSpeed = 1.7;
    this.speed = this.baseSpeed;
    this.stamina = 100;
    this.r = PLAYER_RADIUS;

    // facing direction
    this.facing = 'down';      // 'up', 'down', 'left', 'right'
  }
  update() {
    // freezes during scared animation, escape cutscene, or lose overlay
    if (isLosing || scene === SCENE_ESCAPE || autoRun || scaredAnimActive) {
      this.display();
      return;
    }
    this.px = this.x; this.py = this.y;

    // detects whether any directional key is pressed
    const moving =
      keyIsDown(LEFT_ARROW)  ||
      keyIsDown(RIGHT_ARROW) ||
      keyIsDown(UP_ARROW)    ||
      keyIsDown(DOWN_ARROW);

    // sprint logic, drains stamina only while moving
    const sprinting = moving && keyIsHeld(KEY_SPACE) && this.stamina > 0;

    if (sprinting) {
      this.speed = this.baseSpeed * 1.5;
      this.stamina = max(0, this.stamina - 0.5);
    } else {
      this.speed = this.baseSpeed * (this.stamina <= 0 ? 0.7 : 1.0);
      this.stamina = min(100, this.stamina + 0.25);
    }

    // movement and facing direction
    if (keyIsDown(LEFT_ARROW))  {
      this.x -= this.speed;
      this.facing = 'left';
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
      this.facing = 'right';
    }
    if (keyIsDown(UP_ARROW))    {
      this.y -= this.speed;
      this.facing = 'up';
    }
    if (keyIsDown(DOWN_ARROW))  {
      this.y += this.speed;
      this.facing = 'down';
    }

    this.x = constrain(this.x, this.r, width - this.r);
    this.y = constrain(this.y, this.r, height - this.r);

    this.display();
  }
  revert() { this.x = this.px; this.y = this.py; }
  display() {
    const displaySize = 80;

    push();
    imageMode(CENTER);

    let imgToDraw = null;

    // scared animation frames override normal facing
    if (scaredAnimActive && imgGirlScared1) {
      const t = frameCount - scaredAnimStartFrame;

      // 0–6 frames → scared_1
      // 7–29 frames → scared_2
      // 30+ frames → scared_3
      if (t < 7) {
        imgToDraw = imgGirlScared1;
      } else if (t < 30) {
        imgToDraw = imgGirlScared2;
      } else {
        imgToDraw = imgGirlScared3;
      }

    } else {
      // normal directional sprite choice
      if (this.facing === 'up'   && imgGirlBack)  imgToDraw = imgGirlBack;
      if (this.facing === 'down' && imgGirlFront) imgToDraw = imgGirlFront;
      if (this.facing === 'left' && imgGirlLeft)  imgToDraw = imgGirlLeft;
      if (this.facing === 'right' && imgGirlRight) imgToDraw = imgGirlRight;
      if (!imgToDraw) imgToDraw = imgGirlFront;
    }

    if (imgToDraw) {
      // aligns sprite feet with original circle bottom
      const yOffset = this.r - displaySize / 2;
      image(imgToDraw, this.x, this.y + yOffset, displaySize, displaySize);
    } else {
      // fallback circle if images fail
      noStroke();
      fill(180, 220, 255);
      circle(this.x, this.y, this.r * 2);
    }

    pop();
  }
}

class Ghost {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;
    this.r = 14;
    this.speed = 1.5;
    this.bobPhase = random(TWO_PI);
    this.facing = 'down'; // 'up','down','left','right'
  }
  update(target) {
    if (isLosing || scene !== SCENE_CHASE || !ghostActive || scaredAnimActive) return;
    this.px = this.x;
    this.py = this.y;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d  = max(1, sqrt(dx * dx + dy * dy));
    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;

    // facing decided by dominant axis
    if (abs(dx) > abs(dy)) {
      this.facing = dx < 0 ? 'left' : 'right';
    } else {
      this.facing = dy < 0 ? 'up' : 'down';
    }

    // updates bobbing phase
    this.bobPhase += 0.08;
  }
  display() {
    const a   = map(sin(frameCount * 0.3), -1, 1, 200, 255);
    const bob = sin(this.bobPhase) * 4;

    push();
    imageMode(CENTER);

    let sprite = null;

    if (this.facing === 'up' && imgPocongBack) {
      sprite = imgPocongBack;
    } else if (this.facing === 'down' && imgPocongFront) {
      sprite = imgPocongFront;
    } else if (this.facing === 'left') {
      // left bounce: frame 1 near ground, frame 2 when higher
      if (bob < 0 && imgPocongLeft2) {
        sprite = imgPocongLeft2;
      } else if (imgPocongLeft1) {
        sprite = imgPocongLeft1;
      } else if (imgPocongLeft2) {
        sprite = imgPocongLeft2;
      }
    } else if (this.facing === 'right') {
      // right bounce: frame 1 near ground, frame 2 when higher
      if (bob < 0 && imgPocongRight2) {
        sprite = imgPocongRight2;
      } else if (imgPocongRight1) {
        sprite = imgPocongRight1;
      } else if (imgPocongRight2) {
        sprite = imgPocongRight2;
      }
    }

    if (!sprite && imgPocongFront) sprite = imgPocongFront;

    if (sprite) {
      const baseH = 80;
      const aspect = sprite.width / sprite.height;
      const h = baseH;
      const w = h * aspect;

      tint(255, a);
      image(sprite, this.x, this.y + bob, w, h);
      noTint();
    } else {
      // fallback simple circle
      noStroke();
      fill(255, a);
      circle(this.x, this.y + bob, this.r * 2);
    }

    pop();
  }
  // scale factor controls ghost size on lose screen fallback
  drawCentered(alphaVal = 200, sizeMultiplier = 4) {
    noStroke();
    fill(255, alphaVal);
    circle(0, 0, this.r * sizeMultiplier);
  }
}

class Collectible {
  constructor(x, y, activeScene, requiresGrab) {
    this.x = x; this.y = y;
    this.r = 7;                     // slightly larger radius for sprite
    this.collected = false;
    this.activeScene = activeScene; // 0 = intro-only, 1 = chase-only
    this.requiresGrab = requiresGrab;  // true if on furniture and needs e key
    this.rotDeg = random(-30, 30);
  }
  display() {
    if (imgIndomie) {
      push();
      translate(this.x, this.y);
      rotate(radians(this.rotDeg));
      imageMode(CENTER);

      const spriteSize = 26;
      image(imgIndomie, 0, 0, spriteSize, spriteSize);

      pop();
    } else {
      // fallback rectangle
      noStroke();
      fill(255, 215, 0);
      rectMode(CENTER);
      rect(this.x, this.y, 12, 8, 2);
      rectMode(CORNER);
    }
  }

  hits(player) { return dist(this.x, this.y, player.x, player.y) < this.r + player.r; }
}

// furniture obstacles: dense but invisible
class Obstacle {
  constructor(x, y, w, h, label) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.label = label || "";
  }
  display() {
    // kept commented for debug reference if needed
    // noStroke();
    // fill(90);
    // rect(this.x, this.y, this.w, this.h, 4);
  }
  hitsCircle(cx, cy, cr) {
    const nx = constrain(cx, this.x, this.x + this.w);
    const ny = constrain(cy, this.y, this.y + this.h);
    return dist(cx, cy, nx, ny) < cr;
  }
}

// ---------------- Layout (pre-determined obstacles) ----------------
function initLevelLayout() {
  // furniture blocks (smaller and more packed)
  obstacles = [
    new Obstacle(40, 240, 100, 60, "Bed"),
    new Obstacle(40, 180,  40, 50, "Table"),
    new Obstacle(40, 310,  40, 50, "Table"),
    new Obstacle(340,  60, 140, 40, "Desk"),
    new Obstacle(400, 110,  20, 20, "Chair"),
    new Obstacle(500, 150,  60,130, "Wardrobe"),
    new Obstacle(500, 290,  60, 90, "Wardrobe"),
    new Obstacle(40,  60, 100, 40, "Shelf"),
    new Obstacle(150, 60,  80, 40, "Shelf"),
    new Obstacle(340, 230,  50, 100, "Couch"),
    new Obstacle(300, 170,  40, 40, "Chair"),
    new Obstacle(300, 350,  40, 40, "Chair"),
    new Obstacle(280, 260,  40, 40, "Table"),
    new Obstacle(230, 220,  30, 120, "TV Stand"),
    new Obstacle(200, 180,  20, 200, "Wall")
  ];

  // initial random spawn for packets
  spawnCollectibles();
}

// helper: checks clearance for player around a point
function hasPlayerClearance(x, y, radius) {
  // keeps point away from outer walls with same clearance
  if (x < radius || x > width - radius || y < radius || y > height - radius) {
    return false;
  }
  // keeps circle of given radius free from obstacles
  for (const o of obstacles) {
    if (o.hitsCircle(x, y, radius)) return false;
  }
  return true;
}

// spawns 10 packets: some on furniture (require e), some on floor
function spawnCollectibles() {
  collectibles = [];

  const totalPackets = 10;
  const packetsOnFurniture = 4;
  const minPacketDist = 32;

  // checks distance from all existing packets
  function farFromOthers(x, y, list) {
    for (const p of list) {
      if (dist(x, y, p.x, p.y) < minPacketDist) return false;
    }
    return true;
  }

  // finds tv stand for avoidance
  const tvStand = obstacles.find(o => o.label === "TV Stand");

  function onTVStandArea(x, y, margin = 4) {
    if (!tvStand) return false;
    return (
      x > tvStand.x - margin &&
      x < tvStand.x + tvStand.w + margin &&
      y > tvStand.y - margin &&
      y < tvStand.y + tvStand.h + margin
    );
  }

  // furniture that can hold packets
  const furnitureTargets = obstacles.filter(o =>
    ["Bed", "Table", "Desk", "Couch"].includes(o.label)
  );

  // packets on furniture (require e key)
  for (let i = 0; i < packetsOnFurniture && furnitureTargets.length > 0; i++) {
    let placed = false;
    let tries = 0;

    while (!placed && tries < 40) {
      const o = random(furnitureTargets);
      const x = random(o.x + 10, o.x + o.w - 10);
      const y = o.y + 10; // near top surface

      if (!onTVStandArea(x, y) && farFromOthers(x, y, collectibles)) {
        collectibles.push({ x, y, requiresGrab: true });
        placed = true;
      }
      tries++;
    }

    // fallback if spacing fails
    if (!placed) {
      const o = random(furnitureTargets);
      let x = random(o.x + 10, o.x + o.w - 10);
      let y = o.y + 10;
      if (onTVStandArea(x, y)) {
        x = o.x + o.w / 2;
        y = o.y + 10;
      }
      collectibles.push({ x, y, requiresGrab: true });
    }
  }

  // packets on floor (auto pickup, must be reachable)
  const clearanceRadius = PLAYER_RADIUS + 4;

  while (collectibles.length < totalPackets) {
    let placed = false;
    let tries = 0;

    while (!placed && tries < 60) {
      const x = random(40, width - 40);
      const y = random(60, height - 40);

      if (!pointInsideAnyObstacle(x, y) &&
          !onTVStandArea(x, y) &&
          farFromOthers(x, y, collectibles) &&
          hasPlayerClearance(x, y, clearanceRadius)) {
        collectibles.push({ x, y, requiresGrab: false });
        placed = true;
      }
      tries++;
    }

    // fallback if spacing or clearance cannot be fully met
    if (!placed) {
      const x = random(40, width - 40);
      const y = random(60, height - 40);
      if (!pointInsideAnyObstacle(x, y) &&
          !onTVStandArea(x, y) &&
          hasPlayerClearance(x, y, clearanceRadius)) {
        collectibles.push({ x, y, requiresGrab: false });
      }
    }
  }

  // randomly assigns 3 packets to scene 0, others to scene 1
  let indices = Array.from({ length: totalPackets }, (_, i) => i);
  shuffle(indices, true);
  const scene0Indices = indices.slice(0, 3);

  collectibles = collectibles.map((p, idx) => {
    const activeScene = scene0Indices.includes(idx) ? 0 : 1;
    return new Collectible(p.x, p.y, activeScene, p.requiresGrab);
  });
}

// helper: checks if point is inside obstacle rectangle
function pointInsideAnyObstacle(x, y) {
  for (const o of obstacles) {
    if (x > o.x && x < o.x + o.w &&
        y > o.y && y < o.y + o.h) {
      return true;
    }
  }
  return false;
}

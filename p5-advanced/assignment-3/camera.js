// camera.js
//-global-mode p5 sketch (no run.js, no instance mode)
//-canvas mounts into #sketch-consent-camera if it exists
//-camera input is cam
//-ml5 runs facemesh + handpose
//-trackedFaces is my "memory" so consent sticks a bit when ppl move

let cam;

//MOUNT
let mountEl = null;
let mountId = "sketch-consent-camera";

//LAYOUT
let bannerH = 56;
let topPad = 14;
let sidePad = 16;

let statusBoxW = 560;
let statusBoxH = 48;

let captureZoneH = 110;

//16:9
let targetW = 3420;
let targetH = 1924;
let targetAspect = targetW / targetH;

//EFFECTS + PERFORMANCE
let fxCount = 9;
let activeEffect = 0;
let gridOn = false;

let pixelStep = 2;      //skip pixels in effects (performance)
let previewCursor = 0;  //round robin preview update

//low-res grid buffers
let fxW = 180;
let fxH = 101;
let fxGfx = [];

//high-res single-view buffer
let activeGfx = null;

//UI
let frameRect = { x:0, y:0, w:0, h:0 };

let statusMsg = '';
let captureEnabled = false;

//WARNING
let warnLayer;
let warnOn = false;
let warnTimer = 0;
let warnDur = 90;
let warnType = 'capture'; // 'capture' or 'filters'

//INTRO POPUP
let introOn = true;
let introBtn = null; //for hit test

//BOTTOM BUTTONS
let shutX = 0;
let shutY = 0;
let shutR = 38;
let shutInnerR = 25;

let fxBtnX = 0;
let fxBtnY = 0;
let fxBtnR = 24;

//DOM MENU
let menu, menuHeader, menuArrow, menuContent;
let menuExpanded = true;

let resetBtn, blurSlider;
let defaultBlur = 18;

//track grid toggle
let prevGridOn = false;

//ML MODELS
let faceModel;
let handModel;

let facesReady = false;
let handsReady = false;

let faceResults = [];
let handResults = [];

//TRACKED FACES
let trackedFaces = [];
let nextFaceId = 0;

//-tune these so faces dont "reset" too fast
let faceTTL = 60;     //frames before i consider a face gone
let matchDist = 120;  //px distance for matching same face across frames

//-consent feedback
let consentFlash = 0; //small timer so status msg sticks a bit

//STRICTER OK DETECTION (TIME-BASED)
let okHoldMsTarget = 3000;   //3 seconds
let okHoldMs = 0;            //how long OK has been held (ms)
let okCooldown = 0;          //frames before we allow another consent
let okCooldownDur = 45;

let minHandSize = 110;      //px cam-space bbox diagonal
let pinchRatio = 0.22;      //smaller = stricter
let openMargin = 18;        //bigger = stricter

//UI: show live countdown in top banner while OK is detected
let okLive = false;
let okRemainingS = 3.0;

//CAM READY
let camReady = false;

//MOUNT SIZE
//-canvas should be sized off the div width (keeps your “frame size” feeling)
function getMountSize(){
  let fallbackW = 900;

  if(!mountEl){
    let w = min(fallbackW, windowWidth);
    let frameH = w / targetAspect;
    let uiH = bannerH + topPad + statusBoxH + 12 + captureZoneH + topPad + 28;
    return { w, h: floor(frameH + uiH) };
  }

  let r = mountEl.getBoundingClientRect();
  let w = max(320, floor(r.width));

  let frameH = w / targetAspect;
  let uiH = bannerH + topPad + statusBoxH + 12 + captureZoneH + topPad + 28;
  let h = floor(frameH + uiH);

  return { w, h };
}

function setup(){
  //find mount
  mountEl = document.getElementById(mountId) || document.body;

  //mount should be positioning context for DOM UI (menu)
  mountEl.style.position = 'relative';
  mountEl.style.overflow = 'hidden';

  let s = getMountSize();

  //canvas
  let cnv = createCanvas(s.w, s.h);
  cnv.parent(mountEl);
  cnv.style('display', 'block');
  pixelDensity(1);

  //webcam
  cam = createCapture(
    {
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    },
    () => {
      //capture created, video metadata might still load after
    }
  );
  cam.hide();

  //mobile safari
  if(cam.elt) cam.elt.setAttribute('playsinline', '');

  //force predictable size (helps cam.width/cam.height become valid)
  cam.size(1280, 720);

  //video readiness
  if(cam.elt){
    cam.elt.onloadedmetadata = () => { camReady = true; };
    cam.elt.onplaying = () => { camReady = true; };
  }

  warnLayer = createGraphics(width, height);
  warnLayer.pixelDensity(1);

  fxGfx = [];
  for(let i = 0; i < fxCount; i++){
    let g = createGraphics(fxW, fxH);
    g.pixelDensity(1);
    fxGfx.push(g);
  }

  buildMenu();
  textFont('system-ui');

  initMLModels();
}

function draw(){
  background(0);

  //camera not ready yet
  if(!camReady){
    drawLoadingScreen();
    positionMenuTopRight();
    return;
  }

  initActiveGfx();
  frameRect = getFrameRectMax();

  //GRID LIVE FEED (low res)
  if(gridOn && !prevGridOn) bakeAllTilesOnce();
  prevGridOn = gridOn;
  if(gridOn) updateGridLiveTiles();

  //ML updates still run even if intro is up
  updateTrackedFaces();
  applyOkGestureConsent();

  //CAPTURE RULE
  captureEnabled = getActiveFaces().length > 0 && isAllActiveFacesConsented();

  //DRAW VIEW
  if(!gridOn) drawSingle();
  else drawGrid();

  //TOP BANNER
  let bannerMsg = '';
  if(captureEnabled){
    bannerMsg = 'CAPTURE READY — EVERY FACE CONSENTED';
  }else if(okLive){
    bannerMsg = 'HOLDING OK — ' + okRemainingS.toFixed(1) + 's LEFT';
  }else{
    bannerMsg = 'CONSENT REQUIRED — HOLD OK HAND SIGN (3s)';
  }

  drawTopBanner(bannerMsg, captureEnabled ? '#1f7a3a' : '#b3261e');

  drawStatusTopLeft();
  drawBottomBar();

  if(warnOn) drawWarning();
  if(introOn) drawIntroPopup();

  if(consentFlash > 0) consentFlash--;

  positionMenuTopRight();
}

function windowResized(){
  //resize based on the mount width
  let s = getMountSize();
  resizeCanvas(s.w, s.h);

  warnLayer = createGraphics(width, height);
  warnLayer.pixelDensity(1);

  positionMenuTopRight();
}

function drawLoadingScreen(){
  push();
    noStroke();
    fill(0);
    rect(0, 0, width, height);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('Waiting for camera permission / loading video...', width/2, height/2 - 10);

    fill(255, 180);
    textSize(13);
    text("If you don’t see a prompt, check browser camera permissions for this site.", width/2, height/2 + 18);
  pop();
}

//ML INIT
function initMLModels(){
  if(typeof ml5 === 'undefined'){
    console.warn('ml5 not found. Check your script tag for ml5.');
    return;
  }

  //FACE MODEL
  if(typeof ml5.facemesh === 'function'){
    faceModel = ml5.facemesh(cam, () => facesReady = true);
    faceModel.on('predict', r => faceResults = r);
  }else if(typeof ml5.faceMesh === 'function'){
    faceModel = ml5.faceMesh(cam, () => facesReady = true);
    faceModel.on('predict', r => faceResults = r);
  }else{
    console.log('ml5 facemesh/faceMesh not found. check ml5 script tag.');
  }

  //HAND MODEL
  if(typeof ml5.handpose === 'function'){
    handModel = ml5.handpose(cam, () => handsReady = true);
    handModel.on('predict', r => handResults = r);
  }else if(typeof ml5.handPose === 'function'){
    handModel = ml5.handPose(cam, () => handsReady = true);
    handModel.on('predict', r => handResults = r);
  }else{
    console.log('ml5 handpose/handPose not found. check ml5 script tag.');
  }
}

//DRAW MODES
function drawSingle(){
  drawActiveToRect(frameRect);
  blurNonConsentedFacesInFrame();
  drawFaceBoxesML();
}

function drawGrid(){
  let cells = getGridCells(frameRect);

  for(let i = 0; i < fxCount; i++){
    image(fxGfx[i], cells[i].x, cells[i].y, cells[i].w, cells[i].h);
  }

  push();
    noFill();
    stroke(255);
    strokeWeight(3);
    rect(cells[activeEffect].x, cells[activeEffect].y, cells[activeEffect].w, cells[activeEffect].h);
  pop();
}

//HIGH-QUALITY ACTIVE
function initActiveGfx(){
  let vw = (cam && cam.elt) ? cam.elt.videoWidth : 0;
  let vh = (cam && cam.elt) ? cam.elt.videoHeight : 0;

  if(!vw || !vh){
    vw = cam ? cam.width : 0;
    vh = cam ? cam.height : 0;
  }

  if(!vw || !vh) return;

  if(!activeGfx || activeGfx.width !== vw || activeGfx.height !== vh){
    activeGfx = createGraphics(vw, vh);
    activeGfx.pixelDensity(1);
  }
}

function drawActiveToRect(rect){
  if(!activeGfx) return;

  drawCamIntoGfx(activeGfx);
  applyEffectToGfx(activeGfx, activeEffect);

  image(activeGfx, rect.x, rect.y, rect.w, rect.h);
}

//GRID LIVE
function bakeAllTilesOnce(){
  for(let i = 0; i < fxCount; i++) updateTile(i);
}

function updateGridLiveTiles(){
  updateTile(activeEffect);

  if(frameCount % 2 !== 0) return;

  updateTile(previewCursor);
  previewCursor = (previewCursor + 1) % fxCount;
}

function updateTile(id){
  let g = fxGfx[id];
  drawCamIntoGfx(g);
  applyEffectToGfx(g, id);
}

//CAM DRAW
function drawCamIntoGfx(g){
  let vw = (cam && cam.elt) ? cam.elt.videoWidth : 0;
  let vh = (cam && cam.elt) ? cam.elt.videoHeight : 0;

  if(!vw || !vh){
    vw = cam.width || 1280;
    vh = cam.height || 720;
  }

  let vAspect = vw / vh;
  let gAspect = g.width / g.height;

  let dw, dh;
  if(gAspect > vAspect){
    dw = g.width;
    dh = dw / vAspect;
  }else{
    dh = g.height;
    dw = dh * vAspect;
  }

  let vx = (g.width - dw) / 2;
  let vy = (g.height - dh) / 2;

  g.push();
    g.clear();
    g.translate(vx + dw, vy);
    g.scale(-1, 1);
    g.image(cam, 0, 0, dw, dh);
  g.pop();
}

//EFFECTS
function applyEffectToGfx(g, id){
  if(id === 0) return;

  g.loadPixels();

  if(id === 7){
    let block = 10;
    for(let y = 0; y < g.height; y += block){
      for(let x = 0; x < g.width; x += block){
        let idx = 4 * (y * g.width + x);
        let r = g.pixels[idx];
        let gg = g.pixels[idx + 1];
        let b = g.pixels[idx + 2];

        for(let yy = y; yy < y + block && yy < g.height; yy++){
          for(let xx = x; xx < x + block && xx < g.width; xx++){
            let ii = 4 * (yy * g.width + xx);
            g.pixels[ii] = r;
            g.pixels[ii + 1] = gg;
            g.pixels[ii + 2] = b;
          }
        }
      }
    }
    g.updatePixels();
    return;
  }

  let step = max(1, int(pixelStep));

  for(let y = 0; y < g.height; y += step){
    for(let x = 0; x < g.width; x += step){
      let i = 4 * (y * g.width + x);

      let r = g.pixels[i];
      let gg = g.pixels[i + 1];
      let b = g.pixels[i + 2];

      let nr = r, ng = gg, nb = b;

      if(id === 1){
        let lum = 0.2126*r + 0.7152*gg + 0.0722*b;
        nr = lum; ng = lum; nb = lum;
      }else if(id === 2){
        nr = 255 - r; ng = 255 - gg; nb = 255 - b;
      }else if(id === 3){
        let lum = 0.2126*r + 0.7152*gg + 0.0722*b;
        let v = (lum > 120) ? 255 : 0;
        nr = v; ng = v; nb = v;
      }else if(id === 4){
        let levels = 4;
        nr = floor(r/255*(levels-1))*(255/(levels-1));
        ng = floor(gg/255*(levels-1))*(255/(levels-1));
        nb = floor(b/255*(levels-1))*(255/(levels-1));
      }else if(id === 5){
        let lum = 0.2126*r + 0.7152*gg + 0.0722*b;
        let v = (lum > 128) ? 220 : 35;
        nr = v; ng = v; nb = v;
      }else if(id === 6){
        nr = r*0.8; ng = gg*0.9; nb = min(255, b*1.25);
      }else if(id === 8){
        nr = r; ng = 0; nb = 0;
      }

      for(let yy = y; yy < y + step && yy < g.height; yy++){
        for(let xx = x; xx < x + step && xx < g.width; xx++){
          let ii = 4 * (yy * g.width + xx);
          g.pixels[ii] = nr;
          g.pixels[ii + 1] = ng;
          g.pixels[ii + 2] = nb;
        }
      }
    }
  }

  g.updatePixels();
}

//TRACKING
function updateTrackedFaces(){
  for(let f of trackedFaces) f.lastSeen++;

  if(!facesReady) return;
  if(!activeGfx) return;

  let dets = [];

  for(let pred of faceResults){
    let bb = getFaceBBoxFromPrediction(pred);
    if(!bb) continue;

    let mapped = mapCamBBoxToFrame(bb);
    if(!mapped) continue;

    dets.push(mapped);
  }

  for(let d of dets){
    let best = null;
    let bestDist = 999999;

    for(let f of trackedFaces){
      let dd = dist(d.cx, d.cy, f.cx, f.cy);
      if(dd < bestDist){
        bestDist = dd;
        best = f;
      }
    }

    if(best && bestDist < matchDist){
      best.x = d.x; best.y = d.y; best.w = d.w; best.h = d.h;
      best.cx = d.cx; best.cy = d.cy;
      best.lastSeen = 0;
    }else{
      trackedFaces.push({
        id: nextFaceId++,
        x: d.x, y: d.y, w: d.w, h: d.h,
        cx: d.cx, cy: d.cy,
        consented: false,
        lastSeen: 0
      });
    }
  }

  trackedFaces = trackedFaces.filter(f => f.lastSeen <= faceTTL);
}

function getActiveFaces(){
  return trackedFaces.filter(f => f.lastSeen < 3);
}

function isAllActiveFacesConsented(){
  let active = getActiveFaces();
  if(active.length === 0) return false;

  for(let f of active){
    if(!f.consented) return false;
  }
  return true;
}

function getFaceBBoxFromPrediction(pred){
  if(pred.boundingBox && pred.boundingBox.topLeft && pred.boundingBox.bottomRight){
    let tl = pred.boundingBox.topLeft[0];
    let br = pred.boundingBox.bottomRight[0];

    let x = tl[0];
    let y = tl[1];
    let w = br[0] - tl[0];
    let h = br[1] - tl[1];

    return { x:x, y:y, w:w, h:h };
  }

  if(pred.scaledMesh && pred.scaledMesh.length > 0){
    let minX = 999999, minY = 999999, maxX = -999999, maxY = -999999;
    for(let pt of pred.scaledMesh){
      minX = min(minX, pt[0]);
      minY = min(minY, pt[1]);
      maxX = max(maxX, pt[0]);
      maxY = max(maxY, pt[1]);
    }
    return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
  }

  return null;
}

function mapCamBBoxToFrame(bb){
  let vw = cam.elt.videoWidth || cam.width || 1280;
  let vh = cam.elt.videoHeight || cam.height || 720;

  let gW = activeGfx.width;
  let gH = activeGfx.height;

  let vAspect = vw / vh;
  let gAspect = gW / gH;

  let dw, dh;
  if(gAspect > vAspect){
    dw = gW;
    dh = dw / vAspect;
  }else{
    dh = gH;
    dw = dh * vAspect;
  }

  let vx = (gW - dw) / 2;
  let vy = (gH - dh) / 2;

  let sx = dw / vw;
  let sy = dh / vh;

  let gx = vx + bb.x * sx;
  let gy = vy + bb.y * sy;
  let gw = bb.w * sx;
  let gh = bb.h * sy;

  //mirror x
  let mx = (vx + dw) - (gx + gw);

  let fx = frameRect.x + (mx / gW) * frameRect.w;
  let fy = frameRect.y + (gy / gH) * frameRect.h;
  let fw = (gw / gW) * frameRect.w;
  let fh = (gh / gH) * frameRect.h;

  return { x:fx, y:fy, w:fw, h:fh, cx:fx + fw/2, cy:fy + fh/2 };
}

//OK GESTURE -> CONSENT
function applyOkGestureConsent(){
  if(!handsReady){
    okLive = false;
    okHoldMs = 0;
    okRemainingS = okHoldMsTarget / 1000;
    return;
  }

  if(okCooldown > 0){
    okCooldown--;
    okLive = false;
    okHoldMs = 0;
    okRemainingS = okHoldMsTarget / 1000;
    return;
  }

  let active = getActiveFaces();
  if(active.length === 0){
    okLive = false;
    okHoldMs = 0;
    okRemainingS = okHoldMsTarget / 1000;
    return;
  }

  let okThisFrame = false;
  let bestHandCenter = null;

  for(let h of handResults){
    if(!h.landmarks || h.landmarks.length < 21) continue;

    let hb = getHandBBox(h.landmarks);
    let diag = dist(hb.minX, hb.minY, hb.maxX, hb.maxY);
    if(diag < minHandSize) continue;

    if(isOkGesture(h.landmarks)){
      okThisFrame = true;
      bestHandCenter = getHandCenter(h.landmarks);
      break;
    }
  }

  if(okThisFrame){
    okHoldMs += deltaTime;
  }else{
    okHoldMs = 0;
  }

  okLive = okThisFrame;
  okRemainingS = max(0, (okHoldMsTarget - okHoldMs) / 1000);

  if(okHoldMs >= okHoldMsTarget && bestHandCenter){
    let nearest = getNearestFace(bestHandCenter.x, bestHandCenter.y);

    if(nearest && !nearest.consented){
      nearest.consented = true;
      statusMsg = 'Consent granted';
      consentFlash = 45;
    }

    okHoldMs = 0;
    okLive = false;
    okRemainingS = okHoldMsTarget / 1000;
    okCooldown = okCooldownDur;
  }
}

function getHandBBox(lm){
  let minX = 999999, minY = 999999, maxX = -999999, maxY = -999999;

  for(let pt of lm){
    minX = min(minX, pt[0]);
    minY = min(minY, pt[1]);
    maxX = max(maxX, pt[0]);
    maxY = max(maxY, pt[1]);
  }

  return { minX, minY, maxX, maxY };
}

function getHandCenter(lm){
  let pts = [0, 5, 9, 13, 17];
  let sx = 0, sy = 0;
  for(let idx of pts){
    sx += lm[idx][0];
    sy += lm[idx][1];
  }
  sx /= pts.length;
  sy /= pts.length;

  return mapCamPointToFrame(sx, sy);
}

function mapCamPointToFrame(px, py){
  let vw = cam.elt.videoWidth || cam.width || 1280;
  let vh = cam.elt.videoHeight || cam.height || 720;

  let gW = activeGfx ? activeGfx.width : vw;
  let gH = activeGfx ? activeGfx.height : vh;

  let vAspect = vw / vh;
  let gAspect = gW / gH;

  let dw, dh;
  if(gAspect > vAspect){
    dw = gW;
    dh = dw / vAspect;
  }else{
    dh = gH;
    dw = dh * vAspect;
  }

  let vx = (gW - dw) / 2;
  let vy = (gH - dh) / 2;

  let sx = dw / vw;
  let sy = dh / vh;

  let gx = vx + px * sx;
  let gy = vy + py * sy;

  //mirror x
  let mx = (vx + dw) - gx;

  let fx = frameRect.x + (mx / gW) * frameRect.w;
  let fy = frameRect.y + (gy / gH) * frameRect.h;

  return { x:fx, y:fy };
}

function getNearestFace(x, y){
  let active = getActiveFaces();
  if(active.length === 0) return null;

  let best = null;
  let bestDist = 999999;

  for(let f of active){
    let d = dist(x, y, f.cx, f.cy);
    if(d < bestDist){
      bestDist = d;
      best = f;
    }
  }
  return best;
}

function isOkGesture(lm){
  let wrist = lm[0];

  let thumbTip = lm[4];
  let indexTip = lm[8];

  let pinch = dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]);

  let midMcp = lm[9];
  let handSize = dist(wrist[0], wrist[1], midMcp[0], midMcp[1]);

  let pinchOk = pinch < handSize * pinchRatio;

  let indexPip = lm[6];
  let idxTipD = dist(indexTip[0], indexTip[1], wrist[0], wrist[1]);
  let idxPipD = dist(indexPip[0], indexPip[1], wrist[0], wrist[1]);
  let indexCurled = idxTipD < idxPipD + 6;

  let midTip = lm[12], midPip = lm[10];
  let ringTip = lm[16], ringPip = lm[14];
  let pinkyTip = lm[20], pinkyPip = lm[18];

  let midOpen =
    dist(midTip[0], midTip[1], wrist[0], wrist[1]) >
    dist(midPip[0], midPip[1], wrist[0], wrist[1]) + openMargin;

  let ringOpen =
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) >
    dist(ringPip[0], ringPip[1], wrist[0], wrist[1]) + openMargin;

  let pinkyOpen =
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) >
    dist(pinkyPip[0], pinkyPip[1], wrist[0], wrist[1]) + openMargin;

  let openCount = (midOpen?1:0) + (ringOpen?1:0) + (pinkyOpen?1:0);

  return pinchOk && indexCurled && openCount >= 2;
}

//BLUR (ONLY INSIDE FRAME)
function blurNonConsentedFacesInFrame(){
  if(!blurSlider) return;

  let blockSize = blurSlider.value();
  let active = getActiveFaces();

  for(let f of active){
    if(f.consented) continue;

    let r = intersectRect(
      { x:f.x, y:f.y, w:f.w, h:f.h },
      frameRect
    );
    if(!r) continue;

    let x1 = int(r.x);
    let y1 = int(r.y);
    let w1 = int(r.w);
    let h1 = int(r.h);

    x1 = constrain(x1, int(frameRect.x), int(frameRect.x + frameRect.w - 1));
    y1 = constrain(y1, int(frameRect.y), int(frameRect.y + frameRect.h - 1));
    w1 = constrain(w1, 1, int(frameRect.x + frameRect.w) - x1);
    h1 = constrain(h1, 1, int(frameRect.y + frameRect.h) - y1);

    let boxImg = get(x1, y1, w1, h1);
    boxImg.loadPixels();

    noStroke();
    for(let y = 0; y < h1; y += blockSize){
      for(let x = 0; x < w1; x += blockSize){
        let idx = 4 * (y * w1 + x);
        fill(boxImg.pixels[idx], boxImg.pixels[idx+1], boxImg.pixels[idx+2]);
        rect(x1 + x, y1 + y, min(blockSize, w1-x), min(blockSize, h1-y));
      }
    }

    fill(0, 0, 0, 30);
    rect(x1, y1, w1, h1);
  }
}

function intersectRect(a, b){
  let x = max(a.x, b.x);
  let y = max(a.y, b.y);
  let r = min(a.x + a.w, b.x + b.w);
  let t = min(a.y + a.h, b.y + b.h);

  let w = r - x;
  let h = t - y;

  if(w <= 0 || h <= 0) return null;
  return { x:x, y:y, w:w, h:h };
}

//FACE BOX UI
function drawFaceBoxesML(){
  let active = getActiveFaces();

  push();
    textAlign(LEFT, CENTER);
    textSize(14);

    for(let f of active){
      let r = intersectRect({x:f.x,y:f.y,w:f.w,h:f.h}, frameRect);
      if(!r) continue;

      stroke(255, f.consented ? 255 : 170);
      strokeWeight(f.consented ? 3 : 2);
      noFill();
      rect(f.x, f.y, f.w, f.h);

      let label = f.consented ? 'CONSENTED' : 'NOT CONSENTED';

      noStroke();
      fill(0, 0, 0, 150);
      let chipW = min(f.w, textWidth(label) + 18);
      rect(f.x, f.y - 34, chipW, 26, 10);

      fill(255);
      text(label, f.x + 10, f.y - 21);
    }
  pop();
}

//LAYOUT HELPERS
function getFrameRectMax(){
  let topY = bannerH + topPad + statusBoxH + 12;
  let bottomY = height - captureZoneH - topPad;

  let availH = max(10, bottomY - topY);
  let availW = max(10, width - sidePad*2);

  let w = availW;
  let h = w / targetAspect;

  if(h > availH){
    h = availH;
    w = h * targetAspect;
  }

  return { x:(width-w)/2, y:topY + (availH-h)/2, w:w, h:h };
}

function getGridCells(rect){
  let gap = 10;
  let cellW = (rect.w - gap*2) / 3;
  let cellH = (rect.h - gap*2) / 3;

  let cells = [];
  for(let r = 0; r < 3; r++){
    for(let c = 0; c < 3; c++){
      cells.push({
        x: rect.x + c*(cellW+gap),
        y: rect.y + r*(cellH+gap),
        w: cellW,
        h: cellH
      });
    }
  }
  return cells;
}

//UI DRAW
function drawTopBanner(msg, col){
  push();
    noStroke();
    fill(col);
    rect(0, 0, width, bannerH);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(msg, width/2, bannerH/2);
  pop();
}

function drawStatusTopLeft(){
  let active = getActiveFaces();

  let lockReason = '';
  if(active.length === 0) lockReason = 'No face detected yet.';
  else if(!isAllActiveFacesConsented()) lockReason = 'At least one face has not consented.';
  else lockReason = 'All detected faces have consented.';

  let extra = '';
  if(consentFlash > 0) extra = '  |  ' + statusMsg;

  push();
    noStroke();
    fill(0, 0, 0, 160);
    rect(sidePad, bannerH + topPad, statusBoxW, statusBoxH, 14);

    fill(255);
    textAlign(LEFT, CENTER);
    textSize(15);
    text('Status: ' + lockReason + extra, sidePad + 14, bannerH + topPad + statusBoxH/2);
  pop();
}

function drawBottomBar(){
  push();
    noStroke();
    fill(0);
    rect(0, height - captureZoneH, width, captureZoneH);

    stroke(255, 70);
    strokeWeight(2);
    line(0, height - captureZoneH, width, height - captureZoneH);

    //shutter
    shutX = width/2;
    shutY = height - captureZoneH/2;

    noFill();
    stroke(255, captureEnabled ? 220 : 120);
    strokeWeight(6);
    circle(shutX, shutY, shutR*2);

    noStroke();
    fill(255, captureEnabled ? 235 : 90);
    circle(shutX, shutY, shutInnerR*2);

    fill(0, 70);
    circle(shutX, shutY, 6);

    //effects button
    fxBtnX = width - sidePad - 50;
    fxBtnY = height - captureZoneH/2;

    noStroke();
    fill(255, 24);
    circle(fxBtnX, fxBtnY, fxBtnR*2);

    fill(255, 200);
    let d = 4;
    let s = 9;
    for(let rr = -1; rr <= 1; rr++){
      for(let cc = -1; cc <= 1; cc++){
        circle(fxBtnX + cc*s, fxBtnY + rr*s, d);
      }
    }
  pop();
}

//INTRO POPUP
function drawIntroPopup(){
  push();
    noStroke();
    fill(0, 0, 0, 170);
    rect(0, 0, width, height);

    let w = min(620, width - 40);
    let h = 250;
    let x = (width - w) / 2;
    let y = (height - h) / 2;

    fill(255, 255, 255, 20);
    rect(x, y, w, h, 20);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(28);
    text('Welcome to the Consent Camera!', x + 24, y + 22);

    textSize(16);
    fill(255, 235);
    text('How it works', x + 24, y + 76);

    textSize(15);
    fill(255, 215);
    text(
      '• Faces are blurred by default.\n' +
      '• Each person must HOLD an OK hand sign for 3 seconds to consent.\n' +
      '• When everyone is consented, you can take a photo and open filters.\n\n' +
      'Click OK to begin.',
      x + 24, y + 108
    );

    //button
    let bx = x + w - 150;
    let by = y + h - 62;
    let bw = 120;
    let bh = 42;

    fill(255, 255, 255, 40);
    rect(bx, by, bw, bh, 16);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('OK', bx + bw/2, by + bh/2);

    introBtn = { x:bx, y:by, w:bw, h:bh };
  pop();
}

//INPUT
function mousePressed(){
  if(introOn){
    if(introBtn &&
       mouseX >= introBtn.x && mouseX <= introBtn.x + introBtn.w &&
       mouseY >= introBtn.y && mouseY <= introBtn.y + introBtn.h){
      introOn = false;
      warnOn = false;
      warnTimer = 0;
    }
    return;
  }

  if(gridOn){
    if(selectGridCell(mouseX, mouseY)) return;
  }

  if(overFxBtn(mouseX, mouseY)){
    if(!isAllActiveFacesConsented()){
      triggerWarning('filters');
      return;
    }
    gridOn = !gridOn;
    return;
  }

  if(!gridOn && overShutter(mouseX, mouseY)){
    tryCapture();
  }
}

function overShutter(mx, my){
  return dist(mx, my, shutX, shutY) <= shutR;
}

function overFxBtn(mx, my){
  return dist(mx, my, fxBtnX, fxBtnY) <= fxBtnR;
}

function selectGridCell(mx, my){
  if(!gridOn) return false;

  let cells = getGridCells(frameRect);

  for(let i = 0; i < cells.length; i++){
    let c = cells[i];
    if(mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h){
      activeEffect = i;
      gridOn = false;
      return true;
    }
  }
  return false;
}

//CAPTURE
function tryCapture(){
  if(!captureEnabled){
    triggerWarning('capture');
    return;
  }

  statusMsg = 'Captured at ' + new Date().toLocaleTimeString();
  downloadCapture();
}

function downloadCapture(){
  if(!activeGfx) return;

  drawCamIntoGfx(activeGfx);
  applyEffectToGfx(activeGfx, activeEffect);

  let shot = activeGfx.get();
  let now = new Date();
  let stamp =
    now.getFullYear() + '-' +
    nf(now.getMonth()+1,2) + '-' +
    nf(now.getDate(),2) + '_' +
    nf(now.getHours(),2) + '-' +
    nf(now.getMinutes(),2) + '-' +
    nf(now.getSeconds(),2);

  save(shot, 'consent_camera_' + stamp + '.png');
}

//WARNING
function triggerWarning(type = 'capture'){
  warnType = type;
  warnOn = true;
  warnTimer = 0;
  statusMsg = '';
}

function drawWarning(){
  warnLayer.clear();

  let flash = frameCount % 10 < 5;

  warnLayer.push();
    warnLayer.noStroke();
    warnLayer.fill(0, 0, 0, 140);
    warnLayer.rect(0, 0, width, height);

    if(flash){
      warnLayer.stroke(255, 60, 60);
      warnLayer.strokeWeight(18);
      warnLayer.noFill();
      warnLayer.rect(10, 10, width - 20, height - 20);
    }

    warnLayer.noStroke();
    warnLayer.fill(255);
    warnLayer.textAlign(CENTER, CENTER);
    warnLayer.textSize(44);
    warnLayer.text('STOP', width/2, height/2 - 60);

    warnLayer.textSize(18);

    if(warnType === 'filters'){
      warnLayer.text('Filters are locked until everyone consents.', width/2, height/2 - 10);
      warnLayer.text('Hold an OK sign for 3 seconds (nearest face).', width/2, height/2 + 22);
    }else{
      warnLayer.text('Not everyone in frame has consented.', width/2, height/2 - 10);
      warnLayer.text('Hold an OK sign for 3 seconds to consent.', width/2, height/2 + 22);
    }
  warnLayer.pop();

  image(warnLayer, 0, 0);

  warnTimer++;
  if(warnTimer > warnDur){
    warnOn = false;
    warnTimer = 0;
  }
}

//DOM MENU
function buildMenu(){
  menu = createDiv('');
  menu.parent(mountEl);

  menu.style('width', '420px');
  menu.style('border-radius', '18px');
  menu.style('background', 'rgba(0,0,0,0.46)');
  menu.style('backdrop-filter', 'blur(12px)');
  menu.style('-webkit-backdrop-filter', 'blur(12px)');
  menu.style('box-shadow', '0 12px 34px rgba(0,0,0,0.28)');
  menu.style('font-family', 'system-ui');
  menu.style('color', 'rgba(255,255,255,0.92)');
  menu.style('overflow', 'hidden');

  menuHeader = createDiv('');
  menuHeader.parent(menu);
  menuHeader.style('display', 'flex');
  menuHeader.style('align-items', 'center');
  menuHeader.style('justify-content', 'space-between');
  menuHeader.style('padding', '12px 14px');
  menuHeader.style('user-select', 'none');
  menuHeader.style('border-bottom', '1px solid rgba(255,255,255,0.10)');

  let title = createDiv('Consent Camera Menu');
  title.parent(menuHeader);
  title.style('font-weight', '650');
  title.style('font-size', '14px');

  menuArrow = createDiv('▴');
  menuArrow.parent(menuHeader);
  menuArrow.style('font-size', '14px');
  menuArrow.style('opacity', '0.9');
  menuArrow.style('cursor', 'pointer');

  menuContent = createDiv('');
  menuContent.parent(menu);
  menuContent.style('padding', '12px 14px');
  menuContent.style('display', 'block');
  menuContent.style('max-height', '340px');
  menuContent.style('overflow-y', 'auto');

  menuArrow.mousePressed(toggleMenu);

  let hint = createDiv('Tip: hold an OK sign for ~3 seconds to consent.');
  hint.parent(menuContent);
  hint.style('font-size', '12px');
  hint.style('color', 'rgba(255,255,255,0.82)');
  hint.style('margin-bottom', '12px');

  resetBtn = createButton('Reset Session');
  resetBtn.parent(menuContent);
  resetBtn.style('width', '100%');
  resetBtn.style('margin-bottom', '12px');
  styleDarkButton(resetBtn);
  resetBtn.mousePressed(resetSession);

  let blurLab = createDiv('Blur Block Size');
  blurLab.parent(menuContent);
  blurLab.style('font-size', '12px');
  blurLab.style('color', 'rgba(255,255,255,0.88)');
  blurLab.style('margin-bottom', '6px');

  blurSlider = createSlider(6, 40, defaultBlur, 1);
  blurSlider.parent(menuContent);
  blurSlider.style('width', '100%');
}

function toggleMenu(){
  menuExpanded = !menuExpanded;
  menuContent.style('display', menuExpanded ? 'block' : 'none');
  menuArrow.html(menuExpanded ? '▴' : '▾');
}

function positionMenuTopRight(){
  if(!menu) return;

  let w = menu.elt.getBoundingClientRect().width;
  let x = width - w - sidePad;
  let y = bannerH + topPad;

  menu.position(x, y);
}

function styleDarkButton(btn){
  btn.style('background', 'rgba(255,255,255,0.14)');
  btn.style('border', '1px solid rgba(255,255,255,0.20)');
  btn.style('color', 'rgba(255,255,255,0.94)');
  btn.style('border-radius', '14px');
  btn.style('padding', '12px 12px');
  btn.style('cursor', 'pointer');
}

function resetSession(){
  for(let f of trackedFaces) f.consented = false;

  warnOn = false;
  warnTimer = 0;
  statusMsg = '';
  consentFlash = 0;

  okHoldMs = 0;
  okLive = false;
  okRemainingS = okHoldMsTarget / 1000;
  okCooldown = 0;

  if(blurSlider) blurSlider.value(defaultBlur);
  activeEffect = 0;
  gridOn = false;
}
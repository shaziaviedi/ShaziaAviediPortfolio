//VARIABLES

//-camera input is cam
//-canvas is mounted into #sketch-consent-camera (via run.js)
//-warning overlay layer is warnLayer

//DOM
//-createCapture() webcam
//-createDiv() menu + popup
//-createButton() Reset
//-createSlider() blur size
//-createGraphics() buffers (warnLayer, activeGfx, fxGfx)

//ML
//-faceModel is facemesh/faceMesh
//-handModel is handpose/handPose
//-trackedFaces is my "memory" so consent sticks a bit when ppl move

window.makeConsentCameraSketch = (p, mountEl) => {
  let cam;

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

  let pixelStep = 2;//skip pixels in effects (performance)
  let previewCursor = 0;//round robin preview update

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

  //tune these so faces dont "reset" too fast
  let faceTTL = 60;     //frames before i consider a face gone
  let matchDist = 120;  //px distance for matching same face across frames

  //consent feedback
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

  //SANITY: mount element should exist
  function ensureMount(){
    if(!mountEl){
      console.warn('Consent Camera: mountEl is missing. Check run.js + the div id.');
      return;
    }
    //make mount a positioning context so menu coords behave
    mountEl.style.position = 'relative';
    mountEl.style.overflow = 'hidden';
  }

  //canvas should be sized off the div width
  function getMountSize(){
    if(!mountEl) return { w: 900, h: 700 };

    let r = mountEl.getBoundingClientRect();
    let w = p.max(320, p.floor(r.width));

    //frame wants 16:9 plus top banner/status and bottom capture bar
    let frameH = w / targetAspect;
    let uiH = bannerH + topPad + statusBoxH + 12 + captureZoneH + topPad + 28;
    let h = p.floor(frameH + uiH);

    return { w, h };
  }

  p.setup = function(){
    ensureMount();

    let s = getMountSize();

    //IMPORTANT: actually mount the canvas into the div
    let cnv = p.createCanvas(s.w, s.h);
    p.pixelDensity(1);

    if(mountEl){
      cnv.parent(mountEl);
      cnv.style('display', 'block');
    }

    //webcam
    cam = p.createCapture({
      video:{ width:{ ideal:1280 }, height:{ ideal:720 }, facingMode:'user' },
      audio:false
    });

    cam.hide();

    //mobile safari
    if(cam.elt) cam.elt.setAttribute('playsinline', '');

    //force a predictable size so cam.width/cam.height become valid
    cam.size(1280, 720);

    //video readiness
    if(cam.elt){
      cam.elt.onloadedmetadata = () => { camReady = true; };
      cam.elt.onplaying = () => { camReady = true; };
    }

    warnLayer = p.createGraphics(p.width, p.height);
    warnLayer.pixelDensity(1);

    fxGfx = [];
    for(let i = 0; i < fxCount; i++){
      let g = p.createGraphics(fxW, fxH);
      g.pixelDensity(1);
      fxGfx.push(g);
    }

    buildMenu();
    p.textFont('system-ui');

    initMLModels();
  };

  p.draw = function(){
    p.background(0);

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

    updateTrackedFaces();
    applyOkGestureConsent();

    captureEnabled = getActiveFaces().length > 0 && isAllActiveFacesConsented();

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
  };

  p.windowResized = function(){
    //resize to the div width (not the window)
    let s = getMountSize();
    p.resizeCanvas(s.w, s.h);

    warnLayer = p.createGraphics(p.width, p.height);
    warnLayer.pixelDensity(1);

    //menu stays in the right spot after resize
    positionMenuTopRight();
  };

  function drawLoadingScreen(){
    p.push();
      p.noStroke();
      p.fill(0);
      p.rect(0, 0, p.width, p.height);

      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text('Waiting for camera permission / loading video...', p.width/2, p.height/2 - 10);

      p.fill(255, 180);
      p.textSize(13);
      p.text("If you don’t see a permission prompt, check browser camera settings.", p.width/2, p.height/2 + 18);
    p.pop();
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
      p.image(fxGfx[i], cells[i].x, cells[i].y, cells[i].w, cells[i].h);
    }

    p.push();
      p.noFill();
      p.stroke(255);
      p.strokeWeight(3);
      p.rect(cells[activeEffect].x, cells[activeEffect].y, cells[activeEffect].w, cells[activeEffect].h);
    p.pop();
  }

  //HIGH-QUALITY ACTIVE
  function initActiveGfx(){
    //use real video dimensions when possible
    let vw = (cam && cam.elt) ? cam.elt.videoWidth : 0;
    let vh = (cam && cam.elt) ? cam.elt.videoHeight : 0;

    //fallback
    if(!vw || !vh){
      vw = cam ? cam.width : 0;
      vh = cam ? cam.height : 0;
    }

    if(!vw || !vh) return;

    if(!activeGfx || activeGfx.width !== vw || activeGfx.height !== vh){
      activeGfx = p.createGraphics(vw, vh);
      activeGfx.pixelDensity(1);
    }
  }

  function drawActiveToRect(rect){
    if(!activeGfx) return;

    drawCamIntoGfx(activeGfx);
    applyEffectToGfx(activeGfx, activeEffect);

    p.image(activeGfx, rect.x, rect.y, rect.w, rect.h);
  }

  //GRID LIVE
  function bakeAllTilesOnce(){
    for(let i = 0; i < fxCount; i++) updateTile(i);
  }

  function updateGridLiveTiles(){
    updateTile(activeEffect);

    if(p.frameCount % 2 !== 0) return;

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

    let step = p.max(1, p.int(pixelStep));

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
          nr = p.floor(r/255*(levels-1))*(255/(levels-1));
          ng = p.floor(gg/255*(levels-1))*(255/(levels-1));
          nb = p.floor(b/255*(levels-1))*(255/(levels-1));
        }else if(id === 5){
          let lum = 0.2126*r + 0.7152*gg + 0.0722*b;
          let v = (lum > 128) ? 220 : 35;
          nr = v; ng = v; nb = v;
        }else if(id === 6){
          nr = r*0.8; ng = gg*0.9; nb = p.min(255, b*1.25);
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

  //--- everything below here is the same ---

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
        let dd = p.dist(d.cx, d.cy, f.cx, f.cy);
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
        minX = p.min(minX, pt[0]);
        minY = p.min(minY, pt[1]);
        maxX = p.max(maxX, pt[0]);
        maxY = p.max(maxY, pt[1]);
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
      let diag = p.dist(hb.minX, hb.minY, hb.maxX, hb.maxY);
      if(diag < minHandSize) continue;

      if(isOkGesture(h.landmarks)){
        okThisFrame = true;
        bestHandCenter = getHandCenter(h.landmarks);
        break;
      }
    }

    if(okThisFrame){
      okHoldMs += p.deltaTime;
    }else{
      okHoldMs = 0;
    }

    okLive = okThisFrame;
    okRemainingS = p.max(0, (okHoldMsTarget - okHoldMs) / 1000);

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
      minX = p.min(minX, pt[0]);
      minY = p.min(minY, pt[1]);
      maxX = p.max(maxX, pt[0]);
      maxY = p.max(maxY, pt[1]);
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
      let d = p.dist(x, y, f.cx, f.cy);
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

    let pinch = p.dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]);

    let midMcp = lm[9];
    let handSize = p.dist(wrist[0], wrist[1], midMcp[0], midMcp[1]);

    let pinchOk = pinch < handSize * pinchRatio;

    let indexPip = lm[6];
    let idxTipD = p.dist(indexTip[0], indexTip[1], wrist[0], wrist[1]);
    let idxPipD = p.dist(indexPip[0], indexPip[1], wrist[0], wrist[1]);
    let indexCurled = idxTipD < idxPipD + 6;

    let midTip = lm[12], midPip = lm[10];
    let ringTip = lm[16], ringPip = lm[14];
    let pinkyTip = lm[20], pinkyPip = lm[18];

    let midOpen =
      p.dist(midTip[0], midTip[1], wrist[0], wrist[1]) >
      p.dist(midPip[0], midPip[1], wrist[0], wrist[1]) + openMargin;

    let ringOpen =
      p.dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) >
      p.dist(ringPip[0], ringPip[1], wrist[0], wrist[1]) + openMargin;

    let pinkyOpen =
      p.dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) >
      p.dist(pinkyPip[0], pinkyPip[1], wrist[0], wrist[1]) + openMargin;

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

      let x1 = p.int(r.x);
      let y1 = p.int(r.y);
      let w1 = p.int(r.w);
      let h1 = p.int(r.h);

      x1 = p.constrain(x1, p.int(frameRect.x), p.int(frameRect.x + frameRect.w - 1));
      y1 = p.constrain(y1, p.int(frameRect.y), p.int(frameRect.y + frameRect.h - 1));
      w1 = p.constrain(w1, 1, p.int(frameRect.x + frameRect.w) - x1);
      h1 = p.constrain(h1, 1, p.int(frameRect.y + frameRect.h) - y1);

      let boxImg = p.get(x1, y1, w1, h1);
      boxImg.loadPixels();

      p.noStroke();
      for(let y = 0; y < h1; y += blockSize){
        for(let x = 0; x < w1; x += blockSize){
          let idx = 4 * (y * w1 + x);
          p.fill(boxImg.pixels[idx], boxImg.pixels[idx+1], boxImg.pixels[idx+2]);
          p.rect(x1 + x, y1 + y, p.min(blockSize, w1-x), p.min(blockSize, h1-y));
        }
      }

      p.fill(0, 0, 0, 30);
      p.rect(x1, y1, w1, h1);
    }
  }

  function intersectRect(a, b){
    let x = p.max(a.x, b.x);
    let y = p.max(a.y, b.y);
    let r = p.min(a.x + a.w, b.x + b.w);
    let t = p.min(a.y + a.h, b.y + b.h);

    let w = r - x;
    let h = t - y;

    if(w <= 0 || h <= 0) return null;
    return { x:x, y:y, w:w, h:h };
  }

  //FACE BOX UI
  function drawFaceBoxesML(){
    let active = getActiveFaces();

    p.push();
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);

      for(let f of active){
        let r = intersectRect({x:f.x,y:f.y,w:f.w,h:f.h}, frameRect);
        if(!r) continue;

        p.stroke(255, f.consented ? 255 : 170);
        p.strokeWeight(f.consented ? 3 : 2);
        p.noFill();
        p.rect(f.x, f.y, f.w, f.h);

        let label = f.consented ? 'CONSENTED' : 'NOT CONSENTED';

        p.noStroke();
        p.fill(0, 0, 0, 150);
        let chipW = p.min(f.w, p.textWidth(label) + 18);
        p.rect(f.x, f.y - 34, chipW, 26, 10);

        p.fill(255);
        p.text(label, f.x + 10, f.y - 21);
      }
    p.pop();
  }

  //LAYOUT HELPERS
  function getFrameRectMax(){
    let topY = bannerH + topPad + statusBoxH + 12;
    let bottomY = p.height - captureZoneH - topPad;

    let availH = p.max(10, bottomY - topY);
    let availW = p.max(10, p.width - sidePad*2);

    let w = availW;
    let h = w / targetAspect;

    if(h > availH){
      h = availH;
      w = h * targetAspect;
    }

    return { x:(p.width-w)/2, y:topY + (availH-h)/2, w:w, h:h };
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
    p.push();
      p.noStroke();
      p.fill(col);
      p.rect(0, 0, p.width, bannerH);

      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(msg, p.width/2, bannerH/2);
    p.pop();
  }

  function drawStatusTopLeft(){
    let active = getActiveFaces();

    let lockReason = '';
    if(active.length === 0) lockReason = 'No face detected yet.';
    else if(!isAllActiveFacesConsented()) lockReason = 'At least one face has not consented.';
    else lockReason = 'All detected faces have consented.';

    let extra = '';
    if(consentFlash > 0) extra = '  |  ' + statusMsg;

    p.push();
      p.noStroke();
      p.fill(0, 0, 0, 160);
      p.rect(sidePad, bannerH + topPad, statusBoxW, statusBoxH, 14);

      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(15);
      p.text('Status: ' + lockReason + extra, sidePad + 14, bannerH + topPad + statusBoxH/2);
    p.pop();
  }

  function drawBottomBar(){
    p.push();
      p.noStroke();
      p.fill(0);
      p.rect(0, p.height - captureZoneH, p.width, captureZoneH);

      p.stroke(255, 70);
      p.strokeWeight(2);
      p.line(0, p.height - captureZoneH, p.width, p.height - captureZoneH);

      //shutter
      shutX = p.width/2;
      shutY = p.height - captureZoneH/2;

      p.noFill();
      p.stroke(255, captureEnabled ? 220 : 120);
      p.strokeWeight(6);
      p.circle(shutX, shutY, shutR*2);

      p.noStroke();
      p.fill(255, captureEnabled ? 235 : 90);
      p.circle(shutX, shutY, shutInnerR*2);

      p.fill(0, 70);
      p.circle(shutX, shutY, 6);

      //effects button
      fxBtnX = p.width - sidePad - 50;
      fxBtnY = p.height - captureZoneH/2;

      p.noStroke();
      p.fill(255, 24);
      p.circle(fxBtnX, fxBtnY, fxBtnR*2);

      p.fill(255, 200);
      let d = 4;
      let s = 9;
      for(let rr = -1; rr <= 1; rr++){
        for(let cc = -1; cc <= 1; cc++){
          p.circle(fxBtnX + cc*s, fxBtnY + rr*s, d);
        }
      }
    p.pop();
  }

  //INTRO POPUP
  function drawIntroPopup(){
    p.push();
      p.noStroke();
      p.fill(0, 0, 0, 170);
      p.rect(0, 0, p.width, p.height);

      let w = p.min(620, p.width - 40);
      let h = 250;
      let x = (p.width - w) / 2;
      let y = (p.height - h) / 2;

      p.fill(255, 255, 255, 20);
      p.rect(x, y, w, h, 20);

      p.fill(255);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(28);
      p.text('Welcome to the Consent Camera!', x + 24, y + 22);

      p.textSize(16);
      p.fill(255, 235);
      p.text('How it works', x + 24, y + 76);

      p.textSize(15);
      p.fill(255, 215);
      p.text(
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

      p.fill(255, 255, 255, 40);
      p.rect(bx, by, bw, bh, 16);

      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('OK', bx + bw/2, by + bh/2);

      introBtn = { x:bx, y:by, w:bw, h:bh };
    p.pop();
  }

  //INPUT
  p.mousePressed = function(){
    if(introOn){
      if(introBtn &&
         p.mouseX >= introBtn.x && p.mouseX <= introBtn.x + introBtn.w &&
         p.mouseY >= introBtn.y && p.mouseY <= introBtn.y + introBtn.h){
        introOn = false;
        warnOn = false;
        warnTimer = 0;
      }
      return;
    }

    if(gridOn){
      if(selectGridCell(p.mouseX, p.mouseY)) return;
    }

    if(overFxBtn(p.mouseX, p.mouseY)){
      if(!isAllActiveFacesConsented()){
        triggerWarning('filters');
        return;
      }
      gridOn = !gridOn;
      return;
    }

    if(!gridOn && overShutter(p.mouseX, p.mouseY)){
      tryCapture();
    }
  };

  function overShutter(mx, my){
    return p.dist(mx, my, shutX, shutY) <= shutR;
  }

  function overFxBtn(mx, my){
    return p.dist(mx, my, fxBtnX, fxBtnY) <= fxBtnR;
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
      p.nf(now.getMonth()+1,2) + '-' +
      p.nf(now.getDate(),2) + '_' +
      p.nf(now.getHours(),2) + '-' +
      p.nf(now.getMinutes(),2) + '-' +
      p.nf(now.getSeconds(),2);

    p.save(shot, 'consent_camera_' + stamp + '.png');
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

    let flash = p.frameCount % 10 < 5;

    warnLayer.push();
      warnLayer.noStroke();
      warnLayer.fill(0, 0, 0, 140);
      warnLayer.rect(0, 0, p.width, p.height);

      if(flash){
        warnLayer.stroke(255, 60, 60);
        warnLayer.strokeWeight(18);
        warnLayer.noFill();
        warnLayer.rect(10, 10, p.width - 20, p.height - 20);
      }

      warnLayer.noStroke();
      warnLayer.fill(255);
      warnLayer.textAlign(p.CENTER, p.CENTER);
      warnLayer.textSize(44);
      warnLayer.text('STOP', p.width/2, p.height/2 - 60);

      warnLayer.textSize(18);

      if(warnType === 'filters'){
        warnLayer.text('Filters are locked until everyone consents.', p.width/2, p.height/2 - 10);
        warnLayer.text('Hold an OK sign for 3 seconds (nearest face).', p.width/2, p.height/2 + 22);
      }else{
        warnLayer.text('Not everyone in frame has consented.', p.width/2, p.height/2 - 10);
        warnLayer.text('Hold an OK sign for 3 seconds to consent.', p.width/2, p.height/2 + 22);
      }
    warnLayer.pop();

    p.image(warnLayer, 0, 0);

    warnTimer++;
    if(warnTimer > warnDur){
      warnOn = false;
      warnTimer = 0;
    }
  }

  //DOM MENU
  function buildMenu(){
    menu = p.createDiv('');
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

    menuHeader = p.createDiv('');
    menuHeader.parent(menu);
    menuHeader.style('display', 'flex');
    menuHeader.style('align-items', 'center');
    menuHeader.style('justify-content', 'space-between');
    menuHeader.style('padding', '12px 14px');
    menuHeader.style('user-select', 'none');
    menuHeader.style('border-bottom', '1px solid rgba(255,255,255,0.10)');

    let title = p.createDiv('Consent Camera Menu');
    title.parent(menuHeader);
    title.style('font-weight', '650');
    title.style('font-size', '14px');

    menuArrow = p.createDiv('▴');
    menuArrow.parent(menuHeader);
    menuArrow.style('font-size', '14px');
    menuArrow.style('opacity', '0.9');
    menuArrow.style('cursor', 'pointer');

    menuContent = p.createDiv('');
    menuContent.parent(menu);
    menuContent.style('padding', '12px 14px');
    menuContent.style('display', 'block');
    menuContent.style('max-height', '340px');
    menuContent.style('overflow-y', 'auto');

    menuArrow.mousePressed(toggleMenu);

    let hint = p.createDiv('Tip: hold an OK sign for ~3 seconds to consent.');
    hint.parent(menuContent);
    hint.style('font-size', '12px');
    hint.style('color', 'rgba(255,255,255,0.82)');
    hint.style('margin-bottom', '12px');

    resetBtn = p.createButton('Reset Session');
    resetBtn.parent(menuContent);
    resetBtn.style('width', '100%');
    resetBtn.style('margin-bottom', '12px');
    styleDarkButton(resetBtn);
    resetBtn.mousePressed(resetSession);

    let blurLab = p.createDiv('Blur Block Size');
    blurLab.parent(menuContent);
    blurLab.style('font-size', '12px');
    blurLab.style('color', 'rgba(255,255,255,0.88)');
    blurLab.style('margin-bottom', '6px');

    blurSlider = p.createSlider(6, 40, defaultBlur, 1);
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
    let x = p.width - w - sidePad;
    let y = bannerH + topPad;

    //menu is parented to mountEl, and mountEl is position:relative, so this is local coords
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
};
// (instance mode hook)
// run.js will call window.makeCleanSketch(p)

window.makeCleanSketch = (p) => {
  //VARIABLES

  //-background crop is windowYOffset
  //-squeegee size is squeegeeW
  //-fog strength is fogOpacity
  //-frame colors are frameOuterCol, frameInnerCol, frameBarCol
  //-rect wipe head thickness is headRatio
  //-wipe strength is wipeAlphaBoost and wipeWeightBoost
  //-cursor overlay offsets are cursorOffX, cursorOffY
  //-squeegee fix spacing is stampSpacing

  let windowImg;
  let squeegeeImg;
  let sparkleFont;

  //FOG SYSTEM
  let fogLayer;
  let scribbles = [];
  let currentScribble = null;
  let lastDrawTime = 0;

  //fog starts fully opaque
  let fogOpacity = 230;

  //BACKGROUND CONTROLS
  let windowYOffset = -80;//moves the background up/down to crop img

  //SQUEEGEE CONTROLS
  let squeegeeW = 110;//squeegee draw width (height follows automatically)

  //TEXT CONTROLS
  let cleanTextSize = 150;
  let cleanTextX = 300;//text x position
  let cleanTextY = 300;//text y position

  //FRAME COLOR CONTROLS
  let frameOuterCol = [0, 0, 0, 255];//outer thick frame color (r,g,b,a)
  let frameInnerCol = [70, 70, 80, 255];//inner thin border color
  let frameBarCol = [70, 70, 80, 255];//cross bars color

  //FOG + TEXT COLOR CONTROLS
  let fogCol = [235, 240, 245];//fog base color
  let fogTextAlpha = 120;//text alpha

  //RECT WIPE CONTROLS
  let headRatio = 0.22;//thickness of the squeegee head, compared to the png height
  let wipeAlphaBoost = 2.5;//bigger = clears more per pass
  let wipeWeightBoost = 1.15;//bigger = bigger rectangle stamp

  //DASH FIX CONTROLS
  let stampSpacing = 0.25;//smaller = smoother wipe, bigger = more dashed

  //CURSOR ALIGNMENT CONTROLS
  let cursorOffX = 10;//moves squeegee overlay left/right
  let cursorOffY = 60;//moves squeegee overlay up/down (increase to move down)

  //PRELOAD
  p.preload = function () {
  // assets path based on project-2.html living inside /projects-advanced/
  windowImg = p.loadImage("../p5-advanced/assignment-2/clean/assets/window.png");
  squeegeeImg = p.loadImage("../p5-advanced/assignment-2/clean/assets/squeegee.png");
  sparkleFont = p.loadFont("../p5-advanced/assignment-2/clean/assets/Sparkle.otf");
  };


  //SETUP
  p.setup = function () {
    p.createCanvas(600, 600);

    fogLayer = p.createGraphics(p.width, p.height);
    fogLayer.noStroke();
    fogLayer.fill(fogCol[0], fogCol[1], fogCol[2], fogOpacity);
    fogLayer.rect(0, 0, p.width, p.height);

    //no early fade-in
    lastDrawTime = -999999;
  };

  p.draw = function () {
    p.background(0);

    drawWindowBackground();
    drawCleanText();

    drawFogLayer();
    p.image(fogLayer, 0, 0);

    drawWindowFrameOverlay();
    drawSqueegeeCursor();
  };

  //BACKGROUND
  function drawWindowBackground() {
    let s = p.width / windowImg.width;
    let h = windowImg.height * s;
    p.image(windowImg, 0, windowYOffset, p.width, h);
  }

  //TEXT
  //uses textBounds so the word is centered on cleanTextX/cleanTextY
  function drawCleanText() {
    p.push();
    p.textFont(sparkleFont);
    p.textSize(cleanTextSize);
    p.fill(fogCol[0], fogCol[1], fogCol[2], fogTextAlpha);

    let b = sparkleFont.textBounds("clean", 0, 0, cleanTextSize);
    let x = cleanTextX - (b.x + b.w / 2);
    let y = cleanTextY - (b.y + b.h / 2);

    p.text("clean", x, y);
    p.pop();
  }

  //FOG LAYER
  //draws the fog base, then cuts out rectangles where the squeegee went
  function drawFogLayer() {
    fogLayer.clear();

    //base fog has to use CORNER mode so it fills the whole canvas correctly
    fogLayer.rectMode(p.CORNER);
    fogLayer.fill(fogCol[0], fogCol[1], fogCol[2], fogOpacity);
    fogLayer.noStroke();
    fogLayer.rect(0, 0, p.width, p.height);

    //rect wipes stored in scribbles
    for (let s of scribbles) {
      let age = p.millis() - s.start;

      //older scribbles fade out so the fog can come back
      if (age < 10000) {
        let alpha = p.map(age, 0, 10000, 255, 0);

        fogLayer.erase();
        fogLayer.noStroke();
        fogLayer.rectMode(p.CENTER);

        //alpha controls how “strong” the erase is
        let a = alpha * 0.35 * wipeAlphaBoost;
        fogLayer.fill(0, a);

        for (let pt of s.points) {
          fogLayer.rect(pt.x, pt.y, s.wipeW * wipeWeightBoost, s.wipeH * wipeWeightBoost);
        }

        fogLayer.noErase();
      }
    }

    //fog returns slowly after a pause
    let timeSinceDraw = p.millis() - lastDrawTime;
    if (timeSinceDraw > 5000 && fogOpacity < 230) {
      fogOpacity += 0.1;
    } else if (timeSinceDraw <= 5000) {
      fogOpacity = 230;
    }
  }

  //INPUT START
  //starts a new wipe path and saves the squeegee head size
  p.mousePressed = function () {
    let scale = squeegeeW / squeegeeImg.width;
    let squeegeeH = squeegeeImg.height * scale;

    currentScribble = {
      points: [],
      start: p.millis(),
      wipeW: squeegeeW,
      wipeH: squeegeeH * headRatio
    };
    scribbles.push(currentScribble);

    lastDrawTime = p.millis();

    //first stamp so it reacts immediately
    currentScribble.points.push({ x: p.mouseX, y: p.mouseY });
  };

  //INPUT DRAG
  //fills in extra stamps between frames so fast swipes don’t look dashed
  p.mouseDragged = function () {
    if (!currentScribble) return;

    let d = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);

    //smaller step = more stamps = smoother wipe
    let step = p.max(2, stampSpacing);

    let steps = p.max(1, p.floor(d / step));
    for (let i = 1; i <= steps; i++) {
      let t = i / steps;
      let ix = p.lerp(p.pmouseX, p.mouseX, t);
      let iy = p.lerp(p.pmouseY, p.mouseY, t);
      currentScribble.points.push({ x: ix, y: iy });
    }

    lastDrawTime = p.millis();
  };

  //INPUT END
  //stops adding points to the current scribble
  p.mouseReleased = function () {
    currentScribble = null;
  };

  //SQUEEGEE CURSOR
  //draws the squeegee png on top of the mouse
  function drawSqueegeeCursor() {
    let s = squeegeeW / squeegeeImg.width;
    let h = squeegeeImg.height * s;

    p.push();
    p.noCursor();
    p.imageMode(p.CENTER);
    p.image(squeegeeImg, p.mouseX + cursorOffX, p.mouseY + cursorOffY, squeegeeW, h);
    p.pop();
  }

  //WINDOW FRAME
  //frame drawing stays the same, only colors change via the frame vars
  function drawWindowFrameOverlay() {
    p.push();
    p.noFill();

    p.stroke(frameOuterCol[0], frameOuterCol[1], frameOuterCol[2], frameOuterCol[3]);
    p.strokeWeight(36);
    p.rect(0, 0, p.width, p.height);

    p.stroke(frameInnerCol[0], frameInnerCol[1], frameInnerCol[2], frameInnerCol[3]);
    p.strokeWeight(6);
    p.rect(16, 16, p.width - 32, p.height - 32);

    p.stroke(frameBarCol[0], frameBarCol[1], frameBarCol[2], frameBarCol[3]);
    p.strokeWeight(5);
    p.line(p.width / 2, 16, p.width / 2, p.height - 16);
    p.line(16, p.height / 2, p.width - 16, p.height / 2);

    p.pop();
  }
};
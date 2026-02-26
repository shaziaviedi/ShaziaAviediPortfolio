//(instance mode)

window.makeFragileSketch = (p) => {
//VARIABLES

//-egg start position is eggX and eggStartY
//-egg break height is groundY
//-clicks needed to drop is pawNeeded
//-word placement is wordX and wordY
//-liquid speed is morphSpeed and flowDrag
//-liquid wobble is spreadJitter
//-particle size is yolkSizeMin and yolkSizeMax
//-hint position is hintOffX and hintOffY
//-again button spacing is yesGapY and yesPad

let txt = 'FRAGILE';

let canvasW = 600;
let canvasH = 600;

let fontSize = 140;

//EGG SETUP
let eggX = 300;
let eggStartY = 140;
let eggY = eggStartY;

let eggW = 130;
let eggH = 170;

let eggCol = '#f5f5f5';
let shadowCol = 'rgba(0,0,0,0.18)';

//ROCKING MECHANIC
let pawCount = 0;
let pawNeeded = 3;//how many clicks on the egg before it drops
let isRocking = false;
let rockTimer = 0;
let rockDuration = 18;//frames per rock burst
let rockAmp = 0.28;//how big the wobble is
let rockSpeed = 0.55;//how fast it wobbles
let rockDir = 1;

//HINT TEXT
let showHint = true;//turns off after the first egg click
let hintTxt = 'Touch me!!';
let hintOffX = 90;//moves hint left/right relative to egg
let hintOffY = -10;//moves hint up/down relative to egg
let hintSize = 30;//hint text size
let hintAlpha = 220;//hint opacity

//OOPS TEXT
let showOops = false;//turns on at the third click and stays until word finishes
let oopsTxt = 'Oops';
let oopsOffX = hintOffX;//same location as hint
let oopsOffY = hintOffY;
let oopsSize = hintSize;
let oopsAlpha = 220;

//AGAIN UI
let showAgain = false;//turns on when the word is fully formed
let againTxt = 'Again?';
let yesTxt = 'Yes';
let againSize = 28;
let yesSize = 28;
let againAlpha = 220;
let yesAlpha = 220;
let yesPad = 10;//bigger = easier click area
let yesGapY = 35;//distance between again and yes

//DROP + CRACK MECHANIC
let state = 'idle';//idle -> rocking -> dropping -> cracked -> yolkWord
let groundY = 350;//impact line 
let fallV = 0;
let gravity = 0.85;

//SHELL PHYSICS AFTER CRACK
let shells = [];
let bounce = 0.45;//slightly less bouncy so it feels heavier
let floorFriction = 0.95;//slows faster on the floor
let airDrag = 0.992;//a bit more drag

//YOLK WORD SYSTEM
let wordLayer;
let yolkPts = [];
let yolkParticles = [];
let yolkCol = [255, 199, 46];

//WORD PLACEMENT
let wordX = 300;
let wordY = 500;

let gridDensity = 6;//word point detail

let morphSpeed = 0.022;//slower like liquid
let spreadJitter = 2.2;//wobble

//LIQUID FEEL CONTROLS
let flowDrag = 0.88;//lower = more syrupy, higher = more floaty
let maxFlow = 3.2;//caps speed so it spills not snap

//PARTICLE SIZE CONTROLS
let yolkSizeMin = 15;
let yolkSizeMax = 20;

//SPAWN CONTROLS
let spillRadius = 6;//how tight the start clump is
let spillDelayMax = 70;//bigger = slower spill reveal

//WORD DONE DETECTION
let doneDist = 6;//how close a particle has to be to count as arrived
let doneRatio = 0.92;//how many particles need to arrive before its done
let wordDoneOnce = false;//prevents re-triggering

//YES HIT BOX (gets built in drawAgainUI)
let yesW = 0;
let yesH = 0;
let yesBox = null;

class YolkParticle{
  constructor(sx, sy, tx, ty){
    this.x = sx;
    this.y = sy;

    this.tx = tx;
    this.ty = ty;

    this.vx = 0;
    this.vy = 0;

    this.seed = p.random(1000);
    this.size = p.random(yolkSizeMin, yolkSizeMax);
    this.opa = p.random(170, 230);

    this.delay = p.int(p.random(0, spillDelayMax));//stagger so it spills outward
  }

  update(){
    if(this.delay > 0){
      this.delay--;
      //pooling yolk
      this.x += (p.noise(this.seed + p.frameCount * 0.03) - 0.5) * 0.35;
      this.y += (p.noise(this.seed + 200 + p.frameCount * 0.03) - 0.5) * 0.35;
      return;
    }

    //soft pull
    let ax = (this.tx - this.x) * morphSpeed;
    let ay = (this.ty - this.y) * morphSpeed;

    //more wiggly like liquid spreading
    ax += (p.noise(this.seed + p.frameCount * 0.02) - 0.5) * spreadJitter * 0.12;
    ay += (p.noise(this.seed + 200 + p.frameCount * 0.02) - 0.5) * spreadJitter * 0.12;

    this.vx += ax;
    this.vy += ay;

    this.vx = p.constrain(this.vx, -maxFlow, maxFlow);
    this.vy = p.constrain(this.vy, -maxFlow, maxFlow);

    //drag makes it feel thick
    this.vx *= flowDrag;
    this.vy *= flowDrag;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(){
    p.push();
      p.noStroke();
      p.fill(yolkCol[0], yolkCol[1], yolkCol[2], this.opa);
      p.circle(this.x, this.y, this.size);
    p.pop();
  }

  distToTarget(){
    //distance check used for the “word done” logic
    return p.dist(this.x, this.y, this.tx, this.ty);
  }
}

class ShellHalf{
  constructor(x, y, w, h, side){
    this.x = x;
    this.y = y;

    this.vx = p.random(-5, 5);
    this.vy = p.random(-7, -2);

    this.w = w;
    this.h = h;

    this.ang = p.random(-0.6, 0.6);
    this.angV = p.random(-0.08, 0.08);

    this.side = side;//L or R
  }

  update(){
    //basic gravity + bounce
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    this.ang += this.angV;

    this.vx *= airDrag;
    this.vy *= airDrag;

    //floor bounce
    if(this.y + this.h*0.25 > p.height){
      this.y = p.height - this.h*0.25;
      this.vy *= -bounce;
      this.vx *= floorFriction;
      this.angV *= 0.85;
    }

    //wall bounce
    if(this.x - this.w*0.3 < 0){
      this.x = this.w*0.3;
      this.vx *= -bounce;
    }
    if(this.x + this.w*0.3 > p.width){
      this.x = p.width - this.w*0.3;
      this.vx *= -bounce;
    }
  }

  draw(){
    p.push();
      p.translate(this.x, this.y);
      p.rotate(this.ang);

      p.noStroke();
      p.fill(eggCol);

      p.beginShape();
      if(this.side === 'L'){
        p.vertex(0, -this.h*0.45);
        p.bezierVertex(-this.w*0.55, -this.h*0.2, -this.w*0.55, this.h*0.25, 0, this.h*0.35);
        p.vertex(this.w*0.05, this.h*0.22);
        p.vertex(-this.w*0.06, this.h*0.08);
        p.vertex(this.w*0.03, -this.h*0.05);
        p.vertex(-this.w*0.04, -this.h*0.18);
      }else{
        p.vertex(0, -this.h*0.45);
        p.bezierVertex(this.w*0.55, -this.h*0.2, this.w*0.55, this.h*0.25, 0, this.h*0.35);
        p.vertex(-this.w*0.05, this.h*0.22);
        p.vertex(this.w*0.06, this.h*0.08);
        p.vertex(-this.w*0.03, -this.h*0.05);
        p.vertex(this.w*0.04, -this.h*0.18);
      }
      p.endShape(p.CLOSE);

      //tiny shadow inside
      p.fill(0, 18);
      p.ellipse(0, this.h*0.18, this.w*0.6, this.h*0.22);

    p.pop();
  }
}

p.setup = function(){
  p.createCanvas(canvasW, canvasH);
  p.pixelDensity(1);//keeps pixel sampling consistent
  p.rectMode(p.CENTER);
  p.angleMode(p.RADIANS);

  eggX = p.width/2;

  wordLayer = p.createGraphics(p.width, p.height);
  wordLayer.pixelDensity(1);//same reason
};

p.draw = function(){
  p.background(0);

  updateEgg();

  if(state === 'idle' || state === 'rocking' || state === 'dropping'){
    drawEggWhole();
  }

  if(state === 'cracked' || state === 'yolkWord'){
    updateShells();
    drawShells();
  }

  if(state === 'yolkWord'){
    for(let pt of yolkParticles){
      pt.update();
      pt.draw();
    }

    if(!wordDoneOnce && isWordDone()){
      wordDoneOnce = true;
      showAgain = true;
      showOops = false;
    }
  }

  if(showHint){
    drawHint();
  }

  if(showOops){
    drawOops();
  }

  if(showAgain){
    drawAgainUI();
  }
};


//falling motion and the rocking timer
function updateEgg(){
  if(state === 'dropping'){
    fallV += gravity;
    eggY += fallV;

    if(eggY >= groundY){
      eggY = groundY;
      fallV = 0;

      splitEgg();
      spawnYolkWord();

      state = 'yolkWord';
    }
  }

  if(isRocking){
    rockTimer++;
    if(rockTimer > rockDuration){
      isRocking = false;
      rockTimer = 0;
    }
  }
}


//egg with a wobble when rocking
function drawEggWhole(){
  p.push();

    let ang = 0;
    if(isRocking || state === 'dropping'){
      let t = p.frameCount * rockSpeed;
      ang = p.sin(t) * rockAmp * rockDir;
      if(state === 'dropping') ang *= 0.35;
    }

    p.translate(eggX, eggY);
    p.rotate(ang);

    p.noStroke();
    p.fill(eggCol);
    p.ellipse(0, 0, eggW, eggH);

    p.fill(shadowCol);
    p.ellipse(0, eggH * 0.18, eggW * 0.7, eggH * 0.25);

  p.pop();
}

//INPUT
//egg rocking & drop
p.mousePressed = function(){
  if(showAgain && overYes(p.mouseX, p.mouseY)){
    resetAll();
    return;
  }

  if(state !== 'idle' && state !== 'rocking') return;

  let hit = pointInEgg(p.mouseX, p.mouseY);

  if(hit){
    showHint = false;//first click kills the hint

    pawCount++;
    isRocking = true;
    rockTimer = 0;
    rockDir *= -1;
    state = 'rocking';

    if(pawCount >= pawNeeded){
      showOops = true;
    }

    if(pawCount >= pawNeeded){
      state = 'dropping';
      isRocking = true;
      rockTimer = 0;
      fallV = 0;
    }
  }
};

//EGG HIT TEST
function pointInEgg(mx, my){
  let dx = (mx - eggX) / (eggW * 0.5);
  let dy = (my - eggY) / (eggH * 0.5);
  return (dx*dx + dy*dy) <= 1;
}

//EGG SPLIT
//spawns two shell halves at impact point
function splitEgg(){
  shells = [];
  shells.push(new ShellHalf(eggX - 18, eggY + 10, eggW, eggH, 'L'));
  shells.push(new ShellHalf(eggX + 18, eggY + 10, eggW, eggH, 'R'));
  state = 'cracked';
}

//SHELL UPDATE
//updates shell physics
function updateShells(){
  for(let s of shells){
    s.update();
  }
}

//SHELL DRAW
//draws every shell half
function drawShells(){
  for(let s of shells){
    s.draw();
  }
}

//WORD SPAWN
//draws the word into an offscreen buffer and samples pixels to get target points
function spawnYolkWord(){
  wordLayer.clear();
  wordLayer.background(0);

  wordLayer.fill(255);
  wordLayer.noStroke();
  wordLayer.textAlign(p.CENTER, p.CENTER);
  wordLayer.textSize(fontSize);
  wordLayer.textFont('Times New Roman');
  wordLayer.text(txt, wordX, wordY);

  wordLayer.loadPixels();
  yolkPts = [];

  for(let y = 0; y < p.height; y += gridDensity){
    for(let x = 0; x < p.width; x += gridDensity){
      let idx = 4 * (y * p.width + x);
      let r = wordLayer.pixels[idx];
      let a = wordLayer.pixels[idx + 3];

      //threshold
      if(a > 40 && r > 80){
        yolkPts.push({x:x, y:y});
      }
    }
  }

  //fallback threshold
  if(yolkPts.length < 30){
    for(let y = 0; y < p.height; y += gridDensity){
      for(let x = 0; x < p.width; x += gridDensity){
        let idx = 4 * (y * p.width + x);
        let a = wordLayer.pixels[idx + 3];
        if(a > 10){
          yolkPts.push({x:x, y:y});
        }
      }
    }
  }

  //starts everything from a puddle at impact
  yolkParticles = [];
  let sx = eggX;
  let sy = groundY + 32;

  for(let i = 0; i < yolkPts.length; i++){
    let px = sx + p.random(-spillRadius, spillRadius);
    let py = sy + p.random(-spillRadius, spillRadius);
    yolkParticles.push(new YolkParticle(px, py, yolkPts[i].x, yolkPts[i].y));
  }
}

//HINT DRAW
//blinking hint that disappears after the first click
function drawHint(){
  p.push();
    p.textFont('Times New Roman');
    p.textSize(hintSize);
    p.textAlign(p.LEFT, p.CENTER);
    p.noStroke();

    let blink = p.map(p.sin(p.frameCount * 0.06), -1, 1, 70, hintAlpha);
    p.fill(255, blink);

    let hx = eggX + hintOffX;
    let hy = eggY + hintOffY;

    p.text(hintTxt, hx, hy);
  p.pop();
}

function drawOops(){
  p.push();
    p.textFont('Times New Roman');
    p.textSize(oopsSize);
    p.textAlign(p.LEFT, p.CENTER);
    p.noStroke();

    let blink = p.map(p.sin(p.frameCount * 0.06), -1, 1, 70, oopsAlpha);
    p.fill(255, blink);

    let ox = eggX + oopsOffX;
    let oy = eggY + oopsOffY;

    p.text(oopsTxt, ox, oy);
  p.pop();
}

function drawAgainUI(){
  p.push();
    p.textFont('Times New Roman');
    p.textAlign(p.LEFT, p.CENTER);
    p.noStroke();

    let ax = eggX + oopsOffX;
    let ay = eggY + oopsOffY;

    let blinkA = p.map(p.sin(p.frameCount * 0.06), -1, 1, 90, againAlpha);
    p.fill(255, blinkA);
    p.textSize(againSize);
    p.text(againTxt, ax, ay);

    let yx = ax;
    let yy = ay + yesGapY;

    let blinkY = p.map(p.sin(p.frameCount * 0.06), -1, 1, 120, yesAlpha);
    p.fill(255, blinkY);
    p.textSize(yesSize);
    p.text(yesTxt, yx, yy);

    //hit box is rebuilt every frame so it stays accurate
    p.textSize(yesSize);
    yesW = p.textWidth(yesTxt);
    yesH = yesSize;

    yesBox = {
      x1: yx - yesPad,
      y1: yy - yesH/2 - yesPad,
      x2: yx + yesW + yesPad,
      y2: yy + yesH/2 + yesPad
    };
  p.pop();
}

//YES HIT TEST
//checks if clicks inside yesBox 
function overYes(mx, my){
  if(!yesBox) return false;
  return mx >= yesBox.x1 && mx <= yesBox.x2 && my >= yesBox.y1 && my <= yesBox.y2;
}

//WORD DONE CHECK
//checks arrival ratio
function isWordDone(){
  if(yolkParticles.length === 0) return false;

  let arrived = 0;
  let active = 0;

  for(let pt of yolkParticles){
    if(pt.delay > 0) continue;
    active++;
    if(pt.distToTarget() < doneDist) arrived++;
  }

  if(active < yolkParticles.length * 0.75) return false;
  return arrived / yolkParticles.length >= doneRatio;
}

//RESET
//brings everything back to the first state
function resetAll(){
  eggY = eggStartY;
  fallV = 0;

  state = 'idle';
  isRocking = false;
  rockTimer = 0;

  pawCount = 0;

  shells = [];
  yolkPts = [];
  yolkParticles = [];

  showHint = true;
  showOops = false;
  showAgain = false;

  wordDoneOnce = false;
  yesBox = null;
}
};
/*-----colour palette-----*/

//fill colours
const furColor = '#a67c63';
const skinColor = '#637ea6';
const whiteColor = '#dedede';
const eyeColor = '#5c4a3f';
const detailColor = '#c7858f';
const hatColor = '#fadd9b';

//stroke colours
const brownOutline = '#473b33';
const blueOutline = '#46566e';

/** 400×600 logical art → 600-wide canvas (matches square CC Lab sketches’ width). */
const LOGICAL_W = 400;
const LOGICAL_H = 600;
const VIEW_W = 600;
const VIEW_H = Math.round(LOGICAL_H * (VIEW_W / LOGICAL_W));

/*==========draw==========*/

function setup() {
  const canvas = createCanvas(VIEW_W, VIEW_H);
  // mount into portfolio project container
  canvas.parent('sketch-container');
  pixelDensity(1);
}

function draw() {
  push();
  scale(VIEW_W / LOGICAL_W);
  background('#e3cad2');
  strokeWeight(1.5);
  
  //body parts
  drawLegs(furColor, brownOutline);
  drawLeftArm(furColor, brownOutline);
  drawTail();
  drawMainBody(furColor, brownOutline); 
  drawHead();
  drawRightArm(furColor, brownOutline);
  drawFingers(skinColor, blueOutline);
  drawClaws(whiteColor);
  drawBill(skinColor, blueOutline);
  drawBodyDetails(brownOutline);
  drawChestDetails(detailColor);
  
  //hat
  drawHat(hatColor);
  drawHatPattern(detailColor);
  
  //eyes
  drawEyeSockets(whiteColor, brownOutline);
  drawSclera();
  // pupils (no clip – they sit inside the sclera already)
  drawPupils(eyeColor, brownOutline);

  pop();
}

/*==========helpers==========*/

/*-----body-----*/

function drawMainBody(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  beginShape();
  
  vertex(232.5, 155.5);
  bezierVertex(237.5, 157.34, 251.5, 178.5, 256.58, 192.5);
  bezierVertex(285.5, 223.5, 313.68, 270.89, 294.5, 304.5);
  bezierVertex(297.23, 314.25, 292.5, 313.5, 291.5, 319.5);
  bezierVertex(294.03, 325.75, 291.68, 330.84, 287.5, 335.5);
  bezierVertex(284.24, 338.81, 285.08, 345.92, 279.5, 349.5);
  bezierVertex(280.32, 353.18, 280.68, 356.23, 280.5, 358.5);
  bezierVertex(274.39, 383.44, 336.46, 414.15, 282.5, 475.5);
  bezierVertex(156.5, 541.5, -17.78, 479.5, 79.5, 305.5);
  bezierVertex(77.83, 303.75, 78.42, 301.91, 80.74, 300);
  bezierVertex(77.54, 285.71, 91.5, 272.5, 99.5, 253.5);
  vertex(104.25, 171.37);
  
  endShape();
}

/*-----head-----*/
function drawHead(){
  beginShape();
  vertex(104.25, 171.37);
  bezierVertex(89.72, 151.24, 110.1, 137.48, 116.04, 130.5);
  bezierVertex(122.68, 122.23, 129.21, 115.12, 135, 115);
  vertex(181, 105);
  bezierVertex(192.62, 105.54, 198.5, 112.5, 210.5, 120.5);
  bezierVertex(232.34, 133.96, 241.06, 150.28, 225.02, 171.72);
  endShape();
}

/*-----arms-----*/

function drawLeftArm(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  //left arm
  beginShape();
  vertex(79.5, 305.5);
  bezierVertex(70.5, 318.5, 36.94, 333.7, 46.5, 356.5);
  bezierVertex(45.83, 359.05, 47.5, 361.72, 49.5, 362.5);
  bezierVertex(48.35, 367.49, 48.91, 369.22, 50.07, 369.91);
  bezierVertex(50.77, 373.59, 51.91, 375.45, 53.5, 375.5);
  endShape();
}

function drawRightArm(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  //right arm
  beginShape();
  vertex(280.5, 358.5);
  bezierVertex(274.5, 354.5, 270.59, 354.39, 268.5, 360.5);
  bezierVertex(266.5, 357.5, 261.67, 357.95, 260.5, 361.5);
  bezierVertex(258.5, 355.5, 252.17, 353.45, 248.5, 357.5);
  bezierVertex(249.75, 350.42, 247.73, 346.41, 241.95, 345.91);
  bezierVertex(247.61, 338.33, 247.98, 328.52, 256.5, 323.5);
  bezierVertex(258.73, 317.54, 255.34, 311.64, 263.5, 305.5);
  bezierVertex(270.5, 272.5, 227.5, 259.5, 224.5, 223.5);
  endShape();
  
  bezier(242.22, 259.23, 222.5, 252.5, 216.5, 243.5, 214.5, 228.5);
}

/*-----fingers-----*/
function drawFingers(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  beginShape();
  vertex(280.5, 358.5);
  bezierVertex(274.5, 354.5, 270.59, 354.39, 268.5, 360.5);
  bezierVertex(266.5, 357.5, 261.67, 357.95, 260.5, 361.5);
  bezierVertex(258.5, 355.5, 252.17, 353.45, 248.5, 357.5);
  bezierVertex(249.75, 350.42, 247.73, 346.41, 241.95, 345.91);
  bezierVertex(235.65, 352.85, 234.58, 356.65, 236.5, 361.5);
  bezierVertex(238.2, 360.83, 239.2, 361.5, 239.5, 363.5);
  bezierVertex(243.08, 364.58, 245.94, 362.25, 248.5, 358.5);
  bezierVertex(246.03, 362.85, 245.82, 366.65, 249.5, 369.5);
  bezierVertex(252.49, 367.64, 254.03, 368.55, 254.5, 371.5);
  bezierVertex(256.64, 370.6, 258.02, 368.98, 258.5, 366.5);
  bezierVertex(258.29, 368.5, 258.95, 369.83, 260.5, 370.5);
  bezierVertex(262.82, 366.96, 264.38, 367.17, 265.5, 369.5);
  bezierVertex(267.83, 368.46, 268.51, 369.83, 269.5, 363.5);
  bezierVertex(268.86, 367.56, 270.39, 365.63, 273.5, 366.5);
  bezierVertex(274.38, 364.11, 276.04, 362.78, 278.5, 362.5);
  bezierVertex(279.64, 361.83, 280.26, 360.46, 280.5, 358.5);
  endShape();
  
  beginShape();
  vertex(212.5, 510.5);
  bezierVertex(219.14, 505.22, 223.84, 505.65, 227.5, 510.5);
  bezierVertex(234.95, 504.79, 238.3, 507, 241.5, 509.5);
  bezierVertex(245.39, 503.31, 250.94, 502.34, 257.5, 504.5);
  bezierVertex(255.71, 497.28, 260.31, 494.56, 267.5, 493.67);
  bezierVertex(272.5, 500.5, 272.5, 503.5, 267.5, 508.5);
  bezierVertex(265.18, 507.04, 263.28, 506.92, 262.5, 510.5);
  bezierVertex(260.39, 509.83, 258.96, 509.17, 258.5, 508.5);
  bezierVertex(257.92, 512, 256.67, 514.76, 254.5, 516.5);
  bezierVertex(250.77, 515.5, 248.77, 516.5, 248.5, 519.5);
  bezierVertex(245.33, 519.23, 243.14, 518.34, 242.5, 516.5);
  bezierVertex(241.85, 518.56, 240.49, 519.86, 238.5, 520.5);
  bezierVertex(235.45, 519.83, 233.45, 520.5, 232.5, 522.5);
  bezierVertex(228.91, 521.22, 227.26, 518.88, 227.5, 515.5);
  bezierVertex(227.79, 519.61, 225.9, 521.35, 222.5, 521.45);
  bezierVertex(220.5, 520.39, 218.63, 519.92, 217.5, 522.5);
  bezierVertex(212.9, 518.41, 211.69, 514.58, 212.5, 510.5);
  endShape();
  
  beginShape();
  vertex(93.11, 486.24);
  bezierVertex(91.5, 501.5, 95.5, 498.5, 100.5, 505.5);
  bezierVertex(106.74, 512.74, 102.45, 516.05, 108.5, 521.5);
  bezierVertex(104.76, 527.36, 99.13, 529.99, 90.5, 527.5);
  bezierVertex(86.18, 530.16, 81.51, 529.88, 79.5, 526.5);
  bezierVertex(78.46, 523.94, 78.69, 521.79, 82.5, 518.5);
  bezierVertex(80.61, 519.41, 79.35, 518.9, 78.5, 517.5);
  bezierVertex(79.65, 515.42, 79.14, 513.43, 77.5, 511.5);
  bezierVertex(78.72, 509.37, 79.06, 507.34, 77.5, 505.5);
  bezierVertex(78.25, 503.6, 79.67, 502.73, 81.5, 502.5);
  bezierVertex(78.77, 500.77, 77.84, 499.11, 78.5, 497.5);
  bezierVertex(82.14, 487.32, 85.11, 486.21, 93.11, 486.24);
  endShape();
}

/*-----claws-----*/
function drawClaws(fillCol){
  fill(fillCol);
  
  //left hand
  beginShape();
  vertex(46.5, 356.5);
  bezierVertex(45.83, 359.05, 47.5, 361.72, 49.5, 362.5);
  bezierVertex(46.43, 366.22, 45.96, 369.63, 46.5, 374.1);
  bezierVertex(43.14, 368.02, 42.03, 362.08, 46.5, 356.5);
  endShape();
  
  beginShape();
  vertex(50.07, 369.91);
  bezierVertex(50.77, 373.59, 51.91, 375.45, 53.5, 375.5);
  bezierVertex(52.55, 378.7, 52.12, 381.85, 51.81, 384.93);
  bezierVertex(49.04, 380.65, 47.83, 376.16, 50.07, 369.91);
  endShape();
  
  //right hand
  beginShape();
  vertex(236.5, 361.5);
  bezierVertex(238.2, 360.83, 239.2, 361.5, 239.5, 363.5);
  bezierVertex(236.37, 367.52, 235.39, 371.12, 235.5, 374.5);
  bezierVertex(233.65, 369.72, 232.99, 365.18, 236.5, 361.5);
  endShape();
  
  beginShape();
  vertex(249.5, 369.5);
  bezierVertex(252.49, 367.64, 254.03, 368.55, 254.5, 371.5);
  bezierVertex(251.28, 374.24, 250.13, 377.99, 250.5, 382.5);
  bezierVertex(248.45, 377.45, 247.98, 373.06, 249.5, 369.5);
  endShape();
  
  beginShape();
  vertex(260.5, 370.5);
  bezierVertex(262.82, 366.96, 264.38, 367.17, 265.5, 369.5);
  bezierVertex(263.95, 373.85, 263.33, 377.95, 264.27, 381.63);
  bezierVertex(261.22, 380.19, 259.64, 376.9, 260.5, 370.5);
  endShape();
  
  beginShape();
  vertex(273.5, 366.5);
  bezierVertex(274.38, 364.11, 276.04, 362.78, 278.5, 362.5);
  bezierVertex(280.24, 367.59, 277.41, 372.17, 272.5, 376.5);
  bezierVertex(273.91, 373.36, 274.93, 370.15, 273.5, 366.5);
  endShape();
  
  //left foot
  beginShape();
  vertex(81.5, 502.5);
  bezierVertex(78.77, 500.77, 77.84, 499.11, 78.5, 497.5);
  bezierVertex(74.79, 499.72, 72.35, 502.35, 71.5, 505.5);
  bezierVertex(74.59, 502.05, 77.9, 500.83, 81.5, 502.5);
  endShape();
  
  beginShape();
  vertex(77.5, 511.5);
  bezierVertex(78.72, 509.37, 79.06, 507.34, 77.5, 505.5);
  bezierVertex(71.79, 507.23, 70.03, 510.45, 70.5, 514.5);
  bezierVertex(71.62, 512.54, 73.7, 511.33, 77.5, 511.5);
  endShape();
  
  beginShape();
  vertex(78.5, 517.5);
  bezierVertex(79.65, 515.42, 79.14, 513.43, 77.5, 511.5);
  bezierVertex(72.24, 514.84, 70.19, 518.99, 69.5, 523.5);
  bezierVertex(71.52, 519.98, 74.25, 517.55, 78.5, 517.5);
  endShape();
  
  beginShape();
  vertex(79.5, 526.5);
  bezierVertex(78.46, 523.94, 78.69, 521.79, 82.5, 518.5);
  bezierVertex(75.56, 522.22, 72.66, 526.77, 71.5, 532.5);
  bezierVertex(73.77, 529.36, 76.24, 526.81, 79.5, 526.5);
  endShape();
  
  //right foot
  beginShape();
  vertex(222.5, 521.45);
  bezierVertex(220.5, 520.39, 218.63, 519.92, 217.5, 522.5);
  bezierVertex(217.34, 525.32, 219.46, 527.95, 222.5, 530.5);
  bezierVertex(221.44, 527.29, 221.36, 524.26, 222.5, 521.45);
  endShape();
  
  beginShape();
  vertex(238.5, 520.5);
  bezierVertex(235.45, 519.83, 233.45, 520.5, 232.5, 522.5);
  bezierVertex(234.77, 525.35, 236.31, 528.39, 237.5, 531.5);
  bezierVertex(238.52, 528.49, 238.95, 524.92, 238.5, 520.5);
  endShape();
  
  beginShape();
  vertex(254.5, 516.5);
  bezierVertex(250.77, 515.5, 248.77, 516.5, 248.5, 519.5);
  bezierVertex(250.92, 521.94, 252.29, 524.79, 253.5, 527.5);
  bezierVertex(254.7, 523.77, 255.26, 520.08, 254.5, 516.5);
  endShape();
  
  beginShape();
  vertex(267.5, 508.5);
  bezierVertex(265.18, 507.04, 263.28, 506.92, 262.5, 510.5);
  bezierVertex(262.15, 514.4, 263.74, 517.97, 265.5, 521.5);
  bezierVertex(265.09, 515.96, 265.57, 511.42, 267.5, 508.5);
  endShape();
}

/*-----legs-----*/

function drawLegs(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  //left leg
  beginShape();
  vertex(60.59, 440.95);
  bezierVertex(52.92, 461.88, 70.13, 479.03, 93.11, 486.24);
  bezierVertex(100.38, 488.52, 108.22, 489.81, 116.04, 489.91);
  endShape();
  
  beginShape();
  vertex(116.04, 489.91);
  bezierVertex(108.22, 489.81, 100.38, 488.52, 93.11, 486.24);
  bezierVertex(91.5, 501.5, 95.5, 498.5, 100.5, 505.5);
  bezierVertex(106.74, 512.74, 102.45, 516.05, 108.5, 521.5);
  bezierVertex(121.47, 518.36, 130.62, 508.02, 151.19, 499.27);
  endShape();
  
  //right leg
  beginShape();
  vertex(218.62, 497.6);
  bezierVertex(215.63, 502.44, 213.15, 506.58, 212.5, 510.5);
  bezierVertex(219.14, 505.22, 223.84, 505.65, 227.5, 510.5);
  bezierVertex(234.95, 504.79, 238.3, 507, 241.5, 509.5);
  bezierVertex(245.39, 503.31, 250.94, 502.34, 257.5, 504.5);
  bezierVertex(255.71, 497.28, 260.31, 494.56, 267.5, 493.67);
  bezierVertex(269.18, 491.7, 264.81, 487.05, 264.27, 484.03);
  endShape();
}

/*-----body details-----*/
function drawChestDetails(fillCol){
  fill(fillCol);
  
  //right
  ellipse(206.41, 310.97, 11.18, 9.94);
  bezier(205.02, 310.97, 205.74, 313.86, 211.09, 310.97, 208.42, 308.08);
  
  //left
  beginShape();
  vertex(80.74, 300);
  bezierVertex(78.42, 301.91, 77.83, 303.75, 79.5, 305.5);
  bezierVertex(83.8, 306.13, 83.3, 303.71, 80.74, 300);
  endShape();
  
  beginShape();
  vertex(80.74, 300);
  bezierVertex(82.5, 302.55, 83.29, 304.49, 82.21, 305.25);
  bezierVertex(83.06, 306.75, 84.4, 307.9, 86.5, 308.5);
  bezierVertex(93.5, 306.5, 83.5, 293.5, 80.28, 296.3);
  bezierVertex(80.31, 297.53, 80.46, 298.76, 80.74, 300);
  endShape();
}

function drawBodyDetails(strokeCol){
  stroke(strokeCol);
  push();
  noFill();
  
  //left chest
  bezier(86.5, 308.5, 102.5, 326.5, 101.5, 328.5, 127.5, 326.5);
  
  //right chest
  bezier(152.5, 297.5, 157.5, 335.5, 234.5, 345.5, 236.5, 303.5);
  
  //stomach
  beginShape();
  vertex(115.5, 405.5);
  bezierVertex(114.98, 422.04, 116.42, 434.7, 120.5, 444.5);
  bezierVertex(115.29, 459.73, 99.5, 460.5, 80.5, 450.5);
  endShape();
  
  beginShape();
  vertex(115.5, 405.5);
  bezierVertex(114.98, 422.04, 116.42, 434.7, 120.5, 444.5);
  bezierVertex(126.5, 460.5, 158.5, 466.5, 168.5, 449.5);
  endShape();
  
  beginShape();
  vertex(117.7, 366.5);
  bezierVertex(113.08, 377.66, 113.28, 391.1, 115.5, 405.5);
  bezierVertex(101.38, 410.46, 88.93, 409.54, 78.5, 401.5);
  endShape();
  
  beginShape();
  vertex(117.7, 366.5);
  bezierVertex(113.08, 377.66, 113.28, 391.1, 115.5, 405.5);
  bezierVertex(130.35, 412.53, 143.66, 411.86, 155.83, 405.5);
  endShape();
  
  beginShape();
  vertex(96.5, 333.5);
  bezierVertex(105.27, 328.16, 126.88, 334.94, 124.5, 342.5);
  bezierVertex(119.05, 356.18, 117.09, 363.63, 117.7, 366.5);
  bezierVertex(113.27, 372.12, 102.73, 372.29, 85.5, 366.5);
  endShape();
  
  beginShape();
  vertex(175.5, 334.5);
  bezierVertex(145.5, 324.5, 125.5, 335.5, 124.5, 342.5);
  bezierVertex(119.05, 356.18, 117.09, 363.63, 117.7, 366.5);
  bezierVertex(121.8, 376.24, 133.93, 373.94, 147.5, 369.5);
  endShape();
  
  pop();
}

/*-----bill-----*/
function drawBill(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  beginShape();
  vertex(99.5, 184.5);
  bezierVertex(92.9, 169.67, 119.43, 166.86, 133.5, 155.5);
  bezierVertex(148.5, 139.5, 165.5, 139.5, 181.5, 152.5);
  bezierVertex(201.45, 159.78, 243.76, 173.05, 218.5, 179.5);
  bezierVertex(190.5, 169.5, 198.5, 166.5, 166.5, 160.5);
  bezierVertex(153.78, 155.1, 142.5, 161.5, 132.5, 166.5);
  bezierVertex(122.5, 171.5, 103.82, 176.8, 99.5, 184.5);
  endShape();
  
  beginShape();
  vertex(218.5, 179.5);
  bezierVertex(190.5, 169.5, 198.5, 166.5, 166.5, 160.5);
  bezierVertex(153.78, 155.1, 142.5, 161.5, 132.5, 166.5);
  bezierVertex(122.5, 171.5, 103.82, 176.8, 99.5, 184.5);
  bezierVertex(87.8, 194.6, 76.13, 200.04, 64.5, 200.5);
  bezierVertex(28.08, 202.29, 43.5, 246.5, 71.5, 246.5);
  bezierVertex(110.5, 257.5, 135.5, 265.5, 169.5, 247.5);
  bezierVertex(179.59, 243.26, 178.5, 219.5, 190.5, 205.5);
  bezierVertex(206.5, 189.5, 228.5, 193.5, 218.5, 179.5);
  endShape();
  
  bezier(218.5, 179.5, 211.5, 186.5, 197.5, 190.5, 190.5, 205.5);
  
  beginShape();
  vertex(195.5, 191.5);
  bezierVertex(184.5, 204.5, 179.45, 208.3, 173.5, 226.5);
  bezierVertex(155.5, 254.5, 96.45, 247.81, 71.5, 231.5);
  bezierVertex(45.69, 218.1, 62.83, 212.67, 91.5, 193.5);
  endShape();
  
  //nostrils
  push();
  fill(blueOutline);
  ellipse(114.5, 235.5, 7.73, 3.64); //right
  ellipse(96.5, 231, 7.94, 3.15); //left
  pop();
}

/*-----eye socket-----*/
function drawEyeSockets(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  //right
  push();
  noFill();
  bezier(170.5, 135.5, 176.15, 131.77, 179.3, 124.78, 192.5, 128.5);
  bezier(172.5, 141.5, 190.5, 143.5, 186.5, 141.5, 196.5, 135.);
  pop();
  
  //left
  push();
  noFill();
  bezier(140.18, 141.36, 129.2, 132.81, 124.33, 145.1, 118.5, 144.5);
  bezier(139.5, 148.5, 135.83, 151.01, 131.15, 153.01, 121.5, 152.5);
  pop();
}

function drawSclera(){
  //right
  beginShape();
  vertex(172.5, 137.5);
  bezierVertex(176.61, 133.84, 179.11, 130.43, 186.5, 131.5);
  bezierVertex(190.87, 131.45, 194.29, 130.84, 196.5, 129.5);
  bezierVertex(193.19, 134.07, 189.89, 138.03, 185.5, 139.5);
  bezierVertex(181.46, 140.53, 177.19, 137.61, 172.5, 137.5);
  endShape();
  
  //left
  beginShape();
  vertex(141.5, 143.5);
  bezierVertex(136.58, 142.11, 131.47, 139.48, 127.5, 143.5);
  bezierVertex(125.14, 146.25, 122.03, 147.34, 118.5, 147.5);
  bezierVertex(123.12, 149.56, 127.79, 150.17, 132.5, 149.5);
  bezierVertex(136.86, 148.38, 139.5, 145.5, 141.5, 143.5);
  endShape();
}

/*-----pupils-----*/
function drawPupils(fillCol, strokeCol){
  fill(fillCol);
  stroke(strokeCol);
  
  //right
  circle(183.5, 135.5, 10); //big
  circle(183.5, 135.5, 6);  //small
  
  //left
  circle(132.5, 145.5, 10); //big
  circle(132.5, 145.5, 6);  //small
}

/*-----tail-----*/
function drawTail(){
  beginShape();
  vertex(303.02, 440.01);
  bezierVertex(316.5, 438.5, 347.5, 419.5, 373.38, 440.01);
  bezierVertex(401.5, 497.5, 296.5, 458.5, 282.5, 475.5);
  endShape();
  
  //crosshatch
  line(292.3, 471.35, 313.5, 439.5);
  line(301.71, 470.8, 328.5, 435.5);
  line(316.95, 471.41, 344.5, 432.5);
  line(329.78, 472.3, 357.5, 434.5);
  line(342.33, 472.91, 368.8, 439.5);
  line(354.81, 472.69, 372.5, 450.5);
  
  line(314.57, 471.26, 297.5, 457.5);
  line(336.66, 472.69, 302.5, 446.5);
  line(361.42, 471.89, 316.5, 438.5);
  line(373.93, 466.65, 330.32, 435.82);
  line(377.99, 458.78, 338.96, 433.14);
}

/*-----party hat-----*/
function drawHat(fillCol){
  fill(fillCol);
  
  beginShape();
  vertex(135, 115);
  vertex(150, 52);
  vertex(181, 105);
  bezierVertex(175.5, 116.5, 155.5, 122.5, 135, 115);
  endShape();
}

function drawHatPattern(fillCol){
  fill(fillCol);
  
  circle(163.5, 93.5, 12);
  circle(150.5, 104.5, 12);
  
  beginShape();
  vertex(147.71, 61.62);
  bezierVertex(150.44, 62.18, 152.5, 64.6, 152.5, 67.5);
  bezierVertex(152.5, 70.81, 149.81, 73.5, 146.5, 73.5);
  bezierVertex(145.96, 73.5, 145.43, 73.43, 144.93, 73.29);
  endShape(CLOSE);
  
  beginShape();
  vertex(161.45, 71.58);
  bezierVertex(161.14, 71.53, 160.82, 71.5, 160.5, 71.5);
  bezierVertex(157.19, 71.5, 154.5, 74.19, 154.5, 77.5);
  bezierVertex(154.5, 80.81, 157.19, 83.5, 160.5, 83.5);
  bezierVertex(163.09, 83.5, 165.29, 81.87, 166.13, 79.57);
  endShape(CLOSE);
  
  beginShape();
  vertex(142.55, 83.27);
  bezierVertex(143.42, 82.78, 144.43, 82.5, 145.5, 82.5);
  bezierVertex(148.81, 82.5, 151.5, 85.19, 151.5, 88.5);
  bezierVertex(151.5, 91.81, 148.81, 94.5, 145.5, 94.5);
  bezierVertex(143.43, 94.5, 141.6, 93.45, 140.52, 91.85);
  endShape(CLOSE);
  
  beginShape();
  vertex(136.16, 109.97);
  bezierVertex(136.88, 109.67, 137.67, 109.5, 138.5, 109.5);
  bezierVertex(141.81, 109.5, 144.5, 112.19, 144.5, 115.5);
  bezierVertex(144.5, 116.2, 144.38, 116.87, 144.16, 117.49);
  bezierVertex(141.15, 116.95, 138.08, 116.13, 135, 115);
  endShape(CLOSE);
  
  beginShape();
  vertex(167.79, 115.86);
  bezierVertex(165.84, 114.87, 164.5, 112.84, 164.5, 110.5);
  bezierVertex(164.5, 107.19, 167.19, 104.5, 170.5, 104.5);
  bezierVertex(173.81, 104.5, 176.5, 107.19, 176.5, 110.5);
  bezierVertex(176.5, 110.6, 176.5, 110.71, 176.49, 110.81);
  bezierVertex(174.17, 112.87, 171.2, 114.57, 167.79, 115.86);
  endShape(CLOSE);
}

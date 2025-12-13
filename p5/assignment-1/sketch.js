//global colors
const floorBg   = '#d5cebe';
const wall      = '#c3bca9';
const floorDark = '#69665c';
const equip     = '#43433c';
const equipMid  = '#53524c';
const glass     = '#adafa8';
const glassRef  = [138, 178, 183, 100]; // RGBA as array for stroke()
const shadow    = '#b5b7ae';
const dumbbell  = '#4a4a42';

function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent('sketch-container'); // attach to div in HTML
  angleMode(DEGREES);
}

function draw() {
  background('#d5cebe');

  //========== room ==========
  //wall boundaries
  fill(wall);
  stroke(wall);
  triangle(178.34, 400, 400, 400, 400, 252.5);
  triangle(204.12, 0, 400, 0, 400, 151.65);
  beginShape();
  vertex(0, 199.5);
  vertex(155.5, 318.5);
  vertex(30.89, 400);
  vertex(0, 400);
  endShape();

  //entrance path
  fill(floorDark);
  stroke(floorDark);
  beginShape();
  vertex(155.5, 318.5);
  vertex(30.89, 400);
  vertex(178.34, 400);
  vertex(223.06, 370.31);
  endShape();

  //mirror
  fill(equip);
  stroke(equip);
  beginShape(); // frame
  vertex(400, 166.5);
  vertex(292.5, 83.5);
  vertex(292.5, 16.11);
  vertex(297.5, 12.5);
  vertex(400, 90.5);
  endShape();

  fill(glass);
  stroke(glass);
  beginShape(); // glass
  vertex(400, 99.5);
  vertex(297.5, 21.5);
  vertex(297.5, 81.5);
  vertex(400, 158.5);
  endShape();
  
  push();
  fill(118, 245, 241, 65);
  stroke(glassRef);
  blendMode(ADD);
  beginShape(); // reflection
  vertex(297.5, 81.5);
  vertex(297.5, 78.25);
  vertex(337.78, 52.06);
  vertex(351.9, 62.77);
  vertex(309.73, 90.78);
  endShape();
  pop();
  
  //========== equipment ==========

  // treadmills
  drawTreadmillAt(0, 0);
  drawTreadmillAt(40.28, -24.3); 
  drawTreadmillAt(80.56, -48.6); 
  
  // cycling machine
  fill(shadow);
  stroke(shadow);
  beginShape(); // shadow
  vertex(32.5, 183.5);
  vertex(39.5, 179.5);
  bezierVertex(44.89, 186.08, 52.59, 188.8, 58.5, 186.5);
  bezierVertex(61.35, 185.39, 63.28, 183.31, 64.5, 181.5);
  vertex(72.5, 187.5);
  bezierVertex(72.74, 190.36, 73.54, 195.27, 76.5, 200.5);
  bezierVertex(80.4, 207.4, 85.89, 211.01, 88.5, 212.5);
  vertex(95.35, 215.51);
  vertex(108.37, 207.22);
  bezierVertex(110.86, 209.66, 112.18, 211.91, 109.5, 213.5);
  vertex(95.5, 222.5);
  bezierVertex(93.12, 223.62, 90.78, 223.67, 88.5, 222.5);
  vertex(37.5, 185.5);
  bezierVertex(35.43, 184.04, 33.61, 183.09, 32.5, 183.5);
  endShape();
  
  fill(equip);
  stroke(equip);
  beginShape(); // main body
  vertex(88.5, 212.5);
  bezierVertex(85.89, 211.01, 80.4, 207.4, 76.5, 200.5); 
  bezierVertex(73.54, 195.27, 72.74, 190.36, 72.5, 187.5);
  vertex(64.5, 181.5);
  bezierVertex(63.28, 183.3, 61.25, 185.39, 58.5, 186.5);
  bezierVertex(52.59, 188.8, 44.89, 186.08, 39.5, 179.5);
  vertex(32.5, 183.5);
  bezierVertex(31.2, 183.41, 30.04, 182.64, 29.5, 181.5);
  bezierVertex(28.81, 180.06, 29.41, 178.7, 29.5, 178.5);
  vertex(36.5, 174.5);
  bezierVertex(35.45, 172.85, 32.58, 167.87, 33.5, 161.5);
  bezierVertex(33.86, 158.97, 34.72, 156.94, 35.5, 155.5);
  bezierVertex(36.35, 154.55, 38.72, 152.16, 42.5, 151.5);
  bezierVertex(44.09, 151.22, 45.48, 151.33, 46.5, 151.5);
  bezierVertex(47.62, 151.64, 49, 151.92, 50.5, 152.5);
  bezierVertex(53.4, 153.63, 55.38, 155.34, 56.5, 156.5);
  bezierVertex(56, 154.06, 55.12, 150.93, 53.5, 147.5);
  bezierVertex(51.9, 144.1, 50.05, 141.44, 48.5, 139.5);
  bezierVertex(47.52, 139.9, 46.16, 140.33, 44.5, 140.5);
  bezierVertex(43.35, 140.62, 43.33, 140.59, 41.5, 140.5);
  bezierVertex(40.58, 140.12, 38.27, 139.04, 36.5, 136.5);
  bezierVertex(34.76, 134, 34.54, 131.5, 34.5, 130.5);
  bezierVertex(34.51, 129.93, 34.63, 128.67, 35.5, 127.5);
  bezierVertex(35.83, 127.06, 36.19, 126.73, 36.5, 126.5);
  vertex(47.5, 119.5);
  bezierVertex(51.58, 117.04, 55.43, 117.3, 58.5, 121.5);
  bezierVertex(59.41, 122.58, 60.05, 123.63, 60.5, 124.5 );
  bezierVertex(60.77, 125.37, 61.22, 127.31, 60.5, 129.5);
  bezierVertex(60.23, 130.33, 59.85, 131, 59.5, 131.5);
  vertex(54.5, 135.5);
  bezierVertex(56.72, 138.47, 59.88, 143.54, 61.5, 150.5);
  bezierVertex(62.46, 154.63, 62.61, 158.28, 62.5, 161.11);
  bezierVertex(63.9, 162.57, 66.18, 165.36, 67.5, 169.5);
  bezierVertex(68.39, 172.3, 68.54, 174.77, 68.5, 176.5);
  vertex(73.5, 180.5);
  bezierVertex(73.55, 179.72, 73.8, 177.51, 75.5, 175.5);
  bezierVertex(77.76, 172.83, 80.89, 172.54, 81.5, 172.5);
  bezierVertex(81.62, 171.63, 81.66, 170.62, 81.5, 169.5);
  bezierVertex(80.87, 165.07, 77.61, 162.35, 76.5, 161.5);
  bezierVertex(76.32, 161.67, 75.17, 162.67, 73.5, 162.5);
  bezierVertex(71.54, 162.3, 70.59, 160.66, 70.5, 160.5);
  bezierVertex(70.41, 160.1, 70.31, 159.38, 70.5, 158.5);
  bezierVertex(75.25, 154.16, 81.18, 150.36, 89.15, 147.5);
  bezierVertex(91.23, 147.28, 94.67, 148.59, 99.5, 151.5);
  bezierVertex(99.73, 151.7, 100.43, 152.42, 100.5, 153.5);
  bezierVertex(100.59, 154.89, 99.57, 156.11, 98.5, 156.5);
  bezierVertex(97.94, 156.71, 97.26, 156.72, 94.5, 155.5);
  bezierVertex(92.94, 154.81, 91.61, 154.12, 90.5, 153.5);
  vertex(82.5, 158.5);
  bezierVertex(84.02, 160.24, 86.22, 163.24, 87.5, 167.5);
  bezierVertex(88.19, 169.79, 88.44, 171.85, 88.5, 173.5);
  bezierVertex(90.99, 174.74, 98.23, 178.75, 102.5, 187.5);
  bezierVertex(105.57, 193.8, 105.66, 199.6, 105.5, 202.5);
  bezierVertex(107.03, 201.8, 108.75, 202.3, 109.5, 203.5);
  bezierVertex(110.04, 204.37, 110.02, 205.52, 109.5, 206.5);
  vertex(87.5, 220.5);
  bezierVertex(86.09, 221.13, 84.42, 220.71, 83.5, 219.5);
  bezierVertex(82.61, 218.33, 82.61, 216.69, 83.5, 215.5);
  endShape();

  // dumbbell rack
  fill(equipMid);
  stroke(equipMid);
  beginShape(); // main body
  vertex(28.5, 262.5);
  bezierVertex(25.17, 264.63, 22.8, 265.49, 21.5, 262.5);
  vertex(21.5, 226.5);
  bezierVertex(21.35, 223.52, 24.89, 221.1, 29.17, 218.83);
  vertex(44.5, 209.5);
  bezierVertex(47.07, 208.24, 49.75, 209.29, 52.5, 211.5);
  vertex(121.5, 261.5);
  bezierVertex(123.51, 262.82, 124.5, 264.81, 124.5, 267.5);
  vertex(124.5, 302.5);
  bezierVertex(124.5, 304.7, 122.5, 306.5, 119.5, 308.5);
  vertex(101.5, 320.5);
  bezierVertex(97.37, 321.12, 96.45, 319.47, 96.5, 314.5);
  endShape();
  
  fill(equip);
  stroke(equip);
  beginShape(); // perspective details 1
  vertex(100.16, 280.35);
  vertex(124.08, 264.79);
  vertex(124.08, 304.21);
  vertex(100.16, 320.62);
  endShape();
    
  fill(equip);
  stroke(equip);
  beginShape(); // perspective details 2
  vertex(24.5, 227.5);
  vertex(96.5, 280.5);
  vertex(96.5, 309.5);
  vertex(24.5, 255.09);
  endShape();
  
  fill(equip);
  stroke(equip);
  beginShape(); // perspective details 3
  vertex(24.5, 259.5);
  vertex(28.5, 262.5);
  vertex(24.5, 264.39);
  endShape();
  
  // dumbbells
  fill(equip);
  stroke(equip);
  push(); // top row
  ellipse(103, 265.5, 17, 16);
  translate(-18, -13);
  ellipse(103, 265.5, 17, 16);
  translate(-18, -13);
  ellipse(103, 265.5, 17, 16);
  translate(-18, -13);
  ellipse(103, 265.5, 17, 16);
  pop();
  
  fill(dumbbell);
  stroke(dumbbell);
  beginShape(); // bottom row (simplified)
  vertex(96.5, 286.5);
  bezierVertex(96.29, 285.03, 94.73, 282.79, 91.5, 282.5);
  bezierVertex(85.24, 281.8, 81.5, 287.5, 83.5, 292.5);
  bezierVertex(85.39, 297.3, 91.5, 299.5, 96.5, 295.5);
  endShape(CLOSE);
  
  push();
  ellipse(73.5, 277.5, 14, 14);
  translate(-18, -13);
  ellipse(73.5, 277.5, 14, 14);
  translate(-18, -13);
  ellipse(73.5, 277.5, 14, 14);
  pop();
  
  // bench press
  fill(shadow);
  stroke(shadow);
  beginShape(); // shadow 1
  vertex(242.63, 231.08);
  vertex(251.5, 224.5);
  vertex(251.5, 237.5);
  endShape();

  beginShape(); // shadow 2
  vertex(326.5, 231.5);
  vertex(343.5, 220.5);
  bezierVertex(347.49, 221.45, 349.5, 224.5, 348.5, 225.5);
  vertex(332.5, 235.5);
  bezierVertex(330.52, 236.67, 327.35, 234.06, 324.24, 231.52);
  endShape();

  beginShape(); // shadow 3
  vertex(257.5, 231.91);
  vertex(310.5, 198.5);
  vertex(330.5, 213.5);
  vertex(330.5, 221.8);
  vertex(324.61, 225.26);
  vertex(314.5, 218.5);
  vertex(266.57, 248.58);
  vertex(257.5, 241.5);
  endShape();

  fill(equip);
  stroke(equip);
  beginShape(); // main body
  vertex(251.5, 237.5);
  vertex(251.5, 224.5);
  vertex(242.5, 217.5);
  bezierVertex(239.88, 215.27, 240.5, 211.5, 242.5, 209.5);
  vertex(290.5, 179.5);
  vertex(290.5, 142.5);
  bezierVertex(291.16, 138.24, 295.39, 138.42, 296.5, 141.5);
  vertex(296.5, 175.5);
  bezierVertex(299.31, 173.38, 300.5, 171.5, 303.5, 172.5);
  vertex(321.5, 185.5);
  bezierVertex(323.62, 189.8, 320.64, 191.84, 316.5, 195.5);
  vertex(330.5, 205.5);
  vertex(330.5, 169.5);
  bezierVertex(331.5, 166.5, 336.5, 166.5, 336.5, 170.5);
  vertex(336.5, 217.5);
  vertex(339.5, 215.5);
  bezierVertex(342.5, 214.5, 344.5, 217.5, 343.5, 220.5);
  vertex(326.5, 231.5);
  bezierVertex(322.5, 232.5, 320.5, 228.5, 322.5, 226.5);
  vertex(330.5, 221.8);
  vertex(330.5, 213.5);
  vertex(310.5, 198.5);
  vertex(264.5, 227.5);
  bezierVertex(261.72, 229.22, 259.4, 229.15, 257.5, 227.5);
  vertex(257.5, 241.5);
  vertex(265.5, 247.5);
  bezierVertex(268.5, 249.5, 267.5, 254.5, 262.5, 253.5);
  vertex(239.5, 236.5);
  bezierVertex(237.5, 233.5, 240.5, 229.5, 243.5, 231.5);
  vertex(251.5, 237.5);
  endShape();

  fill(equipMid);
  stroke(equipMid);
  beginShape(); // light
  vertex(241.64, 210.61);
  vertex(302.5, 172.5);
  vertex(321.5, 185.5);
  vertex(260.5, 224.5);
  endShape();

  push();
  fill(equip);
  stroke(equip);
  translate(274.14, 139.19);
  rotate(32.02);
  ellipse(0, 0, 24.19, 27.62);
  pop();

  fill(equipMid);
  stroke(equipMid);
  beginShape(); // bar
  vertex(279.5, 138.5);
  vertex(336.84, 179.51);
  bezierVertex(335.25, 181.33, 334.07, 183.15, 333.37, 184.98);
  vertex(276.5, 143.5);
  bezierVertex(275.5, 142.5, 276.5, 138.5, 279.5, 138.5);
  endShape(CLOSE);

  push();
  fill(equip);
  stroke(equip);
  translate(344.14, 187.65);
  rotate(32.02);
  ellipse(0, 0, 24.19, 27.62);
  pop();
}

// draw one treadmill
function drawTreadmillShape() {
  fill(shadow);
  stroke(shadow);
  beginShape(); // shadow
  vertex(89.02, 130.98);
  vertex(143.5, 171.5);
  bezierVertex(146.35, 173.71, 149.35, 175.09, 152.5, 175.5);
  vertex(177.76, 159.96);
  bezierVertex(178.23, 162.1, 177.58, 163.98, 175.5, 165.5);
  vertex(155.5, 178.5);
  bezierVertex(152.16, 180.86, 149.5, 181.5, 147.5, 180.5);
  vertex(91.5, 139.5);
  bezierVertex(88.5, 136.84, 87.43, 134.02, 89.02, 130.98);
  endShape();
  
  fill(equip); 
  stroke(equip);
  beginShape(); // main shape
  vertex(84.5, 84.5);
  vertex(112.5, 68.5);
  bezierVertex(115.46, 67.33, 117.72, 68.21, 119.5, 70.5);
  vertex(123.5, 80.5);
  bezierVertex(124.53, 82.66, 124.44, 84.42, 122.5, 85.5);
  vertex(120.5, 86.5);
  vertex(120.5, 107.5);
  vertex(179.5, 150.5);
  bezierVertex(181.59, 153.34, 181.11, 156.35, 178.5, 159.5);
  vertex(152.5, 175.5);
  bezierVertex(149.35, 175.09, 146.35, 173.71, 143.5, 171.5);
  vertex(89.5, 131.5);
  bezierVertex(88.13, 130.2, 87.26, 128.12, 87.5, 124.5);
  vertex(87.5, 99.5);
  vertex(82.5, 90.5);
  bezierVertex(82.08, 88.33, 82.45, 86.29, 84.5, 84.5);
  endShape();
  
  fill(equipMid);
  stroke(equipMid);
  beginShape(); // belt
  vertex(92.97, 117.93);
  vertex(114.5, 105.5);
  bezierVertex(116.3, 104.91, 118.38, 106.09, 120.5, 107.5);
  vertex(179.5, 150.5);
  bezierVertex(179.83, 151.2, 179.37, 151.86, 178.5, 152.5);
  vertex(155.5, 166.5);
  bezierVertex(153.92, 167.35, 152.1, 167.84, 149.5, 167.5);
  vertex(92.5, 125.5);
  endShape();
  
  fill(floorBg);
  stroke(floorBg);
  beginShape(); // hole
  vertex(92.97, 102.67);
  vertex(114.5, 90.5);
  vertex(114.5, 105.5);
  vertex(92.97, 117.93);
  endShape();
}

// helper to draw one treadmill at an offset
function drawTreadmillAt(x, y, s = 1) {
  push();
  translate(x, y);
  drawTreadmillShape();
  pop();
}

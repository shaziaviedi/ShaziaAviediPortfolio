/*========== triangle pattern globals ==========*/

let maskG; //mask for head/torso/arms with crown hole

/* master spacing + width knobs */
let SPACING = 2; //visible gap between triangles
let WIDTH_SWITCH = 28;   

// main lattice (bigger triangles for torso/head)
const BASE_SIDE = 18; //lattice side that drives the grid
let SIDE = BASE_SIDE - 2 * SPACING; //drawn side is smaller -> makes gaps
const H = (Math.sqrt(3) / 2) * BASE_SIDE; //row step for grid
const DX = BASE_SIDE / 2; //column step (upright/inverted alternating)

// narrow-space lattice (arms, tight cavities, crown band)
const SMALL_BASE_SIDE = 14;
let SMALL_SIDE = SMALL_BASE_SIDE - 2 * SPACING;
const SMALL_H = (Math.sqrt(3) / 2) * SMALL_BASE_SIDE;
const SMALL_DX = SMALL_BASE_SIDE / 2;

/* background lattice knobs */
let BG_SPACING = 3;            //gap for background triangles
const BG_BASE_SIDE = 20;       //grid size for background
let BG_SIDE = BG_BASE_SIDE - 2 * BG_SPACING;
const BG_H = (Math.sqrt(3) / 2) * BG_BASE_SIDE;
const BG_DX = BG_BASE_SIDE / 2;

/* rotation animation knobs */
let ROTATE_RATE = 1.0; //steps per second; each step = +120°
let _stepIndex = 0; //0 -> 0°, 1 -> 120°, 2 -> 240° -> back to 0
let _lastStepMs = 0;
let _angleOffset = 0; 

/* lattice/background visibility tweak */
const LATTICE_PIVOT_FRAC = 0.12; 

let _triBase; //reference to p5's original triangle


/*========== setup ==========*/

function setup() {
  // create canvas and mount it into the project page layout
  const canvas = createCanvas(600, 600);
  canvas.parent('sketch-container');   // <-- key line
  pixelDensity(1);

  // build offscreen mask: white = keep, transparent = cutout (includes crown hole)
  maskG = createGraphics(600, 600);
  maskG.pixelDensity(1);
  maskG.noStroke();
  maskG.clear();

  // draw solid silhouette
  maskG.fill(255);
  drawHeadTorsoArmsPath(maskG);

  // cut the crown hole to transparent using erase()
  maskG.erase();
  drawCrownHolePath(maskG);
  maskG.noErase();

  // lock pixels for sampling
  maskG.loadPixels();

  // keep a reference to p5's original triangle
  _triBase = window.triangle;
}


/*========== draw ==========*/

function draw() {
  // step the global rotation state in discrete 120° increments
  const periodMs = 1000 / max(0.0001, ROTATE_RATE);
  if (millis() - _lastStepMs >= periodMs) {
    _stepIndex = (_stepIndex + 1) % 3; // 0 -> 1 -> 2 -> 0
    _lastStepMs = millis();
  }
  _angleOffset = _stepIndex * (TWO_PI / 3); // 0, 120°, 240°

  background('magenta');

  // background - alternating triangle pattern drawn first
  drawBackgroundLattice(BG_SIDE, BG_BASE_SIDE, BG_H, BG_DX, 0, _angleOffset);

  fill(0);

  // left leg
  TRI(138.87, 566.6, 141.81, 574.8, 147.07, 568.37);
  TRI(150.01, 567.77, 147.07, 575.97, 155.86, 576.56);
  TRI(156.45, 568.36, 160.84, 576.55, 166.41, 568.36);
  TRI(174.32, 560.74, 167.58, 574.8, 182.23, 574.8);
  TRI(195.11, 560.16, 186.33, 574.8, 201.56, 575.39);
  TRI(208.89, 567.2, 204.5, 576.56, 216.2, 573.34);
  TRI(217.09, 557.24, 210.35, 565.12, 220.31, 570.7);
  TRI(197.47, 553.13, 200.97, 566.91, 208.54, 560.24);
  TRI(191.02, 556.05, 185.15, 569.53, 177.54, 556.05);
  TRI(160.55, 556.06, 166.7, 566, 172.27, 555.47);
  TRI(157.91, 558.39, 162.3, 566.02, 154.1, 566.02);
  TRI(145.32, 554.3, 155.86, 555.47, 151.46, 564.25);
  TRI(142.68, 557.23, 137.7, 564.25, 145.9, 564.84);
  TRI(134.19, 550.2, 141.09, 554, 137.1, 560.74);
  TRI(187.21, 541.41, 181.05, 551.95, 193.95, 551.36);
  TRI(213.56, 545.51, 202.74, 551.08, 212.1, 559.57);
  TRI(200.39, 531.45, 188.08, 538.18, 200.39, 547.27);
  TRI(203.91, 532.62, 203.33, 546.68, 215.03, 541.53);
  TRI(184.58, 518.55, 185.16, 533.79, 198, 528);
  TRI(218.55, 522.66, 208.05, 529.46, 215.93, 536.71);
  TRI(201.56, 511.52, 188.67, 516.51, 201.56, 527.34);
  TRI(205.67, 509.77, 203.91, 526.76, 216.21, 521.48);
  TRI(188.37, 496.88, 186.92, 512.7, 201.55, 507.13);
  TRI(221.48, 501.56, 209.18, 507.43, 219.72, 517.38);
  TRI(202.73, 488.09, 189.26, 493.37, 202.73, 502.15);
  TRI(206.25, 488.09, 205.08, 505.08, 218.55, 499.8);
  TRI(223.83, 479.89, 212.12, 487.21, 221.78, 496.29);
  TRI(188.67, 474.61, 188.67, 490.43, 202.72, 484.86);
  TRI(208.6, 469.34, 206.84, 484.57, 221.47, 477.25);
  TRI(206.25, 464.06, 191.6, 471.98, 204.4, 481.1);
  TRI(209.18, 461.72, 225.34, 457.05, 223.82, 472.85);
  TRI(189.26, 451.76, 189.26, 467.58, 202.74, 462.01);
  TRI(205.32, 441.2, 191, 447, 204.72, 456.97);
  TRI(211.82, 440.04, 206.24, 457.03, 220.31, 453.21);
  TRI(232.62, 439.45, 216.21, 439.45, 227.34, 455.27);
  TRI(191.6, 425.39, 189.85, 442.97, 202.73, 438.86);
  TRI(199.81, 425.98, 213.86, 424.81, 208.98, 439.05);
  TRI(220.91, 417.78, 213.87, 435.35, 231.74, 435.35);
  TRI(245.5, 418.95, 227.35, 419.82, 236.42, 434.18);
  TRI(201.79, 407.84, 193.87, 421.07, 210.35, 421.28);
  TRI(206.84, 407.81, 220.9, 407.81, 214.17, 421.88);
  TRI(231.74, 397.86, 222.66, 414.84, 241.41, 414.25);
  TRI(238.48, 399.61, 258.4, 399.03, 248.4, 416.01);
  TRI(209.77, 390.82, 202.73, 404.3, 217.2, 404.3);
  TRI(215.04, 391.41, 231.45, 390.24, 222.95, 404.87);
  TRI(245.5, 377.93, 235.55, 394.92, 254.29, 394.92);
  TRI(219.15, 373.25, 212.11, 387.3, 227.34, 386.72);
  TRI(224.41, 373.24, 241.99, 373.24, 234.08, 389.05);
  TRI(230.57, 353.92, 222.07, 369.14, 239.06, 369.14);

  // right leg
  TRI(303.52, 564.26, 297.07, 562.5, 298.25, 570.12);
  TRI(306.44, 568.94, 300, 574.21, 308.78, 579.49);
  TRI(317, 571.29, 312.89, 580.07, 321.68, 579.49);
  TRI(329.59, 568.37, 325.78, 577.73, 336.91, 573.62);
  TRI(350.7, 562.51, 344.53, 573.63, 355.66, 574.8);
  TRI(354.5, 561.92, 363.87, 563.68, 358.89, 572.46);
  TRI(371.24, 562.37, 363.29, 573.93, 377.93, 574.81);
  TRI(389.35, 561.33, 381, 569, 384, 575);
  TRI(308.22, 567.81, 315.82, 567.19, 312.01, 575.39);
  TRI(318.75, 567.77, 326.95, 567.77, 322.56, 575.39);
  TRI(336.62, 558.99, 332.23, 568.35, 341.6, 571.87);
  TRI(376.18, 557.23, 387.89, 558.4, 378.84, 567.7);
  TRI(302.34, 554.3, 298.17, 559.57, 304.69, 560.15);
  TRI(309.39, 559.24, 305.32, 564.2, 311.63, 564.84);
  TRI(321.39, 556.06, 316.41, 563.67, 324.02, 564.84);
  TRI(304.1, 551.37, 308.2, 551.37, 306.45, 557.81);
  TRI(309.96, 551.37, 319.92, 552.54, 313.77, 561.33);
  TRI(323.44, 553.71, 333.98, 555.47, 328.42, 565.42);
  TRI(338.09, 555.48, 350.97, 552.55, 344.24, 564.84);
  TRI(355.09, 549.61, 350.98, 558.98, 360.93, 561.33);
  TRI(362.7, 555.47, 370.91, 555.75, 365.55, 563.76);
  TRI(384.67, 544.34, 377.34, 554.29, 388.47, 555.47);
  TRI(368.55, 541.99, 362.11, 551.36, 372.65, 553.71);
  TRI(370.31, 540.82, 381.45, 540.82, 375.29, 550.77);
  TRI(353.91, 539.07, 365.04, 539.65, 359.48, 550.19);
  TRI(377.64, 527.35, 370.91, 536.43, 382.03, 538.48);
  TRI(360.65, 526.17, 354.49, 535.54, 365.03, 537.3);
  TRI(362.7, 525.59, 373.23, 527.05, 367.68, 536.12);
  TRI(343.95, 522.66, 356.84, 524.42, 350.69, 534.37);
  TRI(370.91, 509.77, 362.7, 521.48, 375.58, 523.24);
  TRI(351.27, 510.36, 344.53, 519.72, 356.25, 521.48);
  TRI(354.5, 507.42, 367.38, 509.77, 359.76, 520.02);
  TRI(332.23, 505.67, 348.04, 506.25, 340.72, 517.96);
  TRI(363.57, 492.79, 354.5, 503.62, 369.14, 505.66);
  TRI(339.85, 489.26, 332.81, 502.14, 347.46, 502.73);
  TRI(345.12, 489.26, 359.76, 490.44, 350.98, 501.56);
  TRI(320.51, 487.5, 336.33, 487.5, 329.01, 500.4);
  TRI(308.21, 467.28, 323.44, 466.41, 316.11, 479.87);
  TRI(326.94, 471.68, 321.1, 483.98, 333.4, 483.98);
  TRI(331.07, 472.03, 345.09, 473.11, 338.38, 483.99);
  TRI(349.23, 472.85, 342.78, 485.15, 357.42, 486.91);
  TRI(355.66, 475.79, 369.14, 475.78, 363.87, 489.26);
  TRI(295.31, 445.9, 309.38, 445.9, 303.51, 459.37);
  TRI(312.32, 450, 305.86, 462.3, 320.51, 461.71);
  TRI(318.17, 450.59, 334.57, 451.76, 326.37, 466.99);
  TRI(339.25, 454.1, 329.88, 468.16, 345.7, 468.16);
  TRI(345.12, 454.1, 360.89, 454.74, 352.44, 469.32);
  TRI(364.44, 459.38, 355.67, 472.27, 371.48, 472.26);
  TRI(299.12, 430.67, 293.55, 441.79, 305.25, 441.44);
  TRI(303.52, 430.66, 320.51, 431.25, 312.93, 445.53);
  TRI(325.2, 433.01, 316.99, 447.07, 333.4, 447.65);
  TRI(346.3, 432.43, 337.5, 449.99, 354.5, 448.83);
  TRI(281.25, 424.81, 297.66, 424.81, 290.62, 438.28);
  TRI(328.71, 430.08, 343.36, 430.08, 337.49, 442.97);
  TRI(286.23, 406.05, 278.91, 420.7, 293.54, 419.83);
  TRI(291.8, 405.47, 309.38, 405.47, 299.71, 419.57);
  TRI(312.3, 410.16, 301.76, 425.97, 319.34, 426.56);
  TRI(315.82, 408.98, 331.05, 408.98, 323.73, 423.62);
  TRI(336.04, 410.16, 326.96, 426.56, 343.94, 425.97);
  TRI(267.19, 401.37, 283.01, 402.55, 275.98, 416.6);
  TRI(326.36, 387.89, 316.41, 404.29, 333.98, 404.88);

  // cloth
  TRI(330.54, 308.28, 344.53, 305.87, 336.66, 320.48);
  TRI(347.17, 306.45, 343.37, 324.61, 358.01, 318.44);
  TRI(349.23, 304.39, 359.19, 298.5, 360.35, 310.54);
  TRI(362.7, 307.03, 369.71, 311.74, 360.35, 319.33);
  TRI(363.28, 298.25, 374.41, 297.07, 371.19, 309.95);
  TRI(367.39, 280.08, 360.94, 295.31, 373.24, 294.14);
  TRI(343.94, 327.54, 358.01, 334.56, 345.12, 339.26);
  TRI(341.1, 344.14, 353.31, 341.02, 351.26, 352.15);
  TRI(350.97, 356.84, 342.77, 367.96, 355.07, 368.55);
  TRI(341.02, 370.9, 352.73, 372.08, 345.71, 383.79);
  TRI(335.75, 372.07, 328.72, 384.68, 343.36, 386.13);
  TRI(329.88, 389.07, 343.36, 389.65, 336.92, 402.54);
  TRI(359.77, 335.16, 356.25, 350.39, 369.14, 348.04);
  TRI(351.57, 354.5, 366.21, 352.74, 360.06, 367.38);
  TRI(371.77, 351.56, 365.05, 364.75, 378.52, 365.63);
  TRI(361.52, 369.14, 373.78, 370.55, 368.26, 380.87);
  TRI(357.43, 368.56, 364.45, 383.2, 350.39, 383.2);
  TRI(360.35, 386.72, 348.63, 386.14, 355.37, 397.84);
  TRI(346.58, 389.64, 340.43, 403.13, 352.73, 403.13);
  TRI(338.66, 406.94, 355.08, 406.65, 346.58, 420.69);
  TRI(380.27, 368.56, 371.49, 380.58, 385.54, 381.44);
  TRI(369.73, 384.97, 383.79, 386.14, 377.64, 398.43);
  TRI(365.63, 384.38, 359.77, 396.67, 372.07, 397.26);
  TRI(358.01, 400.78, 371.48, 400.78, 365.03, 413.67);
  TRI(357.72, 410.15, 348.05, 425.98, 366.21, 425.98);
  TRI(348.63, 429.5, 366.21, 430.67, 358.89, 444.72);
  TRI(386.42, 390.82, 380.86, 399.61, 391.41, 399.61);
  TRI(376.46, 400.79, 369.14, 414.25, 382.61, 414.84);
  TRI(383.2, 403.72, 394.92, 402.54, 387.61, 414.84);
  TRI(366.21, 417.19, 381.44, 418.36, 372.66, 431.25);
  TRI(397.86, 404.3, 391.41, 416.01, 404.3, 416.6);
  TRI(388.39, 418.94, 401.96, 420.12, 394.64, 430.67);
  TRI(386.12, 420.12, 377.93, 431.24, 391.4, 431.83);
  TRI(370.03, 433.59, 361.52, 447.94, 378.51, 447.65);
  TRI(376.76, 435.36, 390.82, 435.95, 382.62, 447.66);
  TRI(365.92, 452.36, 380.86, 451.76, 372.95, 465.23);
  TRI(406.06, 419.53, 399.61, 431.83, 412.5, 432.42);
  TRI(397.85, 434.77, 409.57, 436.53, 404.01, 446.48);
  TRI(394.93, 435.94, 387.89, 448.24, 400.78, 449.41);
  TRI(387.89, 452.93, 401.95, 453.8, 394.63, 464.65);
  TRI(383.79, 453.52, 377.34, 466.99, 390.82, 467.58);
  TRI(375.59, 471.38, 390.82, 470.51, 384.95, 482.81);
  TRI(414.55, 436.53, 408.39, 446.77, 421.29, 447.06);
  TRI(406.64, 450, 418.36, 450, 413.66, 459.51);
  TRI(405.46, 453.52, 399.61, 465.23, 411.34, 464.88);
  TRI(397.86, 469.62, 411.33, 468.76, 406.05, 481.05);
  TRI(395.22, 470.52, 389.06, 481.34, 401.37, 481.05);
  TRI(386.72, 484.57, 400.78, 484.57, 395.79, 495.12);
  TRI(422.17, 449.99, 416.6, 461.72, 428.95, 461);
  TRI(417.19, 464.07, 427.73, 464.65, 422.47, 475.19);
  TRI(414.85, 468.75, 410.16, 479.29, 421.88, 478.12);
  TRI(408.99, 481.65, 421.29, 481.65, 414.85, 492.77);
  TRI(405.46, 484.57, 400.2, 494.53, 411.33, 494.53);
  TRI(397.85, 498.05, 410.16, 498.05, 406.21, 507.47);
  TRI(431.54, 463.49, 427.15, 475.19, 438.28, 473.43);
  TRI(425.98, 477.83, 437.11, 476.96, 433.58, 486.91);
  TRI(424.65, 482.52, 419.53, 492.77, 430.66, 492.18);
  TRI(417.19, 495.12, 428.91, 495.71, 425.1, 506.25);
  TRI(415.42, 497.47, 409.57, 508.59, 420.07, 507.14);
  TRI(441.22, 476.37, 437.11, 487.5, 448.24, 485.15);
  TRI(437.11, 490.74, 449.41, 488.09, 441.8, 500.97);
  TRI(433.59, 492.19, 428.32, 504.49, 438.81, 501.81);
  TRI(423.04, 509.18, 410.74, 512.12, 421.87, 517.97);
  TRI(450.59, 485.75, 458.75, 490.8, 452.63, 495.69);
  TRI(448.25, 497.46, 443.55, 505.07, 451.17, 506.25);
  TRI(431.26, 507.42, 440.03, 505.66, 437.1, 515.04);
  TRI(425.98, 508.6, 426.27, 518.54, 431.82, 513.57);
  TRI(452.61, 498.17, 459.41, 497.74, 453.79, 503.94);
  TRI(443.03, 507.47, 439.46, 517.38, 448, 511.05);
  TRI(427.74, 520.91, 433.89, 515.71, 437.1, 523.83);
  TRI(461.14, 492.19, 462.9, 501.56, 469.92, 497.77);
  TRI(452.93, 508.01, 459.96, 505.08, 458.78, 513.28);
  TRI(450.29, 512.12, 452.04, 521.48, 456.44, 516.5);
  TRI(445.53, 518.05, 439.02, 523.77, 449.7, 525.6);
  TRI(473.44, 499.81, 474.03, 506.84, 483.38, 504.2);
  TRI(462.89, 503.32, 470.51, 503.32, 463.48, 511.52);
  TRI(462.5, 514.27, 468.75, 512.7, 465.91, 519.72);
  TRI(459.38, 515.63, 454.69, 524.41, 464.06, 523.24);
  TRI(472.27, 512.11, 468.17, 522.65, 478.12, 520.89);
  TRI(474.61, 509.19, 483.4, 507.42, 479, 516.79);
  TRI(485.16, 501.57, 495.12, 502.74, 489.26, 510.94);
  TRI(485.45, 509.77, 481.65, 519.73, 489.7, 515.93);
  TRI(495.13, 506.25, 492.19, 513.88, 500.39, 510.93);
  TRI(498.05, 502.73, 506.84, 502.73, 502.73, 509.18);

  // left stick
  TRI(141.21, 541.41, 134.18, 547.84, 142.97, 551.36);
  TRI(130.67, 534.38, 138.28, 538.49, 132.43, 543.75);
  TRI(135.95, 524.42, 130.66, 532.02, 138.86, 534.96);
  TRI(126.57, 518.56, 134.18, 521.79, 128.91, 527.93);
  TRI(131.84, 506.84, 126, 514.1, 134.76, 518.55);
  TRI(122.47, 499.81, 130.08, 503.33, 124.81, 510.35);
  TRI(128.03, 488.09, 121.29, 495.69, 130.66, 500.39);
  TRI(117.19, 480.47, 125.98, 484.87, 119.53, 491.6);
  TRI(124.8, 469.34, 117.22, 476.01, 126.56, 480.47);
  TRI(113.09, 461.14, 123.05, 465.24, 116.02, 471.68);
  TRI(120.41, 450, 112.51, 457.33, 123.04, 461.13);
  TRI(107.82, 440.63, 120.79, 444.45, 109.58, 452.93);

  // head, torso, arms — lattice
  drawAlternatingLattice(SIDE, BASE_SIDE, H, DX, false, _angleOffset);         // main body pass
  drawAlternatingLattice(SMALL_SIDE, SMALL_BASE_SIDE, SMALL_H, SMALL_DX, true, _angleOffset); // narrow pass
}


/*========== helpers ==========*/

// background alternating lattice
function drawBackgroundLattice(side, base, rowStep, colStep, gray, angleOffset) {
  noStroke();
  fill(gray);
  for (let r = 0, y = 0; y <= height + rowStep; r++, y += rowStep) {
    for (let c = 0, x = 0; x <= width + base; c++, x += colStep) {
      const baseRot = ((r + c) % 2 === 0) ? -HALF_PI : HALF_PI;

      // build triangle vertices, then rotate them around an off-center pivot
      const v = equiVertsFromSide(x, y, side, baseRot);

 
      const pivot = offCenterPivot(x, y, side, r, c);
      const p1 = rotAbout(v[0].x, v[0].y, pivot.x, pivot.y, angleOffset);
      const p2 = rotAbout(v[1].x, v[1].y, pivot.x, pivot.y, angleOffset);
      const p3 = rotAbout(v[2].x, v[2].y, pivot.x, pivot.y, angleOffset);

      _triBase(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
  }
}

// organized lattice drawer; if narrowMode=true, restrict to narrow zones and flip apex across width
function drawAlternatingLattice(side, base, rowStep, colStep, narrowMode, angleOffset) {
  noStroke();
  fill(0);

  for (let r = 0, y = 0; y <= height + rowStep; r++, y += rowStep) {
    for (let c = 0, x = 0; x <= width + base; c++, x += colStep) {
      if (sampleAlpha(maskG, x, y) <= 1) continue;

      // decide which lattice draws here based on local thickness (also fixes crown band)
      const thick = localThickness(maskG, x, y, 40);
      if (narrowMode) {
        if (thick >= WIDTH_SWITCH) continue;
      } else {
        if (thick < WIDTH_SWITCH) continue;
      }

      // alternating upright / upside-down along the row
      let rot = ((r + c) % 2 === 0) ? -HALF_PI : HALF_PI;

      // in narrow strips, align triangles across the strip
      if (narrowMode) {
        const g = estimateGradient(maskG, x, y, 2);
        const normal = atan2(g.gy, g.gx); // points outward
        const q = x * Math.cos(normal) + y * Math.sin(normal);
        const across = floor(q / (base * 0.5));
        rot = (across % 2 === 0) ? normal : normal + PI; // face each other across width
      }

      // build triangle vertices at the base orientation
      const v = equiVertsFromSide(x, y, side, rot);

      // rotate vertices around a slightly off-center pivot to make motion visible at 120°
      const pivot = offCenterPivot(x, y, side, r, c);
      const p1 = rotAbout(v[0].x, v[0].y, pivot.x, pivot.y, angleOffset);
      const p2 = rotAbout(v[1].x, v[1].y, pivot.x, pivot.y, angleOffset);
      const p3 = rotAbout(v[2].x, v[2].y, pivot.x, pivot.y, angleOffset);

      // margin check with the rotated triangle
      if (!triangleInsideMaskWithMargin(maskG, [p1, p2, p3], SPACING * 0.5)) continue;

      _triBase(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
  }
}

// off-center pivot for lattice/background triangles
function offCenterPivot(cx, cy, side, r, c) {
  const dir = ((r + c) % 2 === 0) ? -HALF_PI : HALF_PI;
  const mag = side * LATTICE_PIVOT_FRAC; //small offset
  return { x: cx + mag * Math.cos(dir), y: cy + mag * Math.sin(dir) };
}

// sample alpha from a p5.Graphics at (x,y)
function sampleAlpha(g, x, y) {
  const ix = constrain(floor(x), 0, g.width - 1);
  const iy = constrain(floor(y), 0, g.height - 1);
  const idx = 4 * (iy * g.width + ix);
  return g.pixels[idx + 3];
}

// estimate gradient of the mask alpha
function estimateGradient(g, x, y, r) {
  const ax1 = sampleAlpha(g, x + r, y);
  const ax0 = sampleAlpha(g, x - r, y);
  const ay1 = sampleAlpha(g, x, y + r);
  const ay0 = sampleAlpha(g, x, y - r);
  return { gx: ax1 - ax0, gy: ay1 - ay0 };
}

// approximate local half-thickness
function localThickness(g, x, y, maxR) {
  let minD = maxR;
  for (let a = 0; a < TWO_PI; a += TWO_PI / 16) {
    for (let d = 1; d <= maxR; d += 1) {
      const sx = x + d * Math.cos(a);
      const sy = y + d * Math.sin(a);
      if (sampleAlpha(g, sx, sy) <= 1) {
        minD = Math.min(minD, d);
        break;
      }
    }
  }
  return minD;
}

function triangleInsideMaskWithMargin(g, verts, margin) {
  const pts = [
    verts[0], verts[1], verts[2],
    { x: (verts[0].x + verts[1].x) / 2, y: (verts[0].y + verts[1].y) / 2 },
    { x: (verts[1].x + verts[2].x) / 2, y: (verts[1].y + verts[2].y) / 2 },
    { x: (verts[2].x + verts[0].x) / 2, y: (verts[2].y + verts[0].y) / 2 },
  ];
  for (let p of pts) {
    if (sampleAlpha(g, p.x, p.y) <= 1) return false;
    if (localThickness(g, p.x, p.y, ceil(margin * 2)) < margin) return false;
  }
  return true;
}

// vertices for an equilateral triangle given center (cx,cy), side length 'side', rotation 'a'
function equiVertsFromSide(cx, cy, side, a) {
  const R = side / Math.sqrt(3); // circumradius
  const a0 = a;
  const a1 = a + TWO_PI / 3;
  const a2 = a + 2 * TWO_PI / 3;
  return [
    { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) },
    { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) },
    { x: cx + R * Math.cos(a2), y: cy + R * Math.sin(a2) },
  ];
}

// rotate a point about (cx, cy)
function rotAbout(x, y, cx, cy, a) {
  const dx = x - cx, dy = y - cy;
  const ca = Math.cos(a), sa = Math.sin(a);
  return { x: cx + dx * ca - dy * sa, y: cy + dx * sa + dy * ca };
}

// draw a single triangle rotated by the global 0/120/240
function TRI(x1, y1, x2, y2, x3, y3) {
  const cx = (x1 + x2 + x3) / 3;
  const cy = (y1 + y2 + y3) / 3;
  const p1 = rotAbout(x1, y1, cx, cy, _angleOffset);
  const p2 = rotAbout(x2, y2, cx, cy, _angleOffset);
  const p3 = rotAbout(x3, y3, cx, cy, _angleOffset);
  _triBase(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
}

// draw silhouette path for head/torso/arms onto a p5.Graphics 'g'
function drawHeadTorsoArmsPath(g) {
  g.beginShape();
  g.vertex(123.64, 183.77);
  g.bezierVertex(151.5, 127.5, 148.5, 58.5, 213.28, 61.53);
  g.bezierVertex(231.5, 32.5, 224.5, 26.5, 241.9, 14.08);
  g.bezierVertex(284.5, -11.5, 361.5, 45.5, 297.96, 128.32);
  g.bezierVertex(289.71, 138.94, 276.78, 141.53, 262.51, 141.8);
  g.bezierVertex(268.84, 152.53, 274.44, 162.61, 278.93, 171.68);
  g.vertex(404.89, 174.03);
  g.vertex(439.95, 232.41);
  g.bezierVertex(450.5, 230.5, 459.5, 248.5, 454.08, 257.21);
  g.vertex(477.5, 307.5);
  g.bezierVertex(472.5, 320.5, 441.5, 339.5, 395.22, 398.43);
  g.vertex(386.13, 380.26);
  g.vertex(457.32, 304.53);
  g.vertex(437.69, 270.7);
  g.bezierVertex(423.5, 269.5, 414.5, 253.5, 423.04, 241.24);
  g.vertex(393.16, 194.24);
  g.vertex(355.09, 196.88);
  g.bezierVertex(343.07, 218.3, 345.32, 217.72, 331.05, 223.83);
  g.vertex(316.41, 247.27);
  g.vertex(307.58, 279.49);
  g.vertex(341.89, 332.23);
  g.vertex(347.21, 356.74);
  g.vertex(312.01, 401.43);
  g.vertex(261.33, 396.34);
  g.vertex(231.45, 349.8);
  g.vertex(260.1, 298.5);
  g.vertex(235.99, 260.74);
  g.bezierVertex(231.65, 254.77, 224.94, 235.84, 216.5, 207.5);
  g.vertex(201.56, 260.74);
  g.bezierVertex(205.09, 268.5, 202.17, 283.5, 192.85, 285.15);
  g.vertex(152.95, 427.46);
  g.bezierVertex(146.33, 447.46, 140.5, 445.5, 106.92, 436.52);
  g.vertex(106.05, 446.78);
  g.bezierVertex(67.5, 425.5, 122.75, 387.49, 129.05, 430.07);
  g.bezierVertex(139.23, 426.61, 155.42, 343.67, 169.92, 283);
  g.bezierVertex(162.5, 270.5, 166.5, 253.5, 181.64, 249.98);
  g.bezierVertex(192.69, 203.72, 188.5, 180.5, 236.72, 190.52);
  g.bezierVertex(223.76, 150.55, 175.91, 189.59, 167.89, 188);
  g.bezierVertex(161.56, 185.48, 159.59, 181.8, 159.81, 177.54);
  g.bezierVertex(152.32, 178.86, 147.85, 178.57, 152.64, 173.34);
  g.bezierVertex(146.08, 174.56, 143.8, 172.83, 143.68, 169.6);
  g.vertex(123.64, 183.77);
  g.endShape(CLOSE);
}

// draw the crown hole path
function drawCrownHolePath(g) {
  g.beginShape();
  g.vertex(232.89, 62.55);
  g.bezierVertex(223.5, 15.5, 267.5, 14.5, 281.84, 26.19);
  g.bezierVertex(291.5, 35.5, 293.5, 53.5, 291.5, 61.5);
  g.bezierVertex(282.32, 80.47, 270.63, 84.01, 251.5, 86.5);
  g.bezierVertex(247.5, 78.5, 244.15, 76.75, 247.5, 68.5);
  g.bezierVertex(236.5, 71.5, 241.5, 67.5, 232.89, 62.55);
  g.endShape(CLOSE);
}

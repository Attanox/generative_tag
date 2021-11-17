const SPACE = 32;

let textToDisplay = "";
let fontSize = 120;
let font;

let phase = 0;
let zoff = 0;

const noiseMax = 3;

function preload() {
  font = loadFont("assets/fonts/Inconsolata-Regular.ttf");
}

function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(30);
  // fill(255);
  // noStroke();
  noFill();
  stroke(255);

  textAlign(CENTER, CENTER);

  const lettersToDisplay = textToDisplay.split("");

  lettersToDisplay.forEach((letter, idx) => {
    const points = font.textToPoints(
      letter,
      0 + idx * fontSize,
      innerHeight / 2,
      fontSize,
      {
        sampleFactor: 1,
      }
    );

    beginShape();
    points.forEach((p, i) => {
      let multiplier = map(i, 0, points.length, 0, TWO_PI);
      let a = multiplier * 0.5;

      let xoff = map(cos(a), -1, 1, 0, noiseMax);
      let yoff = map(sin(a), -1, 1, 0, noiseMax);

      let r = noise(xoff, yoff);
      console.log({ r });
      let x = r + p.x * a;
      let y = r + p.y * a;

      // circle(p.x + x, p.y + y, 5);
      vertex(x, y);
      // vertex(p.x, p.y);
    });
    endShape(CLOSE);
  });
}

function keyPressed() {
  if (keyCode >= 65 && keyCode <= 90) {
    let letter = char(keyCode);

    textToDisplay += letter;
  }

  if (keyCode === BACKSPACE) {
    textToDisplay = textToDisplay.slice(0, textToDisplay.length - 1);
  }

  if (keyCode === SPACE) {
    textToDisplay += char(SPACE);
  }

  if (keyCode === RETURN || keyCode === ENTER) {
    textToDisplay += char(10);
  }
}

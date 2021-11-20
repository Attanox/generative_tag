const simplex = new SimplexNoise();

const density = 50;

const scale = 0.005;

const angle_multiplier = 16;

let z_coord = 4;

const rand_vector_add = 10;

let points = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(30);

  noiseDetail(1);
  // pixelDensity(1);
  // noiseSeed(random());

  const space = width / density;

  for (let x = 0; x < width; x += space) {
    for (let y = 0; y < height; y += space) {
      const p = createVector(
        x + random(rand_vector_add, -rand_vector_add),
        y + random(rand_vector_add, -rand_vector_add)
      );

      points.push(p);
    }
  }
}

function draw() {
  opt1();
}

function opt1() {
  noStroke();

  for (let idx = 0; idx < points.length; idx++) {
    const pos = points[idx];

    const r = map(pos.x, 0, width, 255, 100);
    const g = map(pos.y, 0, height, 255, 100);
    const b = map(pos.x, 0, width, 100, 255);

    fill(r, g, b);

    const angle =
      simplex.noise2D(
        pos.x * scale + simplex.noise2D(pos.x * scale),
        pos.y * scale + simplex.noise2D(pos.y * scale)
      ) *
      TWO_PI *
      angle_multiplier;

    pos.add(p5.Vector.fromAngle(angle));

    circle(pos.x, pos.y, 1);
  }
}

function opt2() {
  loadPixels();
  let yoff = 0;
  for (let y = 0; y < height; y++) {
    let xoff = 0;
    for (let x = 0; x < width; x++) {
      let i = (x + y * width) * 4;

      let n =
        simplex.noise3D(
          xoff + simplex.noise3D(xoff, yoff, z_coord),
          yoff + simplex.noise3D(xoff, yoff, z_coord),
          z_coord
        ) * 255;

      pixels[i] = clr;
      pixels[i + 1] = clr;
      pixels[i + 2] = clr;
      pixels[i + 3] = alpha(clr);
      xoff += 0.01;
    }
    yoff += 0.01;
  }
  z_coord += 0.001;
  updatePixels();
}

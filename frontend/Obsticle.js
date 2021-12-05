class Obsticle {
  constructor({ x, y, w, h }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.pos = [x, y, w, h];
  }

  static getProperties() {
    const x = random(width - 50);
    const y = random(height - 50);

    const w = 10 * (Math.floor(random(5)) + 1);
    const h = 10 * (Math.floor(random(5)) + 1);
    return { x, y, w, h };
  }

  render() {
    fill(255);

    rect(...this.pos);
  }
}

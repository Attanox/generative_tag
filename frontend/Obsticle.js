class Obsticle {
  constructor({ x, y, w, h }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.pos = [x, y, w, h];
  }

  render() {
    fill(255);

    rect(...this.pos);
  }
}

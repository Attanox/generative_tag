class Agent {
  constructor(pos, vel, radius, color) {
    this.pos = pos;
    this.vel = vel;
    this.radius = radius;
    this.color = color;
  }
  collide(other) {
    // do not collide with yourself
    if (other == this) {
      return;
    }

    let relative = p5.Vector.sub(other.pos, this.pos);
    let dist = relative.mag() - (this.radius + other.radius);

    if (dist < 0) {
      let movement = relative.copy().setMag(abs(dist / 2));
      this.pos.sub(movement);
      other.pos.add(movement);

      let thisToOtherNormal = relative.copy().normalize();
      let approachSpeed =
        this.vel.dot(thisToOtherNormal) + -other.vel.dot(thisToOtherNormal);
      let approachVector = thisToOtherNormal.copy().setMag(approachSpeed);
      this.vel.sub(approachVector);
      other.vel.add(approachVector);
    }
  }

  move(acc) {
    // gravity
    // this.vel.y += 0.1;

    // moving means adding velocity to position
    this.pos.add(this.vel);

    this.checkBoundaries();
  }

  checkBoundaries() {
    // if Agent hits border of canvas make it bounce
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y = -this.vel.y;
    }
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y = -this.vel.y;
    }
  }

  setPosition(x, y) {
    this.pos.x = this.pos.x + x;
    this.pos.y = this.pos.y - y;

    this.checkBoundaries();
  }

  render() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }
}

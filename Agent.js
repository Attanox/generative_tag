class Agent {
  static taggedColor = `rgb(255, 100, 100)`;
  static notTaggedColor = `rgb(100, 255, 100)`;

  constructor(vel, radius, tagged) {
    this.vel = vel;
    this.radius = radius;
    this.tagged = tagged;

    this.color = this.getColor();
    this.setStartingPosition(tagged);
  }

  getColor() {
    if (this.tagged) {
      return color(Agent.taggedColor);
    } else {
      return color(Agent.notTaggedColor);
    }
  }

  setStartingPosition(tagged = false) {
    const taggedPos = [random(width), random(height - height / 3, height)];
    const notTaggedPos = [random(width), random(0, height / 3)];

    const pos = tagged ? taggedPos : notTaggedPos;

    this.pos = createVector(...pos);
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

      if (other.tagged) {
        this.tag();
        other.untag();
        return;
      }
      if (this.tagged) {
        other.tag();
        this.untag();
      }
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
      // ? should it ?
      this.vel.x = -this.vel.x;
    }
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      // ? should it ?
      this.vel.x = -this.vel.x;
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      // ? should it ?
      this.vel.y = -this.vel.y;
    }
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      // ? should it ?
      this.vel.y = -this.vel.y;
    }
  }

  changePosition(x, y) {
    this.pos.x = this.pos.x + x;
    this.pos.y = this.pos.y - y;

    this.checkBoundaries();
  }

  render() {
    const clr = this.getColor();
    fill(clr);
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  tag() {
    this.tagged = true;
  }

  untag() {
    this.tagged = false;
  }
}

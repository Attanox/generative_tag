class Agent {
  static taggedColor = `rgb(255, 100, 100)`;
  static notTaggedColor = `rgb(100, 255, 100)`;

  static maxSpeed = 3;
  static maxForce = 5;

  static imuneAmount = 300;

  constructor(id, pos, vel, radius, obsticles = []) {
    this.id = id;

    this.radius = radius;

    this.vel = createVector(vel.x, vel.y);
    this.pos = createVector(pos.x, pos.y);

    this.imune = 0;

    this.obsticles = obsticles;
  }

  changeVel(vel) {
    this.vel = createVector(vel.x, vel.y);
  }

  changePos(pos) {
    this.pos = createVector(pos.x, pos.y);
  }

  getColor(taggedPlayersID) {
    if (taggedPlayersID.includes(this.id)) {
      return color(Agent.taggedColor);
    } else {
      return color(Agent.notTaggedColor);
    }
  }

  static getStartingPosition() {
    return {
      x: random(width),
      y: random(height),
    };
  }

  static getStartingVelocity() {
    const p5v = p5.Vector.random2D().mult(random(10));

    return { x: p5v.x, y: p5v.y };
  }

  static getHunterVelocity() {
    const p5v = p5.Vector.random2D().mult(0.5);

    return { x: p5v.x, y: p5v.y };
  }

  collide(other, taggedPlayersID = []) {
    let otherPosition = createVector(other.pos.x, other.pos.y);

    // find out if two agents are close
    let relative = p5.Vector.sub(otherPosition, this.pos);
    let dist = relative.mag() - (this.radius + other.radius);

    // if agents are too close
    if (dist < 0) {
      // send them opposite ways
      let movement = relative.copy().setMag(abs(dist / 2));
      this.pos.sub(movement);
      // other.pos.add(movement);

      // * tagging part
      if (
        taggedPlayersID.includes(this.id) &&
        taggedPlayersID.includes(other.id)
      ) {
        return "";
      }

      if (taggedPlayersID.includes(this.id)) {
        this.pos.x = this.pos.x - this.radius;
        this.pos.y = this.pos.y - this.radius;
        return { tag: other.id, untag: this.id };
      }

      if (taggedPlayersID.includes(other.id)) {
        return { tag: this.id, untag: other.id };
      }
    }
  }

  huntersCollided(other) {
    if (!other) return;
    let otherPosition = createVector(other.pos.x, other.pos.y);

    // find out if two agents are close
    let relative = p5.Vector.sub(otherPosition, this.pos);
    let dist = relative.mag() - (this.radius + other.radius);

    // if agents are too close
    if (dist < 0) {
      // send them opposite ways
      let movement = relative.copy().setMag(abs(dist / 2));
      this.pos.sub(movement);
      // other.pos.add(movement);

      return true;
    }

    return false;
  }

  possesion(vessel, taggedPlayersID) {
    let otherPosition = createVector(vessel.pos.x, vessel.pos.y);

    // find out if two agents are close
    let relative = p5.Vector.sub(otherPosition, this.pos);
    let dist = relative.mag() - (this.radius + vessel.radius);

    // if agents are too close
    if (dist < 0) {
      if (!taggedPlayersID.includes(this.id)) {
        // send them opposite ways
        let movement = relative.copy().setMag(abs(dist / 2));
        this.pos.sub(movement);
        // vessel.pos.add(movement);
        return "";
      }
      return vessel.id;
    }

    return "";
  }

  isImune() {
    return this.imune > 0;
  }

  move() {
    // moving means adding velocity to position
    this.pos.add(this.vel.limit(2));

    this.checkBoundaries();

    if (this.imune) this.imune--;

    return {
      id: this.id,
      pos: { x: this.pos.x, y: this.pos.y },
      vel: { x: this.vel.x, y: this.vel.y },
      radius: this.radius,
    };
  }

  checkBoundaries() {
    // if Agent hits border of canvas make it bounce
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x = -this.vel.x;
      return;
    }
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x = -this.vel.x;
      return;
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y = -this.vel.y;
      return;
    }
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y = -this.vel.y;
      return;
    }
  }

  changePosition(x, y) {
    this.pos.x = this.pos.x + Math.min(x);
    this.pos.y = this.pos.y - y;

    this.checkBoundaries();
  }

  // taken from https://www.youtube.com/watch?v=4hA7G3gup-4&list=PLLHSiGX_Xw7GPGdb5GZZGYlQsYPg71N3n
  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    let speed = Agent.maxSpeed;
    if (d < 100) {
      speed = map(d, 0, 100, 0, Agent.maxSpeed);
    }
    desired.setMag(speed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(Agent.maxForce);
    this.vel = steer;
  }

  hunt(hunted) {
    this.arrive(hunted.pos);
  }

  // taken from https://stackoverflow.com/questions/55419162/corner-collision-angles-in-p5-js
  resolveRectCircleCollision(obsticles) {
    obsticles.forEach((obsticle) => {
      let hx = 0.5 * obsticle.w;
      let hy = 0.5 * obsticle.h;
      let rx = obsticle.x + hx;
      let ry = obsticle.y + hy;
      let dx = this.pos.x - rx;
      let dy = this.pos.y - ry;

      let sx = dx < -hx ? -1 : dx > hx ? 1 : 0;
      let sy = dy < -hy ? -1 : dy > hy ? 1 : 0;

      let tx = sx * (Math.abs(dx) - hx);
      let ty = sy * (Math.abs(dy) - hy);
      let dc = Math.hypot(tx, ty);
      if (dc > this.radius) return false;

      let nx = 0;
      let ny = 0;
      let nl = 0;

      if (sx == 0 && sy == 0) {
        nx = dx > 0 ? 1 : -1;
        ny = dy > 0 ? 1 : -1;

        nl = Math.hypot(nx, ny);
      } else {
        nx = tx;
        ny = ty;
        nl = dc;
      }
      nx /= nl;
      ny /= nl;

      this.pos.x += (this.radius - dc) * nx;
      this.pos.y += (this.radius - dc) * ny;

      let dv = this.vel.x * nx + this.vel.y * ny;
      if (dv >= 0.0) return false;

      this.vel.x -= 2.0 * dv * nx;
      this.vel.y -= 2.0 * dv * ny;

      return true;
    });
  }

  render(taggedPlayersID) {
    const color = this.getColor(taggedPlayersID);
    fill(color);

    // * stroke so we know which one is ours
    strokeWeight(3);
    stroke(100, 100, 250);

    ellipse(this.pos.x, this.pos.y, this.radius * 2);
    noStroke();
  }

  static configRender(
    { id, pos, radius, vel },
    taggedPlayersID,
    isVessel = false
  ) {
    let fillColor;

    if (isVessel) {
      fillColor = color("rgba(255, 255, 255, 0)");
    } else if (taggedPlayersID.includes(id)) {
      fillColor = color(Agent.taggedColor);
    } else {
      fillColor = color(Agent.notTaggedColor);
    }

    fill(fillColor);

    if (isVessel) stroke(255);
    ellipse(pos.x, pos.y, radius * 2);
    noStroke();
  }
}

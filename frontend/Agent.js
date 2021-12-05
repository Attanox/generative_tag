class Agent {
  static taggedColor = `rgb(255, 100, 100)`;
  static notTaggedColor = `rgb(100, 255, 100)`;

  static maxSpeed = 100;
  static maxForce = 5;

  static imuneAmount = 50;

  constructor(
    id,
    pos,
    vel,
    radius,
    tagged = false,
    alive = false,
    obsticles = []
  ) {
    this.id = id;

    this.radius = radius;
    this.tagged = tagged;
    this.alive = alive;

    this.color = this.getColor();
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

  changeTagged(tagged) {
    this.tagged = tagged;
  }

  getColor() {
    if (this.tagged) {
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

  collide(other) {
    // do not collide with yourself
    if (other == this) {
      return;
    }

    // find out if two agents are close
    let relative = p5.Vector.sub(other.pos, this.pos);
    let dist = relative.mag() - (this.radius + other.radius);

    // if agents are too close
    if (dist < 0) {
      // send them opposite ways
      let movement = relative.copy().setMag(abs(dist / 2));
      this.pos.sub(movement);
      other.pos.add(movement);

      if (other.tagged && !this.isImune()) {
        this.tag();
        other.untag();
        return;
      }
      if (this.tagged && !other.isImune()) {
        other.tag();
        this.untag();
      }
    }

    return {
      [this.id]: {
        pos: { x: this.pos.x, y: this.pos.y },
        vel: { x: this.vel.x, y: this.vel.y },
        tagged: this.tagged,
      },
      [other.id]: {
        pos: { x: other.pos.x, y: other.pos.y },
        vel: { x: other.vel.x, y: other.vel.y },
        tagged: other.tagged,
      },
    };
  }

  isImune() {
    return this.imune > 0;
  }

  move() {
    // moving means adding velocity to position
    this.pos.add(this.vel);

    this.checkBoundaries();

    if (this.imune) this.imune--;

    return {
      pos: { x: this.pos.x, y: this.pos.y },
      vel: { x: this.vel.x, y: this.vel.y },
      tagged: this.tagged,
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
    if (this.isPlayer()) {
      this.pos.x = this.pos.x + x;
      this.pos.y = this.pos.y - y;

      this.checkBoundaries();
    }
  }

  moveToPosition(x, y) {
    if (this.isPlayer()) {
      this.pos = createVector(x, y);

      this.checkBoundaries();
    }
  }

  isPlayer() {
    return this.alive;
  }

  tag() {
    this.tagged = true;
  }

  untag() {
    this.imune = Agent.imuneAmount;
    this.tagged = false;
  }

  // taken from https://www.youtube.com/watch?v=4hA7G3gup-4&list=PLLHSiGX_Xw7GPGdb5GZZGYlQsYPg71N3n
  flee(taggedAgent) {
    let desired = p5.Vector.sub(taggedAgent.pos, this.pos);
    let d = desired.mag();
    if (d < 150) {
      desired.setMag(Agent.maxSpeed * 2);
      desired.mult(-1);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(Agent.maxForce * 2);
      this.vel = steer;
    } else {
      this.vel = p5.Vector.random2D().mult(random(10)); // createVector(0, 0);
    }

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
    // * looking for the closest agent
    let closestTarget;
    hunted.forEach((h) => {
      if (closestTarget) {
        let d = dist(this.pos.x, this.pos.y, h.pos.x, h.pos.y);
        let closestDist = dist(
          this.pos.x,
          this.pos.y,
          closestTarget.x,
          closestTarget.y
        );
        if (d < closestDist && !h.isImune()) {
          closestTarget = h.pos;
        }
      } else {
        // * first iteration does not have anything
        if (!h.isImune()) {
          closestTarget = h.pos;
        }
      }
    });

    if (closestTarget) {
      this.arrive(closestTarget);
    }
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

  render(id) {
    this.color = this.getColor();
    fill(this.color);
    if (this.id === id) {
      strokeWeight(3);
      stroke(100, 100, 250);
    }
    // * for distinguishing imune agents
    // if (this.isImune()) {
    //   strokeWeight(3);
    //   stroke(250, 250, 250);
    // }
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
    noStroke();
  }
}

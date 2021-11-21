var x, y, z;
var xpos, ypos;

const RADIUS = 15;
const PLAYERS_NUM = 5;

let agents = [];

function getAgent(tagged = false, alive = false) {
  const agent = new Agent(
    createVector(0, 0), //p5.Vector.random2D().mult(random(10)) //
    RADIUS,
    tagged,
    alive
  );

  return agent;
}

function setup() {
  // set canvas size
  // createCanvas(400, 400);
  createCanvas(windowWidth, windowHeight);

  for (i = 0; i < PLAYERS_NUM; i++) {
    agents.push(getAgent());
  }

  agents.push(getAgent(true, true));

  x = 0;
  y = 0;
}

function agentsWithoutHunter(idx) {
  return [...agents.slice(0, idx), ...agents.slice(idx + 1)];
}

function draw() {
  // set background color to white
  background(30);

  // draw ellipse
  noStroke();

  // display variables
  fill(255);
  text("x: " + x, 25, 25);
  text("y: " + y, 25, 50);
  text("z: " + z, 25, 75);

  for (let i = 0; i < agents.length; i++) {
    for (let j = 0; j < i; j++) {
      agents[i].collide(agents[j]);
    }
  }

  const taggedAgent = agents.find((agent) => agent.tagged);

  for (let i = 0; i < agents.length; i++) {
    if (!agents[i].tagged) {
      agents[i].flee(taggedAgent);
    } else {
      agents[i].hunt(agentsWithoutHunter(i));
    }

    agents[i].move();
    agents[i].render();
  }

  // * player as agent
  agents[agents.length - 1].moveToPosition(x, y);
}

function removeBanner() {
  var element = document.getElementById("motion-permission");
  if (element) {
    element.parentNode.removeChild(element);
  }
}

function mouseMoved() {
  x = mouseX;
  y = mouseY;
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // do something with e
    // console.log({ e });
    // get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);
    z = parseInt(e.accelerationIncludingGravity.z);
  });
}

function ClickRequestDeviceMotionEvent() {
  window.DeviceMotionEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        removeBanner();
        addMotionListener();
      } else {
        console.log("DeviceMotion permissions not granted.");
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

window.onload = function () {
  // Check if is IOS 13 when page loads.
  if (
    window.DeviceMotionEvent &&
    typeof window.DeviceMotionEvent.requestPermission === "function"
  ) {
    // Everything here is just a lazy banner. You can do the banner your way.
    const banner = document.createElement("div");
    banner.setAttribute("id", "motion-permission");
    banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; background-color:#000; color: #fff"><p style="padding: 10px">Click here to enable DeviceMotion</p></div>`;
    banner.onclick = ClickRequestDeviceMotionEvent; // You NEED to bind the function into a onClick event. An artificial 'onClick' will NOT work.
    document.querySelector("body").appendChild(banner);
  } else {
    addMotionListener();
  }
};

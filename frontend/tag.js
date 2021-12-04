const socket = io.connect("http://127.0.0.1:3000");

const RADIUS = 15;
const PLAYERS_NUM = 5;
const OBSTICLES_NUM = 5;
const CANVAS_HEIGHT = 500;

let x, y;
let xpos, ypos;

let agents = [];
let obsticles = [];
let useMouse = false;
let playerID = "";

socket.on("init", (msg) => console.log({ msg }));
socket.on("unknownCode", (msg) => console.log({ msg }));
socket.on("displayPlayer", handleDisplayPlayer);
socket.on("displayAgent", handleDisplayAgent);

function setup() {
  // * set canvas size
  createCanvas(displayWidth, CANVAS_HEIGHT);
  // createCanvas(displayWidth, displayHeight - 100);

  // TODO: add roomName
  socket.emit("joinGame", {
    roomName: null,
    player: { ...getAddAgentPayload() },
  });

  // * set up obsticles

  // * create agents

  useMouseBtn = createButton("Add agent");
  useMouseBtn.position(50, CANVAS_HEIGHT);
  useMouseBtn.mousePressed(callAddAgent);

  // * initial device motion coords
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

  obsticles.forEach((o) => o.render());

  for (let i = 0; i < agents.length; i++) {
    for (let j = 0; j < i; j++) {
      agents[i].collide(agents[j]);
    }
  }

  const taggedAgent = agents.find((agent) => agent.tagged);

  for (let i = 0; i < agents.length; i++) {
    if (!agents[i].isPlayer() && taggedAgent) {
      if (!agents[i].tagged) {
        agents[i].flee(taggedAgent);
      } else {
        agents[i].hunt(agentsWithoutHunter(i));
      }
    }

    agents[i].resolveRectCircleCollision(obsticles);

    agents[i].move();
    agents[i].render();
  }

  // * player as agent
  // agents.filter((a) => a.isPlayer()).forEach((a) => a.changePosition(x, y));
}

function getAddAgentPayload() {
  return {
    pos: Agent.getStartingPosition(),
    vel: Agent.getStartingVelocity(),
    radius: RADIUS,
  };
}

function callAddAgent() {
  const payload = {
    ...getAddAgentPayload(),
  };
  socket.emit("addAgent", payload);
}

function addNewAgent({ id, pos, vel, radius, tagged = false, alive = false }) {
  const agent = new Agent(id, pos, vel, radius, tagged, alive, obsticles);
  agents.push(agent);
}

function handleDisplayPlayer(data) {
  console.log("adding player 🐛");
  playerID = data.id;
  addNewAgent(data);
}
function handleDisplayAgent(data) {
  console.log("all good here 👍");
  console.log({ data });
  addNewAgent(data);
}

// ****************************************** iOS ***************************************************************
function removeBanner() {
  var element = document.getElementById("motion-permission");
  if (element) {
    element.parentNode.removeChild(element);
  }
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // console.log({ e });
    // * get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);
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
// ****************************************** iOS END ***************************************************************

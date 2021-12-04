const socket = io.connect("http://127.0.0.1:3000");

const RADIUS = 15;
const CANVAS_HEIGHT = 500;

let x, y;

let agents = [];
let obsticles = [];
let playerID = "";

socket.on("displayPlayer", handleDisplayPlayer);
socket.on("changePlayerPosition", handleChangePlayerPosition);
socket.on("gameState", handleGameState);

function setup() {
  // * set canvas size
  createCanvas(displayWidth, CANVAS_HEIGHT);

  // TODO: add roomName ?
  socket.emit("joinGame", {
    roomName: null,
    player: { ...getAddAgentPayload() },
  });

  // * initial device motion coords
  x = 0;
  y = 0;
}

function draw() {
  // set background color to white
  background(30);
  // draw ellipse
  noStroke();

  console.log(agents);

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

  for (let i = 0; i < agents.length; i++) {
    agents[i].resolveRectCircleCollision(obsticles);

    agents[i].move();
    agents[i].render();
  }
}

function getAddAgentPayload() {
  return {
    pos: Agent.getStartingPosition(),
    vel: Agent.getStartingVelocity(),
    radius: RADIUS,
  };
}

function addNewAgent({ id, pos, vel, radius, tagged = false, alive = false }) {
  const agent = new Agent(id, pos, vel, radius, tagged, alive, obsticles);
  agents.push(agent);
}

function handleDisplayPlayer(data) {
  console.log("adding player 🐺");
  playerID = data.id;
  addNewAgent(data);
}

function handleChangePlayerPosition({ id, pos, vel }) {
  const foundAgent = agents.find((a) => a.id === id);

  if (foundAgent && foundAgent.id !== playerID) {
    foundAgent.changeVel(vel);
    foundAgent.changePos(pos);
  }
}

function handleGameState(unparsedGameState) {
  const parsedGameState = JSON.parse(unparsedGameState);

  agents = [];

  Object.keys(parsedGameState.agents).forEach((id) => {
    addNewAgent({ id, ...parsedGameState.agents[id], obsticles });
  });
  // TODO:
  // obsticles = parsedGameState.obsticles;
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // console.log({ e });
    // * get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);
    const currentPlayer = agents.find((a) => `${a.id}` === `${playerID}`);

    console.log({ agents, currentPlayer, playerID });

    if (currentPlayer) {
      currentPlayer.changePosition(x, y);
      socket.emit("movePlayer", {
        id: playerID,
        pos: { x: currentPlayer.pos.x, y: currentPlayer.pos.y },
        vel: { x: currentPlayer.vel.x, y: currentPlayer.vel.y },
      });
    }
  });
}

// ****************************************** iOS ***************************************************************
function removeBanner() {
  var element = document.getElementById("motion-permission");
  if (element) {
    element.parentNode.removeChild(element);
  }
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

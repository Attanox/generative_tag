const socket = io.connect("http://localhost:3000/");
// const socket = io.connect("https://calm-plateau-75658.herokuapp.com/");

const RADIUS = 15;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 500;
const OBSTICLES_NUM = 5;

let x, y;

let agents = [];
let obsticles = [];
let playerID = "";

let agentData = [];
let player;

socket.on("displayPlayer", handleDisplayPlayer);
socket.on("playerExit", handleExitPlayer);

function setup() {
  // * set canvas size
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // TODO: add roomName ?
  socket.emit("joinGame", {
    roomName: null,
    player: { ...getAddAgentPayload() },
    obsticles: createObsticles(),
  });

  // * initial device motion coords
  x = 0;
  y = 0;

  socket.on("gameState", handleGameState);
}

function draw() {
  // * set background color to white
  background(30);
  // * draw ellipse
  noStroke();

  // * display variables
  fill(255);
  text("x: " + x, 25, 25);
  text("y: " + y, 25, 50);

  obsticles.forEach((o) => o.render());

  let agentsMvmt = {};
  let agentsTagged = {};

  agentData.forEach((agentConfig) => {
    // * we render current player separately below
    if (agentConfig.id !== playerID) {
      Agent.configRender(agentConfig);
      agentsTagged[agentConfig.id] = player.collide(agentConfig);
    }
  });

  if (player) {
    player.resolveRectCircleCollision(obsticles);
    agentsMvmt[playerID] = player.move();
    player.render(playerID);
  }

  console.log(agentsTagged);

  socket.emit("updateMvmt", agentsMvmt);
  // socket.emit("updateTagged", agentsTagged);
}

function createObsticles() {
  return [...Array(OBSTICLES_NUM)].map(() => Obsticle.getProperties());
}

function getAddAgentPayload() {
  return {
    pos: Agent.getStartingPosition(),
    vel: Agent.getStartingVelocity(),
    radius: RADIUS,
  };
}

function getAgent({ id, pos, vel, radius, tagged }) {
  const agent = new Agent(id, pos, vel, radius, tagged, obsticles);
  return agent;
}

function addNewAgent({ id, pos, vel, radius, tagged }) {
  const agent = getAgent({ id, pos, vel, radius, tagged, obsticles });
  agents.push(agent);
}

function handleDisplayPlayer(data) {
  playerID = data.id;
  player = getAgent(data);
}

function handleGameState(unparsedGameState) {
  const parsedGameState = JSON.parse(unparsedGameState);

  agentData = [];

  Object.keys(parsedGameState.agents).forEach((id) => {
    agentData.push({ ...parsedGameState.agents[id] });
  });

  obsticles = parsedGameState.obsticles.map((obst) => new Obsticle(obst));
}

function addMotionListener() {
  window.addEventListener("devicemotion", (e) => {
    // console.log({ e });
    // * get accelerometer values
    x = parseInt(e.accelerationIncludingGravity.x);
    y = parseInt(e.accelerationIncludingGravity.y);

    player.changePosition(x, y);
    socket.emit("movePlayer", {
      id: playerID,
      pos: { x: player.pos.x, y: player.pos.y },
      vel: { x: player.vel.x, y: player.vel.y },
      tagged: player.tagged,
      radius: player.radius,
    });
  });
}

function handleExitPlayer(id) {
  const exitedPlayerID = agents.findIndex((a) => a.id === id);

  agents.splice(exitedPlayerID, 1);
}

function handleUnload() {
  return socket.emit("exit", playerID);
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
  window.addEventListener("beforeunload", handleUnload);

  // * Check if is IOS 13 when page loads.
  if (
    window.DeviceMotionEvent &&
    typeof window.DeviceMotionEvent.requestPermission === "function"
  ) {
    // * Everything here is just a lazy banner. You can do the banner your way.
    const banner = document.createElement("div");
    banner.setAttribute("id", "motion-permission");
    banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; background-color:#000; color: #fff"><p style="padding: 10px">Click here to enable DeviceMotion</p></div>`;
    banner.onclick = ClickRequestDeviceMotionEvent; // * You NEED to bind the function into a onClick event. An artificial 'onClick' will NOT work.
    document.querySelector("body").appendChild(banner);
  } else {
    addMotionListener();
  }
};
// ****************************************** iOS END ***************************************************************

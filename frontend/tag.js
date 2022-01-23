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
let taggedPlayers = [];

let vessels = [];

socket.on("displayPlayer", handleDisplayPlayer);
socket.on("playerExit", handleExitPlayer);
socket.on("gameState", handleGameState);

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
}

function draw() {
  // * set background color to white
  background("rgba(30,30,30,0.25)");
  // * draw ellipse
  noStroke();

  // * display variables
  fill(255);
  text("x: " + x, 25, 25);
  text("y: " + y, 25, 50);

  obsticles.forEach((o) => o.render());

  let agentsMvmt = {};

  let newTaggedPlayer;
  agentData.forEach((agentConfig) => {
    // * we render current player separately below
    if (agentConfig.id !== playerID) {
      Agent.configRender(agentConfig, taggedPlayers);
      const collided = player.collide(agentConfig, taggedPlayers);
      if (collided) newTaggedPlayer = collided;
    }
  });

  let removeVessel;
  vessels.forEach((vesselConfig) => {
    // * we render current player separately below
    Agent.configRender(vesselConfig, taggedPlayers, true);
    removeVessel = player.possesion(vesselConfig, taggedPlayers);
  });

  if (player) {
    deviceMoved();
    player.resolveRectCircleCollision(obsticles);
    agentsMvmt[playerID] = player.move();
    player.render(taggedPlayers);
  }

  if (newTaggedPlayer) socket.emit("updateTagged", newTaggedPlayer);
  if (removeVessel) {
    socket.emit("removeVessel", {
      vesselID: removeVessel,
      playerID: player.id,
    });
  }
  socket.emit("updateMvmt", agentsMvmt);
}

function createObsticles() {
  return [...Array(OBSTICLES_NUM)].map(() => Obsticle.getProperties());
}

function getAddAgentPayload() {
  const pos = Agent.getStartingPosition();

  return {
    pos,
    vel: Agent.getStartingVelocity(),
    oppositePos: { ...pos, y: CANVAS_HEIGHT - pos.y },
    radius: RADIUS,
  };
}

function getAgent({ id, pos, vel, radius }) {
  const agent = new Agent(id, pos, vel, radius, obsticles);
  return agent;
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

  taggedPlayers = parsedGameState.taggedPlayers;
  // console.log({ parsedIDs: parsedGameState.taggedPlayers });

  obsticles = parsedGameState.obsticles.map((obst) => new Obsticle(obst));

  vessels = parsedGameState.vessels.map((v) => getAgent(v));
}

function deviceMoved() {
  if (player) {
    player.changePosition(x, y);
    socket.emit("movePlayer", {
      id: playerID,
      pos: { x: player.pos.x, y: player.pos.y },
      vel: { x: player.vel.x, y: player.vel.y },
      radius: player.radius,
    });
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

function handleExitPlayer(id) {
  const exitedPlayerID = agents.findIndex((a) => a.id === id);

  agents.splice(exitedPlayerID, 1);
}

function handleUnload() {
  return socket.emit("exit", playerID);
}
